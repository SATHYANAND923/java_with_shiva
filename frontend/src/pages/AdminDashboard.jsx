import { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, usersRes, purchasesRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/purchases"),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setPurchases(purchasesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1>Manage Users</h1>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{stats?.totalUsers ?? 0}</span>
          <span className="stat-label">Registered Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats?.totalNotes ?? 0}</span>
          <span className="stat-label">Notes Uploaded</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats?.totalPurchases ?? 0}</span>
          <span className="stat-label">Notes Purchased</span>
        </div>
      </div>

      {/* Registered users */}
      <div className="admin-notes-section">
        <h2>Registered Users</h2>
        {users.length === 0 ? (
          <p>No users have signed up yet.</p>
        ) : (
          <div className="admin-notes-table-wrap">
            <table className="admin-notes-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.isAdmin ? (
                        <span className="badge paid">Admin</span>
                      ) : (
                        <span className="badge free">User</span>
                      )}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchases */}
      <div className="admin-notes-section">
        <h2>Purchased Notes</h2>
        {purchases.length === 0 ? (
          <p>No purchases yet.</p>
        ) : (
          <div className="admin-notes-table-wrap">
            <table className="admin-notes-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Note</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Purchased On</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.user?.name ?? "Deleted user"}</strong>
                      {p.user?.email && <p className="note-desc">{p.user.email}</p>}
                    </td>
                    <td>{p.note?.title ?? "Deleted note"}</td>
                    <td>{p.note?.category ?? "-"}</td>
                    <td>₹{p.amount}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
