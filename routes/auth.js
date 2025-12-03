import express from "express";
import * as authController from "../controllers/auth.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = express.Router();

// Render Views
router.get("/register", authController.renderRegister);
router.get("/login", authController.renderLogin);

// Unified route for verifying the token sent by the client
// This handles both Login and Registration verification
router.post("/verify", wrapAsync(authController.verifySession));

router.get("/logout", authController.logoutUser);

export default router;