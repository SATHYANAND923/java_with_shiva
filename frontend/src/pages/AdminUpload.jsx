import { useState } from "react";
import api from "../api/axios.js";
import AdminNotesList from "../components/AdminNotesList.jsx";

export default function AdminUpload() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Java",
    isPaid: false,
    price: "",
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  // Bumping this number tells AdminNotesList to refetch — simplest way to
  // refresh the list right after a successful upload without lifting all its state up.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!file) return setMessage("Please choose a PDF file.");

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);

    try {
      await api.post("/notes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Note uploaded successfully!");
      setForm({ title: "", description: "", category: "Java", isPaid: false, price: "" });
      setFile(null);
      e.target.reset();
      setRefreshKey((k) => k + 1); // triggers AdminNotesList to reload
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <>
    <div className="form-card">
      <h2>Upload a Note / PDF (Admin only)</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="Java">Java</option>
          <option value="DSA">DSA</option>
          <option value="Interview Questions">Interview Questions</option>
        </select>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isPaid}
            onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
          />
          This is a paid note
        </label>

        {form.isPaid && (
          <input
            type="number"
            placeholder="Price in INR"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            min="1"
            required
          />
        )}

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

        <button type="submit">Upload</button>
      </form>
    </div>

    <AdminNotesList refreshKey={refreshKey} />
    </>
  );
}
