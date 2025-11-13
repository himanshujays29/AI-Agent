import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    topic: String,
    research: String,
    summary: String,
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);
