const express = require("express");
const User = require("../models/User");
const Note = require("../models/Note");
const Purchase = require("../models/Purchase");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

// All routes here are admin-only — protect + adminOnly run on every request below.
router.use(protect, adminOnly);

// GET /api/admin/stats -> quick counts for the dashboard's summary cards
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalNotes, totalPurchases] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      Purchase.countDocuments({ status: "paid" }),
    ]);
    res.json({ totalUsers, totalNotes, totalPurchases });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// GET /api/admin/users -> every registered user, most recent first
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email isAdmin createdAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// GET /api/admin/purchases -> every completed purchase, with buyer + note details
router.get("/purchases", async (req, res) => {
  try {
    const purchases = await Purchase.find({ status: "paid" })
      .populate("user", "name email")
      .populate("note", "title category price")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch purchases", error: err.message });
  }
});

module.exports = router;
