// ✅ Import polyfills before everything else
import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { seedDemoData } from "./utils/seed";
import { AuthProvider } from "./context/AuthContext";

const DEMO_FAMILY_ID = "demo-family";
seedDemoData(DEMO_FAMILY_ID);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
