import { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Totals = Record<"requested" | "compensated" | "received", { base: string; calculated: string }>;
interface Contract { id: string; percentage: string; starts_on: string; ends_on: string | null; reference: string; notes: string; billing_evolution_requested: boolean; process_count: number; totals: Totals; }
interface Result { mode: "informational"; contracts: Contract[]; uncovered_processes: number; notice: string; }
const empty = { percentage: "", starts_on: "", ends_on: "", reference: "", notes: "", billing_evolution_requested: false };
const money = (v: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
const date = (v: string | null) => v ? v.split("-").reverse().join("/") : "sem data final";

export default function ClientContracts({ clientId }: { clientId: string }) {
  const { isAdmin } = useAuthStore();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const key = ["client-contracts", clientId];
  const query = useQuery({ queryKey: key, queryFn: async () => (await api.get<Result>(`/clients/${clientId}/contracts/`)).data });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, ends_on: form.ends_on || null };
      return editing ? api.patch(`/clients/${clientId}/contracts/${editing}/`, payload) : api.post(`/clients/${clientId}/contracts/`, payload);
    },
    onSuccess: () => { setForm(empty); setEditing(null); void queryClient.invalidateQueries({ queryKey: key }); toast({ title: editing ? "Contrato atualizado" : "Contrato adicionado" }); },
    onError: (error: unknown) => {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      toast({ title: "Não foi possível salvar", description: String(data?.non_field_errors?.[0] || data?.detail || "Confira percentual e vigência."), variant: "destructive" });
    },
  });
  const edit = (c: Contract) => { setEditing(c.id); setForm({ percentage: c.percentage, starts_on: c.starts_on, ends_on: c.ends_on || "", reference: c.reference, notes: c.notes, billing_evolution_requested: c.billing_evolution_requested }); };
  const labels = { requested: "Valor pedido", compensated: "Valor compensado", received: "Valor recebido" };

  return <div className="space-y-4">
    <Card className="border-amber-300 bg-amber-50/50"><CardContent className="pt-5"><p className="font-medium">Cálculo exclusivamente informativo</p><p className="text-sm text-muted-foreground">Não gera honorários, cobrança, contas a pagar ou obrigação financeira. A vigência é aplicada pela data de transmissão da PER/DCOMP.</p></CardContent></Card>
    {isAdmin && <Card><CardHeader><CardTitle>{editing ? "Atualizar contrato" : "Adicionar contrato e vigência"}</CardTitle></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
        <div className="grid md:grid-cols-4 gap-3">
          <div><Label>Percentual (%)</Label><Input required inputMode="decimal" placeholder="Ex.: 12,5" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value.replace(",", ".") })} /></div>
          <div><Label>Início da vigência</Label><Input required type="date" value={form.starts_on} onChange={e => setForm({ ...form, starts_on: e.target.value })} /></div>
          <div><Label>Fim da vigência</Label><Input type="date" value={form.ends_on} onChange={e => setForm({ ...form, ends_on: e.target.value })} /></div>
          <div><Label>Referência do contrato</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <label className="flex gap-2 items-start text-sm"><input className="mt-1" type="checkbox" checked={form.billing_evolution_requested} onChange={e => setForm({ ...form, billing_evolution_requested: e.target.checked })} /><span><strong>Sinalizar futura evolução para honorários devidos</strong><br /><span className="text-muted-foreground">Comunica a necessidade ao desenvolvedor; não ativa cobrança.</span></span></label>
        <div className="flex gap-2"><Button disabled={save.isPending}>{save.isPending ? "Salvando…" : editing ? "Salvar atualização" : "Adicionar contrato"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</Button>}</div>
      </form>
    </CardContent></Card>}
    {query.isPending && <p>Carregando contratos…</p>}{query.isError && <p className="text-destructive">Não foi possível carregar os contratos.</p>}
    {!!query.data?.uncovered_processes && <p className="text-sm text-amber-700">Atenção: {query.data.uncovered_processes} PER/DCOMP(s) não possuem contrato vigente na data de transmissão e não entram nos cálculos.</p>}
    {query.data?.contracts.map(c => <Card key={c.id}><CardHeader><div className="flex flex-wrap justify-between gap-2"><CardTitle>{Number(c.percentage).toLocaleString("pt-BR")}% · {date(c.starts_on)} até {date(c.ends_on)}</CardTitle>{isAdmin && <Button variant="outline" size="sm" onClick={() => edit(c)}>Atualizar</Button>}</div><p className="text-sm text-muted-foreground">{c.reference || "Sem referência"} · {c.process_count} PER/DCOMP(s)</p></CardHeader><CardContent className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">{Object.entries(labels).map(([keyName, label]) => { const total = c.totals[keyName as keyof Totals]; return <div key={keyName} className="border rounded p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="text-sm">Base: {money(total.base)}</p><p className="font-semibold">Informativo: {money(total.calculated)}</p></div>; })}</div>
      {c.billing_evolution_requested && <p className="text-sm font-medium text-blue-700">Evolução futura para honorários devidos sinalizada ao desenvolvimento.</p>}{c.notes && <p className="text-sm">Observações: {c.notes}</p>}
    </CardContent></Card>)}
    {query.data && !query.data.contracts.length && <Card><CardContent className="py-6 text-muted-foreground">Nenhum contrato percentual cadastrado.</CardContent></Card>}
  </div>;
}
