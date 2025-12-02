// controllers/api.js
import { runExamWorkflow } from "../agents/examWorkflow.js";
import { quizAgent } from "../agents/quizAgent.js";
import { chatAgent } from "../agents/chatAgent.js";
import { flashcardAgent } from "../agents/flashcardAgent.js";
import { diagramAgent } from "../agents/diagramAgent.js";

import History from "../models/History.js";
import PDFDocument from "pdfkit";

const cleanMarkdownForPdf = (markdown) => {
  return markdown
    .replace(/[*#`]/g, "")
    .replace(/^- /gm, "")
    .replace(/^\s*\n/gm, "\n");
};

export const runApi = async (req, res) => {
  const { topic, model } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const steps = [];
  const pushProgress = (msg) => steps.push(msg);

  const { research, summary } = await runExamWorkflow(
    topic,
    pushProgress,
    model
  );

  const record = await History.create({
    topic,
    research,
    summary,
    model,
    owner: req.user._id,
  });

  res.json({ success: true, steps, research, summary, id: record._id });
};

export const generateQuiz = async (req, res) => {
  const record = await History.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) return res.status(404).json({ error: "Record not found" });

  const quiz = await quizAgent(record.topic, record.model);
  record.quiz = quiz;
  await record.save();

  res.json({ success: true, quiz });
};

export const handleChat = async (req, res) => {
  const { userMessage, chatHistory } = req.body;
  const recordId = req.params.id;

  if (!userMessage)
    return res.status(400).json({ error: "Message is required" });

  try {
    const record = await History.findOne({
      _id: recordId,
      owner: req.user._id,
    });
    if (!record) return res.status(404).json({ error: "Record not found" });

    const responseText = await chatAgent(
      record.topic,
      chatHistory || [],
      userMessage,
      record.model
    );

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

export const exportHistory = async (req, res) => {
  const record = await History.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) return res.status(404).send("Record not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${record.topic.replace(/ /g, "_")}.pdf"`
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  doc.pipe(res);

  doc.fontSize(22).fillColor("#000").text(record.topic, {
    underline: true,
    align: "center",
  });
  doc.moveDown();

  doc.fontSize(10).fillColor("#333").text(
    `Generated on: ${record.createdAt.toDateString()}`,
    {
      align: "left",
    }
  );
  doc.moveDown();

  doc.fontSize(16).fillColor("#000").text("Research", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(cleanMarkdownForPdf(record.research), { align: "left" });

  doc.addPage();

  doc.fontSize(16).fillColor("#000").text("Summary", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(cleanMarkdownForPdf(record.summary), { align: "left" });

  if (record.quiz) {
    doc.addPage();
    doc.fontSize(16).fillColor("#000").text("Quiz", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#333")
      .text(cleanMarkdownForPdf(record.quiz), { align: "left" });
  }

  if (record.flashcards) {
    doc.addPage();
    doc
      .fontSize(16)
      .fillColor("#000")
      .text("Flashcards", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#333")
      .text(cleanMarkdownForPdf(record.flashcards), { align: "left" });
  }

  doc.end();
};

export const regenerateNotes = async (req, res) => {
  try {
    const record = await History.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const selectedModel = req.body.model || "gemini-2.5-flash-lite";

    record.versions.push({
      research: record.research,
      summary: record.summary,
      model: selectedModel,
      regeneratedAt: new Date(),
    });

    const steps = [];
    const pushProgress = (msg) => steps.push(msg);

    const { research, summary } = await runExamWorkflow(
      record.topic,
      pushProgress,
      selectedModel
    );

    record.research = research;
    record.summary = summary;
    record.model = selectedModel;
    record.updatedAt = new Date();
    await record.save();

    res.json({
      success: true,
      message: "Notes regenerated successfully",
      steps,
      research,
      summary,
      id: record._id,
    });
  } catch (err) {
    console.error("Regenerate Error:", err);
    res.status(500).json({ error: "Failed to regenerate notes" });
  }
};

export const generateFlashcards = async (req, res) => {
  const record = await History.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) return res.status(404).json({ error: "Record not found" });

  const flashcards = await flashcardAgent(record.topic, record.model);
  record.flashcards = flashcards;
  await record.save();

  res.json({ success: true, flashcards });
};

export const generateDiagram = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });
  
  // Security Check
  if (!record.owner.equals(req.user._id)) {
    return res.status(403).json({ error: "Unauthorized access to this record" });
  }

  try {
    const diagramCode = await diagramAgent(record.topic, record.model);
    record.diagram = diagramCode;
    await record.save();
    res.json({ success: true, diagram: diagramCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/**
 * Sidebar helper: list history items for current user
 * (used to show "Study History" section in sidebar).
 */
export const getHistoryList = async (req, res) => {
  const items = await History.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .select("topic createdAt");

  res.json({ success: true, items });
};

