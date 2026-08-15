import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import NoteCard from "../components/NoteCard.jsx";

export default function Home() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get("/notes", { params });
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return setPurchasedIds([]);
    try {
      const { data } = await api.get("/payment/my-purchases");
      setPurchasedIds(data.map((note) => note._id)); // endpoint now returns full note objects
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  const markPurchased = (noteId) => setPurchasedIds((prev) => [...prev, noteId]);

  return (
    <div>
      <h1>Java, DSA & Interview Notes</h1>

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search notes (e.g. Arrays, OOPs, Java Streams)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Java">Java</option>
          <option value="DSA">DSA</option>
          <option value="Interview Questions">Interview Questions</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              purchased={purchasedIds.includes(note._id)}
              onPurchaseComplete={markPurchased}
            />
          ))}
        </div>
      )}
    </div>
  );
}
