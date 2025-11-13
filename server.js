import express from "express";
import {marked} from "marked";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import History from "./models/History.js";


dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/api", apiRoutes);



// All history
app.get("/history", async (req, res) => {
  const records = await History.find().sort({ createdAt: -1 });
  res.render("history.ejs", { records });
});

// Single record
app.get("/history/:id", async (req, res) => {
  const record = await History.findById(req.params.id);
  if (!record) return res.status(404).send("Not found");
  res.render("history-detail.ejs", { record, marked }); // Pass marked here
});

// Homepage
app.get("/", async (req, res) => {
  const history = await History.find().sort({ createdAt: -1 });
  res.render("index", { history });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
