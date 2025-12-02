import express from "express";
import mongoose from "mongoose";
import ejsMate from "ejs-mate";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { fileURLToPath } from "url";


import historyRoutes from "./routes/history.js";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

import History from "./models/History.js";
import User from "./models/User.js";
import { isLoggedIn } from "./middleware.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Sessions & Passport
const sessionOptions = {
    secret: "mysupersecretcode", // In production, use process.env.SESSION_SECRET
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.redirectUrl = req.get("referer") || "/";
  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/history", historyRoutes);
app.use("/chat", chatRoutes);

// Homepage (protected)
app.get("/", isLoggedIn, async (req, res) => {
  const history = await History.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  const record = await History.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
  res.render("main/index.ejs", { history, record });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);


