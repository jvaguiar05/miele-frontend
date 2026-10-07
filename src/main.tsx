import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CANONICAL_PRODUCTION_HOST = "miele-frontend-staging.vercel.app";
const currentHost = window.location.hostname.toLowerCase();
const isTemporaryVercelDeployment =
  import.meta.env.PROD &&
  currentHost.startsWith("miele-frontend-staging-") &&
  currentHost.endsWith(".vercel.app");

if (isTemporaryVercelDeployment) {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.protocol = "https:";
  canonicalUrl.host = CANONICAL_PRODUCTION_HOST;
  window.location.replace(canonicalUrl.toString());
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
