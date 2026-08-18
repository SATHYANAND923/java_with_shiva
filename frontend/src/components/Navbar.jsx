import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        {/* Replace /logo.png in frontend/public with your actual logo file */}
        <img src="/logo.png" alt="java_with_shiva logo" className="logo" />
        <span>java_with_shiva</span>
      </Link>

      <nav className="nav-links">
        {user?.isAdmin && <Link to="/admin/upload">Upload Note</Link>}
        {user?.isAdmin && <Link to="/admin/users">Manage Users</Link>}
        {user && !user.isAdmin && <Link to="/my-purchases">My Purchases</Link>}
        {user ? (
          <>
            <span className="hello">Hi, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
