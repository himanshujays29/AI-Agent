import express from "express";
import { isLoggedIn } from "../middleware.js";
import * as chatController from "../controllers/chat.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = express.Router();

router.post("/new", isLoggedIn, wrapAsync(chatController.createChatSession));
router.get("/list", isLoggedIn, wrapAsync(chatController.listSessions));
router.get("/:id", isLoggedIn, wrapAsync(chatController.loadChatSession));
router.post("/:id/send", isLoggedIn, wrapAsync(chatController.sendMessage));
router.post("/:id/rename", isLoggedIn, wrapAsync(chatController.renameSession));
router.delete("/:id", isLoggedIn, wrapAsync(chatController.deleteSession));

export default router;
