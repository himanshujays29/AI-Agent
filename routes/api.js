import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import * as apiController from "../controllers/api.js";

const router = express.Router();

router.post("/run", wrapAsync(apiController.runApi));
router.get("/quiz/:id", wrapAsync(apiController.generateQuiz));
router.get("/pdf/:id", wrapAsync(apiController.exportHistory));
router.post("/chat/:id", wrapAsync(apiController.handleChat));
router.post("/regenerate/:id", wrapAsync(apiController.regenerateNotes));

export default router;