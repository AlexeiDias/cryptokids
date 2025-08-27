import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { getUserData } from "../services/firestoreService";

interface User {
  uid: string;
  email?: string;
  name?: string;
  familyId: string;
  role: "parent" | "child";
}

interface AuthContextType {
  user: User | null;
  setDevUserId?: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null });
const DEV_MODE = import.meta.env.DEV;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [devUserId, setDevUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const data = await getUserData(firebaseUser.uid);
        if (data) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            ...data,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const computedUser = DEV_MODE && devUserId ? (user ? { ...user, uid: devUserId } : null) : user;

  return (
    <AuthContext.Provider value={{ user: computedUser, setDevUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
