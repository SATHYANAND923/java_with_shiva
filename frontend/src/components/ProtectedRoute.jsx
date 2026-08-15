import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wrap any page that requires login (and optionally admin rights)
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;

  return children;
}
