import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initialEntry } from "./lib/entry";

/* Decide admin (HashRouter) vs public (BrowserRouter) BEFORE the first render,
   so /#/admin/login never passes through the public homepage. */
const entry = initialEntry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialEntry={entry} />
  </StrictMode>
);
