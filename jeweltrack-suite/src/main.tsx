import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react"
import App from "./App.tsx";
import "./index.css";
// fixing bug in analyticss
createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);
