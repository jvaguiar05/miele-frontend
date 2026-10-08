import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CANONICAL_PRODUCTION_HOST = "miele-frontend-staging.vercel.app";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const currentHost = window.location.hostname.toLowerCase();
const isNonCanonicalProductionHost =
  import.meta.env.PROD &&
  currentHost !== CANONICAL_PRODUCTION_HOST &&
  !LOCAL_HOSTS.has(currentHost);

if (isNonCanonicalProductionHost) {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.protocol = "https:";
  canonicalUrl.host = CANONICAL_PRODUCTION_HOST;
  window.location.replace(canonicalUrl.toString());
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
