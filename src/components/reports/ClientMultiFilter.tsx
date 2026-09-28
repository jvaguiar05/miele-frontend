import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ReportClient { id: string; name: string; cnpj: string; }
interface ApiClient { id: string; razao_social: string; nome_fantasia?: string | null; cnpj: string; }

export default function ClientMultiFilter({ selected, onChange }: { selected: ReportClient[]; onChange: (clients: ReportClient[]) => void }) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const timer = setTimeout(() => setDebounced(term.trim()), 300); return () => clearTimeout(timer); }, [term]);
  const search = useQuery({
    queryKey: ["report-client-search", debounced],
    queryFn: async () => {
      const response = await api.get<{ results: ApiClient[] }>("/clients/clients/", { params: { search: debounced || undefined, is_active: true, ordering: "razao_social" } });
      return response.data.results.slice(0, 10);
    },
    staleTime: 30_000,
  });
  const toggle = (client: ApiClient) => {
    const exists = selected.some(item => item.id === client.id);
    onChange(exists ? selected.filter(item => item.id !== client.id) : [...selected, { id: client.id, name: client.razao_social, cnpj: client.cnpj }]);
  };
  return <div className="space-y-2 lg:col-span-2">
    <Label htmlFor="report-client-search">Cliente ou CNPJ</Label>
    <Input id="report-client-search" placeholder="Digite nome, razão social ou CNPJ" value={term} onChange={e => setTerm(e.target.value)} autoComplete="off" />
    <div className="rounded-md border bg-background max-h-52 overflow-y-auto" aria-label="Clientes encontrados">
      {search.isFetching && <p className="p-3 text-sm text-muted-foreground">Buscando clientes…</p>}
      {!search.isFetching && !search.data?.length && <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
      {search.data?.map(client => { const chosen = selected.some(item => item.id === client.id); return <button type="button" key={client.id} onClick={() => toggle(client)} className="w-full flex gap-2 items-start p-3 text-left border-b last:border-0 hover:bg-muted">
        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${chosen ? "opacity-100" : "opacity-0"}`} />
        <span><span className="block text-sm font-medium">{client.nome_fantasia || client.razao_social}</span><span className="block text-xs text-muted-foreground">{client.razao_social} · CNPJ {client.cnpj}</span></span>
      </button>; })}
    </div>
    {!!selected.length && <div className="flex flex-wrap gap-2 pt-1">{selected.map(client => <span key={client.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs"><span>{client.name} · {client.cnpj}</span><Button type="button" variant="ghost" size="icon" className="h-5 w-5" aria-label={`Remover ${client.name}`} onClick={() => onChange(selected.filter(item => item.id !== client.id))}><X className="h-3 w-3" /></Button></span>)}</div>}
    <p className="text-xs text-muted-foreground">Selecione um ou vários clientes. Sem seleção, o relatório considera todos.</p>
  </div>;
}
