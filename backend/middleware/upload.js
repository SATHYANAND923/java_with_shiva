const multer = require("multer");

// Files are held in memory only, then uploaded straight to Cloudinary from the route handler.
// This replaces the old disk storage, which lost every file whenever the server restarted
// (Render's free tier wipes local disk on restart — Cloudinary storage survives that).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

module.exports = upload;
