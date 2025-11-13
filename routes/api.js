import express from "express";
import History from "../models/History.js";
import { runExamWorkflow } from "../agents/examWorkflow.js";

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

export default router;
