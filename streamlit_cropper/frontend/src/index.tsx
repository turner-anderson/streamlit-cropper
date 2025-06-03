import React from "react"
import { createRoot } from "react-dom/client"
import StreamlitCropper from "./StreamlitCropper"

import "./index.css"

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <StreamlitCropper />
  </React.StrictMode>
);
