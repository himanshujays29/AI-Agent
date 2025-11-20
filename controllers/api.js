import { runExamWorkflow } from "../agents/examWorkflow.js";
import { quizAgent } from "../agents/quizAgent.js";
import History from "../models/History.js";
import PDFDocument from "pdfkit";

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
  const record = await History.create({ topic, research, summary });

  res.json({ success: true, steps, research, summary, id: record._id });
};

export const generateQuiz = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });

  const quiz = await quizAgent(record.topic);

  record.quiz = quiz;
  await record.save();

  res.json({ success: true, quiz });
};

export const exportHistory = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).send("Record not found");

  // Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${record.topic.replace(/ /g, "_")}.pdf"`
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true, // IMPORTANT for page numbers
  });

  // Pipe PDF to response
  doc.pipe(res);

  // Title
  doc
    .fontSize(22)
    .fillColor("#000")
    .text(record.topic, { underline: true, align: "center" });
  doc.moveDown();

  // Date
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Generated on: ${record.createdAt.toDateString()}`);
  doc.moveDown();

  // Research section
  doc.fontSize(16).fillColor("#000").text("Research", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(record.research.replace(/[*#`]/g, ""), { align: "left" });
  doc.addPage();

  // Summary section
  doc.fontSize(16).fillColor("#000").text("Summary", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(record.summary.replace(/[*#`]/g, ""), { align: "left" });

  doc.end();
};

export const regenerateNotes = async (req, res) => {
  try {
    const record = await History.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const selectedModel = req.body.model || "gemini-2.5-flash-lite";

    const steps = [];
    const pushProgress = (msg) => steps.push(msg);

    const { research, summary } = await runExamWorkflow(
      record.topic,
      pushProgress,
      selectedModel
    );

    record.research = research;
    record.summary = summary;
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
