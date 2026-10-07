import { Download, ExternalLink, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export type OcrQuota = {
  per_operation_limit?: number;
  user_limit?: number;
  user_used?: number;
  user_remaining?: number;
  global_limit?: number;
  global_used?: number;
  global_remaining?: number;
  reset_at?: string | null;
  best_effort?: boolean;
};

type LocalOcrHelpProps = {
  expanded?: boolean;
  quota?: OcrQuota | null;
};

const defaults = { per_operation_limit: 5, user_limit: 10, global_limit: 40 };

function resetLabel(resetAt?: string | null) {
  if (!resetAt) return "Renova à meia-noite no fuso do sistema.";
  const date = new Date(resetAt);
  return Number.isNaN(date.getTime())
    ? "Renova à meia-noite no fuso do sistema."
    : `Renova em ${date.toLocaleString("pt-BR")}.`;
}

export function LocalOcrHelp({ expanded = false, quota }: LocalOcrHelpProps) {
  const installerUrl = import.meta.env.VITE_MIELE_OCR_INSTALLER_URL;
  const guideUrl = import.meta.env.VITE_MIELE_OCR_GUIDE_URL;
  const limits = { ...defaults, ...quota };
  const hasQuota = quota !== null && quota !== undefined;

  return <details open={expanded} className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-950">
    <summary className="cursor-pointer font-medium">OCR local para PDFs em imagem ou demorados <span className="font-normal text-muted-foreground">· OCR online: {limits.per_operation_limit} pág./op. · usuário {limits.user_limit}/dia · sistema {limits.global_limit}/dia{hasQuota ? ` · usuário ${limits.user_used}/${limits.user_limit}` : " · saldo após a prévia"}</span></summary>
    <div className="mt-2 space-y-3 text-xs">
      <p>PDFs nativos com texto não consomem OCR. O pacote <strong>.miele.zip</strong> criado pelo Miele OCR Local também não consome a cota online.</p>
      <p>Envie o pacote exatamente como foi criado: ele exige confirmação antes do registro e não deve ser extraído, alterado ou recomposto.</p>
      <div className="rounded border border-blue-200 bg-background/70 p-2">
        <p className="font-medium">Cota de OCR online</p>
        {hasQuota ? <><p>{limits.per_operation_limit} páginas por operação · você: {limits.user_used}/{limits.user_limit} usadas hoje ({limits.user_remaining} restantes) · sistema: {limits.global_used}/{limits.global_limit} usadas hoje ({limits.global_remaining} restantes).</p><p className="mt-1 text-muted-foreground">{resetLabel(limits.reset_at)}</p></> : <p>{limits.per_operation_limit} páginas por operação · usuário: {limits.user_limit}/dia · sistema: {limits.global_limit}/dia. O saldo será atualizado após gerar a prévia.</p>}
      </div>
      <ol className="list-decimal space-y-1 pl-4">
        <li>{installerUrl ? "Instale o Miele OCR Local uma vez." : "Solicite o instalador à equipe responsável."}</li>
        <li>Abra o Miele OCR Local pelo Menu Iniciar.</li>
        <li>Escolha os PDFs ou a pasta de origem e aguarde o processamento.</li>
        <li>Abra a pasta <strong>pacotes</strong> criada pelo programa e envie o arquivo <strong>.miele.zip</strong> neste mesmo campo.</li>
      </ol>
      {(installerUrl || guideUrl) && <div className="flex flex-wrap gap-2">
        {installerUrl && <Button asChild size="sm" variant="outline"><a href={installerUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-3.5 w-3.5" />Baixar Miele OCR Local</a></Button>}
        {guideUrl && <Button asChild size="sm" variant="ghost"><a href={guideUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-3.5 w-3.5" />Ver guia de uso</a></Button>}
      </div>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span className="inline-flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" />Pacotes locais: até 500 páginas</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Original preservado para conferência</span>
      </div>
    </div>
  </details>;
}
