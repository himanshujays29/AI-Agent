
import express from "express";
import mongoose from "mongoose";
import ejsMate from "ejs-mate";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import historyRoutes from "./routes/history.js";
import History from "./models/History.js";
import apiRoutes from "./routes/api.js";


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

app.use((req, res, next) => {
  res.locals.redirectUrl = req.get("referer") || "/";
  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/api", apiRoutes);
app.use("/history", historyRoutes);

// Homepage
app.get("/", async (req, res) => {
  const history = await History.find().sort({ createdAt: -1 });
  res.render("main/index.ejs", { history });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
