import { researchAgent } from "./researchAgent.js";
import { summaryAgent } from "./summaryAgent.js";

export async function runExamWorkflow(topic, pushProgress, model) {
  pushProgress(`🔍 Researching about "${topic}" using ${model}...`);
  const research = await researchAgent(topic, model);

  pushProgress("🧠 Summarizing topic...");
  const summary = await summaryAgent( topic, model);

  pushProgress("✅ Study notes ready!");
  return { research, summary };
}
