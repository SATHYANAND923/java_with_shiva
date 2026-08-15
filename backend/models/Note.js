const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true }, // e.g. "Java", "DSA", "Interview Questions"
    fileUrl: { type: String, required: true }, // path/URL to the actual PDF
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 }, // in INR, ignored if isPaid is false
  },
  { timestamps: true }
);

noteSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("Note", noteSchema);
