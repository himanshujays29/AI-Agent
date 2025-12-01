import { marked } from "marked";
import History from "../models/History.js";
// import marked from "../utils/markdown.js";
import { diffWords } from "diff";

export const showAllHistory = async (req, res) => {
  const records = await History.find().sort({ createdAt: -1 });
  res.render("history/history.ejs", { records });
};

export const showHistoryDetail = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).send("Not found");
  res.render("history/history-detail.ejs", { record, marked }); // Pass marked here
};

export const compareVersions = async (req, res) => {
  const record = await History.findById(req.params.id);

  if (!record || record.versions.length === 0) {
    return res.send("No previous versions available to compare.");
  }

  const latest = record;
  const previous = record.versions[record.versions.length - 1];

  function cleanDiff(diffArray) {
    return diffArray.filter((part) => {
      const text = (part.value || "").trim();
      return text.length > 0; 
    });
  }

  const normalize = (str) =>
    str
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ") 
      .trim();

  const prevResearchClean = normalize(previous.research);
  const newResearchClean = normalize(latest.research);
  const prevSummaryClean = normalize(previous.summary);
  const newSummaryClean = normalize(latest.summary);

  const researchDiff = cleanDiff(
    diffWords(prevResearchClean, newResearchClean)
  );
  const summaryDiff = cleanDiff(diffWords(prevSummaryClean, newSummaryClean));

  const oldMarkdown = marked(previous.research + "\n\n" + previous.summary);
  const newMarkdown = marked(latest.research + "\n\n" + latest.summary);

  res.render("history/compare.ejs", {
    topic: record.topic,
    oldMarkdown,
    newMarkdown,
    researchDiff,
    summaryDiff,
    marked,
    // previous,
    // la
  });
};

export const deleteHistory = async (req, res) => {
  await History.findByIdAndDelete(req.params.id);
  let redirectUrl = res.locals.redirectUrl || "/";
  if (redirectUrl.includes(`/history/${req.params.id}`)) {
    return res.redirect("/history");
  }
  res.redirect(redirectUrl);
};
