// routes/auth.js
import express from "express";
import * as authController from "../controllers/auth.js";

const router = express.Router();

// Register
router.get("/register", authController.renderRegister);
router.post("/register", authController.registerUser);

// Login
router.get("/login", authController.renderLogin);
router.post("/login", authController.loginUser);

// Logout
router.get("/logout", authController.logoutUser);

export default router;
