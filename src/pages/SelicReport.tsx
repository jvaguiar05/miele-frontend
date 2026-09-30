import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReportTabs from "@/components/reports/ReportTabs";

interface Rate { year: number; month: number; rate: string; source: string; issued_on: string | null; updated_at: string; updated_by: string; }
interface Result { count: number; years: number[]; results: Rate[]; can_edit: boolean; source: string; }
const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const empty = { year: "", month: "", rate: "", source: "Sicalc - Sistema de Cálculo de Acréscimos Legais", reference_date: "" };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const parseMoney = (raw: string) => { const clean = raw.replace(/R\$|\s/g, ""); return Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean); };

export default function SelicReport() {
  const { isAdmin } = useAuthStore();
  const [yearFilter, setYearFilter] = useState("");
  const [calcYear, setCalcYear] = useState("2026"); const [calcMonth, setCalcMonth] = useState("9"); const [baseValue, setBaseValue] = useState("");
  const [editing, setEditing] = useState<string | null>(null); const [form, setForm] = useState(empty);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient(); const { toast } = useToast();
  const query = useQuery({ queryKey: ["selic-rates"], queryFn: async () => (await api.get<Result>("/dashboard/selic/")).data });
  const map = useMemo(() => new Map(query.data?.results.map(rate => [`${rate.year}-${rate.month}`, rate]) || []), [query.data]);
  const years = yearFilter ? [Number(yearFilter)] : query.data?.years || [];
  const chosen = map.get(`${calcYear}-${calcMonth}`); const principal = parseMoney(baseValue); const validPrincipal = Number.isFinite(principal) && principal >= 0;
  const interest = chosen && validPrincipal ? principal * Number(chosen.rate) / 100 : null;
  const save = useMutation({ mutationFn: () => {
    const payload = { year: Number(form.year), month: Number(form.month), rate: form.rate.replace(",", "."), source: form.source, reference_date: form.reference_date || null };
    return api.patch(`/dashboard/selic/${payload.year}/${payload.month}/`, { rate: payload.rate, source: payload.source, issued_on: payload.reference_date });
  }, onSuccess: () => { setEditing(null); setForm(empty); void queryClient.invalidateQueries({ queryKey: ["selic-rates"] }); toast({ title: "Taxa Selic salva" }); },
  onError: (error: unknown) => { const data = axios.isAxiosError(error) ? error.response?.data : undefined; toast({ title: "Não foi possível salvar", description: String(data?.non_field_errors?.[0] || data?.detail || "Confira mês, ano e taxa."), variant: "destructive" }); } });
  const edit = (rate: Rate) => { setEditing(`${rate.year}-${rate.month}`); setForm({ year: String(rate.year), month: String(rate.month), rate: rate.rate.replace(".", ","), source: rate.source, reference_date: rate.issued_on || "" }); };
  const exportCsv = async () => { setExporting(true); try { const { data } = await api.get("/dashboard/selic/", { params: { export: "csv", year: yearFilter || undefined }, responseType: "blob" }); const url = URL.createObjectURL(data); const a = document.createElement("a"); a.href = url; a.download = "selic-acumulada.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { toast({ title: "Falha ao exportar", variant: "destructive" }); } finally { setExporting(false); } };

  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <style>{`@media print { header, footer, .no-print { display:none !important; } main { display:block; } .print-card { border:0 !important; box-shadow:none !important; } }`}</style>
    <ReportTabs />
    <header><h1 className="text-3xl font-bold">Taxa Selic acumulada para pagamento</h1><p className="text-muted-foreground mt-2">Consulta baseada no Sicalc. Dados iniciais de fevereiro/1995 a setembro/2026.</p></header>
    <Card className="no-print"><CardHeader><CardTitle>Calculadora informativa</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3"><div><Label>Ano</Label><select className="h-10 w-full border rounded bg-background px-3" value={calcYear} onChange={e => setCalcYear(e.target.value)}>{query.data?.years.map(y => <option key={y}>{y}</option>)}</select></div><div><Label>Mês</Label><select className="h-10 w-full border rounded bg-background px-3" value={calcMonth} onChange={e => setCalcMonth(e.target.value)}>{monthNames.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></div><div><Label>Valor-base</Label><Input placeholder="Ex.: 100.000,00" value={baseValue} onChange={e => setBaseValue(e.target.value)} /></div></div>
      {!chosen ? <p className="text-amber-700">Não há taxa publicada para o período escolhido.</p> : <div className="grid sm:grid-cols-3 gap-3"><div><p className="text-sm text-muted-foreground">Taxa acumulada</p><p className="text-xl font-bold">{Number(chosen.rate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</p></div><div><p className="text-sm text-muted-foreground">Juros Selic</p><p className="text-xl font-bold">{interest === null ? "Informe o valor" : money(interest)}</p></div><div><p className="text-sm text-muted-foreground">Total atualizado</p><p className="text-xl font-bold">{interest === null ? "—" : money(principal + interest)}</p></div></div>}
      <p className="text-xs text-muted-foreground">Fórmula: valor-base × taxa acumulada ÷ 100. Simulação informativa; confirme regras, período e demais acréscimos aplicáveis antes do uso oficial.</p>
    </CardContent></Card>
    {isAdmin && <Card className="no-print"><CardHeader><CardTitle>{editing ? "Editar taxa mensal" : "Adicionar taxa mensal"}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}><div className="grid sm:grid-cols-3 gap-3"><div><Label>Ano</Label><Input required type="number" min="1995" max="2100" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div><div><Label>Mês</Label><select required className="h-10 w-full border rounded bg-background px-3" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}><option value="">Selecione</option>{monthNames.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></div><div><Label>Taxa acumulada (%)</Label><Input required inputMode="decimal" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div><div className="sm:col-span-2"><Label>Fonte</Label><Input required value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div><div><Label>Data de referência</Label><Input type="date" value={form.reference_date} onChange={e => setForm({ ...form, reference_date: e.target.value })} /></div></div><div className="flex gap-2"><Button disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar taxa"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</Button>}</div></form></CardContent></Card>}
    <Card className="print-card"><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>Tabela completa</CardTitle><p className="text-sm text-muted-foreground mt-1">{query.data?.source}</p></div><div className="flex gap-2 no-print"><select className="h-10 border rounded bg-background px-3" aria-label="Filtrar ano" value={yearFilter} onChange={e => setYearFilter(e.target.value)}><option value="">Todos os anos</option>{query.data?.years.map(y => <option key={y}>{y}</option>)}</select><Button variant="outline" onClick={exportCsv} disabled={exporting}>{exporting ? "Exportando…" : "CSV"}</Button><Button variant="outline" onClick={() => window.print()}>Imprimir</Button></div></div></CardHeader><CardContent>
      {query.isPending && <p>Carregando taxas…</p>}{query.isError && <p className="text-destructive">Não foi possível carregar a tabela Selic.</p>}
      {query.data && <div className="overflow-x-auto"><table className="w-full text-sm text-right"><thead><tr><th className="p-2 text-left border-b">Ano</th>{months.map(m => <th key={m} className="p-2 border-b uppercase">{m}</th>)}</tr></thead><tbody>{years.map(year => <tr key={year} className="border-b"><th className="p-2 text-left">{year}</th>{months.map((_, index) => { const rate = map.get(`${year}-${index + 1}`); return <td key={index} className="p-2 whitespace-nowrap">{rate ? <button type="button" disabled={!isAdmin} onClick={() => isAdmin && edit(rate)} className={isAdmin ? "underline decoration-dotted hover:text-primary" : ""} title={isAdmin ? "Editar taxa" : undefined}>{Number(rate.rate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</button> : "—"}</td>; })}</tr>)}</tbody></table></div>}
      <p className="text-xs text-muted-foreground mt-4 no-print">Administradores podem clicar em uma taxa para editá-la. Meses com “—” não possuem taxa cadastrada e não são considerados zero.</p>
    </CardContent></Card>
  </div>;
}
