import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: String,
    research: String,
    summary: String,
    quiz: { type: String, default: "" },
    model: { type: String, default: "gemini-2.5-flash-lite" },
    versions: [
      {
        research: String,
        summary: String,
        model: String,
        regeneratedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);
