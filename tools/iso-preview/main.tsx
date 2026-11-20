import React from "react";
import ReactDOM from "react-dom/client";
import { IsoPreviewApp } from "./IsoPreviewApp";
import "./isoPreview.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IsoPreviewApp />
  </React.StrictMode>,
);
