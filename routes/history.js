import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import * as historyController from "../controllers/history.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.get("/", isLoggedIn, wrapAsync(historyController.showAllHistory));
router.get("/:id", isLoggedIn, wrapAsync(historyController.showHistoryDetail));
router.get("/compare/:id", isLoggedIn, historyController.compareVersions);
router.post("/delete/:id", isLoggedIn, wrapAsync(historyController.deleteHistory));

export default router;
