import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StorageSummary = {
  status: string;
  total: number;
  archived: number;
  pending: number;
  database_copies: number;
  unavailable: number;
  released?: number;
  message?: string;
};

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { detail?: unknown } } }).response?.data;
    if (typeof data?.detail === "string") return data.detail;
  }
  return "Não foi possível consultar o arquivamento agora.";
}

export default function PerdcompStorageQueue({ refreshKey = 0 }: { refreshKey?: number }) {
  const isAdmin = useAuthStore(state => state.isAdmin);
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const stopRequested = useRef(false);

  useEffect(() => {
    let active = true;
    api.get<StorageSummary>("/perdcomps/import/storage/")
      .then(({ data }) => { if (active) setSummary(data); })
      .catch(error => { if (active) setMessage(errorMessage(error)); });
    return () => { active = false; stopRequested.current = true; };
  }, [refreshKey]);

  async function archive() {
    if (syncing) {
      stopRequested.current = true;
      setMessage("Pausa solicitada. O PDF em andamento será concluído com segurança.");
      return;
    }
    stopRequested.current = false;
    setSyncing(true);
    try {
      while (!stopRequested.current) {
        const { data } = await api.post<StorageSummary>(
          "/perdcomps/import/storage/",
          {},
          { timeout: 180000 },
        );
        setSummary(data);
        setMessage(data.message || "Arquivamento atualizado.");
        if (data.pending === 0) {
          toast.success("Todos os PDFs foram verificados e arquivados no Drive.");
          break;
        }
        if (!data.released) {
          toast.warning(data.message || "Arquivamento pausado. Verifique a conexão com o Drive.");
          break;
        }
        await new Promise(resolve => window.setTimeout(resolve, 6500));
      }
      if (stopRequested.current) {
        toast.info("Arquivamento pausado. Você pode continuar depois sem duplicar arquivos.");
      }
    } catch (error) {
      setMessage("Arquivamento pausado. Os PDFs continuam protegidos no banco.");
      toast.error(errorMessage(error));
    } finally {
      setSyncing(false);
      stopRequested.current = false;
    }
  }

  if (!summary?.total) return message ? <p role="alert" className="mb-4 text-xs text-destructive">{message}</p> : null;

  const percentage = Math.round(summary.archived * 100 / summary.total);
  return (
    <Card className="mb-4 border-primary/15 bg-card/70 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Originais no Google Drive</p>
            <Badge variant={summary.pending ? "outline" : "secondary"}>
              {summary.archived}/{summary.total} arquivados
            </Badge>
          </div>
          <div className="h-2 max-w-xl overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {message || (summary.pending
              ? `${summary.pending} PDF(s) aguardando. Eles permanecem protegidos no banco até a verificação no Drive.`
              : "Arquivamento concluído; downloads são obtidos automaticamente do Drive.")}
          </p>
        </div>
        {summary.pending > 0 && (isAdmin
          ? <Button size="sm" variant="outline" onClick={archive}>
              {syncing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Pausar após o atual</>
                : <><Upload className="mr-2 h-4 w-4" />Arquivar no Drive</>}
            </Button>
          : <span className="text-xs text-muted-foreground">Aguardando um administrador</span>)}
      </div>
    </Card>
  );
}
