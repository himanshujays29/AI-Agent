
import { runExamWorkflow } from "../agents/examWorkflow.js";
import { quizAgent } from "../agents/quizAgent.js";
import { chatAgent } from "../agents/chatAgent.js";
import { flashcardAgent } from "../agents/flashcardAgent.js";
import { diagramAgent } from "../agents/diagramAgent.js";

import History from "../models/History.js";
import PDFDocument from "pdfkit";
import { cleanMarkdownForPdf } from "../utils/markdown.js"; // Import the utility

export const runApi = async (req, res) => {
  const { topic, model } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const steps = [];
  const pushProgress = (msg) => steps.push(msg);

  try {
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
  } catch (error) {
    req.flash("error", `API Run Error: ${error}`);
    console.error("API Run Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const record = await History.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!record) return res.status(404).json({ error: "Record not found" });

    const quiz = await quizAgent(record.topic, record.model);
    record.quiz = quiz;
    await record.save();

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    req.flash("error", `Chat Error: ${err}`);
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

export const exportHistory = async (req, res) => {
  try {
    const record = await History.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!record) return res.status(404).send("Record not found");

    // --- Ensure we don't send duplicate Content-Disposition ---
    const filename = `${record.topic.replace(/ /g, "_")}.pdf`;
    const existing = res.getHeader("Content-Disposition");
    if (existing) {
      console.warn("Removing duplicate Content-Disposition header:", existing);
      res.removeHeader("Content-Disposition");
    }

    res.setHeader("Content-Type", "application/pdf");
    // Use attachment which sets Content-Disposition correctly
    res.attachment(filename);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    doc.pipe(res);

    // --- PDF Styles ---
    const addTitle = (text) => {
      doc.moveDown(1);
      doc.fontSize(20).fillColor("#000").text(text, {
        underline: true,
        align: "left",
      });
      doc.moveDown(0.8);
    };

    const addBody = (text) => {
      doc.fontSize(12).fillColor("#333");
      const cleaned = cleanMarkdownForPdf(text)
        .replace(/\n\s*\n/g, "\n\n") // fix double spacing
        .replace(/✔/g, "•") // bullet styling
        .replace(/\*\*(.*?)\*\*/g, "$1"); // remove Markdown bold
      doc.text(cleaned, { lineGap: 4 });
      doc.moveDown(1);
    };

    // --- HEADER ---
    doc
      .fontSize(24)
      .fillColor("#000")
      .text(record.topic, { align: "center", underline: true });

    doc.moveDown();
    doc
      .fontSize(11)
      .fillColor("#666")
      .text(`Generated on: ${record.createdAt.toDateString()}`, {
        align: "left",
      });

    doc.moveDown(1.5);

    // --- SECTIONS ---
    addTitle("Research");
    addBody(record.research);

    doc.addPage();
    addTitle("Summary");
    addBody(record.summary);

    if (record.quiz) {
      doc.addPage();
      addTitle("Quiz");
      addBody(record.quiz);
    }

    if (record.flashcards) {
      doc.addPage();
      addTitle("Flashcards");
      addBody(record.flashcards);
    }

    doc.end();
  } catch (error) {
    req.flash("error", `PDF Export Error: ${error}`);
    console.error("PDF Export Error:", error);
    res.status(500).send("Error exporting PDF");
  }
};

//Download as Markdown
export const exportMarkdown = async (req, res) => {
  try {
    const record = await History.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!record) return res.status(404).send("Record not found");

    const content = `
# ${record.topic}
_Generated on: ${record.createdAt.toDateString()}_

## 🔍 Research
${record.research}

## 🧠 Summary
${record.summary}

${record.quiz ? `## 🎯 Quiz\n${record.quiz}` : ""}

${record.flashcards ? `## 📘 Flashcards\n${record.flashcards}` : ""}
`.trim();

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${record.topic.replace(/ /g, "_")}.md"`
    );
    res.send(content);
  } catch (error) {
    req.flash("error", `Markdown Export Error: ${error}`);
    console.error("Markdown Export Error:", error);
    res.status(500).send("Error exporting Markdown");
  }
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
      model: record.model, // save previous model
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
    req.flash("error", `Regenerate Error: ${err}`);
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

  if (!record.owner.equals(req.user._id)) {
    return res
      .status(403)
      .json({ error: "Unauthorized access to this record" });
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

export const getHistoryList = async (req, res) => {
  const items = await History.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .select("topic createdAt");

  res.json({ success: true, items });
};
