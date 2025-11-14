import { marked } from "marked";
import History from "../models/History.js";

export const showAllHistory = async (req, res) => {
  const records = await History.find().sort({ createdAt: -1 });
  res.render("history/history.ejs", { records });
};

export const showHistoryDetail = async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).send("Not found");
  res.render("history/history-detail.ejs", { record, marked }); // Pass marked here
};

export const deleteHistory = async (req, res) => {
  await History.findByIdAndDelete(req.params.id);
  let redirectUrl = res.locals.redirectUrl || "/";
  if (redirectUrl.includes(`/history/${req.params.id}`)) {
    return res.redirect("/history");
  }
  res.redirect(redirectUrl);
};
