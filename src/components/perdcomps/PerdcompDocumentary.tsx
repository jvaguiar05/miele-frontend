import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileSearch,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import usePerdcompDocumentary from "./usePerdcompDocumentary";

type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
type Relation = { kind: string; target_protocol: string; resolved: boolean };
type Review = { reviewed_at: string; reviewed_by: string; reason: string; changes: Record<string, Value>[] };
type ImportedFile = {
  id: string;
  name: string;
  kind: string;
  pages: number;
  available: boolean;
  storage: "drive" | "transition" | "database";
  extracted_at: string;
  extraction: {
    text_source?: "native" | "ocr";
    ocr?: { confidence?: number; pages?: number; recognized_pages?: number } | null;
    evidence?: Record<string, { page?: number | null; text?: string; value?: Value }>;
    issues?: string[];
  };
};
type ImportedDocument = {
  id: string;
  protocol: string;
  fields: Record<string, Value>;
  completeness: string;
  fiscal_status: string;
  financial_effect: string;
  version_status: string;
  superseded_by: string | null;
  relations: Relation[];
  debts: Record<string, Value>[];
  components: Record<string, Value>[];
  reviews: Review[];
  files: ImportedFile[];
};
type ChainDocument = {
  operational_id: string | null;
  protocol: string;
  transmitted_on: string | null;
  version_status: string | null;
  source: "imported_pdf" | "operational_only";
};
type Chain = {
  id: string;
  origin_protocol: string | null;
  status: "documented" | "attention" | "ambiguous";
  issues: string[];
  documents: ChainDocument[];
};
export type DocumentaryDetail = {
  has_import: boolean;
  client_id: string | null;
  documents: ImportedDocument[];
  chain: Chain | null;
  calculation: { enabled: false; message: string } | null;
  message: string | null;
};

const labels: Record<string, string> = {
  protocol: "Protocolo", cnpj: "CNPJ", name: "Razão social", nature: "Natureza do crédito",
  modality: "Modalidade", revision_kind: "Versão documental", control: "Número de controle",
  created_on: "Data de criação", transmitted_on: "Data de transmissão", transmitted_time: "Horário de transmissão",
  program: "Programa", version: "Versão do programa", taxation: "Regime de tributação",
  period_type: "Tipo de período", year: "Ano", quarter: "Trimestre", month: "Mês", period: "Período",
  judicial: "Crédito judicial", successor: "Crédito de sucedida", prior_process: "Processo anterior",
  other_document: "Informado em outro PER/DCOMP", credit_holder: "Detentor do crédito",
  initial_credit: "Crédito inicial", delivery_credit: "Crédito na entrega", updated_credit: "Crédito atualizado",
  declared_selic: "Selic declarada (%)", eligible_credit: "Passível de ressarcimento",
  requested: "Valor solicitado", used: "Utilizado neste documento", declared_balance: "Saldo documental",
  total_debts: "Total dos débitos", credit_tax: "Tributo do crédito", sequence: "Sequência",
  holder: "CNPJ detentor", group: "Grupo", revenue: "Receita/denominação", code: "Código",
  extension: "Extensão", description: "Descrição", frequency: "Periodicidade", due_on: "Vencimento",
  principal: "Principal compensado", original_principal: "Principal original", fine: "Multa",
  interest: "Juros", total: "Total", dctf_receipt: "Recibo DCTFWeb", dctf_date: "Transmissão DCTFWeb",
  dctf_category: "Categoria DCTFWeb", dctf_period: "Período DCTFWeb", controlled_process: "Controlado em processo",
  assessed: "Apurado", component_total: "Crédito apurado consolidado", deductions: "Deduções",
  previous_use: "Utilizações anteriores", balance: "Saldo documental", code_description: "Código/descrição",
  months: "Detalhamento mensal",
};
const fieldGroups = [
  { title: "Identificação do documento", keys: ["protocol", "cnpj", "name", "modality", "revision_kind", "control", "created_on", "transmitted_on", "transmitted_time", "program", "version"] },
  { title: "Crédito e período", keys: ["nature", "credit_tax", "taxation", "period_type", "year", "quarter", "month", "period", "judicial", "successor", "prior_process", "other_document", "credit_holder"] },
  { title: "Valores declarados", keys: ["initial_credit", "delivery_credit", "updated_credit", "declared_selic", "eligible_credit", "requested", "used", "declared_balance", "total_debts"] },
];
const moneyKeys = new Set(["initial_credit", "delivery_credit", "updated_credit", "eligible_credit", "requested", "used", "declared_balance", "total_debts", "principal", "original_principal", "fine", "interest", "total", "assessed", "component_total", "deductions", "previous_use", "balance"]);
const relationLabels: Record<string, string> = { credit_origin: "Origem do crédito", balance_reference: "Referência de saldo", rectifies: "Retifica", cancels: "Cancela" };
const kindLabels: Record<string, string> = { demonstrative: "PER/DCOMP", receipt: "Recibo", unknown: "Documento" };
const completenessLabels: Record<string, string> = { complete: "Demonstrativo + recibo", receipt_only: "Somente recibo", demonstrative_only: "Somente demonstrativo", conflict: "Evidências conflitantes" };
const versionLabels: Record<string, string> = { current: "Versão vigente", superseded: "Substituída", previous: "Versão anterior", cancelled: "Cancelada", VIGENTE: "Versão vigente", SUBSTITUIDA: "Substituída", VERSAO_ANTERIOR: "Versão anterior", CANCELADA: "Cancelada" };

function present(value: Value | undefined) {
  return value !== null && value !== undefined && value !== "";
}

function display(key: string, value: Value): string {
  if (!present(value)) return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map(item => display(key, item)).join(" · ");
  if (typeof value === "object") return Object.entries(value).map(([childKey, childValue]) => `${labels[childKey] || childKey}: ${display(childKey, childValue)}`).join(" · ");
  const text = String(value);
  if (moneyKeys.has(key) && /^-?\d+(?:\.\d+)?$/.test(text)) {
    return Number(text).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return text;
}

function friendlyUnknown(key: string) {
  return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return "Não foi possível carregar as informações da importação.";
}

function LoadingOrError({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  if (loading) return <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando informações importadas...</div>;
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Não foi possível carregar</AlertTitle><AlertDescription className="space-y-2"><p>{error}</p><Button size="sm" variant="outline" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button></AlertDescription></Alert>;
  return null;
}

function FieldSection({ title, fields, keys }: { title: string; fields: Record<string, Value>; keys: string[] }) {
  const visible = keys.filter(key => present(fields[key]));
  if (!visible.length) return null;
  return <div className="rounded-lg border p-3"><h4 className="mb-3 text-sm font-semibold">{title}</h4><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map(key => <div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{labels[key] || friendlyUnknown(key)}</dt><dd className="break-words text-sm font-medium">{display(key, fields[key])}</dd></div>)}</dl></div>;
}

function RecordTable({ title, rows }: { title: string; rows: Record<string, Value>[] }) {
  if (!rows.length) return null;
  return <details className="rounded-lg border"><summary className="cursor-pointer p-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{title} ({rows.length})</summary><div className="space-y-2 border-t p-3">{rows.map((row, index) => <dl key={index} className="grid gap-2 rounded-md bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(row).filter(([, value]) => present(value)).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{labels[key] || friendlyUnknown(key)}</dt><dd className="break-words text-sm">{display(key, value)}</dd></div>)}</dl>)}</div></details>;
}

export function PerdcompDocumentaryDetails({ state, perdcompId }: { state: ReturnType<typeof usePerdcompDocumentary>; perdcompId: string }) {
  const { data, loading, error, refresh } = state;
  if (!data) return <LoadingOrError loading={loading} error={error} onRetry={refresh} />;
  if (!data.has_import) return <Card><CardContent className="p-4"><div className="flex items-start gap-3"><FileSearch className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Sem detalhes de importação</p><p className="text-sm text-muted-foreground">{data.message}</p></div></div></CardContent></Card>;

  return <div className="space-y-3">
    {error && <LoadingOrError loading={false} error={error} onRetry={refresh} />}
    <Card>
      <CardHeader className="p-4 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4 text-primary" />Extrato da Cadeia do Crédito</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {data.calculation && <Alert className="border-blue-200 bg-blue-50/60 text-blue-950"><AlertTriangle className="h-4 w-4" /><AlertTitle>Consulta documental</AlertTitle><AlertDescription>{data.calculation.message}</AlertDescription></Alert>}
        {data.chain ? <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"><div className="min-w-0"><p className="break-all text-sm font-semibold">Origem: {data.chain.origin_protocol || "não identificada"}</p><p className="text-xs text-muted-foreground">{data.chain.documents.length} documento(s) relacionado(s)</p></div><Badge className={data.chain.status === "ambiguous" ? "border-red-300 bg-red-50 text-red-800" : data.chain.status === "attention" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-green-300 bg-green-50 text-green-800"} variant="outline">{data.chain.status === "ambiguous" ? "Cadeia ambígua" : data.chain.status === "attention" ? "Requer atenção" : "Cadeia documentada"}</Badge></div>
          {data.chain.issues.length > 0 && <ul className="list-disc space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 pl-7 text-xs text-amber-950">{data.chain.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
          <div className="space-y-2">{data.chain.documents.map(document => <div key={`${document.source}-${document.protocol}`} className={`flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border p-3 ${document.operational_id === perdcompId ? "border-primary bg-primary/5" : ""}`}><div className="min-w-0"><p className="break-all text-sm font-medium">{document.protocol}</p><p className="text-xs text-muted-foreground">{document.transmitted_on || "Data não informada"}</p></div><div className="flex flex-wrap gap-1"><Badge variant="outline">{versionLabels[document.version_status || ""] || "Situação não informada"}</Badge>{document.operational_id === perdcompId && <Badge>PER/DCOMP atual</Badge>}</div></div>)}</div>
        </> : <p className="rounded-md border p-3 text-sm text-muted-foreground">O PDF está vinculado, mas ainda não há uma cadeia de crédito identificada para este documento.</p>}
      </CardContent>
    </Card>

    {data.documents.map(document => {
      const usedKeys = new Set(fieldGroups.flatMap(group => group.keys));
      const otherKeys = Object.keys(document.fields).filter(key => !usedKeys.has(key) && present(document.fields[key]));
      const ocrFiles = document.files.filter(file => file.extraction?.text_source === "ocr");
      return <Card key={document.id}>
        <CardHeader className="p-4 pb-3"><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><CardTitle className="break-all text-base">Informações coletadas na importação</CardTitle><p className="mt-1 break-all text-xs text-muted-foreground">Protocolo {document.protocol}</p></div><div className="flex flex-wrap gap-1"><Badge variant="secondary">{completenessLabels[document.completeness] || document.completeness}</Badge><Badge variant="outline">{versionLabels[document.version_status] || document.version_status}</Badge>{ocrFiles.length > 0 && <Badge className="border-blue-300 bg-blue-50 text-blue-800" variant="outline">OCR conferido</Badge>}</div></div></CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {document.relations.length > 0 && <div className="flex flex-wrap gap-1">{document.relations.map(relation => <Badge key={`${relation.kind}-${relation.target_protocol}`} className={!relation.resolved ? "border-amber-300 bg-amber-50 text-amber-800" : ""} variant="outline">{relationLabels[relation.kind] || relation.kind}: {relation.target_protocol}{relation.resolved ? "" : " · pendente"}</Badge>)}</div>}
          {fieldGroups.map(group => <FieldSection key={group.title} title={group.title} fields={document.fields} keys={group.keys} />)}
          <FieldSection title="Outras informações interpretadas" fields={document.fields} keys={otherKeys} />
          <RecordTable title="Débitos identificados" rows={document.debts} />
          <RecordTable title="Componentes do crédito" rows={document.components} />
          <details className="rounded-lg border"><summary className="cursor-pointer p-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Evidências e auditoria da extração</summary><div className="space-y-3 border-t p-3">
            {document.files.map(file => { const evidence = Object.entries(file.extraction?.evidence || {}); return <div key={file.id} className="rounded-md bg-muted/30 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all text-sm font-medium">{file.name}</p><Badge variant="outline">{file.extraction?.text_source === "ocr" ? `OCR${file.extraction.ocr?.confidence != null ? ` ${file.extraction.ocr.confidence}%` : ""}` : "Texto do PDF"}</Badge></div>{evidence.length > 0 && <dl className="mt-2 grid gap-2 sm:grid-cols-2">{evidence.map(([key, item]) => <div key={key}><dt className="text-xs text-muted-foreground">{labels[key] || friendlyUnknown(key)}{item.page ? ` · pág. ${item.page}` : ""}</dt><dd className="break-words text-xs">{item.text || display(key, item.value ?? null)}</dd></div>)}</dl>}</div>; })}
            {document.reviews.map((review, index) => <div key={`${review.reviewed_at}-${index}`} className="rounded-md bg-muted/30 p-3 text-xs"><p className="font-medium">Conferido por {review.reviewed_by}</p><p className="text-muted-foreground">{new Date(review.reviewed_at).toLocaleString("pt-BR")}</p><p className="mt-1">{review.reason}</p>{review.changes.length > 0 && <p className="mt-1 text-muted-foreground">{review.changes.length} ajuste(s) preservado(s) na auditoria.</p>}</div>)}
          </div></details>
        </CardContent>
      </Card>;
    })}
  </div>;
}

export function PerdcompImportedFiles({ state }: { state: ReturnType<typeof usePerdcompDocumentary> }) {
  const { data, loading, error, refresh } = state;
  const role = useAuthStore(store => store.user?.role);
  const canOpen = role === "admin" || role === "employee";
  const [busyFile, setBusyFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [fileError, setFileError] = useState("");
  const files = useMemo(() => data?.documents.flatMap(document => document.files) || [], [data]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function fetchFile(file: ImportedFile) {
    if (!data?.client_id) throw new Error("Cliente da importação não identificado.");
    const response = await api.get(`/clients/${data.client_id}/perdcomp-imports/files/${file.id}/`, { responseType: "blob" });
    return response.data as Blob;
  }

  async function openFile(file: ImportedFile, mode: "view" | "download") {
    setBusyFile(file.id);
    setFileError("");
    try {
      const blob = await fetchFile(file);
      const url = URL.createObjectURL(blob);
      if (mode === "view") {
        if (preview) URL.revokeObjectURL(preview.url);
        setPreview({ url, name: file.name });
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (requestError) {
      setFileError(errorMessage(requestError));
    } finally {
      setBusyFile(null);
    }
  }

  if (!data) return <LoadingOrError loading={loading} error={error} onRetry={refresh} />;
  return <>
    <Card>
      <CardHeader className="p-4 pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Documentos originais da importação</CardTitle><p className="text-xs text-muted-foreground">PER/DCOMP e recibos vinculados a este registro. O arquivo é obtido do Google Drive automaticamente quando estiver arquivado.</p></CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {(error || fileError) && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Não foi possível acessar o arquivo</AlertTitle><AlertDescription>{fileError || error}</AlertDescription></Alert>}
        {!data.has_import || files.length === 0 ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{data.message || "Nenhum PDF de importação está vinculado a esta PER/DCOMP."}</p> : files.map(file => <div key={file.id} className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="break-all text-sm font-medium">{file.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{kindLabels[file.kind] || "Documento"}</Badge><Badge variant="outline">{file.pages} página(s)</Badge><Badge className={file.storage === "drive" ? "border-green-300 bg-green-50 text-green-800" : "border-amber-300 bg-amber-50 text-amber-800"} variant="outline">{file.storage === "drive" ? "Google Drive" : file.storage === "transition" ? "Sincronizando com Drive" : "Aguardando Drive"}</Badge></div></div></div>{canOpen ? <div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" disabled={!file.available || busyFile === file.id} onClick={() => void openFile(file, "view")}>{busyFile === file.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}Visualizar</Button><Button size="sm" variant="outline" disabled={!file.available || busyFile === file.id} onClick={() => void openFile(file, "download")}><Download className="mr-2 h-4 w-4" />Baixar</Button></div> : <p className="text-xs text-muted-foreground">Seu perfil pode consultar os dados, mas não abrir o PDF original.</p>}</div>)}
        {files.length > 0 && files.every(file => file.storage === "drive") && <p className="flex items-center gap-2 text-xs text-green-700"><CheckCircle2 className="h-4 w-4" />Todos os originais desta PER/DCOMP estão arquivados no Google Drive.</p>}
      </CardContent>
    </Card>
    <Dialog open={!!preview} onOpenChange={open => { if (!open && preview) { URL.revokeObjectURL(preview.url); setPreview(null); } }}><DialogContent className="grid h-[90vh] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden"><DialogHeader><DialogTitle className="break-all text-base">{preview?.name}</DialogTitle></DialogHeader>{preview && <iframe title={`Visualização de ${preview.name}`} src={preview.url} className="h-full min-h-0 w-full rounded-md border" />}</DialogContent></Dialog>
  </>;
}
