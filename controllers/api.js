import { runExamWorkflow } from "../agents/examWorkflow.js";
import { quizAgent } from "../agents/quizAgent.js";
import { chatAgent } from "../agents/chatAgent.js"; // New Import
import History from "../models/History.js";
import PDFDocument from "pdfkit";

// Helper function to process Markdown for PDF (Crude removal of *#` for basic PDF rendering)
const cleanMarkdownForPdf = (markdown) => {
  // Basic replacements for better PDF rendering (markdown-specific characters)
  return markdown
    .replace(/[*#`]/g, "") // Remove bold, list markers, code backticks
    .replace(/^- /gm, "") // Remove hyphen list markers
    .replace(/^\s*\n/gm, "\n"); // Remove extra blank lines created by removal
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
  ); // Save the model name with the record (Feature 3)
  const record = await History.create({ topic, research, summary, model });

  res.json({ success: true, steps, research, summary, id: record._id });
};

export const generateQuiz = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });

  const quiz = await quizAgent(record.topic, record.model); // Use record.model for consistency

  record.quiz = quiz;
  await record.save();

  res.json({ success: true, quiz });
};

// New Controller Function for Chat (Feature 1)
export const handleChat = async (req, res) => {
  const { userMessage, chatHistory } = req.body;
  const recordId = req.params.id;

  if (!userMessage)
    return res.status(400).json({ error: "Message is required" });

  try {
    const record = await History.findById(recordId);
    if (!record) return res.status(404).json({ error: "Record not found" });

    // Use the chat agent
    const responseText = await chatAgent(
      record.topic,
      chatHistory || [],
      userMessage,
      record.model // Use the same model for follow-up chat
    );

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

// Updated Controller Function for PDF Export (Feature 2)
export const exportHistory = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).send("Record not found"); // Headers

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${record.topic.replace(/ /g, "_")}.pdf"`
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true, // IMPORTANT for page numbers
  }); // Pipe PDF to response

  doc.pipe(res); // Title

  doc
    .fontSize(22)
    .fillColor("#000")
    .text(record.topic, { underline: true, align: "center" });
  doc.moveDown(); // Date

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Generated on: ${record.createdAt.toDateString()}`);
  doc.moveDown(); // Research section

  doc.fontSize(16).fillColor("#000").text("Research", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(cleanMarkdownForPdf(record.research), { align: "left" });
  doc.addPage(); // Summary section

  doc.fontSize(16).fillColor("#000").text("Summary", { underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(cleanMarkdownForPdf(record.summary), { align: "left" });

  // Quiz section (Feature 2)
  if (record.quiz) {
    doc.addPage();
    doc.fontSize(16).fillColor("#000").text("Quiz", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#333")
      .text(cleanMarkdownForPdf(record.quiz), { align: "left" });
  }

  doc.end();
};

export const regenerateNotes = async (req, res) => {
  try {
    const record = await History.findById(req.params.id);
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
    record.model = selectedModel; // Update the model name (Feature 3)
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
