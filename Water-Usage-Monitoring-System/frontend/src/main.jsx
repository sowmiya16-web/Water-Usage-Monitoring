import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if ("serviceWorker" in navigator) {
  const registerSw = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (document.readyState === "complete") registerSw();
  else window.addEventListener("load", registerSw);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);