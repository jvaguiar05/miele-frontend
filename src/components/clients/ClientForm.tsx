import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
import { MaskedInput } from "@/components/ui/input-mask";

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

  // Dados societários
  quadro_societario: z.string().optional(),
  cargos: z.string().optional(),
  responsavel_financeiro: z.string().optional(),
  contador_responsavel: z.string().optional(),

  // Dados fiscais
  cnaes: z.string().optional(),
  regime_tributacao: z.string().optional(),

  // Documentos
  contrato_social: z.string().optional(),
  ultima_alteracao_contratual: z.string().optional(),
  rg_cpf_socios: z.string().optional(),
  certificado_digital: z.string().optional(),

  // Controles
  autorizado_para_envio: z.boolean().default(false),
  atividades: z.string().optional(),
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

    // Handle complex object fields - convert to strings for form
    quadro_societario: Array.isArray(client.quadro_societario)
      ? JSON.stringify(client.quadro_societario)
      : typeof client.quadro_societario === "object" && client.quadro_societario
      ? JSON.stringify(client.quadro_societario)
      : client.quadro_societario || "",

    cargos:
      typeof client.cargos === "object" && client.cargos
        ? JSON.stringify(client.cargos)
        : client.cargos || "",

    atividades:
      typeof client.atividades === "object" && client.atividades
        ? JSON.stringify(client.atividades)
        : client.atividades || "",

    cnaes: Array.isArray(client.cnaes)
      ? client.cnaes.join(", ")
      : client.cnaes || "",
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
      // If not valid JSON, convert to array
      clientData.quadro_societario = clientData.quadro_societario
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  }

  if (clientData.cargos && typeof clientData.cargos === "string") {
    try {
      clientData.cargos = JSON.parse(clientData.cargos);
    } catch {
      clientData.cargos = { principal: clientData.cargos };
    }
  }

  if (clientData.atividades && typeof clientData.atividades === "string") {
    try {
      clientData.atividades = JSON.parse(clientData.atividades);
    } catch {
      clientData.atividades = { principal: clientData.atividades };
    }
  }

  if (clientData.cnaes && typeof clientData.cnaes === "string") {
    clientData.cnaes = clientData.cnaes
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  // Handle address fields - structure them properly for the API
  if (
    clientData.logradouro ||
    clientData.numero ||
    clientData.complemento ||
    clientData.bairro ||
    clientData.municipio ||
    clientData.uf ||
    clientData.cep
  ) {
    clientData.address = {
      logradouro: clientData.logradouro || null,
      numero: clientData.numero || null,
      complemento: clientData.complemento || null,
      bairro: clientData.bairro || null,
      municipio: clientData.municipio || null,
      uf: clientData.uf || null,
      cep: clientData.cep || null,
    };

    // Remove individual address fields since they're now in the address object
    delete clientData.logradouro;
    delete clientData.numero;
    delete clientData.complemento;
    delete clientData.bairro;
    delete clientData.municipio;
    delete clientData.uf;
    delete clientData.cep;
  }

  return clientData;
};

export default function ClientForm({
  client,
  onSuccess,
  onCancel,
}: ClientFormProps) {
  const { createClient, updateClient } = useClientStore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      recuperacao_judicial: false,
      autorizado_para_envio: false,
      is_active: true,
      client_status: "pending",
    },
  });

  // Populate form when client data is provided for editing
  useEffect(() => {
    if (client) {
      const formData = convertClientToForm(client);
      reset(formData);
    } else {
      // Reset to default values for new client
      reset({
        recuperacao_judicial: false,
        autorizado_para_envio: false,
        is_active: true,
        client_status: "pending",
      });
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
              <MaskedInput
                id="cnpj"
                mask="99.999.999/9999-99"
                {...register("cnpj")}
                placeholder="00.000.000/0000-00"
                className={errors.cnpj ? "border-destructive" : ""}
              />
              {errors.cnpj && (
                <p className="text-sm text-destructive">
                  {errors.cnpj.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_empresa">Tipo de Empresa *</Label>
              <Select
                onValueChange={(value) => setValue("tipo_empresa", value)}
                defaultValue={watch("tipo_empresa")}
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
            <Input
              id="razao_social"
              {...register("razao_social")}
              className={errors.razao_social ? "border-destructive" : ""}
            />
            {errors.razao_social && (
              <p className="text-sm text-destructive">
                {errors.razao_social.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input id="nome_fantasia" {...register("nome_fantasia")} />
          </div>

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
              <Label htmlFor="email_contato">Email de Contato *</Label>
              <Input
                id="email_contato"
                type="email"
                {...register("email_contato")}
                className={errors.email_contato ? "border-destructive" : ""}
              />
              {errors.email_contato && (
                <p className="text-sm text-destructive">
                  {errors.email_contato.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone_contato">Telefone de Contato *</Label>
              <MaskedInput
                id="telefone_contato"
                mask="(99) 99999-9999"
                {...register("telefone_contato")}
                placeholder="(00) 00000-0000"
                className={errors.telefone_contato ? "border-destructive" : ""}
              />
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
              <Input
                id="email_comercial"
                type="email"
                {...register("email_comercial")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
              <MaskedInput
                id="telefone_comercial"
                mask="(99) 9999-9999"
                {...register("telefone_comercial")}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
              placeholder="https://"
            />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnaes">CNAEs (separe por vírgula)</Label>
              <Textarea
                id="cnaes"
                {...register("cnaes")}
                placeholder="Ex: 6201-5/00, 6202-3/00"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime_tributacao">Regime Tributário</Label>
              <Select
                onValueChange={(value) => setValue("regime_tributacao", value)}
                defaultValue={watch("regime_tributacao")}
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
            <Label htmlFor="quadro_societario">Quadro Societário (JSON)</Label>
            <Textarea
              id="quadro_societario"
              {...register("quadro_societario")}
              placeholder='Ex: [{"nome": "João Silva", "cpf": "000.000.000-00", "participacao": "50%"}]'
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargos">Cargos e Responsabilidades (JSON)</Label>
            <Textarea
              id="cargos"
              {...register("cargos")}
              placeholder='Ex: {"diretor": "João Silva", "gerente": "Maria Santos"}'
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="atividades">Atividades da Empresa (JSON)</Label>
            <Textarea
              id="atividades"
              {...register("atividades")}
              placeholder='Ex: {"principal": "Desenvolvimento de software", "secundarias": ["Consultoria", "Treinamento"]}'
              rows={4}
            />
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
            <MaskedInput
              id="cep"
              mask="99999-999"
              {...register("cep")}
              placeholder="00000-000"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" {...register("logradouro")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...register("numero")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" {...register("complemento")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...register("bairro")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              <Input id="municipio" {...register("municipio")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Select
              onValueChange={(value) => setValue("uf", value)}
              defaultValue={watch("uf")}
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
