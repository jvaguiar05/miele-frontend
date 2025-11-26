import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientStore, type Client } from "@/stores/clientStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import PerdCompDetailModal from "@/components/perdcomps/PerdCompDetailModal";
import FileManager from "./FileManager";
import AddAnnotationForm from "./AddAnnotationForm";

interface ClientDetailProps {
  clientId: string;
  client?: Client; // Use the Client type from the store
  onBack: () => void;
  onEdit: () => void; // Simplified - no client parameter
  onAddPerdComp: () => void;
}

export default function ClientDetail({
  clientId,
  client,
  onBack,
  onEdit,
  onAddPerdComp,
}: ClientDetailProps) {
  const navigate = useNavigate();
  const { selectedClient, fetchClientById, deleteAnnotation } =
    useClientStore();
  const [showAddAnnotationForm, setShowAddAnnotationForm] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerdComp, setSelectedPerdComp] = useState(null);
  const [isPerdCompModalOpen, setIsPerdCompModalOpen] = useState(false);

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (confirm("Tem certeza que deseja excluir esta anotação?")) {
      try {
        await deleteAnnotation(annotationId);
        fetchClientById(clientId); // Refresh to show updated annotations
      } catch (error) {
        console.error("Error deleting annotation:", error);
      }
    }
  };

  const handleEditAnnotation = (annotation: any) => {
    setEditingAnnotation(annotation);
    setShowAddAnnotationForm(true);
  };

  const handleFormClose = () => {
    setShowAddAnnotationForm(false);
    setEditingAnnotation(null);
  };

  // Use provided client or selected client from store
  // After fetch completes, always prefer selectedClient as it has complete data
  const displayClient = loading
    ? client || selectedClient
    : selectedClient || client;

  useEffect(() => {
    const loadData = async () => {
      // Always fetch complete data to ensure we have all information
      setLoading(true);
      try {
        const fetchedClient = await fetchClientById(clientId);
        console.log("Client fetched successfully:", fetchedClient); // Debug log
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId, fetchClientById]);

  if (loading || !displayClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Defensive check for required fields
  if (!displayClient.cnpj || !displayClient.razao_social) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Dados do cliente incompletos
        </div>
      </div>
    );
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return "N/A";
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  };

  const handlePerdCompClick = (perdcomp: any) => {
    setSelectedPerdComp(perdcomp);
    setIsPerdCompModalOpen(true);
  };

  const handleViewFullPerdComp = (perdcompId: string) => {
    setIsPerdCompModalOpen(false);
    navigate(`/perdcomps/${perdcompId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{displayClient.razao_social}</h2>
        </div>
        <Button
          onClick={() => {
            console.log("Edit button clicked - opening empty form"); // Debug log
            onEdit();
            onBack(); // Close the detail modal after starting edit
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="perdcomps">PER/DCOMPs</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Empresariais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-mono">{formatCNPJ(displayClient.cnpj)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p>{displayClient.nome_fantasia || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tipo de Empresa
                  </p>
                  <Badge variant="outline">{displayClient.tipo_empresa}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Status do Cliente
                  </p>
                  <Badge
                    variant={
                      displayClient.client_status === "pending"
                        ? "outline"
                        : displayClient.client_status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {displayClient.client_status || "Não definido"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Inscrição Estadual
                  </p>
                  <p>{displayClient.inscricao_estadual || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Inscrição Municipal
                  </p>
                  <p>{displayClient.inscricao_municipal || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Regime Tributário
                  </p>
                  <p>{displayClient.regime_tributacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Recuperação Judicial
                  </p>
                  <Badge
                    variant={
                      displayClient.recuperacao_judicial
                        ? "destructive"
                        : "default"
                    }
                  >
                    {displayClient.recuperacao_judicial ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Autorizado para Envio
                  </p>
                  <Badge
                    variant={
                      displayClient.autorizado_para_envio
                        ? "default"
                        : "outline"
                    }
                  >
                    {displayClient.autorizado_para_envio ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>

              {displayClient.atividades && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Atividades
                    </p>
                    <div className="text-sm space-y-2">
                      {Array.isArray(displayClient.atividades) ? (
                        displayClient.atividades.map((ativ, index) => {
                          // Handle different object formats
                          if (typeof ativ === "object" && ativ !== null) {
                            // Use type assertion for flexible property access
                            const ativObj = ativ as any;
                            // Try to extract CNAE and description from various possible formats
                            const cnae =
                              ativObj.cnae ||
                              ativObj.code ||
                              ativObj.codigo ||
                              `Item ${index + 1}`;
                            const descricao =
                              ativObj.descricao ||
                              ativObj.description ||
                              ativObj.text ||
                              ativObj.atividade ||
                              "Descrição não disponível";

                            return (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{cnae}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  - {descricao}
                                </span>
                              </div>
                            );
                          }
                          // Handle string format
                          return (
                            <div key={index} className="text-sm">
                              {String(ativ)}
                            </div>
                          );
                        })
                      ) : typeof displayClient.atividades === "object" ? (
                        <>
                          {/* Legacy format support */}
                          {(displayClient.atividades as any).principal && (
                            <div>
                              <strong>Principal:</strong>{" "}
                              {(displayClient.atividades as any).principal.text}
                            </div>
                          )}
                          {(displayClient.atividades as any).secundarias &&
                            Array.isArray(
                              (displayClient.atividades as any).secundarias
                            ) && (
                              <div>
                                <strong>Secundárias:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1">
                                  {(
                                    displayClient.atividades as any
                                  ).secundarias.map(
                                    (atividade: any, index: number) => (
                                      <li key={index}>{atividade.text}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          {/* Fallback for other object formats */}
                          {!(displayClient.atividades as any).principal &&
                            !(displayClient.atividades as any).secundarias &&
                            Object.entries(displayClient.atividades).map(
                              ([key, value]) => (
                                <p key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </p>
                              )
                            )}
                        </>
                      ) : (
                        <p>{String(displayClient.atividades)}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  {displayClient.address?.logradouro || ""}{" "}
                  {displayClient.address?.numero || ""}
                </p>
                {displayClient.address?.complemento && (
                  <p>{displayClient.address.complemento}</p>
                )}
                <p>
                  {displayClient.address?.bairro || ""} -{" "}
                  {displayClient.address?.municipio || ""}/
                  {displayClient.address?.uf || ""}
                </p>
                {displayClient.address?.cep && (
                  <p>CEP: {displayClient.address.cep}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Email de Contato
                  </p>
                  <p>{displayClient.email_contato || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Telefone de Contato
                  </p>
                  <p>{displayClient.telefone_contato || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Email Comercial
                  </p>
                  <p>{displayClient.email_comercial || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Telefone Comercial
                  </p>
                  <p>{displayClient.telefone_comercial || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {displayClient.website ? (
                    <a
                      href={displayClient.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {displayClient.website}
                    </a>
                  ) : (
                    <p>-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Responsável Financeiro
                  </p>
                  <p>{displayClient.responsavel_financeiro || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quadro Societário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(displayClient.quadro_societario) ? (
                  <div className="space-y-1">
                    {displayClient.quadro_societario.map(
                      (socio: any, index: number) => (
                        <p key={index} className="text-sm">
                          <strong>
                            {socio?.nome || `Sócio ${index + 1}`}:
                          </strong>{" "}
                          {socio?.cargo || "N/A"}
                        </p>
                      )
                    )}
                  </div>
                ) : (
                  <p>{displayClient.quadro_societario || "Não informado"}</p>
                )}
                {displayClient.contador_responsavel && (
                  <p className="text-sm text-muted-foreground">
                    Contador: {displayClient.contador_responsavel}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {showAddAnnotationForm && (
            <AddAnnotationForm
              clientId={clientId}
              entityName={displayClient?.razao_social || "Cliente"}
              editingAnnotation={editingAnnotation}
              onAnnotationAdded={() => {
                handleFormClose();
                fetchClientById(clientId);
              }}
              onCancel={handleFormClose}
            />
          )}

          {!showAddAnnotationForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Anotações e Observações</CardTitle>
                <Button
                  onClick={() => {
                    setEditingAnnotation(null);
                    setShowAddAnnotationForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Anotação
                </Button>
              </CardHeader>
              <CardContent>
                {displayClient?.annotations &&
                displayClient.annotations.length > 0 ? (
                  <div className="space-y-3">
                    {displayClient.annotations.map((annotation) => {
                      // Simplified priority logic
                      const priority =
                        annotation.content.priority?.toLowerCase();
                      const priorityVariant =
                        priority === "high" || priority === "alta"
                          ? "destructive"
                          : priority === "medium" ||
                            priority === "media" ||
                            priority === "média"
                          ? "default"
                          : "secondary";

                      const priorityLabel =
                        priority === "alta" || priority === "high"
                          ? "Alta"
                          : priority === "media" ||
                            priority === "medium" ||
                            priority === "média"
                          ? "Média"
                          : priority === "baixa" || priority === "low"
                          ? "Baixa"
                          : annotation.content.priority;

                      return (
                        <div
                          key={annotation.id}
                          className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {annotation.user_name}
                                </p>
                                {annotation.content.priority && (
                                  <Badge
                                    variant={priorityVariant}
                                    className={
                                      priorityVariant === "default"
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : ""
                                    }
                                  >
                                    {priorityLabel}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(annotation.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAnnotation(annotation)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAnnotation(annotation.id)
                                }
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm leading-relaxed">
                              {annotation.content.text}
                            </p>

                            {annotation.content.tags &&
                              annotation.content.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {annotation.content.tags.map((tag, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                            {annotation.content.metadata?.category && (
                              <p className="text-xs text-muted-foreground">
                                Categoria:{" "}
                                {annotation.content.metadata.category}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma anotação ou observação foi adicionada para este
                    cliente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <FileManager clientId={clientId} />
        </TabsContent>

        <TabsContent value="perdcomps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">PER/DCOMPs do Cliente</h3>
            <Button onClick={onAddPerdComp}>
              <Plus className="mr-2 h-4 w-4" />
              Novo PER/DCOMP
            </Button>
          </div>

          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum PER/DCOMP encontrado para este cliente</p>
              <Button className="mt-4" onClick={onAddPerdComp}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro PER/DCOMP
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
