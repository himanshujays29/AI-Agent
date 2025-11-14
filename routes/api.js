import express from "express";
import History from "../models/History.js";
import { runExamWorkflow } from "../agents/examWorkflow.js";
import { quizAgent } from "../agents/quizAgent.js";
import PDFDocument from "pdfkit";



const router = express.Router();

router.post("/run", async (req, res) => {
  const { topic, model } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    const steps = [];
    const pushProgress = (msg) => steps.push(msg);

    const { research, summary } = await runExamWorkflow(topic, pushProgress, model);
    const record = await History.create({ topic, research, summary });

    res.json({ success: true, steps, research, summary, id: record._id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate quiz for existing topic
router.get("/quiz/:id", async (req, res) => {
  try {
    const record = await History.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    const quiz = await quizAgent(record.topic);

    record.quiz = quiz;
    await record.save();

    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export a history record as PDF
router.get("/pdf/:id", async (req, res) => {
  try {
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
      bufferPages: true   // IMPORTANT for page numbers
    });

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(22)
       .fillColor("#000")
       .text(record.topic, { underline: true, align: "center" });
    doc.moveDown();

    // Date
    doc.fontSize(10)
       .fillColor("#333")
       .text(`Generated on: ${record.createdAt.toDateString()}`);
    doc.moveDown();

    // Research section
    doc.fontSize(16).fillColor("#000").text("Research", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#333")
       .text(record.research.replace(/[*#`]/g, ""), { align: "left" });
    doc.addPage();

    // Summary section
    doc.fontSize(16).fillColor("#000").text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#333")
       .text(record.summary.replace(/[*#`]/g, ""), { align: "left" });


    doc.end();
  } catch (err) {
    res.status(500).send("PDF generation failed: " + err.message);
  }
});




export default router;
