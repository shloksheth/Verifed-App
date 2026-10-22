import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./brand.css";

// Keep startup small: the app owns its routes, and the data adapter owns sessions.
createRoot(document.getElementById("root")).render(<App />);
