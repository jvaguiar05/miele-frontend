import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Dashboard {
  generated_at: string; reference_date: string; clients: number; processes: number;
  transmitted_count: number; transmitted_amount: string; balance: string; missing_values: number;
  quarter: number; quarter_end: string; quarter_alert: boolean;
  alerts: { id: string; number: string; client: string; due: string; severity: string; business_days: number }[];
  statuses: { status: string; label: string; count: number }[];
  companies: { id: string; name: string; count: number; amount: string }[];
}
interface Activity { id: number; timestamp: string; user_name: string; action_label: string; entity: string; }
const currency = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
// Date-only API values must not be converted from UTC to the previous local day.
const dateLabel = (value: string) => value.split("-").reverse().join("/");

export default function OperationalDashboard() {
  const { user, isAdmin } = useAuthStore();
  const dashboard = useQuery({
    queryKey: ["operational-dashboard", user?.id],
    queryFn: async () => (await api.get<Dashboard>("/dashboard/operations/")).data,
    refetchInterval: 60_000,
    retry: false,
  });
  const activities = useQuery({
    queryKey: ["dashboard-activities", user?.id, dashboard.data?.reference_date],
    enabled: !!dashboard.data,
    queryFn: async () => (await api.get<{ results: Activity[] }>("/activities/daily-report/")).data,
    refetchInterval: 60_000,
    retry: false,
  });
  const data = dashboard.data;
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl md:text-3xl font-bold">Visão geral</h1>
        <p className="text-muted-foreground">Olá, {user?.first_name || user?.username}. Acompanhe seus processos e prazos.</p>
        {import.meta.env.MODE === "sandbox" && <Badge variant="outline" className="mt-2">Ambiente de testes</Badge>}
      </div>
      <div className="flex gap-2">
        {isAdmin && <Button variant="outline" asChild><Link to="/admin-dashboard">Administração</Link></Button>}
        <Button variant="outline" disabled={dashboard.isFetching} onClick={() => { void dashboard.refetch(); void activities.refetch(); }}>
          <RefreshCw className={`mr-2 h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />Atualizar
        </Button>
      </div>
    </header>
    {dashboard.isError && <div role="alert" className="rounded-lg border border-destructive p-4 text-destructive">Não foi possível atualizar o painel. Verifique se o backend está em execução e tente Atualizar.{data && " Os dados abaixo são da última consulta bem-sucedida."}</div>}
    {dashboard.isPending && <p role="status">Carregando indicadores…</p>}
    {data && <>
      <p className="text-xs text-muted-foreground">Atualizado em {new Date(data.generated_at).toLocaleString("pt-BR")} · Totais de todo o período, somente registros e clientes ativos.</p>
      {data.missing_values > 0 && <p role="alert" className="rounded-lg bg-amber-50 text-amber-900 p-3">Há {data.missing_values} campos monetários ausentes ou inválidos. Os totais são parciais; confira os pedidos e saldos cadastrados.</p>}
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Volume transmitido", currency(data.transmitted_amount), `${data.transmitted_count} processos · exclui rascunhos e cancelados`, "/reports/status?scope=transmitted"],
          ["Saldo em acompanhamento", currency(data.balance), "Saldo cadastrado dos processos em aberto", "/reports/status?scope=open"],
          ["Processos cadastrados", String(data.processes), `${data.clients} clientes ativos`, "/reports/status"],
          ["Próximos a vencer", String(data.alerts.filter(a => a.severity === "upcoming" || a.severity === "today").length), `${data.alerts.filter(a => a.severity === "overdue").length} vencidos · janela de 30 dias úteis`, "/reports"],
        ].map(([title, value, caption, href]) => <Link key={title} to={href} className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Card className="h-full hover:border-primary"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold break-words">{value}</p><p className="text-xs text-muted-foreground mt-2">{caption}</p></CardContent></Card></Link>)}
      </section>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex gap-2 items-center"><AlertTriangle className="h-5 w-5" />Alertas prioritários <Badge variant="secondary">{data.alerts.length}</Badge></CardTitle>
          <p className="text-sm text-muted-foreground">Vencimentos cadastrados. Calendário inicial: segunda a sexta, exceto feriados nacionais fixos. Feriados locais e móveis dependem de configuração.</p>
          <Button asChild size="sm" variant="outline"><Link to="/reports">Relatório e exportação</Link></Button>
        </CardHeader><CardContent>
          {!data.alerts.length ? <p className="text-muted-foreground">Nenhum prazo na janela de alerta.</p> : <div className="max-h-[480px] overflow-y-auto space-y-3">
            {data.alerts.map(a => <div key={a.id} className="border rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
              <div className="min-w-0"><Badge variant={a.severity === "upcoming" ? "secondary" : "destructive"}>{a.severity === "overdue" ? "Vencido" : a.severity === "today" ? "Vence hoje" : `${a.business_days} dias úteis restantes`}</Badge><p className="font-medium mt-2 break-words">{a.client}</p><p className="text-sm text-muted-foreground break-all">{a.number} · Vencimento: {dateLabel(a.due)}</p></div>
              <Button asChild size="sm" variant="outline"><Link to={`/perdcomps/${a.id}`}>Abrir processo</Link></Button>
            </div>)}
          </div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Fechamento do trimestre</CardTitle></CardHeader><CardContent className="space-y-4">
          <p>{data.quarter}º trimestre · {dateLabel(data.quarter_end)}</p><p className="text-3xl font-bold">{currency(data.balance)}</p>
          <p className="text-sm text-muted-foreground">Saldo atual em acompanhamento. Consulte as fotografias salvas para revisar posições e fechamentos anteriores.</p>
          {data.quarter_alert && <p className="rounded-lg bg-amber-50 text-amber-900 p-3">O trimestre encerra em até 7 dias. Revise os processos com saldo.</p>}
          <Button asChild variant="outline"><Link to="/reports/quarters">Posições e fechamentos</Link></Button>
        </CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Status dos processos</CardTitle></CardHeader><CardContent className="space-y-3">
          {data.statuses.map(s => <Link className="block rounded hover:bg-muted p-1" key={s.status} to={`/reports/status?status=${s.status}`}><div className="flex justify-between text-sm"><span>{s.label}</span><span>{s.count}</span></div><div className="bg-muted h-2 rounded mt-1"><div className="bg-primary h-2 rounded" style={{ width: `${data.processes ? s.count / data.processes * 100 : 0}%` }} /></div></Link>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Volume transmitido por empresa</CardTitle></CardHeader><CardContent className="max-h-96 overflow-auto space-y-4">
          {!data.companies.length && <p className="text-muted-foreground">Nenhuma transmissão registrada.</p>}
          {data.companies.map(c => <Link key={c.id} className="block border-b pb-3 hover:text-primary" to={`/reports/status?scope=transmitted&client_id=${c.id}`}><span className="font-medium">{c.name}</span><div className="flex justify-between text-sm mt-1"><span>{c.count} processos</span><span>{currency(c.amount)}</span></div></Link>)}
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Atualizações de hoje</CardTitle><p className="text-sm text-muted-foreground">Últimos 20 eventos acessíveis ao seu usuário.</p><Button asChild variant="outline" size="sm"><Link to="/reports/updates">Relatório completo</Link></Button></CardHeader><CardContent>
        {activities.isPending && <p>Carregando atividades…</p>}
        {activities.isError && <p role="alert">Não foi possível consultar as atividades. Tente Atualizar.</p>}
        {activities.data && !activities.data.results.length && <p className="text-muted-foreground">Nenhuma atividade registrada hoje.</p>}
        <div className="divide-y">{activities.data?.results.map(a => <div key={a.id} className="py-3 text-sm"><p className="font-medium">{a.user_name} · {a.action_label}</p><p className="text-muted-foreground">{a.entity} · {new Date(a.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p></div>)}</div>
      </CardContent></Card>
    </>}
  </div>;
}
