import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePerdCompStore,
  type PerDcompStatus,
  type PerdComp,
} from "@/stores/perdcompStore";
import { useClientStore } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { MaskedInput } from "@/components/ui/input-mask";

const perdcompSchema = z.object({
  client_id: z.string().min(1, "Cliente é obrigatório"),
  cnpj: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  // Identificação
  numero: z.string().min(1, "Número é obrigatório"),
  numero_perdcomp: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  processo_protocolo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  // Datas
  data_transmissao: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  data_vencimento: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  data_competencia: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  // Dados fiscais
  tributo_pedido: z.string().min(1, "Tributo é obrigatório"),
  competencia: z.string().min(1, "Competência é obrigatória"),

  // Valores (como string para precisão)
  valor_pedido: z.string().min(1, "Valor do pedido é obrigatório"),
  valor_compensado: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  valor_recebido: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  valor_saldo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  valor_selic: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  // Status
  status: z.enum([
    "RASCUNHO",
    "TRANSMITIDO",
    "EM_PROCESSAMENTO",
    "DEFERIDO",
    "INDEFERIDO",
    "PARCIALMENTE_DEFERIDO",
    "CANCELADO",
    "VENCIDO",
  ]),

  // Controles
  is_active: z.boolean().default(true),
});

type PerdCompFormData = z.infer<typeof perdcompSchema>;

interface PerdCompFormProps {
  perdcomp?: PerdComp | null;
  clientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PerdCompForm({
  perdcomp,
  clientId,
  onSuccess,
  onCancel,
}: PerdCompFormProps) {
  const { createPerdComp, updatePerdComp } = usePerdCompStore();
  const { clients, fetchClients, fetchClientById } = useClientStore();
  const { toast } = useToast();
  const [selectedClientData, setSelectedClientData] = useState<any>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<PerdCompFormData>({
    resolver: zodResolver(perdcompSchema),
    defaultValues: perdcomp
      ? {
          client_id: "", // Will be set when we find the client by CNPJ
          cnpj: perdcomp.cnpj,
          numero: perdcomp.numero,
          numero_perdcomp: perdcomp.numero_perdcomp,
          processo_protocolo: perdcomp.processo_protocolo?.toString() || "",
          // Convert dates from YYYY-MM-DD to YYYY-MM-DDTHH:mm for datetime-local inputs
          data_transmissao: perdcomp.data_transmissao
            ? perdcomp.data_transmissao.includes("T")
              ? perdcomp.data_transmissao.slice(0, 16)
              : `${perdcomp.data_transmissao}T00:00`
            : undefined,
          data_vencimento: perdcomp.data_vencimento
            ? perdcomp.data_vencimento.includes("T")
              ? perdcomp.data_vencimento.slice(0, 16)
              : `${perdcomp.data_vencimento}T00:00`
            : undefined,
          data_competencia: perdcomp.data_competencia
            ? perdcomp.data_competencia.includes("T")
              ? perdcomp.data_competencia.slice(0, 16)
              : `${perdcomp.data_competencia}T00:00`
            : undefined,
          tributo_pedido: perdcomp.tributo_pedido,
          competencia: perdcomp.competencia,
          valor_pedido: perdcomp.valor_pedido,
          valor_compensado: perdcomp.valor_compensado,
          valor_recebido: perdcomp.valor_recebido,
          valor_saldo: perdcomp.valor_saldo,
          valor_selic: perdcomp.valor_selic,
          status: perdcomp.status,
          is_active: perdcomp.is_active ?? true,
        }
      : {
          client_id: clientId || "",
          cnpj: "", // Will be populated by useEffect when client loads
          status: "RASCUNHO" as any,
          valor_pedido: "0.00",
          valor_compensado: "0.00",
          valor_recebido: "0.00",
          valor_saldo: "0.00",
          valor_selic: "0.00",
          is_active: true,
        },
  });

  // Reset form when perdcomp changes
  useEffect(() => {
    if (perdcomp) {
      // Convert dates from YYYY-MM-DD to YYYY-MM-DDTHH:mm for datetime-local inputs
      const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return undefined;
        // If it's already in datetime format, return as is
        if (dateStr.includes("T")) return dateStr.slice(0, 16);
        // If it's just a date, add time
        return `${dateStr}T00:00`;
      };

      reset({
        client_id: "", // Will be set when client is selected
        cnpj: perdcomp.cnpj,
        numero: perdcomp.numero,
        numero_perdcomp: perdcomp.numero_perdcomp,
        processo_protocolo: perdcomp.processo_protocolo?.toString() || "",
        data_transmissao: formatDateForInput(perdcomp.data_transmissao),
        data_vencimento: formatDateForInput(perdcomp.data_vencimento),
        data_competencia: formatDateForInput(perdcomp.data_competencia),
        tributo_pedido: perdcomp.tributo_pedido,
        competencia: perdcomp.competencia,
        valor_pedido: perdcomp.valor_pedido,
        valor_compensado: perdcomp.valor_compensado,
        valor_recebido: perdcomp.valor_recebido,
        valor_saldo: perdcomp.valor_saldo,
        valor_selic: perdcomp.valor_selic,
        status: perdcomp.status,
        is_active: perdcomp.is_active ?? true,
      });
    }
  }, [perdcomp, reset]);

  // Fetch client data when clientId is provided OR when perdcomp is loaded
  useEffect(() => {
    const loadClientData = async () => {
      // If editing a PerdComp, find client by CNPJ
      if (perdcomp?.cnpj && clients.length > 0) {
        const client = clients.find((c) => c.cnpj === perdcomp.cnpj);
        if (client) {
          setSelectedClientData(client);
          setValue("client_id", client.id);
          return;
        }
      }

      // If creating new with pre-selected client
      if (clientId) {
        try {
          const client = await fetchClientById(clientId);
          setSelectedClientData(client);
          setValue("client_id", clientId);
          if (client?.cnpj) {
            setValue("cnpj", client.cnpj);
          }
        } catch (error) {
          console.error("Error loading client data:", error);
        }
      }
    };
    loadClientData();
  }, [clientId, perdcomp, fetchClientById, setValue, clients]);

  // Handle client selection change
  const handleClientChange = async (clientId: string) => {
    setValue("client_id", clientId);

    try {
      const client = await fetchClientById(clientId);
      setSelectedClientData(client);

      // Auto-populate CNPJ when client is selected
      if (client?.cnpj) {
        setValue("cnpj", client.cnpj);
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  };

  const onSubmit = async (data: PerdCompFormData) => {
    try {
      // Validate that CNPJ is present for API requirements
      if (!data.cnpj || data.cnpj.trim() === "") {
        toast({
          title: "Erro",
          description: "CNPJ é obrigatório. Selecione um cliente.",
          variant: "destructive",
        });
        return;
      }

      // Transform data to match API expectations
      const apiData: any = {
        ...data,
        client_cnpj: data.cnpj, // Send CNPJ for backend identification
        cnpj: undefined, // Remove separate cnpj field since it's now client_cnpj
      };

      // Convert processo_protocolo to number for API if it exists and is not empty
      if (data.processo_protocolo && data.processo_protocolo.trim() !== "") {
        const protocoloNumber = Number(data.processo_protocolo);
        if (!isNaN(protocoloNumber)) {
          apiData.processo_protocolo = protocoloNumber;
        }
      }

      // Remove undefined/null fields to clean up the payload
      Object.keys(apiData).forEach((key) => {
        if (
          apiData[key] === undefined ||
          apiData[key] === null ||
          apiData[key] === ""
        ) {
          delete apiData[key];
        }
      });

      console.log("Sending PerdComp data to API:", apiData);

      if (perdcomp?.id) {
        await updatePerdComp(perdcomp.id, apiData);
        toast({
          title: "PER/DCOMP atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        await createPerdComp(apiData);
        toast({
          title: "PER/DCOMP criado",
          description: "O PER/DCOMP foi cadastrado com sucesso.",
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving perdcomp:", error);
      toast({
        title: "Erro",
        description: error?.message || "Ocorreu um erro ao salvar o PER/DCOMP.",
        variant: "destructive",
      });
    }
  };

  const onInvalid = (errors: any) => {
    toast({
      title: "Erro de validação",
      description:
        "Por favor, verifique os campos obrigatórios marcados em vermelho.",
      variant: "destructive",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="dates">Datas</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente *</Label>
            <Select
              onValueChange={handleClientChange}
              defaultValue={selectedClientData?.id || clientId}
              disabled={!!clientId && !perdcomp}
            >
              <SelectTrigger
                className={errors.client_id ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome_fantasia || client.razao_social} -{" "}
                    {client.cnpj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-destructive">
                {errors.client_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ do Cliente</Label>
            <MaskedInput
              id="cnpj"
              mask="99.999.999/9999-99"
              {...(!!clientId && !perdcomp ? {} : register("cnpj"))}
              value={
                !!clientId && !perdcomp
                  ? selectedClientData?.cnpj || watch("cnpj") || ""
                  : watch("cnpj") || ""
              }
              placeholder="00.000.000/0000-00"
              disabled={!!clientId && !perdcomp}
              className={
                !!clientId && !perdcomp ? "bg-muted cursor-not-allowed" : ""
              }
              readOnly={!!clientId && !perdcomp}
              {...(!!clientId && !perdcomp
                ? {}
                : { onChange: (e) => setValue("cnpj", e.target.value) })}
            />
            {!!clientId && !perdcomp && (
              <p className="text-xs text-muted-foreground">
                CNPJ preenchido automaticamente com base no cliente selecionado
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Documento *</Label>
              <Input
                id="numero"
                {...register("numero")}
                className={errors.numero ? "border-destructive" : ""}
              />
              {errors.numero && (
                <p className="text-sm text-destructive">
                  {errors.numero.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_perdcomp">Número PER/DCOMP</Label>
              <Input
                id="numero_perdcomp"
                {...register("numero_perdcomp")}
                placeholder="Número específico do PER/DCOMP"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processo_protocolo">Protocolo do Processo</Label>
            <Input
              id="processo_protocolo"
              {...register("processo_protocolo")}
              placeholder="Número do protocolo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              onValueChange={(value) =>
                setValue("status", value as PerDcompStatus)
              }
              defaultValue={watch("status") || "RASCUNHO"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                <SelectItem value="TRANSMITIDO">Transmitido</SelectItem>
                <SelectItem value="EM_PROCESSAMENTO">
                  Em Processamento
                </SelectItem>
                <SelectItem value="DEFERIDO">Deferido</SelectItem>
                <SelectItem value="INDEFERIDO">Indeferido</SelectItem>
                <SelectItem value="PARCIALMENTE_DEFERIDO">
                  Parcialmente Deferido
                </SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                <SelectItem value="VENCIDO">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Aba Datas */}
        <TabsContent value="dates" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_transmissao">Data de Transmissão</Label>
            <Input
              id="data_transmissao"
              type="datetime-local"
              {...register("data_transmissao")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Input
              id="data_vencimento"
              type="datetime-local"
              {...register("data_vencimento")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_competencia">Data de Competência</Label>
            <Input
              id="data_competencia"
              type="datetime-local"
              {...register("data_competencia")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </TabsContent>

        {/* Aba Valores */}
        <TabsContent value="values" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_pedido">Valor do Pedido *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor_pedido"
                  {...register("valor_pedido")}
                  placeholder="0,00"
                  className={`pl-10 ${
                    errors.valor_pedido ? "border-destructive" : ""
                  }`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = (Number(value) / 100)
                      .toFixed(2)
                      .replace(".", ",");
                    setValue("valor_pedido", formatted);
                  }}
                />
              </div>
              {errors.valor_pedido && (
                <p className="text-sm text-destructive">
                  {errors.valor_pedido.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Valor solicitado no pedido
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_compensado">Valor Compensado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor_compensado"
                  {...register("valor_compensado")}
                  placeholder="0,00"
                  className="pl-10"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = (Number(value) / 100)
                      .toFixed(2)
                      .replace(".", ",");
                    setValue("valor_compensado", formatted);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Valor efetivamente compensado
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_recebido">Valor Recebido</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor_recebido"
                  {...register("valor_recebido")}
                  placeholder="0,00"
                  className="pl-10"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = (Number(value) / 100)
                      .toFixed(2)
                      .replace(".", ",");
                    setValue("valor_recebido", formatted);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Valor efetivamente recebido
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_saldo">Valor do Saldo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor_saldo"
                  {...register("valor_saldo")}
                  placeholder="0,00"
                  className="pl-10"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = (Number(value) / 100)
                      .toFixed(2)
                      .replace(".", ",");
                    setValue("valor_saldo", formatted);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo remanescente
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_selic">Valor SELIC</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="valor_selic"
                {...register("valor_selic")}
                placeholder="0,00"
                className="pl-10"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const formatted = (Number(value) / 100)
                    .toFixed(2)
                    .replace(".", ",");
                  setValue("valor_selic", formatted);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valor dos juros SELIC aplicados
            </p>
          </div>
        </TabsContent>

        {/* Aba Fiscal */}
        <TabsContent value="fiscal" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tributo_pedido">Tributo do Pedido *</Label>
            <Select
              onValueChange={(value) => setValue("tributo_pedido", value)}
              defaultValue={perdcomp?.tributo_pedido}
            >
              <SelectTrigger
                className={errors.tributo_pedido ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Selecione o tributo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IRPJ">
                  IRPJ - Imposto de Renda Pessoa Jurídica
                </SelectItem>
                <SelectItem value="CSLL">
                  CSLL - Contribuição Social sobre o Lucro Líquido
                </SelectItem>
                <SelectItem value="PIS">
                  PIS - Programa de Integração Social
                </SelectItem>
                <SelectItem value="COFINS">
                  COFINS - Contribuição para Financiamento da Seguridade Social
                </SelectItem>
                <SelectItem value="PIS/COFINS">PIS/COFINS</SelectItem>
                <SelectItem value="IPI">
                  IPI - Imposto sobre Produtos Industrializados
                </SelectItem>
                <SelectItem value="ICMS">
                  ICMS - Imposto sobre Circulação de Mercadorias e Serviços
                </SelectItem>
                <SelectItem value="OUTROS">Outros</SelectItem>
              </SelectContent>
            </Select>
            {errors.tributo_pedido && (
              <p className="text-sm text-destructive">
                {errors.tributo_pedido.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="competencia">Competência *</Label>
            <Input
              id="competencia"
              {...register("competencia")}
              placeholder="Ex: 2024, 01/2024, 2024-01"
              className={errors.competencia ? "border-destructive" : ""}
            />
            {errors.competencia && (
              <p className="text-sm text-destructive">
                {errors.competencia.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Período de referência do tributo
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : perdcomp?.id ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
