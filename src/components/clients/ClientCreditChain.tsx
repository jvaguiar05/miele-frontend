import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
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

type NullableMoney = string | null;
type ChainFile = {
  id: string;
  name: string;
  kind: string;
  pages: number;
  available: boolean;
  storage: "database" | "transition" | "drive";
};
type ChainRelation = {
  kind: string;
  target_protocol: string;
  resolved: boolean;
  target_source?: "imported_pdf" | "operational_only" | null;
};
type ChainDocument = {
  id: string | null;
  operational_id: string | null;
  protocol: string;
  source: "imported_pdf" | "operational_only";
  transmitted_on: string | null;
  modality: string | null;
  nature: string | null;
  revision_kind: string | null;
  version_status: string | null;
  superseded_by: string | null;
  documentary_values: {
    requested: NullableMoney;
    used: NullableMoney;
    declared_balance: NullableMoney;
  };
  operational_values: null | {
    requested: NullableMoney;
    compensated: NullableMoney;
    received: NullableMoney;
    balance: NullableMoney;
  };
  relations: ChainRelation[];
  files: ChainFile[];
};
type CreditChain = {
  id: string;
  origin_protocol: string | null;
  origin_status: "documented" | "referenced" | "unknown";
  status: "documented" | "attention" | "ambiguous";
  issues: string[];
  documents: ChainDocument[];
};
type CreditChainReport = {
  calculation: { enabled: false; status: string; message: string };
  counts: {
    chains: number;
    documents: number;
    pending_references: number;
    ambiguous_chains: number;
  };
  chains: CreditChain[];
};

const relationLabels: Record<string, string> = {
  credit_origin: "Origem do crédito",
  balance_reference: "Referência de saldo",
  rectifies: "Retifica",
  cancels: "Cancela",
};
const versionLabels: Record<string, string> = {
  current: "Versão vigente",
  superseded: "Substituída",
  previous: "Versão anterior",
  cancelled: "Cancelada",
  VIGENTE: "Versão vigente",
  SUBSTITUIDA: "Substituída",
  VERSAO_ANTERIOR: "Versão anterior",
  CANCELADA: "Cancelada",
};
const chainStatus = {
  documented: { label: "Cadeia documentada", className: "border-green-300 bg-green-50 text-green-800" },
  attention: { label: "Requer atenção", className: "border-amber-300 bg-amber-50 text-amber-800" },
  ambiguous: { label: "Cadeia ambígua", className: "border-red-300 bg-red-50 text-red-800" },
};

function money(value: NullableMoney) {
  if (value === null || value === "") return "Não informado";
  const normalized = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number(normalized).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return normalized.startsWith("R$") ? normalized : `R$ ${normalized}`;
}

function date(value: string | null) {
  if (!value) return "Data não informada";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return "Não foi possível carregar o extrato. Tente novamente.";
}

function Values({ title, values }: { title: string; values: Array<[string, NullableMoney]> }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <dl className="grid gap-2 sm:grid-cols-3">
        {values.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`break-words text-sm font-medium ${value === null || value === "" ? "text-muted-foreground" : ""}`}>
              {money(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ClientCreditChain({ clientId }: { clientId: string }) {
  const role = useAuthStore(state => state.user?.role);
  const mayDownloadOriginal = role === "admin" || role === "employee";
  const [report, setReport] = useState<CreditChainReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<CreditChainReport>(
        `/clients/${clientId}/perdcomp-imports/credit-chain/`,
      );
      setReport(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // clientId is the only input to this read-only report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function downloadOriginal(file: ChainFile) {
    setDownloading(file.id);
    try {
      const response = await api.get(
        `/clients/${clientId}/perdcomp-imports/files/${file.id}/`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Extrato da Cadeia do Crédito
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Consulta documental das origens, derivações e versões já vinculadas.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Não foi possível atualizar o extrato</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !report ? (
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando vínculos documentais...
          </div>
        ) : report ? (
          <>
            <Alert className="border-blue-200 bg-blue-50/60 text-blue-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Consulta segura — cálculo consolidado desativado</AlertTitle>
              <AlertDescription>{report.calculation.message}</AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{report.counts.chains} cadeia(s)</Badge>
              <Badge variant="outline">{report.counts.documents} documento(s)</Badge>
              {report.counts.pending_references > 0 && (
                <Badge className="border-amber-300 bg-amber-50 text-amber-800" variant="outline">
                  {report.counts.pending_references} referência(s) pendente(s)
                </Badge>
              )}
              {report.counts.ambiguous_chains > 0 && (
                <Badge className="border-red-300 bg-red-50 text-red-800" variant="outline">
                  {report.counts.ambiguous_chains} cadeia(s) ambígua(s)
                </Badge>
              )}
            </div>

            {report.chains.length === 0 ? (
              <p className="rounded-md border p-3 text-sm text-muted-foreground">
                Nenhuma cadeia documental foi identificada. Ela aparecerá aqui após a importação dos PDFs.
              </p>
            ) : (
              <div className="space-y-2">
                {report.chains.map((chain, index) => {
                  const status = chainStatus[chain.status];
                  return (
                    <details key={chain.id} className="group rounded-lg border bg-muted/10" open={index === 0}>
                      <summary className="cursor-pointer list-none p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-all text-sm font-semibold">
                              {chain.origin_protocol ? `Origem ${chain.origin_protocol}` : "Origem ainda não identificada"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {chain.documents.length} documento(s) · clique para {index === 0 ? "recolher" : "consultar"}
                            </p>
                          </div>
                          <Badge className={status.className} variant="outline">{status.label}</Badge>
                        </div>
                      </summary>

                      <div className="space-y-3 border-t p-3">
                        {chain.issues.length > 0 && (
                          <div className={`rounded-md border p-3 text-xs ${chain.status === "ambiguous" ? "border-red-200 bg-red-50 text-red-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                            <p className="font-medium">Antes de automatizar um saldo desta cadeia:</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {chain.issues.map(issue => <li key={issue}>{issue}</li>)}
                            </ul>
                          </div>
                        )}

                        {chain.documents.map(item => (
                          <div key={`${item.source}-${item.protocol}`} className="rounded-lg border bg-background p-3">
                            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="break-all text-sm font-semibold">{item.protocol}</p>
                                <p className="text-xs text-muted-foreground">
                                  {date(item.transmitted_on)} · {item.nature || item.modality || "Tipo não informado"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">{versionLabels[item.version_status || ""] || "Situação não informada"}</Badge>
                                {item.source === "operational_only" && <Badge variant="secondary">Somente operacional</Badge>}
                              </div>
                            </div>

                            {item.relations.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.relations.map(relation => (
                                  <Badge
                                    key={`${relation.kind}-${relation.target_protocol}`}
                                    className={!relation.resolved ? "border-amber-300 bg-amber-50 text-amber-800" : ""}
                                    variant="outline"
                                  >
                                    {relationLabels[relation.kind] || relation.kind}: {relation.target_protocol}
                                    {!relation.resolved ? " · pendente" : ""}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 grid gap-2 lg:grid-cols-2">
                              <Values
                                title="Valores declarados no documento"
                                values={[
                                  ["Pedido", item.documentary_values.requested],
                                  ["Utilizado", item.documentary_values.used],
                                  ["Saldo documental", item.documentary_values.declared_balance],
                                ]}
                              />
                              {item.operational_values ? (
                                <Values
                                  title="Valores do cadastro operacional"
                                  values={[
                                    ["Pedido", item.operational_values.requested],
                                    ["Compensado", item.operational_values.compensated],
                                    ["Recebido", item.operational_values.received],
                                    ["Saldo", item.operational_values.balance],
                                  ]}
                                />
                              ) : (
                                <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                                  Sem cadastro operacional vinculado a este documento.
                                </div>
                              )}
                            </div>

                            {item.files.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                {item.files.map(file => mayDownloadOriginal ? (
                                  <Button
                                    key={file.id}
                                    size="sm"
                                    variant="ghost"
                                    className="h-auto max-w-full whitespace-normal break-all px-2 py-1 text-xs"
                                    disabled={!file.available || downloading === file.id}
                                    onClick={() => void downloadOriginal(file)}
                                  >
                                    {downloading === file.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                                    {file.name}
                                  </Button>
                                ) : (
                                  <span key={file.id} className="max-w-full break-all text-xs text-muted-foreground">{file.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
