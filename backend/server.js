require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Note: uploaded PDFs are now stored on Cloudinary (see config/cloudinary.js),
// so this backend no longer needs to serve or persist files locally.

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("java_with_shiva backend is running"));

// Global error handler — catches errors thrown by middleware (like multer's file-size
// or file-type checks) that happen before a route's own try/catch runs. Without this,
// Express falls back to a generic HTML error page instead of a readable JSON message.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
