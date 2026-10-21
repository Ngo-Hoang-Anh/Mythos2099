import React from "react";
import ReactDOM from "react-dom/client";
import "../src/ui/styles.css";
import { StudioApp } from "./StudioApp";
import "./studio.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StudioApp />
  </React.StrictMode>,
);
