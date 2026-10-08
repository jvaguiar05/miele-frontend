import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { DocumentaryDetail } from "./PerdcompDocumentary";

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return "Não foi possível carregar as informações da importação.";
}

export default function usePerdcompDocumentary(perdcompId: string) {
  const [data, setData] = useState<DocumentaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get<DocumentaryDetail>(`/perdcomps/${perdcompId}/documentary/`)
      .then(response => { if (active) setData(response.data); })
      .catch(requestError => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [perdcompId, refreshKey]);

  return { data, loading, error, refresh: () => setRefreshKey(value => value + 1) };
}
