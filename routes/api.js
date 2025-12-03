// routes/api.js
import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import * as apiController from "../controllers/api.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.post("/run", isLoggedIn, wrapAsync(apiController.runApi));
router.get("/quiz/:id", isLoggedIn, wrapAsync(apiController.generateQuiz));
router.get("/pdf/:id", isLoggedIn, wrapAsync(apiController.exportHistory));
router.get("/md/:id", isLoggedIn, wrapAsync(apiController.exportMarkdown)); // NEW ROUTE
router.post("/chat/:id", isLoggedIn, wrapAsync(apiController.handleChat));
router.post("/regenerate/:id", isLoggedIn, wrapAsync(apiController.regenerateNotes));
router.get("/flashcards/:id", isLoggedIn, wrapAsync(apiController.generateFlashcards));
router.get("/diagram/:id", isLoggedIn, wrapAsync(apiController.generateDiagram));
router.get("/history-list", isLoggedIn, wrapAsync(apiController.getHistoryList));

export default router;