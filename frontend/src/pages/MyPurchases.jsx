import { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function MyPurchases() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // tracks which note's button is mid-action

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payment/my-purchases");
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Opens the PDF inline in a new browser tab, without downloading it.
  const handleView = async (note) => {
    setBusyId(note._id + "-view");
    try {
      const response = await api.get(`/notes/${note._id}/view`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(blobUrl, "_blank");
    } catch (err) {
      alert(err.response?.data?.message || "Could not open this note");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (note) => {
    setBusyId(note._id + "-download");
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
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1>My Purchases</h1>

      {loading ? (
        <p>Loading your purchases...</p>
      ) : notes.length === 0 ? (
        <p>
          You haven't purchased any notes yet. Browse the{" "}
          <a href="/">home page</a> to find paid notes and interview question sets.
        </p>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note._id} className="note-card">
              <h3>{note.title}</h3>
              <span className="category-tag">{note.category}</span>
              {note.description && <p>{note.description}</p>}
              <div className="purchase-actions">
                <button onClick={() => handleView(note)} disabled={busyId === note._id + "-view"}>
                  {busyId === note._id + "-view" ? "Opening..." : "View"}
                </button>
                <button
                  className="secondary"
                  onClick={() => handleDownload(note)}
                  disabled={busyId === note._id + "-download"}
                >
                  {busyId === note._id + "-download" ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
