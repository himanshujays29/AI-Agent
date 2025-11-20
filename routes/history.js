import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import * as historyController from "../controllers/history.js";
import * as apiController from "../controllers/api.js";

const router = express.Router();

router.get("/", wrapAsync(historyController.showAllHistory));
router.get("/:id", wrapAsync(historyController.showHistoryDetail));
router.post("/delete/:id", wrapAsync(historyController.deleteHistory));
router.post("/regenerate/:id", apiController.regenerateNotes);

export default router;
