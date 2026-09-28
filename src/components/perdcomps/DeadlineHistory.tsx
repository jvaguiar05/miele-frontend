import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Entry { id: number; timestamp: string; user: string; previous_due: string | null; new_due: string | null; reason: string | null; kind: string; }
const dateLabel = (value: string | null) => value ? value.slice(0, 10).split("-").reverse().join("/") : "Não informado";

export default function DeadlineHistory({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(s => s.user?.id);
  const history = useQuery({
    queryKey: ["deadline-history", userId, id, page],
    queryFn: async () => (await api.get<{ results: Entry[]; count: number; next: string | null; previous: string | null }>(`/perdcomps/${id}/deadline-history/`, { params: { page } })).data,
    retry: false,
  });
  return <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Histórico de vencimentos</CardTitle><Button variant="outline" disabled={history.isFetching} onClick={() => void history.refetch()}>Atualizar</Button></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Datas e justificativas registradas na auditoria deste processo. Alterações anteriores à existência da auditoria podem não estar disponíveis.</p>
    {history.isPending && <p role="status">Carregando histórico…</p>}
    {history.isError && <p role="alert" className="text-destructive">Não foi possível consultar o histórico. Verifique sua permissão ou tente Atualizar.</p>}
    {!history.isError && history.data && <>
      {!history.data.count && <p>Nenhum histórico de vencimento disponível.</p>}
      <ol className="space-y-3">{history.data.results.map(entry => <li key={entry.id} className="border rounded-lg p-4 space-y-2">
        <p className="font-medium">{entry.kind === "exception" ? "Exceção justificada" : entry.kind === "initial" ? "Vencimento inicial" : "Alteração de vencimento"}</p>
        <p className="text-sm">{dateLabel(entry.previous_due)} → {dateLabel(entry.new_due)}</p>
        {entry.reason && <p className="text-sm whitespace-pre-wrap break-words"><strong>Justificativa:</strong> {entry.reason}</p>}
        <p className="text-xs text-muted-foreground">{entry.user} · {new Date(entry.timestamp).toLocaleString("pt-BR")}</p>
      </li>)}</ol>
      <div className="flex gap-3 items-center"><Button variant="outline" disabled={!history.data.previous || history.isFetching} onClick={() => setPage(p => p - 1)}>Anterior</Button><span className="text-sm">Página {page} · {history.data.count} registros</span><Button variant="outline" disabled={!history.data.next || history.isFetching} onClick={() => setPage(p => p + 1)}>Próxima</Button></div>
    </>}
  </CardContent></Card>;
}
