const express = require("express");
const path = require("path");
const fs = require("fs");
const Note = require("../models/Note");
const Purchase = require("../models/Purchase");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const upload = require("../middleware/upload");

const router = express.Router();

// GET /api/notes?search=&category=  -> list/search notes (public, no file access here)
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const notes = await Note.find(query).select("-fileUrl").sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes", error: err.message });
  }
});

// POST /api/notes  -> admin uploads a new note/pdf
router.post("/", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const { title, description, category, isPaid, price } = req.body;
    if (!req.file) return res.status(400).json({ message: "PDF file is required" });

    const note = await Note.create({
      title,
      description,
      category,
      isPaid: isPaid === "true" || isPaid === true,
      price: isPaid ? Number(price) || 0 : 0,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// DELETE /api/notes/:id -> admin deletes a note
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const filePath = path.join(__dirname, "..", note.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// GET /api/notes/:id/download -> checks access rules, then streams the PDF
router.get("/:id/download", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.isPaid) {
      const purchase = await Purchase.findOne({
        user: req.user.id,
        note: note._id,
        status: "paid",
      });
      if (!purchase && !req.user.isAdmin) {
        return res.status(403).json({ message: "Purchase required to download this item" });
      }
    }

    const filePath = path.join(__dirname, "..", note.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

    res.download(filePath, `${note.title}.pdf`);
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
});

// GET /api/notes/:id/view -> same access rules as download, but opens the PDF inline
// in the browser (new tab) instead of forcing a file download.
router.get("/:id/view", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.isPaid) {
      const purchase = await Purchase.findOne({
        user: req.user.id,
        note: note._id,
        status: "paid",
      });
      if (!purchase && !req.user.isAdmin) {
        return res.status(403).json({ message: "Purchase required to view this item" });
      }
    }

    const filePath = path.join(__dirname, "..", note.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${note.title}.pdf"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: "View failed", error: err.message });
  }
});

module.exports = router;
