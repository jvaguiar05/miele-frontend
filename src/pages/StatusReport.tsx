import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ClientMultiFilter, { type ReportClient } from "@/components/reports/ClientMultiFilter";

const statuses = { RASCUNHO: "Rascunho (histórico)", TRANSMITIDO: "Transmitido", EM_PROCESSAMENTO: "Em processamento", DEFERIDO: "Deferido", INDEFERIDO: "Indeferido", PARCIALMENTE_DEFERIDO: "Parcialmente deferido", CANCELADO: "Cancelado", VENCIDO: "Vencido" };
const defaults = { client: "", client_id: "", client_ids: "", status: "", tax: "", start: "", end: "", date_field: "data_transmissao", scope: "all" };
type Filters = typeof defaults;
interface Row { id: string; number: string; client: string; cnpj: string; status_label: string; tax: string; transmission: string | null; due: string | null; amount: string | null; balance: string | null; }
interface Result { count: number; next: string | null; previous: string | null; results: Row[]; selected_clients: ReportClient[]; summary: { amount: string; balance: string; missing_values: number; statuses: Record<string, number> }; }
const money = (value: string | null) => value === null ? "Não informado" : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string | null) => value ? value.split("-").reverse().join("/") : "—";
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";
const filtersFromQuery = (query: string): Filters => {
  const params = new URLSearchParams(query);
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, params.get(key) ?? value])) as Filters;
};

export default function StatusReport() {
  const [search, setSearch] = useSearchParams();
  const url = search.toString();
  const [draft, setDraft] = useState<Filters>(() => filtersFromQuery(url));
  useEffect(() => setDraft(filtersFromQuery(url)), [url]);
  const [exporting, setExporting] = useState(false);
  const [selectedClients, setSelectedClients] = useState<ReportClient[]>([]);
  const user = useAuthStore(s => s.user?.id);
  const { toast } = useToast();
  const report = useQuery({ queryKey: ["status-report", user, url], queryFn: async () => (await api.get<Result>("/perdcomps/status-report/", { params: Object.fromEntries(search) })).data, retry: false });
  useEffect(() => { if (report.data) setSelectedClients(report.data.selected_clients || []); }, [url, report.data]);
  const chooseClients = (clients: ReportClient[]) => { setSelectedClients(clients); setDraft(current => ({ ...current, client: "", client_id: "", client_ids: clients.map(item => item.id).join(",") })); };
  const apply = () => setSearch(Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== "")));
  const setPage = (page: number) => { const next = new URLSearchParams(search); next.set("page", String(page)); setSearch(next); };
  const page = Math.max(1, Number(search.get("page")) || 1);
  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await api.get("/perdcomps/status-report/", { params: { ...Object.fromEntries(search), export: "csv" }, responseType: "blob" });
      const link = document.createElement("a"); const blobUrl = URL.createObjectURL(response.data);
      link.href = blobUrl; link.download = "relatorio-status.csv"; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch { toast({ title: "Erro na exportação", description: "Tente novamente após verificar a conexão.", variant: "destructive" }); }
    finally { setExporting(false); }
  };
  const field = (key: keyof Filters, label: string, type = "text") => <div><Label htmlFor={`status-${key}`}>{label}</Label><Input id={`status-${key}`} type={type} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></div>;
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Relatórios personalizados</h1><p className="text-muted-foreground mt-2">Combine clientes, status, tributo, grupo e período. O resultado representa o estado atual e não reconstrói o status histórico.</p></div><Button asChild variant="outline"><Link to="/reports">Próximos a vencer</Link></Button></div>
    <Card className="p-4"><form className="space-y-4" onSubmit={e => { e.preventDefault(); apply(); }}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClientMultiFilter selected={selectedClients} onChange={chooseClients} />
        <div><Label htmlFor="status-choice">Status</Label><select id="status-choice" className={selectClass} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">Todos</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        {field("tax", "Tributo")}
        <div><Label htmlFor="scope-choice">Grupo de processos</Label><select id="scope-choice" className={selectClass} value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value })}><option value="all">Todos</option><option value="transmitted">Volume transmitido</option><option value="open">Saldo em acompanhamento</option></select></div>
        <div><Label htmlFor="date-choice">Filtrar período por</Label><select id="date-choice" className={selectClass} value={draft.date_field} onChange={e => setDraft({ ...draft, date_field: e.target.value })}><option value="data_transmissao">Transmissão</option><option value="data_vencimento">Vencimento</option><option value="created_at">Cadastro</option></select></div>
        {field("start", "Data inicial", "date")}{field("end", "Data final", "date")}
      </div>
      {draft.client_id && <p className="text-sm">Filtro por empresa selecionada no Dashboard. <button type="button" className="underline" onClick={() => setDraft({ ...draft, client_id: "" })}>Remover filtro de empresa</button></p>}
      <div className="flex flex-wrap gap-2"><Button>Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setDraft(defaults); setSelectedClients([]); setSearch({}); }}>Limpar</Button><Button type="button" variant="outline" disabled={report.isFetching} onClick={() => void report.refetch()}>Atualizar</Button><Button type="button" variant="outline" onClick={exportCsv} disabled={exporting || report.isFetching || report.isError || !report.data?.count}>{exporting ? "Exportando…" : "Exportar todos os resultados (CSV)"}</Button></div>
      <p className="text-xs text-muted-foreground">A exportação usa os filtros aplicados e inclui todas as páginas. Saldo é o valor cadastrado, sem confirmação de disponibilidade.</p>
    </form></Card>
    {report.isPending && <p role="status">Carregando relatório…</p>}
    {report.isError && <p role="alert" className="text-destructive">Não foi possível consultar. Verifique os filtros (inclusive a ordem das datas), sua permissão e a conexão.</p>}
    {report.data && !report.isError && <>
      <div className="grid sm:grid-cols-3 gap-4">{[["Processos", report.data.count], ["Valor pedido", money(report.data.summary.amount)], ["Saldo cadastrado", money(report.data.summary.balance)]].map(([label, value]) => <Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></Card>)}</div>
      {report.data.summary.missing_values > 0 && <p role="alert">Totais parciais: {report.data.summary.missing_values} campos monetários ausentes ou inválidos.</p>}
      <Card className="p-4 space-y-4">
        {!report.data.count ? <p>Nenhum processo corresponde aos filtros.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{["Cliente", "Processo", "Status", "Tributo", "Transmissão", "Vencimento", "Valor pedido", "Saldo"].map(label => <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody>{report.data.results.map(row => <tr className="border-b" key={row.id}><td className="p-3">{row.client}<p className="text-xs text-muted-foreground">{row.cnpj}</p></td><td className="p-3"><Link className="text-primary underline" to={`/perdcomps/${row.id}`}>{row.number}</Link></td><td className="p-3">{row.status_label}</td><td className="p-3">{row.tax}</td><td className="p-3 whitespace-nowrap">{date(row.transmission)}</td><td className="p-3 whitespace-nowrap">{date(row.due)}</td><td className="p-3 whitespace-nowrap">{money(row.amount)}</td><td className="p-3 whitespace-nowrap">{money(row.balance)}</td></tr>)}</tbody></table></div>}
        <div className="flex gap-3 items-center"><Button variant="outline" disabled={!report.data.previous || report.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={!report.data.next || report.isFetching} onClick={() => setPage(page + 1)}>Próxima</Button></div>
      </Card>
    </>}
  </div>;
}
