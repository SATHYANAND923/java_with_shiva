import { useEffect, useState } from "react";
import api from "../api/axios.js";

// Lists every uploaded note for the admin, with a delete option for each.
// Exposes a `refreshKey` prop so the parent (AdminUpload) can trigger a reload
// right after a new note is uploaded, without this component managing that state itself.
export default function AdminNotesList({ refreshKey }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get("/notes", { params });
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleDelete = async (note) => {
    const confirmed = window.confirm(`Delete "${note.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(note._id);
    try {
      await api.delete(`/notes/${note._id}`);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  return (
    <div className="admin-notes-section">
      <h2>Uploaded Notes</h2>

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search your uploaded notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p>No notes uploaded yet. Use the form above to add your first one.</p>
      ) : (
        <div className="admin-notes-table-wrap">
          <table className="admin-notes-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note._id}>
                  <td>
                    <strong>{note.title}</strong>
                    {note.description && <p className="note-desc">{note.description}</p>}
                  </td>
                  <td>{note.category}</td>
                  <td>
                    {note.isPaid ? (
                      <span className="badge paid">Paid — ₹{note.price}</span>
                    ) : (
                      <span className="badge free">Free</span>
                    )}
                  </td>
                  <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(note)}
                      disabled={deletingId === note._id}
                    >
                      {deletingId === note._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
