import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isSignup) {
            await signup(email, password, "parent"); // 👈 always parent for now
          } else {
            await login(email, password);
          }
          
    } catch (err) {
      console.error("Auth error:", err);
      alert("Authentication failed. Check console.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isSignup ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br/>
        <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
      </form>
      <p onClick={() => setIsSignup(!isSignup)} style={{cursor:"pointer", color:"blue"}}>
        {isSignup ? "Already have an account? Login" : "No account? Sign Up"}
      </p>
    </div>
  );
};

export default Login;
