import { marked } from "marked";
import History from "../models/History.js";
import { diffWords } from "diff";

export const showAllHistory = async (req, res) => {
  const records = await History.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  res.render("history/history.ejs", { records, marked });
};

export const showHistoryDetail = async (req, res) => {
  const record = await History.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) return res.status(404).send("Not found");
  res.render("history/history-detail.ejs", { record, marked });
};

export const compareVersions = async (req, res) => {
  const record = await History.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

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

  const researchDiff = cleanDiff(diffWords(prevResearchClean, newResearchClean));
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
  });
};

export const deleteHistory = async (req, res) => {
  await History.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });
  let redirectUrl = res.locals.redirectUrl || "/";
  if (redirectUrl.includes(`/history/${req.params.id}`)) {
    return res.redirect("/history");
  }
  res.redirect(redirectUrl);
};
