import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

interface ReportRow {
  id: string; number: string; client: string; status_label: string;
  due: string; business_days: number; severity: string; balance: string | null;
}
interface Filters { client: string; status: string; start: string; end: string; include_overdue: boolean; }
const initial: Filters = { client: "", status: "", start: "", end: "", include_overdue: false };
const date = (value: string) => value.split("-").reverse().join("/");
const money = (value: string) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function UpcomingReport() {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const userId = useAuthStore(s => s.user?.id);
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
  const report = useQuery({
    queryKey: ["upcoming-report", userId, filters],
    queryFn: async () => (await api.get<{ results: ReportRow[]; count: number; reference_date: string }>("/perdcomps/upcoming-report/", { params })).data,
    retry: false,
  });
  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await api.get("/perdcomps/upcoming-report/", { params: { ...params, export: "csv" }, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = "proximos-vencimentos.csv";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast({ title: "Não foi possível exportar", description: "Verifique a conexão e tente novamente.", variant: "destructive" });
    } finally { setExporting(false); }
  };
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <div><h1 className="text-3xl font-bold">Próximos a vencer</h1><p className="text-muted-foreground mt-2">Processos na janela de 30 dias úteis. Inclui os que vencem hoje; vencidos são opcionais.</p></div>
    <div className="flex gap-2 flex-wrap"><Button asChild variant="outline"><Link to="/reports/status">Relatório de Status</Link></Button><Button asChild variant="outline"><Link to="/reports/quarters">Saldos trimestrais</Link></Button><Button asChild variant="outline"><Link to="/reports/updates">Atualizações diárias</Link></Button></div>
    <Card className="p-4 space-y-4">
      <form onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); }} className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><Label htmlFor="report-client">Cliente ou CNPJ</Label><Input id="report-client" value={draft.client} onChange={e => setDraft({ ...draft, client: e.target.value })} /></div>
          <div><Label htmlFor="report-status">Status</Label><select id="report-status" className="w-full h-10 rounded-md border bg-background px-3" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>
            <option value="">Todos elegíveis</option><option value="TRANSMITIDO">Transmitido</option><option value="EM_PROCESSAMENTO">Em processamento</option><option value="PARCIALMENTE_DEFERIDO">Parcialmente deferido</option><option value="VENCIDO">Vencido</option>
          </select></div>
          <div><Label htmlFor="report-start">Vencimento a partir de</Label><Input id="report-start" type="date" value={draft.start} max={draft.end || undefined} onChange={e => setDraft({ ...draft, start: e.target.value })} /></div>
          <div><Label htmlFor="report-end">Vencimento até</Label><Input id="report-end" type="date" value={draft.end} min={draft.start || undefined} onChange={e => setDraft({ ...draft, end: e.target.value })} /></div>
        </div>
        <label className="flex gap-2 text-sm items-center"><input type="checkbox" checked={draft.include_overdue} onChange={e => setDraft({ ...draft, include_overdue: e.target.checked })} />Incluir vencidos</label>
        <div className="flex flex-wrap gap-2"><Button type="submit">Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setDraft(initial); setFilters(initial); }}>Limpar</Button><Button type="button" variant="outline" onClick={() => void report.refetch()} disabled={report.isFetching}>Atualizar</Button><Button type="button" variant="outline" onClick={exportCsv} disabled={exporting || report.isFetching || report.isError || !report.data?.count}>{exporting ? "Exportando…" : "Exportar CSV dos filtros aplicados"}</Button></div>
      </form>
      <p className="text-xs text-muted-foreground">O intervalo restringe a janela de alerta. Calendário: segunda a sexta, exceto feriados nacionais fixos e datas adicionais configuradas. Exclui rascunhos, cancelados, deferidos e indeferidos.</p>
    </Card>
    {report.isPending && <p role="status">Carregando relatório…</p>}
    {report.isError && <p role="alert" className="text-destructive">Não foi possível consultar o relatório. Verifique os filtros e a conexão, depois clique Atualizar.</p>}
    {report.data && !report.isError && <Card className="p-4">
      <p className="text-sm mb-4">{report.data.count} processos · Data de referência: {date(report.data.reference_date)}</p>
      {!report.data.count ? <p className="text-muted-foreground">Nenhum processo corresponde aos filtros.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{["Cliente", "Processo", "Status", "Vencimento", "Prazo", "Saldo cadastrado"].map(label => <th className="p-3 border-b" key={label}>{label}</th>)}</tr></thead><tbody>
        {report.data.results.map(row => <tr key={row.id} className="border-b"><td className="p-3">{row.client}</td><td className="p-3"><Link className="text-primary underline" to={`/perdcomps/${row.id}`}>{row.number}</Link></td><td className="p-3">{row.status_label}</td><td className="p-3 whitespace-nowrap">{date(row.due)}</td><td className="p-3">{row.severity === "overdue" ? "Vencido" : row.severity === "today" ? "Vence hoje" : `${row.business_days} dias úteis`}</td><td className="p-3 whitespace-nowrap">{row.balance === null ? "Não informado" : money(row.balance)}</td></tr>)}
      </tbody></table></div>}
    </Card>}
  </div>;
}
