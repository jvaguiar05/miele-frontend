import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerdCompStore } from "@/stores/perdcompStore";
import { useClientStore } from "@/stores/clientStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import PerdCompFileManager from "./PerdCompFileManager";
import AddPerdCompAnnotationForm from "./AddPerdCompAnnotationForm";

interface PerdCompDetailProps {
  perdcompId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function PerdCompDetail({
  perdcompId,
  onBack,
  onEdit,
}: PerdCompDetailProps) {
  const { selectedPerdComp, fetchPerdCompById, deleteAnnotation } =
    usePerdCompStore();
  const { fetchClientById, clients, fetchClients } = useClientStore();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAnnotationForm, setShowAddAnnotationForm] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null);

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (confirm("Tem certeza que deseja excluir esta anotação?")) {
      try {
        await deleteAnnotation(annotationId);
        fetchPerdCompById(perdcompId); // Refresh to show updated annotations
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const perdcomp = await fetchPerdCompById(perdcompId);
        // Find client by CNPJ if available
        if (perdcomp?.cnpj && clients.length > 0) {
          const clientData = clients.find((c) => c.cnpj === perdcomp.cnpj);
          if (clientData) {
            setClient(clientData);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [perdcompId, fetchPerdCompById, clients]);

  // Load clients if not already loaded
  useEffect(() => {
    if (clients.length === 0) {
      fetchClients();
    }
  }, [clients, fetchClients]);

  if (loading || !selectedPerdComp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "default";
      case "Recusado":
        return "destructive";
      case "Em Análise":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedPerdComp.numero}</h2>
            <p className="text-muted-foreground">
              {client && `${client.razao_social} - CNPJ: ${client.cnpj}`}
            </p>
          </div>
        </div>
        <Button onClick={() => onEdit()}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informações Gerais</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do PER/DCOMP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-semibold">{selectedPerdComp.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedPerdComp.status)}>
                    {selectedPerdComp.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tributo</p>
                  <Badge variant="outline">
                    {selectedPerdComp.tributo_pedido}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Competência</p>
                  <p>{selectedPerdComp.competencia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data de Transmissão
                  </p>
                  <p>
                    {selectedPerdComp.data_transmissao
                      ? formatDate(selectedPerdComp.data_transmissao)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p>
                    {selectedPerdComp.created_at
                      ? formatDate(selectedPerdComp.created_at)
                      : "-"}
                  </p>
                </div>
              </div>

              {client && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Informações do Cliente
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Razão Social
                        </p>
                        <p className="font-medium">{client.razao_social}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ</p>
                        <p className="font-mono">{client.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{client.email_contato || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Telefone
                        </p>
                        <p>{client.telefone_contato || "-"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedPerdComp.numero_perdcomp && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Número PER/DCOMP
                    </p>
                    <p className="font-mono">
                      {selectedPerdComp.numero_perdcomp}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="values" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valores Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Valor do Pedido
                  </span>
                  <span className="text-xl font-semibold">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_pedido || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Valor Compensado
                  </span>
                  <span className="text-xl font-semibold text-blue-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_compensado || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Valor Recebido
                  </span>
                  <span className="text-xl font-semibold text-success">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_recebido || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Valor SELIC
                  </span>
                  <span className="text-xl font-semibold text-purple-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_selic || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className="text-xl font-semibold text-orange-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_saldo || "0")
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {showAddAnnotationForm && (
            <AddPerdCompAnnotationForm
              perdcompId={selectedPerdComp.id.toString()}
              entityName={selectedPerdComp.numero || "PER/DCOMP"}
              editingAnnotation={editingAnnotation}
              onAnnotationAdded={() => {
                handleFormClose();
                fetchPerdCompById(perdcompId);
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
                {selectedPerdComp?.annotations &&
                selectedPerdComp.annotations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPerdComp.annotations.map((annotation) => {
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
                    PER/DCOMP.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <PerdCompFileManager perdcompId={selectedPerdComp.id.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
