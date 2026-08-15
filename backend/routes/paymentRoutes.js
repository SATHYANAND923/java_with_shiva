const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Note = require("../models/Note");
const Purchase = require("../models/Purchase");
const protect = require("../middleware/auth");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order  -> creates a Razorpay order for one paid note
router.post("/create-order", protect, async (req, res) => {
  try {
    const { noteId } = req.body;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (!note.isPaid) return res.status(400).json({ message: "This note is free, no payment needed" });

    // Already purchased? Don't charge again.
    const existing = await Purchase.findOne({ user: req.user.id, note: note._id, status: "paid" });
    if (existing) return res.status(400).json({ message: "You already purchased this note" });

    const amountInPaise = Math.round(note.price * 100);

    // Razorpay requires the `receipt` field to be 40 characters or fewer.
    // Using the full note/user IDs together was too long and caused every order to fail —
    // a short timestamp-based receipt is unique enough and always within the limit.
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // Save/update a "created" purchase record we'll confirm after payment
    await Purchase.findOneAndUpdate(
      { user: req.user.id, note: note._id },
      { orderId: order.id, amount: note.price, status: "created" },
      { upsert: true, new: true }
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key, safe to expose to frontend
      noteTitle: note.title,
    });
  } catch (err) {
    // Razorpay's SDK throws error objects without a standard .message property,
    // so we log the full thing to the terminal and pull the real description out for the response.
    console.error("Razorpay create-order failed:", err);
    const description = err?.error?.description || err.message || "Unknown error";
    res.status(500).json({ message: "Could not create order", error: description });
  }
});

// POST /api/payment/verify -> called by frontend after Razorpay checkout succeeds
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, noteId } = req.body;

    // Verify the signature to make sure the payment is genuine (not spoofed)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Purchase.findOneAndUpdate(
        { user: req.user.id, note: noteId },
        { status: "failed" }
      );
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const purchase = await Purchase.findOneAndUpdate(
      { user: req.user.id, note: noteId, orderId: razorpay_order_id },
      { status: "paid", paymentId: razorpay_payment_id },
      { new: true }
    );

    if (!purchase) return res.status(404).json({ message: "Purchase record not found" });

    res.json({ message: "Payment verified, download unlocked", purchase });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

// GET /api/payment/my-purchases -> returns full note details the logged-in user has paid for
// (Used by the "My Purchases" page — the Home page's purchase check only needs IDs,
// but this endpoint also serves the richer view, so it always populates the note.)
router.get("/my-purchases", protect, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id, status: "paid" })
      .populate("note", "-fileUrl")
      .sort({ createdAt: -1 });

    const notes = purchases.filter((p) => p.note).map((p) => p.note);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch purchases", error: err.message });
  }
});

module.exports = router;
