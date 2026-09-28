import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Snapshot { id: string; year: number; quarter: number; kind: string; captured_at: string; captured_by: string; note: string; balance: string; missing: number; count: number; }
interface Position { year: number; quarter: number; quarter_end: string; reference_date: string; balance: string; missing: number; count: number; companies: { id: string; name: string; cnpj: string; count: number; balance: string; missing: number }[]; processes: { id: string; client: string; number: string; status: string; due: string; balance: string | null }[]; can_close?: boolean; closing?: Snapshot | null; previous_closing?: Snapshot | null; difference?: string | null; }
const money = (value: string | null) => value === null ? "Não informado" : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => value.split("-").reverse().join("/");

export default function QuarterClosing() {
  const { user, isAdmin } = useAuthStore();
  const cache = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const current = useQuery({ queryKey: ["quarter-current", user?.id], queryFn: async () => (await api.get<Position>("/dashboard/quarters/current/")).data, retry: false });
  const history = useQuery({ queryKey: ["quarter-snapshots", user?.id, page], queryFn: async () => (await api.get<{ results: Snapshot[]; next: string | null; previous: string | null }>("/dashboard/quarters/snapshots/", { params: { page } })).data, retry: false });
  const detail = useQuery({ queryKey: ["quarter-snapshot", user?.id, selected], enabled: !!selected, queryFn: async () => (await api.get<Snapshot & { payload: Position }>(`/dashboard/quarters/snapshots/${selected}/`)).data, retry: false });
  const displayed = selected ? detail.data?.payload : current.data;
  const refresh = () => { void current.refetch(); void history.refetch(); if (selected) void detail.refetch(); };
  const capture = async (kind: "position" | "closing") => {
    if (!current.data) return;
    if (kind === "closing" && !window.confirm("Confirmar o fechamento com os saldos atuais? Será guardado um registro definitivo deste trimestre, sem substituição pela interface.")) return;
    setSaving(true);
    try {
      const { data } = await api.post<Snapshot>("/dashboard/quarters/snapshots/", { year: current.data.year, quarter: current.data.quarter, kind, note });
      setSelected(data.id); setNote(""); setPage(1);
      await Promise.all([cache.invalidateQueries({ queryKey: ["quarter-current"] }), cache.invalidateQueries({ queryKey: ["quarter-snapshots"] })]);
      toast({ title: kind === "closing" ? "Fechamento registrado" : "Posição parcial registrada" });
    } catch (error) {
      const e = error as { response?: { data?: { detail?: string } } };
      toast({ title: "Não foi possível registrar", description: e.response?.data?.detail || "Verifique a conexão e os dados.", variant: "destructive" });
    } finally { setSaving(false); }
  };
  const exportCsv = async () => {
    setExporting(true);
    try {
      const { data } = await api.get(`/dashboard/quarters/snapshots/${selected}/`, { params: { export: "csv" }, responseType: "blob" });
      const url = URL.createObjectURL(data); const link = document.createElement("a"); link.href = url; link.download = "saldos-trimestrais.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast({ title: "Falha ao exportar", variant: "destructive" }); }
    finally { setExporting(false); }
  };
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Saldos trimestrais</h1><p className="text-muted-foreground mt-2">Posições de revisão e fechamentos registrados com os valores do momento da captura.</p></div><Button variant="outline" onClick={refresh}>Atualizar</Button></header>
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelected("")}>Posição atual</Button><Button asChild variant="outline"><Link to="/reports/status?scope=open">Revisar processos em aberto</Link></Button></div>
    {(current.isError || history.isError || (selected && detail.isError)) && <p role="alert" className="text-destructive">Não foi possível carregar os dados. Verifique a conexão e tente Atualizar.</p>}
    {(selected ? detail.isPending : current.isPending) && <p role="status">Carregando posição…</p>}
    {displayed && <>
      <Card className="p-5 space-y-3">
        <h2 className="text-xl font-semibold">{displayed.quarter}º trimestre de {displayed.year} · {selected ? detail.data?.kind === "closing" ? "Fechamento registrado" : "Posição parcial registrada" : "Posição atual"}</h2>
        <p>Encerramento do trimestre: {date(displayed.quarter_end)}</p>
        <p className="text-3xl font-bold">{money(displayed.balance)}</p><p>{displayed.count} processos · {displayed.companies.length} empresas</p>
        <p className="text-sm text-muted-foreground">Saldo cadastrado dos processos em acompanhamento; não confirma disponibilidade de crédito. Inclui saldos acumulados de transmissões anteriores.</p>
        {displayed.missing > 0 && <p role="alert" className="text-amber-700">Total parcial: {displayed.missing} saldos ausentes ou inválidos. Revise antes de fechar.</p>}
        {!selected && current.data?.previous_closing && <p>Fechamento anterior: {money(current.data.previous_closing.balance)}. {current.data.difference != null ? `Variação do saldo atual: ${money(current.data.difference)}.` : "Comparação indisponível enquanto há saldos incompletos."}</p>}
        {!selected && !current.data?.previous_closing && <p className="text-sm text-muted-foreground">Ainda não há fechamento do trimestre anterior para comparação.</p>}
        {selected && detail.data && <><p className="text-sm">Capturado por {detail.data.captured_by} em {new Date(detail.data.captured_at).toLocaleString("pt-BR")}</p><p className="whitespace-pre-wrap break-words">{detail.data.note}</p><Button variant="outline" disabled={exporting} onClick={exportCsv}>{exporting ? "Exportando…" : "Exportar fotografia (CSV)"}</Button></>}
      </Card>
      <Card className="p-4 overflow-x-auto"><h2 className="font-semibold mb-3">Saldo por empresa</h2>{!displayed.companies.length ? <p>Nenhum processo elegível.</p> : <table className="w-full text-sm text-left"><thead><tr>{["Empresa", "CNPJ", "Processos", "Saldo", "Pendências"].map(h => <th className="p-3 border-b" key={h}>{h}</th>)}</tr></thead><tbody>{displayed.companies.map(c => <tr key={c.id} className="border-b"><td className="p-3">{c.name}</td><td className="p-3">{c.cnpj}</td><td className="p-3">{c.count}</td><td className="p-3 whitespace-nowrap">{money(c.balance)}</td><td className="p-3">{c.missing}</td></tr>)}</tbody></table>}</Card>
      <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Processos da posição ({displayed.count})</summary><div className="overflow-auto max-h-96 mt-3"><table className="w-full text-sm text-left"><thead><tr>{["Empresa", "Processo", "Status", "Vencimento", "Saldo"].map(h => <th key={h} className="p-3 border-b">{h}</th>)}</tr></thead><tbody>{displayed.processes.map(p => <tr key={p.id} className="border-b"><td className="p-3">{p.client}</td><td className="p-3">{p.number}</td><td className="p-3">{p.status}</td><td className="p-3">{date(p.due)}</td><td className="p-3 whitespace-nowrap">{money(p.balance)}</td></tr>)}</tbody></table></div></details>
    </>}
    {isAdmin && !selected && current.data && !current.isError && <Card className="p-4 space-y-3"><Label htmlFor="quarter-note">Observação da revisão</Label><Textarea id="quarter-note" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /><p className="text-sm text-muted-foreground">Posições parciais podem ser salvas durante o trimestre. Fechamento único no último dia, com todos os saldos preenchidos. Dados são lidos novamente ao registrar.</p>{current.data.closing && <p>Este trimestre já possui um fechamento registrado.</p>}<div className="flex flex-wrap gap-2"><Button disabled={saving || current.isFetching} onClick={() => capture("position")}>{saving ? "Registrando…" : "Salvar posição parcial"}</Button><Button variant="outline" disabled={saving || current.isFetching || !current.data.can_close} onClick={() => capture("closing")}>Confirmar fechamento</Button></div></Card>}
    <Card className="p-4 space-y-3"><h2 className="text-xl font-semibold">Histórico de posições e fechamentos</h2>{history.isPending && <p>Carregando histórico…</p>}{history.data && !history.data.results.length && <p>Nenhuma fotografia registrada.</p>}{history.data?.results.map(s => <button className={`w-full text-left border rounded p-3 hover:bg-muted ${selected === s.id ? "border-primary" : ""}`} key={s.id} onClick={() => setSelected(s.id)}><span className="font-semibold">{s.quarter}º trimestre/{s.year} · {s.kind === "closing" ? "Fechamento" : "Posição parcial"} · {money(s.balance)}</span><span className="block text-sm text-muted-foreground">{new Date(s.captured_at).toLocaleString("pt-BR")} · {s.captured_by}{s.missing ? " · Valores incompletos" : ""}</span></button>)}<div className="flex gap-3 items-center"><Button variant="outline" disabled={!history.data?.previous || history.isFetching} onClick={() => setPage(p => p - 1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={!history.data?.next || history.isFetching} onClick={() => setPage(p => p + 1)}>Próxima</Button></div></Card>
  </div>;
}
