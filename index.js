import express from "express";
import mongoose from "mongoose";
import ejsMate from "ejs-mate";
import dotenv from "dotenv";
import ExpressError from "./utils/ExpressError.js";
import flash from "connect-flash";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app"; 

// Models
import User from "./models/User.js";
import History from "./models/History.js";

// Routes
import historyRoutes from "./routes/history.js";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

import { isLoggedIn } from "./middleware.js";

dotenv.config();

// --- FIREBASE ADMIN SETUP (Backend) ---
// This handles verifying tokens sent from the client.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    console.log("🔥 Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", error.message);
  }
} else {
  try {
    initializeApp(); 
    console.log("🔥 Firebase Admin Initialized (Default/Dev)");
  } catch (e) {
    console.warn("⚠️ Firebase Admin not initialized. Token verification might fail if keys are missing.");
  }
}

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Configuration
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionOptions));
app.use(flash());


// --- GLOBAL LOCALS & AUTH MIDDLEWARE ---
app.use(async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.redirectUrl = req.get("referer") || "/";
  res.locals.firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };


  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
      } else {
        req.session.userId = null;
      }
    } catch (err) {
      console.error("Session User Fetch Error:", err);
    }
  }
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/history", historyRoutes);
app.use("/chat", chatRoutes);

// Home
app.get("/", isLoggedIn, async (req, res) => {
  const history = await History.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10);
  res.render("main/index.ejs", { history });
});

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Somthing Went Wrong!" } = err;
  res.status(statusCode).render("includes/error.ejs", { message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});