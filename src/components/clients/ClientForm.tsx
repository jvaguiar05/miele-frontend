import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useClientStore, type Client } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { MaskedInput } from "@/components/ui/input-mask";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { WebsiteInput } from "@/components/ui/website-input";
import { CapitalizedInput } from "@/components/ui/capitalized-input";
import { JsonInput } from "@/components/ui/json-input";

const clientSchema = z.object({
  // Dados principais
  cnpj: z.string().min(14, "CNPJ inválido"),
  razao_social: z.string().min(3, "Razão social é obrigatória"),
  nome_fantasia: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  tipo_empresa: z.string().min(1, "Tipo de empresa é obrigatório"),
  recuperacao_judicial: z.boolean().default(false),

  // Contatos comerciais
  telefone_comercial: z.string().optional(),
  email_comercial: z.string().optional(),
  website: z.string().optional(),

  // Contatos diretos
  telefone_contato: z.string().optional(),
  email_contato: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email inválido",
    }),

  // Dados societários e atividades (merged JSONB fields)
  quadro_societario: z.string().optional(), // JSON string for form input
  atividades: z.string().optional(), // JSON string for form input
  responsavel_financeiro: z.string().optional(),
  contador_responsavel: z.string().optional(),

  // Dados fiscais
  regime_tributacao: z.string().optional(),

  // Documentos
  contrato_social: z.string().optional(),
  ultima_alteracao_contratual: z.string().optional(),
  rg_cpf_socios: z.string().optional(),
  certificado_digital: z.string().optional(),

  // Controles
  autorizado_para_envio: z.boolean().default(false),
  client_status: z.string().optional(),
  is_active: z.boolean().default(true),

  // Endereço
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper functions for formatting
const formatCNPJ = (cnpj: string) => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length <= 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return cnpj;
};

const formatCEP = (cep: string) => {
  const digits = cep.replace(/\D/g, "");
  if (digits.length <= 8) {
    return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cep;
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return "";

  // Apply mask based on length
  if (digits.length <= 2) {
    // Just area code
    return `(${digits}`;
  } else if (digits.length <= 6) {
    // Area code + first part
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    // 8-digit number: (xx) xxxx-xxxx
    const areaCode = digits.slice(0, 2);
    const firstPart = digits.slice(2, 6);
    const secondPart = digits.slice(6);
    return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ""}`;
  } else {
    // 9-digit number: (xx) xxxxx-xxxx
    const areaCode = digits.slice(0, 2);
    const firstPart = digits.slice(2, 7);
    const secondPart = digits.slice(7, 11);
    return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ""}`;
  }
};

const unformatValue = (value: string) => {
  return value.replace(/\D/g, "");
};

// Helper functions to convert between form data and API data
const convertClientToForm = (client: Client): ClientFormData => {
  console.log("Converting client to form:", JSON.stringify(client, null, 2)); // Debug log
  console.log("Client CNPJ:", client.cnpj); // Debug specific field
  console.log("Client telefone_contato:", client.telefone_contato); // Debug specific field
  console.log("Client tipo_empresa:", client.tipo_empresa); // Debug specific field
  console.log("Client address:", client.address); // Debug address object

  const formData: any = {
    // Basic fields
    id: client.id,
    razao_social: client.razao_social || "",
    nome_fantasia: client.nome_fantasia || "",
    cnpj: client.cnpj || "",
    inscricao_estadual: client.inscricao_estadual || "",
    inscricao_municipal: client.inscricao_municipal || "",
    tipo_empresa: client.tipo_empresa || "",
    recuperacao_judicial: client.recuperacao_judicial || false,

    // Contact fields
    telefone_comercial: client.telefone_comercial || "",
    email_comercial: client.email_comercial || "",
    website: client.website || "",
    telefone_contato: client.telefone_contato || "",
    email_contato: client.email_contato || "",

    // Company data
    responsavel_financeiro: client.responsavel_financeiro || "",
    contador_responsavel: client.contador_responsavel || "",
    regime_tributacao: client.regime_tributacao || "",

    // Documents
    contrato_social: client.contrato_social || "",
    // Convert API date format (2023-06-14T21:00:00-03:00) to form input format (2023-06-14)
    ultima_alteracao_contratual: client.ultima_alteracao_contratual
      ? client.ultima_alteracao_contratual.split("T")[0]
      : "",
    rg_cpf_socios: client.rg_cpf_socios || "",
    certificado_digital: client.certificado_digital || "",

    // Control fields
    autorizado_para_envio: client.autorizado_para_envio || false,
    client_status: client.client_status || "pending",
    is_active: client.is_active !== false, // Default to true

    // Handle nested address object
    logradouro: client.address?.logradouro || "",
    numero: client.address?.numero || "",
    complemento: client.address?.complemento || "",
    bairro: client.address?.bairro || "",
    municipio: client.address?.municipio || "",
    uf: client.address?.uf || "",
    cep: client.address?.cep || "",

    // Handle complex JSONB fields - convert to strings for form
    quadro_societario: Array.isArray(client.quadro_societario)
      ? JSON.stringify(client.quadro_societario)
      : typeof client.quadro_societario === "object" && client.quadro_societario
      ? JSON.stringify(client.quadro_societario)
      : client.quadro_societario || "",

    atividades: Array.isArray(client.atividades)
      ? JSON.stringify(client.atividades)
      : typeof client.atividades === "object" && client.atividades
      ? JSON.stringify(client.atividades)
      : client.atividades || "",
  };

  console.log("Converted form data:", JSON.stringify(formData, null, 2)); // Debug log
  console.log("Form CNPJ:", formData.cnpj); // Debug specific field
  console.log("Form telefone_contato:", formData.telefone_contato); // Debug specific field
  console.log("Form tipo_empresa:", formData.tipo_empresa); // Debug specific field
  console.log("Form CEP:", formData.cep); // Debug specific field
  return formData as ClientFormData;
};

const convertFormToClient = (formData: ClientFormData): Partial<Client> => {
  const clientData: any = { ...formData };

  // Convert string fields back to objects/arrays for API
  if (
    clientData.quadro_societario &&
    typeof clientData.quadro_societario === "string"
  ) {
    try {
      clientData.quadro_societario = JSON.parse(clientData.quadro_societario);
    } catch {
      // If not valid JSON, convert to array with nome/cargo structure
      clientData.quadro_societario = clientData.quadro_societario
        .split(",")
        .map((s: string) => ({
          nome: s.trim(),
          cargo: "Não informado",
        }))
        .filter((item: any) => item.nome);
    }
  }

  if (clientData.atividades && typeof clientData.atividades === "string") {
    try {
      clientData.atividades = JSON.parse(clientData.atividades);
    } catch {
      // If not valid JSON, convert to array with cnae/descricao structure
      clientData.atividades = clientData.atividades
        .split(",")
        .map((s: string) => ({
          cnae: s.trim(),
          descricao: "Descrição não informada",
        }))
        .filter((item: any) => item.cnae);
    }
  }

  // Remove empty fields from the request body
  const cleanedData: any = {};

  Object.keys(clientData).forEach((key) => {
    const value = clientData[key];

    // Keep the field if it has a meaningful value
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0) &&
      !(typeof value === "object" && Object.keys(value).length === 0)
    ) {
      cleanedData[key] = value;
    }
  });

  return cleanedData;
};

export default function ClientForm({
  client,
  onSuccess,
  onCancel,
}: ClientFormProps) {
  const { createClient, updateClient } = useClientStore();
  const { toast } = useToast();
  const [tipoEmpresa, setTipoEmpresa] = useState<string>("");
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    getValues,
    reset,
    control,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      recuperacao_judicial: false,
      autorizado_para_envio: false,
      is_active: true,
      client_status: "pending",
    },
  });

  // Function to search CNPJ data
  const searchCNPJData = async () => {
    const cnpjValue = getValues("cnpj");
    if (!cnpjValue) {
      toast({
        title: "CNPJ obrigatório",
        description: "Digite um CNPJ para buscar os dados.",
        variant: "destructive",
      });
      return;
    }

    // Clean CNPJ (remove formatting)
    const cleanCNPJ = cnpjValue.replace(/\D/g, "");
    if (cleanCNPJ.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "O CNPJ deve ter 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingCNPJ(true);
    try {
      // Use allorigins.win as it's working reliably
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const apiUrl = `https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`;
      const requestUrl = `${proxyUrl}${encodeURIComponent(apiUrl)}`;

      console.log(`Fetching CNPJ data from: ${requestUrl}`);

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ CNPJ data received:", data);

      if (data.status === "ERROR") {
        toast({
          title: "CNPJ não encontrado",
          description:
            data.message || "Não foi possível encontrar dados para este CNPJ.",
          variant: "destructive",
        });
        return;
      }

      // Map API response to form fields
      if (data.nome) setValue("razao_social", data.nome);
      if (data.fantasia) setValue("nome_fantasia", data.fantasia);
      if (data.email) setValue("email_comercial", data.email);
      if (data.telefone) {
        // Split phone numbers: first = contact, second = commercial
        const phones = data.telefone.split("/").map((phone) => phone.trim());
        if (phones.length >= 1) {
          // Apply phone formatting for new clients only
          const formattedPhone = !client ? formatPhone(phones[0]) : phones[0];
          setValue("telefone_contato", formattedPhone);
        }
        if (phones.length >= 2) {
          // Apply phone formatting for new clients only
          const formattedPhone = !client ? formatPhone(phones[1]) : phones[1];
          setValue("telefone_comercial", formattedPhone);
        }
      }

      // Map address fields
      if (data.logradouro) setValue("logradouro", data.logradouro);
      if (data.numero) setValue("numero", data.numero);
      if (data.complemento) setValue("complemento", data.complemento);
      if (data.bairro) setValue("bairro", data.bairro);
      if (data.municipio) setValue("municipio", data.municipio);
      if (data.uf) setValue("uf", data.uf);
      if (data.cep) {
        // Apply CEP formatting for new clients only
        const cleanCEP = data.cep.replace(/\D/g, "");
        const formattedCEP = !client ? formatCEP(cleanCEP) : cleanCEP;
        setValue("cep", formattedCEP);
      }

      // Map company type based on porte
      if (data.porte) {
        let tipoEmpresaValue = "";
        switch (data.porte.toUpperCase()) {
          case "MICRO EMPRESA":
            tipoEmpresaValue = "ME";
            break;
          case "EMPRESA DE PEQUENO PORTE":
            tipoEmpresaValue = "EPP";
            break;
          case "DEMAIS":
            tipoEmpresaValue = "LTDA";
            break;
          default:
            tipoEmpresaValue = "LTDA";
        }
        setValue("tipo_empresa", tipoEmpresaValue);
        setTipoEmpresa(tipoEmpresaValue);
      }

      // Map CNAEs and Atividades to new merged structure
      if (data.atividade_principal || data.atividades_secundarias) {
        const atividades = [];

        // Add principal activity
        if (data.atividade_principal && data.atividade_principal.length > 0) {
          atividades.push({
            cnae: data.atividade_principal[0].code,
            descricao: data.atividade_principal[0].text,
          });
        }

        // Add secondary activities
        if (
          data.atividades_secundarias &&
          data.atividades_secundarias.length > 0
        ) {
          const secundarias = data.atividades_secundarias
            .slice(0, 4) // Limit to first 4 secondary activities
            .map((ativ) => ({
              cnae: ativ.code,
              descricao: ativ.text,
            }));
          atividades.push(...secundarias);
        }

        setValue("atividades", JSON.stringify(atividades));
      }

      // Map QSA to Quadro Societário with new structure
      if (data.qsa && data.qsa.length > 0) {
        const quadroSocietario = data.qsa.map((socio) => ({
          nome: socio.nome,
          cargo: socio.qual,
        }));
        setValue("quadro_societario", JSON.stringify(quadroSocietario));
      }

      // Map ultima_atualizacao to Data da Última Alteração Contratual
      if (data.ultima_atualizacao) {
        // Convert ISO date to YYYY-MM-DD format for date input
        const date = new Date(data.ultima_atualizacao);
        const formattedDate = date.toISOString().split("T")[0];
        setValue("ultima_alteracao_contratual", formattedDate);
      }

      toast({
        title: "Dados encontrados!",
        description:
          "As informações do CNPJ foram preenchidas automaticamente.",
      });
    } catch (error) {
      console.error("Error fetching CNPJ data:", error);
      toast({
        title: "Erro na consulta",
        description:
          "Não foi possível consultar os dados do CNPJ. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  // Populate form when client data is provided for editing
  useEffect(() => {
    if (client) {
      const formData = convertClientToForm(client);
      reset(formData);
      setTipoEmpresa(formData.tipo_empresa || "");
    } else {
      // Reset to default values for new client
      reset({
        recuperacao_judicial: false,
        autorizado_para_envio: false,
        is_active: true,
        client_status: "pending",
      });
      setTipoEmpresa("");
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    console.log("Form submitted with data:", data);

    try {
      const clientData = convertFormToClient(data);

      if (client?.id) {
        // Update existing client
        await updateClient(client.id, clientData);
        toast({
          title: "Cliente atualizado",
          description: "O cliente foi atualizado com sucesso.",
        });
      } else {
        // Create new client
        await createClient(clientData);
        toast({
          title: "Cliente criado",
          description: "O cliente foi cadastrado com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast({
        title: "Erro",
        description: error?.message || "Ocorreu um erro ao salvar o cliente.",
        variant: "destructive",
      });
    }
  };
  const onInvalid = (errors: any) => {
    console.log("Form validation errors:", errors);
    toast({
      title: "Erro de validação",
      description:
        "Por favor, verifique os campos obrigatórios marcados em vermelho.",
      variant: "destructive",
    });
  };

  // Log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
    }
  }, [errors]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <div className="flex gap-2">
                {client ? (
                  <Input
                    id="cnpj"
                    {...register("cnpj")}
                    placeholder="00.000.000/0000-00"
                    className={errors.cnpj ? "border-destructive" : ""}
                    readOnly={!!client}
                  />
                ) : (
                  <Controller
                    name="cnpj"
                    control={control}
                    render={({ field }) => (
                      <MaskedInput
                        id="cnpj"
                        mask="99.999.999/9999-99"
                        {...field}
                        placeholder="00.000.000/0000-00"
                        className={errors.cnpj ? "border-destructive" : ""}
                      />
                    )}
                  />
                )}
                {!client && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={searchCNPJData}
                    disabled={isSearchingCNPJ}
                    className="shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.cnpj && (
                <p className="text-sm text-destructive">
                  {errors.cnpj.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_empresa">Tipo de Empresa *</Label>
              <Select
                onValueChange={(value) => {
                  setValue("tipo_empresa", value);
                  setTipoEmpresa(value);
                }}
                value={tipoEmpresa}
              >
                <SelectTrigger
                  className={errors.tipo_empresa ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                  <SelectItem value="EPP">EPP</SelectItem>
                  <SelectItem value="LTDA">LTDA</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_empresa && (
                <p className="text-sm text-destructive">
                  {errors.tipo_empresa.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social *</Label>
            {client ? (
              <Input
                id="razao_social"
                {...register("razao_social")}
                className={errors.razao_social ? "border-destructive" : ""}
              />
            ) : (
              <Controller
                name="razao_social"
                control={control}
                render={({ field }) => (
                  <CapitalizedInput
                    id="razao_social"
                    {...field}
                    className={errors.razao_social ? "border-destructive" : ""}
                    capitalizationType="upper"
                    placeholder="Digite a razão social da empresa"
                  />
                )}
              />
            )}
            {errors.razao_social && (
              <p className="text-sm text-destructive">
                {errors.razao_social.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            {client ? (
              <Input id="nome_fantasia" {...register("nome_fantasia")} />
            ) : (
              <Controller
                name="nome_fantasia"
                control={control}
                render={({ field }) => (
                  <CapitalizedInput
                    id="nome_fantasia"
                    {...field}
                    capitalizationType="upper"
                    placeholder="Digite o nome fantasia"
                  />
                )}
              />
            )}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                {...register("inscricao_estadual")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                {...register("inscricao_municipal")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recuperacao_judicial"
                checked={watch("recuperacao_judicial")}
                onCheckedChange={(checked) =>
                  setValue("recuperacao_judicial", checked)
                }
              />
              <Label htmlFor="recuperacao_judicial">
                Em recuperação judicial
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autorizado_para_envio"
                checked={watch("autorizado_para_envio")}
                onCheckedChange={(checked) =>
                  setValue("autorizado_para_envio", checked)
                }
              />
              <Label htmlFor="autorizado_para_envio">
                Autorizado para envio
              </Label>
            </div>
          </div>
        </TabsContent>

        {/* Aba Contato */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_contato">Email de Contato</Label>
              {client ? (
                <Input
                  id="email_contato"
                  type="email"
                  {...register("email_contato")}
                  className={errors.email_contato ? "border-destructive" : ""}
                />
              ) : (
                <Controller
                  name="email_contato"
                  control={control}
                  render={({ field }) => (
                    <EmailInput
                      id="email_contato"
                      {...field}
                      placeholder="contato@empresa.com.br"
                      className={
                        errors.email_contato ? "border-destructive" : ""
                      }
                    />
                  )}
                />
              )}
              {errors.email_contato && (
                <p className="text-sm text-destructive">
                  {errors.email_contato.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone_contato">Telefone de Contato</Label>
              {client ? (
                <Input
                  id="telefone_contato"
                  {...register("telefone_contato")}
                  placeholder="(00) 00000-0000"
                  className={
                    errors.telefone_contato ? "border-destructive" : ""
                  }
                />
              ) : (
                <Controller
                  name="telefone_contato"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="telefone_contato"
                      {...field}
                      className={
                        errors.telefone_contato ? "border-destructive" : ""
                      }
                    />
                  )}
                />
              )}
              {errors.telefone_contato && (
                <p className="text-sm text-destructive">
                  {errors.telefone_contato.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_comercial">Email Comercial</Label>
              {client ? (
                <Input
                  id="email_comercial"
                  type="email"
                  {...register("email_comercial")}
                />
              ) : (
                <Controller
                  name="email_comercial"
                  control={control}
                  render={({ field }) => (
                    <EmailInput
                      id="email_comercial"
                      {...field}
                      placeholder="comercial@empresa.com.br"
                    />
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
              {client ? (
                <Input
                  id="telefone_comercial"
                  {...register("telefone_comercial")}
                  placeholder="(00) 0000-0000"
                />
              ) : (
                <Controller
                  name="telefone_comercial"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput id="telefone_comercial" {...field} />
                  )}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            {client ? (
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://www.empresa.com.br"
              />
            ) : (
              <Controller
                name="website"
                control={control}
                render={({ field }) => <WebsiteInput id="website" {...field} />}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_financeiro">
                Responsável Financeiro
              </Label>
              <Input
                id="responsavel_financeiro"
                {...register("responsavel_financeiro")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contador_responsavel">Contador Responsável</Label>
              <Input
                id="contador_responsavel"
                {...register("contador_responsavel")}
              />
            </div>
          </div>
        </TabsContent>

        {/* Aba Fiscal */}
        <TabsContent value="fiscal" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regime_tributacao">Regime Tributário</Label>
              <Select
                onValueChange={(value) => setValue("regime_tributacao", value)}
                value={watch("regime_tributacao") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lucro_presumido">
                    Lucro Presumido
                  </SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="atividades">Atividades da Empresa</Label>
            <Controller
              name="atividades"
              control={control}
              render={({ field }) => (
                <JsonInput
                  id="atividades"
                  {...field}
                  jsonType="atividades"
                  rows={6}
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              Formato: Array de objetos com CNAE e descrição. Será preenchido
              automaticamente ao buscar dados do CNPJ.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quadro_societario">Quadro Societário</Label>
            <Controller
              name="quadro_societario"
              control={control}
              render={({ field }) => (
                <JsonInput
                  id="quadro_societario"
                  {...field}
                  jsonType="quadro_societario"
                  rows={6}
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              Formato: Array de objetos com nome e cargo. Será preenchido
              automaticamente ao buscar dados do CNPJ.
            </p>
          </div>
        </TabsContent>

        {/* Aba Documentos */}
        <TabsContent value="docs" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contrato_social">Contrato Social</Label>
            <Textarea
              id="contrato_social"
              {...register("contrato_social")}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ultima_alteracao_contratual">
              Data da Última Alteração Contratual
            </Label>
            <Input
              id="ultima_alteracao_contratual"
              type="date"
              {...register("ultima_alteracao_contratual")}
              className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rg_cpf_socios">RG/CPF dos Sócios</Label>
            <Textarea
              id="rg_cpf_socios"
              {...register("rg_cpf_socios")}
              placeholder="Liste os documentos dos sócios"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificado_digital">Certificado Digital</Label>
            <Textarea
              id="certificado_digital"
              {...register("certificado_digital")}
              placeholder="Informações sobre certificados digitais"
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Aba Endereço */}
        <TabsContent value="address" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            {client ? (
              <Input id="cep" {...register("cep")} placeholder="00000-000" />
            ) : (
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    id="cep"
                    mask="99999-999"
                    {...field}
                    placeholder="00000-000"
                  />
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              {client ? (
                <Input id="logradouro" {...register("logradouro")} />
              ) : (
                <Controller
                  name="logradouro"
                  control={control}
                  render={({ field }) => (
                    <CapitalizedInput
                      id="logradouro"
                      {...field}
                      capitalizationType="title"
                      placeholder="Rua, Avenida, Travessa..."
                    />
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...register("numero")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            {client ? (
              <Input id="complemento" {...register("complemento")} />
            ) : (
              <Controller
                name="complemento"
                control={control}
                render={({ field }) => (
                  <CapitalizedInput
                    id="complemento"
                    {...field}
                    capitalizationType="title"
                    placeholder="Apartamento, Sala, Andar..."
                  />
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              {client ? (
                <Input id="bairro" {...register("bairro")} />
              ) : (
                <Controller
                  name="bairro"
                  control={control}
                  render={({ field }) => (
                    <CapitalizedInput
                      id="bairro"
                      {...field}
                      capitalizationType="title"
                      placeholder="Digite o bairro"
                    />
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              {client ? (
                <Input id="municipio" {...register("municipio")} />
              ) : (
                <Controller
                  name="municipio"
                  control={control}
                  render={({ field }) => (
                    <CapitalizedInput
                      id="municipio"
                      {...field}
                      capitalizationType="title"
                      placeholder="Digite a cidade"
                    />
                  )}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Select
              onValueChange={(value) => setValue("uf", value)}
              value={watch("uf") || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="AL">AL</SelectItem>
                <SelectItem value="AP">AP</SelectItem>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="BA">BA</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
                <SelectItem value="DF">DF</SelectItem>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="GO">GO</SelectItem>
                <SelectItem value="MA">MA</SelectItem>
                <SelectItem value="MT">MT</SelectItem>
                <SelectItem value="MS">MS</SelectItem>
                <SelectItem value="MG">MG</SelectItem>
                <SelectItem value="PA">PA</SelectItem>
                <SelectItem value="PB">PB</SelectItem>
                <SelectItem value="PR">PR</SelectItem>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="PI">PI</SelectItem>
                <SelectItem value="RJ">RJ</SelectItem>
                <SelectItem value="RN">RN</SelectItem>
                <SelectItem value="RS">RS</SelectItem>
                <SelectItem value="RO">RO</SelectItem>
                <SelectItem value="RR">RR</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
                <SelectItem value="SE">SE</SelectItem>
                <SelectItem value="TO">TO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : client?.id ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
