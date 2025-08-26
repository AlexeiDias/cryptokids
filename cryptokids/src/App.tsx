import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

  useEffect(() => {
    const fetchRole = async () => {
      if (user?.uid) {
        try {
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setRole(snap.data().role); // "parent" or "child"
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : role === "parent" ? (
          <Route path="*" element={<Dashboard />} />
        ) : role === "child" ? (
          <Route path="*" element={<ChildDashboard />} />
        ) : (
          <Route path="*" element={<p>No role assigned. Contact admin.</p>} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
