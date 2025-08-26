import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: "parent" | "child") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Watch Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch profile doc from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ uid: firebaseUser.uid, ...userSnap.data() });
        } else {
          // fallback if Firestore doc missing
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Signup (creates Firestore profile doc)
  const signup = async (email: string, password: string, role: "parent" | "child" = "parent") => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Create Firestore user doc
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      role,
      familyId: role === "parent" ? cred.user.uid : null, // parent gets own familyId
      createdAt: new Date(),
    });
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
