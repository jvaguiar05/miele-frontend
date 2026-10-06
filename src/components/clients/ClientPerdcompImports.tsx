import { useEffect, useRef, useState } from "react";
import { Upload, Download, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

type Value = string | number | boolean | null;
type Evidence = { page: number | null; text: string; value: Value; original_value?: Value; reason?: string };
type OcrMetadata = { engine: string; pages: number; recognized_pages: number; confidence: number; minimum_confidence: number };
type Extraction = { evidence: Record<string, Evidence>; fields: Record<string, Value>; text_source?: "native" | "ocr"; ocr?: OcrMetadata | null };
type Source = { index?: number; id?: string; name: string; sha256: string; status?: string; kind: string; pages: number; issues?: string[]; fields?: Record<string, Value>; extraction: Extraction; drive_synced?: boolean; storage?: "database" | "transition" | "drive"; manual_eligible?: boolean };
type Relation = { kind: string; protocol: string; resolved?: boolean };
type OperationalPlan = { action: "create" | "update" | "link_only" | "manual" | "conflict"; reason: string; operational_id?: string; financial_confirmation_required?: boolean; financial_review_required?: boolean; financial_review_reason?: string | null; changes: { field: string; old: Value; new: Value; financial?: boolean }[] };
type VersionInfo = { status: "current" | "superseded" | "previous" | "cancelled"; successor_protocol?: string | null; message: string };
type Document = { id?: string; key: string; fields: Record<string, Value>; status?: string; completeness: string; importable?: boolean; duplicate?: boolean; retifier?: boolean; ocr_used?: boolean; ocr_confidence?: number | null; issues?: string[]; missing?: Relation[]; relations: Relation[]; debts: Record<string, Value>[]; components: Record<string, unknown>[]; files: number[] | Source[]; reviews?: { reviewer: number; date: string; reason: string }[]; operational?: OperationalPlan; version?: VersionInfo; version_status?: string; superseded_by?: string | null; operational_id?: string | null };
type PreviewClient = { id: string; cnpj: string; razao_social: string; nome_fantasia?: string | null };
type Preview = { token: string; client_id: string; client?: PreviewClient; files: Source[]; groups: Document[]; counts: { files: number; documents: number; importable: number; rejected: number } };
type BatchFileSummary = { index: number; name: string; sha256: string; pages: number; status?: string; issues?: string[] };
type ClientPreviewOption = { cnpj: string; registered: boolean; client: PreviewClient | null; file_count: number; document_count: number; importable: number; rejected: number; preview?: Preview };
type MultiClientPreview = { selection_required: true; clients: ClientPreviewOption[]; unassigned_files: BatchFileSummary[]; counts: { files: number; clients: number; unassigned: number }; notice: string };
type AutomaticPreview = Preview | MultiClientPreview;
type ReprocessDocument = { key: string; document_id: string; fields: Record<string, Value>; retifier: boolean; version: VersionInfo; operational: OperationalPlan; files: { id: string; name: string; kind: string; sha256: string; pages: number }[] };
type ReprocessPreview = { token: string; documents: ReprocessDocument[]; counts: { pending: number; financial_confirmation: number }; notice: string };
type Change = { sha256: string; field: string; value: Value; reason: string };
type ManualIssue = { id: string; name: string; sha256: string; pages: number; issues: string[]; created_at: string; drive_synced?: boolean; storage?: "database" | "transition" | "drive" };
type StorageSummary = { status: string; total: number; archived: number; pending: number; pending_drive: number; pending_release: number; database_copies: number; unavailable: number; processed?: number; released?: number; failed?: number; message?: string };
type OperationalOption = { id: string; numero_perdcomp?: string; numero?: string };
type ClientPerdcompImportsProps = { clientId?: string; initialFiles?: File[]; autoAnalyze?: boolean; onClientNotFound?: (cnpj: string, files: File[]) => void; onAddPerdComp: () => void; onOperationalChanged: () => Promise<void>; onStorageChanged?: () => void; operationalPerdcomps: OperationalOption[]; startOpen?: boolean; panelHidden?: boolean; onImportOpenChange?: (open: boolean) => void };
const statuses: Record<string, string> = { ready: "Pronto", review: "Revisão necessária", duplicate: "Duplicado", no_text: "PDF sem texto", wrong_client: "CNPJ divergente", missing_reference: "Referência ausente", retifier: "Retificação", conflict: "Conflito", rejected: "Não suportado" };
const completeness: Record<string, string> = { complete: "Demonstrativo + recibo", receipt_only: "Somente recibo", demonstrative_only: "Somente demonstrativo", conflict: "Evidências conflitantes" };
const operationalActions: Record<string, string> = { create: "Criar no operacional", update: "Atualizar operacional", link_only: "Somente vincular", manual: "Tratamento manual", conflict: "Conflito operacional" };
const labels: Record<string, string> = {
  protocol: "Protocolo", cnpj: "CNPJ titular", name: "Razão social", nature: "Natureza do crédito", modality: "Modalidade", revision_kind: "Versão documental",
  control: "Controle", created_on: "Criação", transmitted_on: "Transmissão", transmitted_time: "Horário", program: "Programa", version: "Versão do programa",
  taxation: "Tributação", period_type: "Tipo de período", year: "Ano", quarter: "Trimestre", month: "Mês", period: "Período", judicial: "Crédito judicial",
  successor: "Crédito de sucedida", prior_process: "Processo anterior", other_document: "Informado em outro PER/DCOMP", process: "Processo", credit_holder: "Detentor do crédito",
  initial_credit: "Crédito inicial", delivery_credit: "Crédito na entrega", updated_credit: "Crédito atualizado", declared_selic: "Selic declarada (%)",
  eligible_credit: "Passível de ressarcimento", requested: "Valor solicitado", used: "Utilizado neste documento", declared_balance: "Saldo documental", total_debts: "Total dos débitos", credit_tax: "Tributo do crédito",
  sequence: "Sequência", holder: "CNPJ detentor", group: "Grupo", revenue: "Receita/denominação", code: "Código", extension: "Extensão", description: "Descrição", frequency: "Periodicidade", due_on: "Vencimento",
  principal: "Principal compensado", original_principal: "Principal original do débito", fine: "Multa", interest: "Juros", total: "Total", dctf_receipt: "Recibo DCTFWeb", dctf_date: "Transmissão DCTFWeb", dctf_category: "Categoria DCTFWeb", dctf_period: "Período DCTFWeb", controlled_process: "Controlado em processo",
  assessed: "Apurado", component_total: "Crédito apurado consolidado", deductions: "Deduções", previous_use: "Utilizações anteriores", balance: "Saldo documental", code_description: "Código/descrição", months: "Detalhamento mensal",
  credit_origin: "Origem do crédito", balance_reference: "Referência de saldo", rectifies: "Retifica", cancels: "Cancela",
  valor_pedido: "Valor pedido", valor_compensado: "Compensado operacional", valor_recebido: "Recebido operacional", valor_saldo: "Saldo operacional",
  valor_solicitado: "Valor solicitado", valor_compensado_declarado: "Compensação declarada", valor_compensado_homologado: "Compensação homologada",
  credito_original_utilizado: "Crédito original utilizado", saldo_credito_original: "Saldo do crédito original",
  status_compensacao: "Situação da compensação", status_ressarcimento: "Situação do ressarcimento",
};
const moneyKeys = new Set(["initial_credit", "delivery_credit", "updated_credit", "eligible_credit", "requested", "used", "declared_balance", "total_debts", "principal", "original_principal", "fine", "interest", "total", "assessed", "component_total", "deductions", "previous_use", "balance", "valor_pedido", "valor_compensado", "valor_recebido", "valor_saldo", "valor_solicitado", "valor_compensado_declarado", "valor_compensado_homologado", "credito_original_utilizado", "saldo_credito_original"]);
const readOnlyFields = new Set(["protocol", "cnpj", "program", "version", "modality", "revision_kind", "credit_tax", "sequence", "transmitted_time", "code", "extension", "description", "original_principal"]);
const display = (key: string, value: unknown): string => value === null || value === undefined ? "Não informado" : typeof value === "boolean" ? value ? "Sim" : "Não" : typeof value === "object" ? Object.entries(value).map(([k, v]) => `${labels[k] || k}: ${display(k, v)}`).join(" · ") : moneyKeys.has(key) ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(value);
function message(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data === "object" && data !== null) {
      const detail = (data as { detail?: unknown; error?: unknown }).detail ?? (data as { error?: unknown }).error;
      if (typeof detail === "string" && detail.trim()) return detail;
    }
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
function missingClientCnpj(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data !== "object" || data === null) return null;
  const payload = data as { code?: unknown; cnpj?: unknown; can_create_client?: unknown };
  return payload.code === "client_not_found" && payload.can_create_client === true && typeof payload.cnpj === "string"
    ? payload.cnpj
    : null;
}
const formatCnpj = (value: string) => value.replace(/\D/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const isMultiClientPreview = (value: AutomaticPreview): value is MultiClientPreview => "selection_required" in value && value.selection_required === true;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ClientPerdcompImports({ clientId, initialFiles, autoAnalyze = false, onClientNotFound, onAddPerdComp, onOperationalChanged, onStorageChanged, operationalPerdcomps, startOpen = false, panelHidden = false, onImportOpenChange }: ClientPerdcompImportsProps) {
  const isAdmin = useAuthStore(s => s.isAdmin);
  const [open, setOpen] = useState(startOpen);
  const [files, setFiles] = useState<File[]>(() => initialFiles ? [...initialFiles] : []);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [manualSelected, setManualSelected] = useState<string[]>([]);
  const [financialConfirmed, setFinancialConfirmed] = useState<string[]>([]);
  const [ocrConfirmed, setOcrConfirmed] = useState<string[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [manualIssues, setManualIssues] = useState<ManualIssue[]>([]);
  const [manualResolution, setManualResolution] = useState<Record<string, { operational: string; note: string }>>({});
  const [offset, setOffset] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [storageMessage, setStorageMessage] = useState("");
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [syncingStorage, setSyncingStorage] = useState(false);
  const [editing, setEditing] = useState<{ source: Source; field: string; value: string; reason: string } | null>(null);
  const [reprocessOpen, setReprocessOpen] = useState(false);
  const [reprocessPreview, setReprocessPreview] = useState<ReprocessPreview | null>(null);
  const [reprocessSelected, setReprocessSelected] = useState<string[]>([]);
  const [reprocessFinancial, setReprocessFinancial] = useState<string[]>([]);
  const [reprocessReason, setReprocessReason] = useState("");
  const [detectedClientId, setDetectedClientId] = useState<string | null>(clientId || null);
  const [unregisteredCnpj, setUnregisteredCnpj] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<ClientPreviewOption[]>([]);
  const [unassignedBatchFiles, setUnassignedBatchFiles] = useState<BatchFileSummary[]>([]);
  const autoAnalyzeStarted = useRef(false);
  const stopStorageSync = useRef(false);
  const clientRef = useRef(clientId);
  const effectiveClientId = clientId || detectedClientId;
  const base = effectiveClientId ? `/clients/${effectiveClientId}/perdcomp-imports/` : "";
  useEffect(() => { clientRef.current = clientId; setDetectedClientId(clientId || null); setPreview(null); setFiles(initialFiles ? [...initialFiles] : []); setChanges([]); setSelected([]); setManualSelected([]); setFinancialConfirmed([]); setOcrConfirmed([]); setResult(null); setStorageSummary(null); setStorageMessage(""); setUnregisteredCnpj(null); setClientOptions([]); setUnassignedBatchFiles([]); autoAnalyzeStarted.current = false; setOpen(startOpen); setReprocessOpen(false); setReprocessPreview(null); setOffset(0); }, [clientId, initialFiles, startOpen]);
  useEffect(() => { let active = true;
    if (!base || panelHidden) { setDocuments([]); setManualIssues([]); setNext(null); setLoadError(""); return () => { active = false; }; }
    api.get(base + `documents/?offset=${offset}`).then(({ data }) => { if (active) { setDocuments(data.results); setManualIssues(data.manual_issues || []); setStorageSummary(data.storage || null); setNext(data.next_offset); setLoadError(""); } }).catch(error => { if (active) setLoadError(message(error)); });
    return () => { active = false; };
  }, [base, offset, panelHidden, result]);
  function form(currentChanges = changes) {
    const data = new FormData(); files.forEach(file => data.append("files", file)); data.append("changes", JSON.stringify(currentChanges)); return data;
  }
  function selectClientOption(option: ClientPreviewOption) {
    setSelected([]); setManualSelected([]); setFinancialConfirmed([]); setOcrConfirmed([]); setReason("");
    if (!option.registered || !option.client || !option.preview) {
      setDetectedClientId(null); setPreview(null); setUnregisteredCnpj(option.cnpj); return;
    }
    setUnregisteredCnpj(null); setDetectedClientId(option.client.id); setPreview(option.preview);
    setSelected(option.preview.groups.filter(group => group.importable).map(group => group.key));
  }
  async function analyze(currentChanges = changes) {
    const previousClientId = detectedClientId;
    setBusy(true); setPreview(null); setSelected([]); setManualSelected([]); setFinancialConfirmed([]); setOcrConfirmed([]); setReason(""); setUnregisteredCnpj(null);
    try {
      const previewUrl = clientId ? base + "preview/" : "/perdcomps/import/preview/";
      const { data } = await api.post<AutomaticPreview>(previewUrl, form(currentChanges), { headers: { "Content-Type": "multipart/form-data" }, timeout: 180000 });
      if (clientRef.current !== clientId) return;
      setChanges(currentChanges); setEditing(null);
      if (!clientId && isMultiClientPreview(data)) {
        setClientOptions(data.clients); setUnassignedBatchFiles(data.unassigned_files);
        const previous = data.clients.find(option => option.client?.id === previousClientId);
        if (previous) selectClientOption(previous);
        else setDetectedClientId(null);
      } else {
        const single = data as Preview;
        setClientOptions([]); setUnassignedBatchFiles([]);
        if (!clientId) setDetectedClientId(single.client_id);
        setPreview(single);
      }
    } catch (error) {
      const cnpj = !clientId ? missingClientCnpj(error) : null;
      if (cnpj && onClientNotFound) setUnregisteredCnpj(cnpj);
      else toast.error(message(error));
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (!autoAnalyze || autoAnalyzeStarted.current || !open || !files.length) return;
    autoAnalyzeStarted.current = true;
    void analyze();
    // Files and callbacks are fixed for this short-lived import session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, open]);
  async function confirm() {
    if (!preview || !effectiveClientId || (!selected.length && !manualSelected.length)) return;
    setBusy(true);
    try {
      const data = form(); data.append("token", preview.token); data.append("selected", JSON.stringify(selected)); data.append("reason", reason);
      data.append("manual_selected", JSON.stringify(manualSelected));
      data.append("financial_confirmed", JSON.stringify(financialConfirmed));
      data.append("ocr_confirmed", JSON.stringify(ocrConfirmed));
      const response = await api.post(`/clients/${effectiveClientId}/perdcomp-imports/confirm/`, data, { headers: { "Content-Type": "multipart/form-data" }, timeout: 180000 });
      if (clientRef.current !== clientId) return;
      const remainingClients = clientOptions.filter(option => option.client?.id !== effectiveClientId);
      setResult(response.data); setPreview(null); setSelected([]); setManualSelected([]); setFinancialConfirmed([]); setOcrConfirmed([]); setDetectedClientId(clientId || null); setUnregisteredCnpj(null); setOffset(0);
      if (clientOptions.length > 0 && remainingClients.length > 0) {
        setClientOptions(remainingClients);
      } else {
        setFiles([]); setChanges([]); setClientOptions([]); setUnassignedBatchFiles([]);
      }
      await onOperationalChanged();
      setStorageSummary(response.data.storage || null);
      setStorageMessage(response.data.storage?.message || "");
      onStorageChanged?.();
      toast.success(remainingClients.length > 0 ? "Cliente registrado. Selecione o próximo cliente do lote." : "Importação concluída com os valores conferidos.");
    } catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  async function reviewImported() {
    setBusy(true);
    try {
      const { data } = await api.get<ReprocessPreview>(base + "reprocess/preview/");
      setReprocessPreview(data); setReprocessSelected([]); setReprocessFinancial([]); setReprocessReason(""); setReprocessOpen(true);
    } catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  async function confirmReprocess() {
    if (!reprocessPreview || !reprocessSelected.length) return;
    setBusy(true);
    try {
      const { data } = await api.post(base + "reprocess/confirm/", { token: reprocessPreview.token,
        selected: reprocessSelected, financial_confirmed: reprocessFinancial, reason: reprocessReason });
      setResult(data); setReprocessOpen(false); setReprocessPreview(null); setOffset(0);
      await onOperationalChanged();
      toast.success("Documentos já importados registrados no operacional.");
    } catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  async function syncDrive() {
    if (syncingStorage) {
      stopStorageSync.current = true;
      setStorageMessage("Pausa solicitada. O PDF em andamento será concluído com segurança.");
      return;
    }
    stopStorageSync.current = false;
    setSyncingStorage(true);
    const storageUrl = clientId ? base + "sync-drive/" : "/perdcomps/import/storage/";
    let completed = false;
    try {
      while (!stopStorageSync.current) {
        const { data } = await api.post<StorageSummary>(storageUrl, {}, { timeout: 180000 });
        setStorageSummary(data);
        setStorageMessage(data.message || "Arquivamento atualizado.");
        if (data.pending === 0) { completed = true; toast.success("Todos os PDFs foram verificados e arquivados no Drive."); break; }
        if (!data.released) { toast.warning(data.message || "O arquivamento foi pausado. Tente novamente após verificar o Drive."); break; }
        await new Promise(resolve => window.setTimeout(resolve, 6500));
      }
      if (stopStorageSync.current && !completed) toast.info("Arquivamento pausado. Você pode continuar depois sem duplicar arquivos.");
    } catch (error) {
      setStorageMessage("Arquivamento pausado. Os PDFs ainda estão protegidos no banco; tente continuar depois.");
      toast.error(message(error));
    } finally { setSyncingStorage(false); stopStorageSync.current = false; onStorageChanged?.(); }
  }
  async function downloadManual(issue: ManualIssue) {
    setBusy(true);
    try { const response = await api.get(base + `manual/${issue.id}/file/`, { responseType: "blob" }); download(response.data, issue.name); }
    catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  async function resolveManual(issue: ManualIssue, action: "resolved" | "dismissed") {
    const resolution = manualResolution[issue.id] || { operational: "", note: "" };
    setBusy(true);
    try {
      await api.post(base + `manual/${issue.id}/resolve/`, { action, operational_id: resolution.operational || null, note: resolution.note });
      await onOperationalChanged();
      setManualIssues(current => current.filter(item => item.id !== issue.id));
      toast.success(action === "resolved" ? "Pendência vinculada ao cadastro operacional." : "Arquivo descartado da fila manual.");
    } catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  async function original(source: Source) {
    setBusy(true);
    try {
      const response = source.id ? await api.get(base + `files/${source.id}/`, { responseType: "blob" }) : await api.post(base + "preview-file/", (() => { const data = form(); data.append("sha256", source.sha256); return data; })(), { responseType: "blob", headers: { "Content-Type": "multipart/form-data" }, timeout: 180000 });
      download(response.data, source.name);
    } catch (error) { toast.error(message(error)); } finally { setBusy(false); }
  }
  function details(document: Document, sources: Source[], reviewing = false) {
    return <details className="rounded-md border p-3 mt-2"><summary className="cursor-pointer text-sm font-medium">Conferir dados, débitos e evidências</summary>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mt-3">{Object.entries(document.fields).map(([key, value]) => <div key={key}><dt className="text-muted-foreground">{labels[key] || key}</dt><dd className="break-words">{display(key, value)}</dd></div>)}</dl>
      {document.relations.length > 0 && <div className="mt-3 text-xs space-y-1">{document.relations.map((r, i) => <p key={i}>{labels[r.kind] || r.kind}: {r.protocol} {r.resolved === false ? "— referência pendente" : ""}</p>)}</div>}
      {[{ title: "Débitos declarados", items: document.debts }, { title: "Componentes do crédito", items: document.components }].map(section => section.items.length > 0 && <details key={section.title} className="mt-3"><summary className="text-sm cursor-pointer">{section.title} ({section.items.length})</summary>{section.items.map((item, i) => <dl key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t mt-2 py-2 text-xs">{Object.entries(item).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{labels[k] || k}</dt><dd className="break-words">{display(k, v)}</dd></div>)}</dl>)}</details>)}
      {sources.map(source => <details key={source.sha256 + source.index} className="border-t mt-3 pt-2"><summary className="text-sm cursor-pointer break-all">{source.name} · {source.kind === "receipt" ? "Recibo" : "Demonstrativo"} · {source.pages} pág. {source.storage && <Badge className="ml-2" variant="outline">{source.storage === "drive" ? "No Drive" : "Aguardando Drive"}</Badge>}</summary>
        <Button disabled={busy} size="sm" variant="outline" className="my-2" onClick={() => original(source)}><Download className="w-3 h-3 mr-2" />PDF original</Button>
        <p className="text-xs break-all text-muted-foreground">SHA-256: {source.sha256}</p>
        <div className="max-h-80 overflow-auto mt-2"><table className="w-full text-xs"><thead><tr className="text-left"><th className="p-2">Campo / página</th><th className="p-2">Trecho original</th><th className="p-2">Valor interpretado</th></tr></thead><tbody>{Object.entries(source.extraction.evidence).map(([key, ev]) => <tr key={key} className="border-t"><td className="p-2 align-top">{labels[key.split(".").at(-1) || ""] || key}<br />{key.includes(".") && <span>{key}<br /></span>}Pág. {ev.page ?? "—"}</td><td className="p-2 max-w-sm break-words whitespace-pre-wrap">{ev.text}{ev.reason && <p className="text-amber-700">Correção: {ev.reason} · Original: {display(key, ev.original_value)}</p>}</td><td className="p-2">{display(key.split(".").at(-1) || key, ev.value)}{reviewing && !readOnlyFields.has(key.split(".").at(-1) || key) && !key.startsWith("relation.") && !key.includes("months.") && <Button disabled={busy} size="sm" variant="ghost" onClick={() => setEditing({ source, field: key, value: ev.value === null ? "" : String(ev.value), reason: "" })}>Revisar</Button>}</td></tr>)}</tbody></table></div>
      </details>)}
      {document.reviews?.map((r, i) => <p key={i} className="mt-2 text-xs text-muted-foreground">Conferido em {new Date(r.date).toLocaleString("pt-BR")} · Usuário {r.reviewer} · {r.reason}</p>)}
    </details>;
  }
  const matching = preview?.groups.filter(g => filter === "all" || g.status === filter) || [];
  const ungrouped = preview?.files.filter(f => !preview.groups.some(g => (g.files as number[]).includes(f.index!)) && (filter === "all" || f.status === filter)) || [];
  const selectedGroups = preview?.groups.filter(group => selected.includes(group.key)) || [];
  const financialRequired = selectedGroups.filter(group => group.operational?.financial_confirmation_required).map(group => group.key);
  const missingFinancialAuthorization = financialRequired.filter(key => !financialConfirmed.includes(key));
  const ocrRequired = selectedGroups.filter(group => group.ocr_used).map(group => group.key);
  const missingOcrAuthorization = ocrRequired.filter(key => !ocrConfirmed.includes(key));
  const reasonRequired = selectedGroups.some(group => group.retifier || group.operational?.financial_confirmation_required || group.ocr_used);
  const reasonMissing = reasonRequired && reason.trim().length < 10;
  const confirmDisabled = busy || (!selected.length && !manualSelected.length) || missingFinancialAuthorization.length > 0 || missingOcrAuthorization.length > 0 || reasonMissing;
  const missingReferenceDocuments = preview?.groups.filter(group => (group.missing?.length || 0) > 0).length || 0;
  const reprocessAvailable = reprocessPreview?.documents.filter(item => item.operational.action !== "manual" && item.operational.action !== "conflict") || [];
  const reprocessSelectedItems = reprocessAvailable.filter(item => reprocessSelected.includes(item.key));
  const reprocessFinancialRequired = reprocessSelectedItems.filter(item => item.operational.financial_confirmation_required).map(item => item.key);
  const missingReprocessFinancial = reprocessFinancialRequired.filter(key => !reprocessFinancial.includes(key));
  const reprocessReasonRequired = reprocessSelectedItems.some(item => item.retifier || item.operational.financial_confirmation_required);
  const reprocessReasonMissing = reprocessReasonRequired && reprocessReason.trim().length < 10;
  const reprocessConfirmDisabled = busy || !reprocessSelected.length || missingReprocessFinancial.length > 0 || reprocessReasonMissing;
  function authorizeSelectedFinancial(checked: boolean) {
    setFinancialConfirmed(current => checked
      ? Array.from(new Set([...current, ...financialRequired]))
      : current.filter(key => !financialRequired.includes(key)));
  }
  function authorizeSelectedOcr(checked: boolean) {
    setOcrConfirmed(current => checked
      ? Array.from(new Set([...current, ...ocrRequired]))
      : current.filter(key => !ocrRequired.includes(key)));
  }
  function authorizeReprocessFinancial(checked: boolean) {
    setReprocessFinancial(current => checked
      ? Array.from(new Set([...current, ...reprocessFinancialRequired]))
      : current.filter(key => !reprocessFinancialRequired.includes(key)));
  }
  return <Card className={panelHidden ? "hidden" : undefined}><CardHeader className="p-4"><div className="flex flex-wrap justify-between gap-2 items-center"><CardTitle className="text-base">Importação e registro de PER/DCOMPs</CardTitle><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy || syncingStorage} onClick={reviewImported}><RefreshCw className="h-4 w-4 mr-2" />Registrar arquivos já importados</Button><Button size="sm" disabled={syncingStorage} onClick={() => { setOpen(true); onImportOpenChange?.(true); }}><Upload className="h-4 w-4 mr-2" />Importar novos arquivos</Button></div></div><p className="text-xs text-muted-foreground">O sistema apresenta a origem e as diferenças antes de criar ou atualizar valores. Nada financeiro é substituído sem sua confirmação.</p></CardHeader>
    <CardContent className="px-4 pb-4 space-y-3">
      {storageSummary && storageSummary.total > 0 && <div className="rounded-lg border bg-muted/30 p-3 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">Originais no Google Drive</p><p role="status" className="text-xs text-muted-foreground">{storageMessage || (storageSummary.pending ? `${storageSummary.pending} PDF(s) aguardando arquivamento.` : "Todos os PDFs estão arquivados.")}</p></div><Badge variant={storageSummary.pending ? "outline" : "secondary"}>{storageSummary.archived}/{storageSummary.total} arquivados</Badge></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${storageSummary.total ? Math.round(storageSummary.archived * 100 / storageSummary.total) : 0}%` }} /></div>{isAdmin && storageSummary.pending > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={syncDrive}>{syncingStorage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pausar após o atual</> : <><Upload className="h-4 w-4 mr-2" />Arquivar no Drive</>}</Button>}</div>}
      {loadError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as importações: {loadError}</p> : documents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento importado para este cliente.</p> : documents.map(d => <div key={d.key} className="border rounded-lg p-3"><p className="text-sm font-medium">{String(d.fields.protocol)} <Badge variant="secondary">{completeness[d.completeness]}</Badge> <Badge variant="outline">{d.version_status === "current" ? "Versão vigente" : d.version_status === "cancelled" ? "Cancelada" : "Substituída"}</Badge></p><p className="text-xs text-muted-foreground">{String(d.fields.modality)} · {String(d.fields.nature)}</p>{d.superseded_by && <p className="text-xs text-amber-700">Versão anterior — nenhum dado alterado. Substituída por {d.superseded_by}.</p>}{!d.operational_id && <p className="text-xs text-amber-700">Aguardando registro operacional.</p>}{details(d, d.files as Source[])}</div>)}
      {manualIssues.length > 0 && <div className="rounded-lg border border-amber-300 p-3 space-y-3"><div><p className="font-medium text-sm">Pendências para tratamento manual ({manualIssues.length})</p><p className="text-xs text-muted-foreground">Abra o original, cadastre manualmente e vincule o resultado; ou descarte com justificativa.</p></div>{manualIssues.map(issue => { const resolution = manualResolution[issue.id] || { operational: "", note: "" }; return <div key={issue.id} className="rounded border p-3 space-y-2"><p className="text-sm break-all">{issue.name} {issue.storage && <Badge className="ml-2" variant="outline">{issue.storage === "drive" ? "No Drive" : "Aguardando Drive"}</Badge>}</p>{issue.issues.map((text, i) => <p key={i} className="text-xs text-amber-800">{text}</p>)}<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => downloadManual(issue)}><Download className="h-3 w-3 mr-2" />Original</Button><Button size="sm" variant="outline" onClick={onAddPerdComp}>Cadastrar manualmente</Button></div>{isAdmin && <><select className="w-full rounded border p-2 text-sm bg-background" value={resolution.operational} onChange={e => setManualResolution(current => ({ ...current, [issue.id]: { ...resolution, operational: e.target.value } }))}><option value="">Selecione o cadastro operacional criado</option>{operationalPerdcomps.map(item => <option key={item.id} value={item.id}>{item.numero_perdcomp || item.numero || item.id}</option>)}</select><Textarea placeholder="Justificativa do tratamento ou descarte" maxLength={2000} value={resolution.note} onChange={e => setManualResolution(current => ({ ...current, [issue.id]: { ...resolution, note: e.target.value } }))} /><div className="flex gap-2"><Button size="sm" disabled={busy || !resolution.operational || resolution.note.trim().length < 10} onClick={() => resolveManual(issue, "resolved")}>Vincular e concluir</Button><Button size="sm" variant="outline" disabled={busy || resolution.note.trim().length < 10} onClick={() => resolveManual(issue, "dismissed")}>Descartar da fila</Button></div></>}</div>; })}</div>}
      {(offset > 0 || next !== null) && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Anterior</Button><Button size="sm" variant="outline" disabled={next === null} onClick={() => setOffset(next!)}>Próxima</Button></div>}
    </CardContent>
    <Dialog open={open} onOpenChange={v => { if (!busy) { setOpen(v); onImportOpenChange?.(v); } }}><DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Importar PER/DCOMPs</DialogTitle><DialogDescription>Envie um PDF, vários PDFs ou um ZIP. PDFs com texto ou em imagem passam pela mesma conferência. OCR e valores financeiros exigem sua autorização antes do registro.</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <Label htmlFor="perdcomp-batch-files">PDFs, ZIP ou pacote .miele.zip · até 100 arquivos / 50 MB · OCR direto: 20 páginas · pacote OCR local: 500 páginas</Label>
        <Input id="perdcomp-batch-files" type="file" accept=".pdf,.zip" multiple disabled={busy || syncingStorage} onChange={e => { setFiles(Array.from(e.target.files || [])); if (!clientId) setDetectedClientId(null); setUnregisteredCnpj(null); setClientOptions([]); setUnassignedBatchFiles([]); autoAnalyzeStarted.current = false; setPreview(null); setSelected([]); setManualSelected([]); setFinancialConfirmed([]); setOcrConfirmed([]); setChanges([]); setResult(null); }} />
        {clientOptions.length > 0 && <div role="status" className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3"><div><p className="font-medium text-sm">{clientOptions.length} cliente(s) disponível(is) neste lote</p><p className="text-xs text-muted-foreground">Escolha um cliente por vez. O sistema exibirá e registrará somente os PDFs associados ao CNPJ selecionado.</p></div><div className="grid gap-2 sm:grid-cols-2">{clientOptions.map(option => { const active = option.client?.id === detectedClientId || (!option.registered && option.cnpj === unregisteredCnpj); return <div key={option.cnpj} className={`rounded-md border bg-background p-3 ${active ? "border-primary ring-1 ring-primary" : ""}`}><p className="text-sm font-medium">{option.client?.razao_social || "Cliente ainda não cadastrado"}</p><p className="text-xs text-muted-foreground">CNPJ {formatCnpj(option.cnpj)}</p><div className="my-2 flex flex-wrap gap-1"><Badge variant="secondary">{option.file_count} PDF(s)</Badge><Badge variant="outline">{option.document_count} documento(s)</Badge>{option.registered && <Badge variant="outline">{option.importable} publicável(is)</Badge>}</div><Button size="sm" variant={active ? "secondary" : "outline"} disabled={busy} onClick={() => selectClientOption(option)}>{active ? "Cliente selecionado" : option.registered ? "Selecionar cliente" : "Cadastrar este cliente"}</Button></div>; })}</div></div>}
        {unassignedBatchFiles.length > 0 && <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><p className="font-medium">{unassignedBatchFiles.length} arquivo(s) sem titularização segura</p><p>Esses arquivos não serão atribuídos automaticamente a nenhum cliente. Separe-os e importe dentro do cadastro correto para conferência.</p><p className="mt-1 break-words">{unassignedBatchFiles.map(file => file.name).join(" · ")}</p></div>}
        <div className="flex items-center gap-3"><Button disabled={!files.length || busy || syncingStorage} onClick={() => analyze()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Gerar prévia</Button><span className="text-xs text-muted-foreground">{files.length} arquivo(s) selecionado(s). Nada é salvo antes da confirmação.</span></div>
        {unregisteredCnpj && <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-medium">Cliente não cadastrado</p><p className="mt-1">O CNPJ {formatCnpj(unregisteredCnpj)} foi identificado nos arquivos. Deseja cadastrar esse cliente agora?</p><p className="mt-1 text-xs">Os arquivos selecionados serão preservados e a prévia continuará automaticamente após o cadastro.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setUnregisteredCnpj(null)}>Agora não</Button><Button size="sm" onClick={() => onClientNotFound?.(unregisteredCnpj, [...files])}>Cadastrar cliente</Button></div></div>}
        {result && <div role="status" className="rounded-md bg-muted p-3 text-sm space-y-2"><p>Concluído: {String(result.created)} documento(s) documental(is), {String(result.attached)} PDF(s). Operacional: {String((result.operational as Record<string, unknown>)?.created || 0)} criado(s), {String((result.operational as Record<string, unknown>)?.updated || 0)} atualizado(s), {String((result.operational as Record<string, unknown>)?.linked || 0)} apenas vinculado(s). Pendências manuais criadas: {String(result.manual_pending_created || 0)}.</p>{storageSummary && storageSummary.total > 0 && <div className="rounded border bg-background p-3 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">Guardar originais</p><p className="text-xs text-muted-foreground">{storageMessage}</p></div><Badge variant={storageSummary.pending ? "outline" : "secondary"}>{storageSummary.archived}/{storageSummary.total} no Drive</Badge></div>{isAdmin && storageSummary.pending > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={syncDrive}>{syncingStorage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pausar após o atual</> : <><Upload className="h-4 w-4 mr-2" />Arquivar no Drive</>}</Button>}</div>}<Button variant="link" size="sm" onClick={() => download(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }), "resultado-importacao.json")}>Baixar resultado</Button></div>}
        {preview && <>
          {preview.client && <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-950"><p className="font-medium">Cliente identificado automaticamente</p><p>{preview.client.razao_social}{preview.client.nome_fantasia ? ` · ${preview.client.nome_fantasia}` : ""} · CNPJ {preview.client.cnpj}</p></div>}
          <div className="flex flex-wrap gap-2 text-xs"><Badge variant="secondary">{preview.counts.files} arquivos</Badge><Badge variant="secondary">{preview.counts.documents} documentos agrupados</Badge><Badge variant="secondary">{preview.counts.importable} publicáveis</Badge><Badge variant="outline">{preview.counts.rejected} não aceitos</Badge></div>
          <div className="flex flex-wrap items-center gap-3"><Label htmlFor="perdcomp-import-filter">Filtrar</Label><select id="perdcomp-import-filter" className="rounded border p-2 text-sm bg-background" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><Button size="sm" variant="outline" disabled={busy} onClick={() => { setSelected(matching.filter(g => g.importable).map(g => g.key)); setFinancialConfirmed([]); setOcrConfirmed([]); }}>Selecionar todos os publicáveis deste filtro</Button><span className="text-xs">{selected.length} selecionado(s)</span></div>
          {missingReferenceDocuments > 0 && <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950"><p className="font-medium">A origem documental pendente não bloqueia o registro operacional.</p><p>{missingReferenceDocuments} documento(s) fazem referência a uma origem que não está neste lote. O PER/DCOMP será registrado normalmente; somente o vínculo documental do crédito ficará pendente e será resolvido automaticamente quando o PDF da origem for importado.</p></div>}
          {(selected.length > 0 || manualSelected.length > 0) && <div className="rounded-lg border bg-background p-3 space-y-3 shadow-sm"><p className="text-sm font-medium">Concluir registro</p>
            {financialRequired.length > 0 && <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950"><input type="checkbox" className="mt-0.5" checked={missingFinancialAuthorization.length === 0} disabled={busy} onChange={event => authorizeSelectedFinancial(event.target.checked)} /><span>Conferi os valores atuais e propostos dos {financialRequired.length} documento(s) selecionado(s) e autorizo a atualização financeira. O histórico será preservado e o saldo será calculado como Pedido − (Compensado + Recebido).</span></label>}
            {ocrRequired.length > 0 && <label className="flex items-start gap-2 rounded border border-blue-300 bg-blue-50 p-2 text-xs text-blue-950"><input type="checkbox" className="mt-0.5" checked={missingOcrAuthorization.length === 0} disabled={busy} onChange={event => authorizeSelectedOcr(event.target.checked)} /><span>Conferi no PDF original o protocolo, CNPJ, datas e valores dos {ocrRequired.length} documento(s) interpretado(s) por OCR e autorizo o registro. O arquivo original e a extração serão preservados.</span></label>}
            {reasonRequired && <div><Label htmlFor="perdcomp-import-reason">Justificativa da conferência</Label><Textarea id="perdcomp-import-reason" className="mt-1 min-h-16" maxLength={2000} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} placeholder="Ex.: Valores e documentos conferidos com os PDFs do lote." /></div>}
            {missingFinancialAuthorization.length > 0 && <p className="text-xs text-amber-800">Para continuar, autorize os valores dos {missingFinancialAuthorization.length} documento(s) acima.</p>}
            {missingOcrAuthorization.length > 0 && <p className="text-xs text-blue-800">Para continuar, confira e autorize o OCR dos {missingOcrAuthorization.length} documento(s) acima.</p>}
            {reasonMissing && <p className="text-xs text-amber-800">Informe uma justificativa com pelo menos 10 caracteres.</p>}
            <div className="flex flex-wrap items-center gap-3"><Button disabled={confirmDisabled} onClick={confirm}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Registrar {selected.length} PER/DCOMP(s){manualSelected.length > 0 ? ` e guardar ${manualSelected.length} pendência(s)` : ""}</Button><span className="text-xs text-muted-foreground">Nada é alterado enquanto este botão estiver desabilitado.</span></div>
          </div>}
          {matching.map(g => <div key={g.key} className="border rounded-lg p-3"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Publicar ${g.fields.protocol}`} className="mt-1" disabled={!g.importable || busy} checked={selected.includes(g.key)} onChange={e => { setSelected(s => e.target.checked ? [...s, g.key] : s.filter(k => k !== g.key)); if (!e.target.checked) { setFinancialConfirmed(s => s.filter(k => k !== g.key)); setOcrConfirmed(s => s.filter(k => k !== g.key)); } }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 items-center"><span className="font-medium text-sm">{String(g.fields.protocol)}</span><Badge variant={g.importable ? "secondary" : "destructive"}>{statuses[g.status!]}</Badge>{g.ocr_used && <Badge className="border-blue-300 bg-blue-50 text-blue-800" variant="outline">OCR {g.ocr_confidence !== null && g.ocr_confidence !== undefined ? `${Math.round(g.ocr_confidence * 100)}%` : ""}</Badge>}<Badge variant="outline">{completeness[g.completeness]}</Badge><Badge variant="outline">{g.version?.status === "current" ? "Versão vigente" : g.version?.status === "cancelled" ? "Cancelada" : "Versão anterior"}</Badge></div><p className="text-xs mt-1">CNPJ {String(g.fields.cnpj)} · {String(g.fields.modality)} · {String(g.fields.nature)}</p><p className="text-xs text-muted-foreground">{display("year", g.fields.year)} · {display("quarter", g.fields.quarter)} · Pedido: {display("requested", g.fields.requested)} · Utilizado: {display("used", g.fields.used)} · {g.debts.length} débito(s)</p></div></div>
            {g.issues?.map((issue, i) => <p key={i} className="text-xs text-destructive mt-1">{issue}</p>)}
            {g.missing?.map((ref, i) => <p key={i} className="text-xs text-blue-800 mt-1">{labels[ref.kind]} documental ainda não importada: {ref.protocol}. Isso não impede o registro operacional; o vínculo será completado quando a origem for importada.</p>)}
            {g.version && <p className={g.version.status === "current" ? "text-xs text-green-700 mt-1" : "text-xs text-amber-700 mt-1"}>{g.version.message}{g.version.successor_protocol ? ` Documento sucessor: ${g.version.successor_protocol}.` : ""}</p>}
            {g.retifier && <p className="text-xs text-amber-700 mt-1">Retificadora: será mantida como novo registro e, quando válida, será marcada como vigente; a original ficará substituída.</p>}
            {g.operational && <div className="mt-2 rounded bg-muted p-2 text-xs"><p className="font-medium">Operacional: {operationalActions[g.operational.action]}</p><p>{g.operational.reason}</p>{g.operational.changes.length > 0 && <details className="mt-1"><summary className="cursor-pointer">Ver {g.operational.changes.length} alteração(ões)</summary>{g.operational.changes.map(change => <p key={change.field}>{labels[change.field] || change.field}: {display(change.field, change.old)} → {display(change.field, change.new)}</p>)}</details>}</div>}
            {g.operational?.financial_review_required && <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950">Revisão financeira futura: {g.operational.financial_review_reason}</p>}
            {g.operational?.financial_confirmation_required && selected.includes(g.key) && <label className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950"><input type="checkbox" className="mt-0.5" checked={financialConfirmed.includes(g.key)} disabled={busy} onChange={e => setFinancialConfirmed(current => e.target.checked ? [...current, g.key] : current.filter(key => key !== g.key))} /><span>Conferi os valores atuais e propostos e autorizo a substituição, inclusive de valores digitados manualmente. O histórico será preservado.</span></label>}
            {g.ocr_used && selected.includes(g.key) && <label className="mt-2 flex items-start gap-2 rounded border border-blue-300 bg-blue-50 p-2 text-xs text-blue-950"><input type="checkbox" className="mt-0.5" checked={ocrConfirmed.includes(g.key)} disabled={busy} onChange={e => setOcrConfirmed(current => e.target.checked ? [...current, g.key] : current.filter(key => key !== g.key))} /><span>Conferi protocolo, CNPJ, datas e valores diretamente no PDF original e autorizo esta interpretação por OCR.</span></label>}
            {!g.importable && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" disabled={busy} checked={(g.files as number[]).every(index => manualSelected.includes(preview.files.find(file => file.index === index)!.sha256))} onChange={e => { const hashes = preview.files.filter(file => (g.files as number[]).includes(file.index!)).map(file => file.sha256); setManualSelected(current => e.target.checked ? Array.from(new Set([...current, ...hashes])) : current.filter(hash => !hashes.includes(hash))); }} />Guardar os PDFs deste documento na fila manual</label>}
            {details(g, preview.files.filter(f => (g.files as number[]).includes(f.index!)), true)}
          </div>)}
          {ungrouped.map(f => <div key={f.index} className="border rounded-lg p-3 text-sm"><div className="flex flex-wrap gap-2"><span className="break-all">{f.name}</span><Badge variant="outline">{statuses[f.status!]}</Badge></div>{f.fields?.cnpj && <p>CNPJ encontrado: {String(f.fields.cnpj)}</p>}{f.issues?.map((issue, i) => <p className="text-xs text-muted-foreground mt-1" key={i}>{issue}</p>)}{f.pages > 0 && <Button size="sm" variant="ghost" disabled={busy} onClick={() => original(f)}>Consultar PDF original</Button>}{f.manual_eligible && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={manualSelected.includes(f.sha256)} disabled={busy} onChange={e => setManualSelected(current => e.target.checked ? [...current, f.sha256] : current.filter(hash => hash !== f.sha256))} />Guardar na fila para tratamento manual</label>}</div>)}
          {matching.length === 0 && ungrouped.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item neste filtro.</p>}
        </>}
      </div>
    </DialogContent></Dialog>
    <Dialog open={reprocessOpen} onOpenChange={value => { if (!busy) setReprocessOpen(value); }}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar arquivos já importados</DialogTitle><DialogDescription>Os PDFs já estão preservados. Selecione os documentos, confira as diferenças e autorize individualmente qualquer alteração financeira.</DialogDescription></DialogHeader>
      {!reprocessPreview ? <p className="text-sm text-muted-foreground">Carregando conferência...</p> : <div className="space-y-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{reprocessPreview.counts.pending} aguardando processamento</Badge><Badge variant="outline">{reprocessPreview.counts.financial_confirmation} com conferência financeira</Badge>{reprocessAvailable.length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setReprocessSelected(reprocessAvailable.map(item => item.key)); setReprocessFinancial([]); }}>Selecionar todos para registro</Button>}</div>
        {reprocessPreview.documents.length > 0 && <div className="rounded-lg border bg-background p-3 space-y-3 shadow-sm"><p className="text-sm font-medium">Concluir registro operacional</p><p className="text-xs text-muted-foreground">Referências documentais pendentes não impedem esta etapa. Elas serão vinculadas automaticamente quando os PDFs de origem forem importados.</p>
          {reprocessFinancialRequired.length > 0 && <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950"><input className="mt-0.5" type="checkbox" checked={missingReprocessFinancial.length === 0} disabled={busy} onChange={event => authorizeReprocessFinancial(event.target.checked)} /><span>Conferi os valores atuais e propostos dos {reprocessFinancialRequired.length} documento(s) selecionado(s) e autorizo a atualização financeira. O histórico será preservado.</span></label>}
          {reprocessReasonRequired && <div><Label htmlFor="reprocess-reason">Justificativa da conferência</Label><Textarea id="reprocess-reason" className="mt-1 min-h-16" value={reprocessReason} maxLength={2000} disabled={busy} onChange={event => setReprocessReason(event.target.value)} placeholder="Ex.: Valores e documentos conferidos com os PDFs importados." /></div>}
          {missingReprocessFinancial.length > 0 && <p className="text-xs text-amber-800">Para continuar, autorize os valores dos {missingReprocessFinancial.length} documento(s) acima.</p>}
          {reprocessReasonMissing && <p className="text-xs text-amber-800">Informe uma justificativa com pelo menos 10 caracteres.</p>}
          <Button onClick={confirmReprocess} disabled={reprocessConfirmDisabled}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Registrar {reprocessSelected.length} documento(s)</Button>
        </div>}
        {reprocessPreview.documents.length === 0 ? <p className="rounded bg-muted p-3 text-sm">Todos os documentos importados já estão registrados e atualizados.</p> : reprocessPreview.documents.map(item => <div key={item.key} className="rounded-lg border p-3 space-y-2"><div className="flex items-start gap-3"><input className="mt-1" type="checkbox" aria-label={`Registrar ${item.key}`} checked={reprocessSelected.includes(item.key)} disabled={busy || item.operational.action === "manual" || item.operational.action === "conflict"} onChange={event => { setReprocessSelected(current => event.target.checked ? [...current, item.key] : current.filter(key => key !== item.key)); if (!event.target.checked) setReprocessFinancial(current => current.filter(key => key !== item.key)); }} /><div className="min-w-0"><p className="font-medium text-sm">{item.key} <Badge variant="outline">{item.version.status === "current" ? "Versão vigente" : item.version.status === "cancelled" ? "Cancelada" : "Versão anterior"}</Badge></p><p className="text-xs text-muted-foreground">{String(item.fields.modality)} · transmissão {String(item.fields.transmitted_on || "não informada")}</p></div></div>
          <p className={item.version.status === "current" ? "text-xs text-green-700" : "text-xs text-amber-700"}>{item.version.message}{item.version.successor_protocol ? ` Documento sucessor: ${item.version.successor_protocol}.` : ""}</p>
          <div className="rounded bg-muted p-2 text-xs"><p className="font-medium">{operationalActions[item.operational.action]}</p><p>{item.operational.reason}</p>{item.operational.changes.length > 0 && <div className="mt-2 space-y-1">{item.operational.changes.map(change => <p key={change.field} className={change.financial ? "font-medium text-amber-800" : ""}>{labels[change.field] || change.field}: {display(change.field, change.old)} → {display(change.field, change.new)}</p>)}</div>}</div>
          {item.operational.financial_review_required && <p className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950">Revisão financeira futura: {item.operational.financial_review_reason}</p>}
          <p className="text-xs text-muted-foreground">Arquivos: {item.files.map(file => file.name).join(" · ")}</p>
          {item.operational.financial_confirmation_required && reprocessSelected.includes(item.key) && <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950"><input className="mt-0.5" type="checkbox" checked={reprocessFinancial.includes(item.key)} disabled={busy} onChange={event => setReprocessFinancial(current => event.target.checked ? [...current, item.key] : current.filter(key => key !== item.key))} /><span>Conferi os valores anteriores e propostos e autorizo a substituição. O saldo será recalculado como Pedido − (Compensado + Recebido).</span></label>}
        </div>)}
      </div>}
    </DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={v => { if (!v && !busy) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>Revisar campo extraído</DialogTitle><DialogDescription>O PDF original será preservado. A justificativa e o valor original ficam no histórico. Uma nova prévia será gerada.</DialogDescription></DialogHeader>{editing && <div className="space-y-3"><Label htmlFor="import-review-value">{labels[editing.field.split(".").at(-1)!] || editing.field}</Label><Input id="import-review-value" value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.value })} /><p className="text-xs text-muted-foreground">Valores: 1234.56 · Datas: AAAA-MM-DD · Lógicos: true/false · Vazio: não informado.</p><Label htmlFor="import-review-reason">Justificativa</Label><Textarea id="import-review-reason" maxLength={2000} value={editing.reason} onChange={e => setEditing({ ...editing, reason: e.target.value })} /><Button disabled={busy || editing.reason.trim().length < 10} onClick={() => { const value: Value = editing.value === "" ? null : editing.value === "true" ? true : editing.value === "false" ? false : editing.value; analyze([...changes.filter(c => c.sha256 !== editing.source.sha256 || c.field !== editing.field), { sha256: editing.source.sha256, field: editing.field, value, reason: editing.reason }]); }}>Aplicar e revalidar</Button></div>}</DialogContent></Dialog>
  </Card>;
}
