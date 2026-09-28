import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Change { field: string; before: string | number | boolean | null; after: string | number | boolean | null; }
interface Event { id: number; timestamp: string; user_name: string; origin: string; action_label: string; resource: string; entity: string; client: string; perdcomp: string; href: string | null; changes: Change[]; reason: string | null; }
interface Result { results: Event[]; count: number; next: string | null; previous: string | null; start: string; end: string; scope: string; }
const initial = { start: "", end: "", user: "", client: "", perdcomp: "", action: "", origin: "" };
const actions = { CREATE: "Criação", UPDATE: "Alteração", DELETE: "Exclusão", LOGIN: "Login", LOGOUT: "Logout", APPROVAL_REQUESTED: "Aprovação solicitada", APPROVAL_GRANTED: "Aprovação concedida", APPROVAL_DENIED: "Aprovação recusada", CUSTOM: "Outras ações / justificativas" };
const value = (v: Change["before"]) => v === null ? "Não informado" : typeof v === "boolean" ? v ? "Sim" : "Não" : String(v);
const dateLabel = (s: string) => s.split("-").reverse().join("/");

export default function DailyUpdates() {
  const { user, isAdmin } = useAuthStore();
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
  const report = useQuery({ queryKey: ["daily-updates", user?.id, filters, page], queryFn: async () => (await api.get<Result>("/activities/daily-report/", { params: { ...params, page } })).data, retry: false });
  const exportCsv = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/activities/daily-report/", { params: { ...params, export: "csv" }, responseType: "blob" });
      const url = URL.createObjectURL(data); const link = document.createElement("a"); link.href = url; link.download = "atualizacoes-diarias.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast({ title: "Não foi possível exportar", description: "Verifique os filtros e a conexão.", variant: "destructive" }); }
    finally { setExporting(false); }
  };
  const input = (key: keyof typeof initial, label: string, type = "text") => <div><Label htmlFor={`daily-${key}`}>{label}</Label><Input id={`daily-${key}`} type={type} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></div>;
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Atualizações diárias</h1><p className="text-muted-foreground mt-2">{isAdmin ? "Visão administrativa das atividades registradas." : "Histórico das suas próprias ações."} Horários de São Paulo.</p></div><Button asChild variant="outline"><Link to="/home">Dashboard</Link></Button></header>
    <Card className="p-4"><form className="space-y-4" onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); setPage(1); }}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{input("start", "Data inicial", "date")}{input("end", "Data final", "date")}{isAdmin && input("user", "Usuário (nome ou login)")}{input("client", "Cliente (nome)")}{input("perdcomp", "Número PER/DCOMP")}
        <div><Label htmlFor="daily-action">Tipo de ação</Label><select id="daily-action" className="w-full h-10 border rounded bg-background px-3 text-sm" value={draft.action} onChange={e => setDraft({ ...draft, action: e.target.value })}><option value="">Todas</option>{Object.entries(actions).map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select></div>
        {isAdmin && <div><Label htmlFor="daily-origin">Autoria</Label><select id="daily-origin" className="w-full h-10 border rounded bg-background px-3 text-sm" value={draft.origin} onChange={e => setDraft({ ...draft, origin: e.target.value })}><option value="">Todas</option><option value="user">Usuário identificado</option><option value="system">Sistema / autoria não registrada</option></select></div>}
      </div>
      <p className="text-xs text-muted-foreground">Sem datas, consulta hoje. Com uma data, consulta esse dia. Intervalo máximo: 366 dias. Cliente inclui alterações do cadastro e das PER/DCOMPs relacionadas quando o vínculo estiver disponível.</p>
      <div className="flex flex-wrap gap-2"><Button>Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setDraft(initial); setFilters(initial); setPage(1); }}>Hoje / limpar</Button><Button type="button" variant="outline" disabled={report.isFetching} onClick={() => void report.refetch()}>Atualizar</Button><Button type="button" variant="outline" disabled={report.isFetching || report.isError || !report.data?.count || exporting} onClick={exportCsv}>{exporting ? "Exportando…" : "Exportar CSV"}</Button></div>
    </form></Card>
    {report.isPending && <p role="status">Carregando atividades…</p>}
    {report.isError && <p role="alert" className="text-destructive">Não foi possível consultar. Verifique o período, sua permissão e a conexão.</p>}
    {report.data && !report.isError && <>
      <p className="text-sm">{report.data.count} eventos · {dateLabel(report.data.start)} a {dateLabel(report.data.end)} · {report.data.scope === "own" ? "Suas ações" : "Todas as ações"}</p>
      <p className="text-xs text-muted-foreground">Detalhes limitados aos campos de negócio autorizados. Eventos sem usuário podem ser automáticos ou ter autoria não registrada. O CSV inclui todas as páginas e uma linha por campo alterado.</p>
      {!report.data.count && <Card className="p-5">Nenhuma atividade corresponde aos filtros.</Card>}
      {report.data.results.map(event => <Card key={event.id} className="p-4 space-y-3">
        <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{event.action_label} · {event.entity}</h2><p className="text-sm text-muted-foreground">{event.user_name} · {new Date(event.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p></div>{event.href && <Button asChild size="sm" variant="outline"><Link to={event.href}>Abrir registro</Link></Button>}</div>
        {event.client && event.perdcomp && <p className="text-sm">Cliente: {event.client}</p>}
        {event.reason && <p className="text-sm whitespace-pre-wrap break-words"><strong>Justificativa:</strong> {event.reason}</p>}
        <details><summary className="cursor-pointer text-sm font-medium">Detalhes ({event.changes.length} campos)</summary>{!event.changes.length ? <p className="text-sm text-muted-foreground mt-2">Sem diferenças em campos de negócio autorizados. O evento permanece registrado.</p> : <div className="overflow-x-auto mt-3"><table className="w-full text-sm text-left"><thead><tr><th className="p-2 border-b">Campo</th><th className="p-2 border-b">Antes</th><th className="p-2 border-b">Depois</th></tr></thead><tbody>{event.changes.map(change => <tr key={change.field} className="border-b"><td className="p-2">{change.field}</td><td className="p-2 whitespace-pre-wrap break-words max-w-md">{value(change.before)}</td><td className="p-2 whitespace-pre-wrap break-words max-w-md">{value(change.after)}</td></tr>)}</tbody></table></div>}</details>
      </Card>)}
      <div className="flex gap-3 items-center"><Button variant="outline" disabled={!report.data.previous || report.isFetching} onClick={() => setPage(p => p - 1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={!report.data.next || report.isFetching} onClick={() => setPage(p => p + 1)}>Próxima</Button></div>
    </>}
  </div>;
}
