import type { PerdComp } from "@/stores/perdcompStore";

function normalizePdfText(text: string): string {
  return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function pick(text: string, regex: RegExp): string | undefined {
  return text.match(regex)?.[1]?.trim();
}

function parseBRMoneyToDotDecimal(input?: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (Number.isNaN(n)) return undefined;
  return n.toFixed(2);
}

function mapTributoPedidoFromTipoCredito(
  tipoCredito?: string
): string | undefined {
  if (!tipoCredito) return undefined;
  const t = tipoCredito.toLowerCase();

  if (t.includes("cofins")) return "COFINS";
  if (t.includes("pis")) return "PIS_PASEP";
  if (t.includes("ipi")) return "IPI";
  if (t.includes("irpj")) return "IRPJ";
  if (t.includes("csll")) return "CSLL";

  return undefined;
}

/**
 * Parser para "RECIBO DE ENTREGA DO PEDIDO DE RESSARCIMENTO / PER/DCOMP WEB"
 */
export function parsePerdcompReceiptText(rawText: string): Partial<PerdComp> {
  const text = normalizePdfText(rawText);

  const cnpj = pick(text, /CNPJ\s*:\s*([0-9.\-\/]{14,18})/i);

  const dataTransmissao = pick(
    text,
    /Data de Transmiss[aã]o\s*:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i
  );

  const numeroControle = pick(text, /N[uú]mero de Controle\s*:\s*([0-9.\-]+)/i);

  const numeroDocumento = pick(
    text,
    /N[uú]mero do Documento\s*:\s*([0-9.\-]+)/i
  );

  const tipoCredito = pick(
    text,
    /Tipo de Cr[eé]dito\s*:\s*(.+?)\s*Oriundo de A[cç][aã]o Judicial/i
  );

  const tributo_pedido = mapTributoPedidoFromTipoCredito(tipoCredito);

  const ano = pick(text, /Ano\s*:\s*([0-9]{4})/i);
  const trimestre = pick(text, /Trimestre\s*:\s*([0-9]+)[ºo]?\s*Trimestre/i);

  const competencia =
    ano && trimestre ? `${ano} - ${trimestre}º Trimestre` : ano || "";

  const valorPedidoRaw = pick(text, /Valor do Pedido\s*:\s*([0-9.,]+)/i);
  const valor_pedido = parseBRMoneyToDotDecimal(valorPedidoRaw);

  return {
    cnpj,
    // form chama "numero" e "numero_perdcomp"
    numero: numeroControle || "",
    numero_perdcomp: numeroDocumento,

    // input date do form costuma aceitar YYYY-MM-DD
    data_transmissao: dataTransmissao
      ? dataTransmissao.split("/").reverse().join("-")
      : undefined,

    tributo_pedido,
    competencia,

    valor_pedido,

    status: "TRANSMITIDO",
    is_active: true,
  };
}
