import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  const [activeTab, setActiveTab] = useState("info");

  // Tab options
  const tabOptions = [
    { value: "info", label: "📋 Informações Gerais", icon: "📋" },
    { value: "values", label: "💰 Valores", icon: "💰" },
    { value: "notes", label: "📝 Anotações", icon: "📝" },
    { value: "files", label: "📁 Arquivos", icon: "📁" },
  ];

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
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold truncate leading-tight">
              {selectedPerdComp.numero}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate leading-tight">
              {client && `${client.razao_social} - CNPJ: ${client.cnpj}`}
            </p>
          </div>
        </div>
        <Button onClick={() => onEdit()} className="w-full sm:w-auto" size="sm">
          <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Editar
        </Button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className="block sm:hidden">
        <Label htmlFor="tab-select" className="text-sm font-medium">
          Seção
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden sm:grid w-full grid-cols-4">
          <TabsTrigger value="info" className="text-sm px-3">
            📋 Informações Gerais
          </TabsTrigger>
          <TabsTrigger value="values" className="text-sm px-3">
            💰 Valores
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-sm px-3">
            📝 Anotações
          </TabsTrigger>
          <TabsTrigger value="files" className="text-sm px-3">
            📁 Arquivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                Detalhes do PER/DCOMP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-6 sm:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Número
                  </p>
                  <p className="font-semibold text-sm sm:text-base">
                    {selectedPerdComp.numero}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={getStatusColor(selectedPerdComp.status)}
                    className="text-xs"
                  >
                    {selectedPerdComp.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Tributo
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {selectedPerdComp.tributo_pedido}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Competência
                  </p>
                  <p className="text-sm sm:text-base">
                    {selectedPerdComp.competencia}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Data de Transmissão
                  </p>
                  <p className="text-sm sm:text-base">
                    {selectedPerdComp.data_transmissao
                      ? formatDate(selectedPerdComp.data_transmissao)
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Criado em
                  </p>
                  <p className="text-sm sm:text-base">
                    {selectedPerdComp.created_at
                      ? formatDate(selectedPerdComp.created_at)
                      : "-"}
                  </p>
                </div>
              </div>

              {client && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 font-medium">
                      Informações do Cliente
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Razão Social
                        </p>
                        <p className="font-medium text-sm sm:text-base break-words">
                          {client.razao_social}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          CNPJ
                        </p>
                        <p className="font-mono text-sm sm:text-base">
                          {client.cnpj}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Email
                        </p>
                        <p className="text-sm sm:text-base break-all">
                          {client.email_contato || "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Telefone
                        </p>
                        <p className="text-sm sm:text-base">
                          {client.telefone_contato || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedPerdComp.numero_perdcomp && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Número PER/DCOMP
                    </p>
                    <p className="font-mono text-sm sm:text-base break-all">
                      {selectedPerdComp.numero_perdcomp}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="values" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                Valores Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-6 sm:px-8">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                  <span className="text-sm text-muted-foreground">
                    Valor do Pedido
                  </span>
                  <span className="text-lg sm:text-xl font-semibold">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_pedido || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                  <span className="text-sm text-muted-foreground">
                    Valor Compensado
                  </span>
                  <span className="text-lg sm:text-xl font-semibold text-blue-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_compensado || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                  <span className="text-sm text-muted-foreground">
                    Valor Recebido
                  </span>
                  <span className="text-lg sm:text-xl font-semibold text-success">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_recebido || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                  <span className="text-sm text-muted-foreground">
                    Valor SELIC
                  </span>
                  <span className="text-lg sm:text-xl font-semibold text-purple-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_selic || "0")
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className="text-lg sm:text-xl font-semibold text-orange-600">
                    {formatCurrency(
                      parseFloat(selectedPerdComp.valor_saldo || "0")
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-3 sm:space-y-4">
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-4 px-6 sm:px-8">
                <CardTitle className="text-base sm:text-lg">
                  Anotações e Observações
                </CardTitle>
                <Button
                  onClick={() => {
                    setEditingAnnotation(null);
                    setShowAddAnnotationForm(true);
                  }}
                  size="sm"
                  className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Anotação
                </Button>
              </CardHeader>
              <CardContent className="px-6 sm:px-8">
                {selectedPerdComp?.annotations &&
                selectedPerdComp.annotations.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
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
                          className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="text-sm font-medium">
                                  {annotation.user_name}
                                </p>
                                {annotation.content.priority && (
                                  <Badge
                                    variant={priorityVariant}
                                    className={`text-xs ${
                                      priorityVariant === "default"
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : ""
                                    }`}
                                  >
                                    {priorityLabel}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(annotation.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 self-start">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAnnotation(annotation)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAnnotation(annotation.id)
                                }
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm leading-relaxed break-words">
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
                  <p className="text-muted-foreground text-xs sm:text-sm text-center py-6">
                    Nenhuma anotação ou observação foi adicionada para este
                    PER/DCOMP.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-3 sm:space-y-4">
          <PerdCompFileManager perdcompId={selectedPerdComp.id.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
