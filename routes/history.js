import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import * as historyController from "../controllers/history.js";

const router = express.Router();

router.get("/", wrapAsync(historyController.showAllHistory));
router.get("/:id", wrapAsync(historyController.showHistoryDetail));
router.get("/compare/:id", historyController.compareVersions);
router.post("/delete/:id", wrapAsync(historyController.deleteHistory));


export default router;
