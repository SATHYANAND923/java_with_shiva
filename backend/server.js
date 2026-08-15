require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Note: uploaded PDFs are also served statically here for convenience,
// but the /api/notes/:id/download route is the one that enforces payment access.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => res.send("java_with_shiva backend is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
