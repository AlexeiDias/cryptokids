import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import ChildDashboard from "./pages/ChildDashboard";
import Login from "./pages/Login";
import { db } from "./services/firebase";
import { doc, getDoc } from "firebase/firestore";

const App: React.FC = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Dev-only override for testing roles
  const [overrideRole, setOverrideRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || null);
        } else {
          console.warn("User document not found.");
          setRole(null);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setRole(null);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  // 🧠 Use overridden role if in dev
  const effectiveRole = overrideRole || role;

  return (
    <Router>
      {/* 🛠️ Dev-only role override UI */}
      {import.meta.env.DEV && user && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 9999,
            background: "white",
            border: "1px solid #ccc",
            padding: "0.5rem",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        >
          <label>
            <strong>Dev Role:</strong>{" "}
            <select
              value={overrideRole || role || ""}
              onChange={(e) =>
                setOverrideRole(
                  e.target.value === "none" ? null : e.target.value
                )
              }
            >
              <option value="none">(default)</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
            </select>
          </label>
        </div>
      )}

      <Routes>
        {!user && <Route path="*" element={<Login />} />}
        {user && effectiveRole === "parent" && (
          <Route path="*" element={<Dashboard />} />
        )}
        {user && effectiveRole === "child" && (
          <Route path="*" element={<ChildDashboard />} />
        )}
        {user && !effectiveRole && (
          <Route
            path="*"
            element={
              <p>
                User role not set. Please contact support or an administrator.
              </p>
            }
          />
        )}
      </Routes>
    </Router>
  );
};

export default App;
