const express = require("express");
const Note = require("../models/Note");
const Purchase = require("../models/Purchase");
const protect = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const adminOnly = require("../middleware/admin");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// GET /api/notes?search=&category=  -> list/search notes (public, no file access here)
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const notes = await Note.find(query).select("-fileUrl -filePublicId").sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes", error: err.message });
  }
});

// POST /api/notes  -> admin uploads a new note/pdf, stored permanently on Cloudinary
router.post("/", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const { title, description, category, isPaid, price } = req.body;
    if (!req.file) return res.status(400).json({ message: "PDF file is required" });

    // Upload the in-memory file buffer to Cloudinary. resource_type "raw" is used
    // because PDFs aren't images/videos — Cloudinary treats them as raw files.
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "java_with_shiva_notes" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const note = await Note.create({
      title,
      description,
      category,
      isPaid: isPaid === "true" || isPaid === true,
      price: isPaid ? Number(price) || 0 : 0,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// DELETE /api/notes/:id -> admin deletes a note, including its file on Cloudinary
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.filePublicId) {
      await cloudinary.uploader.destroy(note.filePublicId, { resource_type: "raw" });
    }

    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// GET /api/notes/:id/download -> free notes are open to anyone; paid notes need
// the requester to be logged in AND to have purchased this specific note.
router.get("/:id/download", optionalAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.isPaid) {
      if (!req.user) {
        return res.status(401).json({ message: "Please log in to download this note" });
      }
      const purchase = await Purchase.findOne({
        user: req.user.id,
        note: note._id,
        status: "paid",
      });
      if (!purchase && !req.user.isAdmin) {
        return res.status(403).json({ message: "Purchase required to download this item" });
      }
    }

    // Fetch the file from Cloudinary server-side, then pass it through to the user.
    // This keeps the raw Cloudinary URL hidden from the browser, so access control
    // (the checks above) stays enforced on every download, not just the first one.
    const fileResponse = await fetch(note.fileUrl);
    if (!fileResponse.ok) return res.status(404).json({ message: "File missing on server" });

    const arrayBuffer = await fileResponse.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${note.title}.pdf"`);
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
});

// GET /api/notes/:id/view -> same access rules as download, but opens the PDF inline
// in the browser (new tab) instead of forcing a file download.
router.get("/:id/view", optionalAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.isPaid) {
      if (!req.user) {
        return res.status(401).json({ message: "Please log in to view this note" });
      }
      const purchase = await Purchase.findOne({
        user: req.user.id,
        note: note._id,
        status: "paid",
      });
      if (!purchase && !req.user.isAdmin) {
        return res.status(403).json({ message: "Purchase required to view this item" });
      }
    }

    const fileResponse = await fetch(note.fileUrl);
    if (!fileResponse.ok) return res.status(404).json({ message: "File missing on server" });

    const arrayBuffer = await fileResponse.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${note.title}.pdf"`);
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ message: "View failed", error: err.message });
  }
});

module.exports = router;
