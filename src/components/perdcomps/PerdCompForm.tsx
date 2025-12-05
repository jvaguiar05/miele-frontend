import { Controller, useForm } from "react-hook-form";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  usePerdCompStore,
  type PerDcompStatus,
  type PerdComp,
} from "@/stores/perdcompStore";
import { useClientStore } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useCallback } from "react";
import { MaskedInput } from "@/components/ui/input-mask";
import { Check, ChevronsUpDown, Search } from "lucide-react";

// Funções helper para formatação monetária brasileira
const formatCurrencyDisplay = (value: string | undefined | null): string => {
  if (!value || value.trim() === "" || value === "0.00" || value === "0") {
    return "";
  }

  // Normaliza o valor: se vier com vírgula, converte para ponto
  let normalizedValue = value.replace(",", ".");

  // Se o valor já está no formato "123.45" (ponto decimal), converte para exibição
  const numValue = parseFloat(normalizedValue);

  if (isNaN(numValue) || numValue === 0) {
    return "";
  }

  // Formata com separador de milhar (ponto) e decimal (vírgula)
  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const unformatCurrency = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  // Converte para número e divide por 100, retorna como string com ponto decimal
  const amount = Number(digits) / 100;
  return amount.toFixed(2);
};

// Tributos do pedido conforme normas brasileiras
const TRIBUTOS_PEDIDO = {
  COFINS: "COFINS - Contribuição para o Financiamento da Seguridade Social",
  COFINS_EXPORTACAO:
    "COFINS Exportação - Contribuição para o Financiamento da Seguridade Social (Exportação)",
  COFINS_RESTITUICAO:
    "COFINS Restituição - Contribuição para o Financiamento da Seguridade Social (Restituição)",
  COFINS_RETIFICADOR:
    "COFINS Retificador - Contribuição para o Financiamento da Seguridade Social (Retificador)",
  PIS_PASEP:
    "PIS/PASEP - Programa de Integração Social/Programa de Formação do Patrimônio do Servidor Público",
  PIS_PASEP_EXPORTACAO:
    "PIS/PASEP Exportação - Programa de Integração Social (Exportação)",
  PIS_PASEP_RESTITUICAO:
    "PIS/PASEP Restituição - Programa de Integração Social (Restituição)",
  PIS_PASEP_RETIFICADOR:
    "PIS/PASEP Retificador - Programa de Integração Social (Retificador)",
  IPI: "IPI - Imposto sobre Produtos Industrializados",
  IPI_RESSARCIMENTO:
    "IPI Ressarcimento - Imposto sobre Produtos Industrializados (Ressarcimento)",
  FUNRURAL: "FUNRURAL - Fundo de Assistência ao Trabalhador Rural",
  INSS_RETENCAO:
    "INSS Retenção - Instituto Nacional do Seguro Social (Retenção)",
  IRPJ_CSRF_RESTITUICAO:
    "IRPJ/CSRFB Restituição - Imposto de Renda Pessoa Jurídica/Contribuição Social sobre o Resultado Fiscal (Restituição)",
};

const perdcompSchema = z.object({
  client_id: z.string().min(1, "Cliente é obrigatório"),
  cnpj: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  // Identificação
  numero: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
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
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [searchedClients, setSearchedClients] = useState<any[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Debounced client search effect
  const debouncedClientSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return async (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim()) {
            setIsSearchingClients(true);
            try {
              // Use the clientStore's searchClients method
              const { searchClients } = useClientStore.getState();
              await searchClients(query.trim());

              // Get the searched results from the store
              const { clients } = useClientStore.getState();
              setSearchedClients(clients);
            } catch (error) {
              console.error("Error searching clients:", error);
              setSearchedClients([]);
            } finally {
              setIsSearchingClients(false);
            }
          } else {
            setSearchedClients([]);
            setIsSearchingClients(false);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    debouncedClientSearch(clientSearchQuery);
  }, [clientSearchQuery, debouncedClientSearch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    control,
  } = useForm<PerdCompFormData>({
    resolver: zodResolver(perdcompSchema),
    defaultValues: perdcomp
      ? {
        client_id: "", // Will be set when we find the client by CNPJ
        cnpj: perdcomp.cnpj,
        numero: perdcomp.numero,
        numero_perdcomp: perdcomp.numero_perdcomp,
        processo_protocolo: perdcomp.processo_protocolo?.toString() || "",
        // Convert dates from YYYY-MM-DD to YYYY-MM-DD for date inputs
        data_transmissao: perdcomp.data_transmissao
          ? perdcomp.data_transmissao.split("T")[0]
          : undefined,
        data_vencimento: perdcomp.data_vencimento
          ? perdcomp.data_vencimento.split("T")[0]
          : undefined,
        data_competencia: perdcomp.data_competencia
          ? perdcomp.data_competencia.split("T")[0]
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
        valor_pedido: "",
        valor_compensado: "",
        valor_recebido: "",
        valor_saldo: "",
        valor_selic: "",
        is_active: true,
      },
  });

  // Reset form when perdcomp changes
  useEffect(() => {
    if (perdcomp) {
      reset({
        client_id: "", // Will be set when client is selected
        cnpj: perdcomp.cnpj,
        numero: perdcomp.numero,
        numero_perdcomp: perdcomp.numero_perdcomp,
        processo_protocolo: perdcomp.processo_protocolo?.toString() || "",
        data_transmissao: perdcomp.data_transmissao
          ? perdcomp.data_transmissao.split("T")[0]
          : undefined,
        data_vencimento: perdcomp.data_vencimento
          ? perdcomp.data_vencimento.split("T")[0]
          : undefined,
        data_competencia: perdcomp.data_competencia
          ? perdcomp.data_competencia.split("T")[0]
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

  // Use searched clients if search query exists, otherwise show recent clients
  const displayClients = clientSearchQuery.trim()
    ? searchedClients
    : clients.slice(0, 10); // Show only first 10 clients when no search

  // Handle client selection change
  const handleClientChange = async (clientId: string) => {
    setValue("client_id", clientId);

    // Find client in both regular clients and searched clients
    const client =
      clients.find((c) => c.id === clientId) ||
      searchedClients.find((c) => c.id === clientId);

    if (client) {
      setSelectedClientData(client);
      // Auto-populate CNPJ when client is selected
      if (client?.cnpj) {
        setValue("cnpj", client.cnpj);
      }
    } else {
      try {
        const fetchedClient = await fetchClientById(clientId);
        setSelectedClientData(fetchedClient);
        // Auto-populate CNPJ when client is selected
        if (fetchedClient?.cnpj) {
          setValue("cnpj", fetchedClient.cnpj);
        }
      } catch (error) {
        console.error("Error loading client data:", error);
      }
    }

    setClientSearchOpen(false);
    setClientSearchQuery("");
    setSearchedClients([]);
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
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSearchOpen}
                  className={`w-full justify-between ${errors.client_id ? "border-destructive" : ""
                    }`}
                  disabled={!!clientId && !perdcomp}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-sm">
                      {selectedClientData
                        ? selectedClientData.nome_fantasia ||
                        selectedClientData.razao_social
                        : "Selecione o cliente"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] max-w-[90vw] p-0 z-50 bg-popover border shadow-md">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar por CNPJ, nome fantasia ou razão social..."
                    value={clientSearchQuery}
                    onValueChange={setClientSearchQuery}
                  />
                  <CommandList
                    className="max-h-[300px] overflow-y-auto overscroll-contain"
                    style={{ scrollBehavior: "auto" }}
                  >
                    {isSearchingClients ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">
                          Buscando...
                        </span>
                      </div>
                    ) : (
                      <>
                        {displayClients.length === 0 &&
                          clientSearchQuery.trim() ? (
                          <CommandEmpty>
                            Nenhum cliente encontrado.
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {displayClients.map((client) => {
                              const displayName =
                                client.nome_fantasia ||
                                client.razao_social ||
                                "Cliente sem nome";
                              const searchText = `${client.cnpj} ${client.nome_fantasia || ""
                                } ${client.razao_social || ""}`;

                              return (
                                <CommandItem
                                  key={client.id}
                                  value={searchText}
                                  onSelect={() =>
                                    handleClientChange(client.id.toString())
                                  }
                                  className="cursor-pointer py-3 px-2"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 shrink-0 ${selectedClientData?.id ===
                                        client.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                      }`}
                                  />
                                  <div className="flex flex-col items-start min-w-0 flex-1 gap-1">
                                    <span className="text-sm font-medium leading-tight break-words">
                                      {displayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      CNPJ: {client.cnpj}
                                    </span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
              <Label htmlFor="numero">Número do Documento</Label>
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
              <Controller
                name="numero_perdcomp"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    id="numero_perdcomp"
                    mask="99999.99999.999999.9.9.99-9999"
                    {...field}
                    placeholder="00000.00000.000000.0.0.00-0000"
                  />
                )}
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
              type="date"
              {...register("data_transmissao")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Input
              id="data_vencimento"
              type="date"
              {...register("data_vencimento")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_competencia">Data de Competência</Label>
            <Input
              id="data_competencia"
              type="date"
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
                <Controller
                  name="valor_pedido"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="valor_pedido"
                      placeholder="0,00"
                      className={`pl-10 ${errors.valor_pedido ? "border-destructive" : ""
                        }`}
                      value={formatCurrencyDisplay(field.value || "")}
                      onChange={(e) => {
                        const unformatted = unformatCurrency(e.target.value);
                        field.onChange(unformatted);
                        setValue("valor_pedido", unformatted, { shouldValidate: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
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
                <Controller
                  name="valor_compensado"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="valor_compensado"
                      placeholder="0,00"
                      className="pl-10"
                      value={formatCurrencyDisplay(field.value || "")}
                      onChange={(e) => {
                        const unformatted = unformatCurrency(e.target.value);
                        field.onChange(unformatted);
                        setValue("valor_compensado", unformatted, { shouldValidate: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
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
                <Controller
                  name="valor_recebido"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="valor_recebido"
                      placeholder="0,00"
                      className="pl-10"
                      value={formatCurrencyDisplay(field.value || "")}
                      onChange={(e) => {
                        const unformatted = unformatCurrency(e.target.value);
                        field.onChange(unformatted);
                        setValue("valor_recebido", unformatted, { shouldValidate: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
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
                <Controller
                  name="valor_saldo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="valor_saldo"
                      placeholder="0,00"
                      className="pl-10"
                      value={formatCurrencyDisplay(field.value || "")}
                      onChange={(e) => {
                        const unformatted = unformatCurrency(e.target.value);
                        field.onChange(unformatted);
                        setValue("valor_saldo", unformatted, { shouldValidate: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
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
              <Controller
                name="valor_selic"
                control={control}
                render={({ field }) => (
                  <Input
                    id="valor_selic"
                    placeholder="0,00"
                    className="pl-10"
                    value={formatCurrencyDisplay(field.value || "")}
                    onChange={(e) => {
                      const unformatted = unformatCurrency(e.target.value);
                      field.onChange(unformatted);
                      setValue("valor_selic", unformatted, { shouldValidate: true });
                    }}
                    onBlur={field.onBlur}
                  />
                )}
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
              <SelectContent className="max-h-60">
                {Object.entries(TRIBUTOS_PEDIDO)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([codigo, descricao]) => (
                    <SelectItem key={codigo} value={codigo}>
                      {descricao}
                    </SelectItem>
                  ))}
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
