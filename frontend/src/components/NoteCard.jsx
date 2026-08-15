import { useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function NoteCard({ note, purchased, onPurchaseComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const canDownloadFree = !note.isPaid;
  const alreadyPaid = note.isPaid && purchased;

  const handleDownload = async () => {
    try {
      const response = await api.get(`/notes/${note._id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || "Download failed");
    }
  };

  // Opens Razorpay's checkout modal for this specific note
  const handleBuy = async () => {
    if (!user) return alert("Please login to purchase this note.");
    setLoading(true);
    try {
      const { data: order } = await api.post("/payment/create-order", { noteId: note._id });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "java_with_shiva",
        description: order.noteTitle,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              noteId: note._id,
            });
            alert("Payment successful! You can now download this note.");
            onPurchaseComplete?.(note._id);
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#2b6cb0" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || "Could not start payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-card">
      <h3>{note.title}</h3>
      <span className="category-tag">{note.category}</span>
      <p>{note.description}</p>

      {note.isPaid && !alreadyPaid && <p className="price">₹{note.price}</p>}

      {canDownloadFree || alreadyPaid ? (
        <button onClick={handleDownload}>Download</button>
      ) : (
        <button onClick={handleBuy} disabled={loading}>
          {loading ? "Processing..." : `Buy for ₹${note.price}`}
        </button>
      )}
    </div>
  );
}
