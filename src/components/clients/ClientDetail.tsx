import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientStore } from "@/stores/clientStore";
import { usePerdCompStore } from "@/stores/perdcompStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import PerdCompDetailModal from "@/components/perdcomps/PerdCompDetailModal";
import FileManager from "./FileManager";

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
  onEdit: (client: any) => void;
  onAddPerdComp: () => void;
}

export default function ClientDetail({ clientId, onBack, onEdit, onAddPerdComp }: ClientDetailProps) {
  const navigate = useNavigate();
  const { selectedClient, fetchClientById } = useClientStore();
  const { fetchPerdCompsByClient, clientPerdComps } = usePerdCompStore();
  const [loading, setLoading] = useState(true);
  const [selectedPerdComp, setSelectedPerdComp] = useState(null);
  const [isPerdCompModalOpen, setIsPerdCompModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchClientById(clientId);
        await fetchPerdCompsByClient(clientId);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [clientId]);

  if (loading || !selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
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
          <h2 className="text-2xl font-bold">{selectedClient.razao_social}</h2>
        </div>
        <Button onClick={() => onEdit(selectedClient)}>
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
                  <p className="font-mono">{formatCNPJ(selectedClient.cnpj)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p>{selectedClient.nome_fantasia || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Empresa</p>
                  <Badge variant="outline">{selectedClient.tipo_empresa}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Regime Tributário</p>
                  <p>{selectedClient.regime_tributacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNAEs</p>
                  <p>{selectedClient.cnaes || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedClient.recuperacao_judicial ? "destructive" : "default"}>
                    {selectedClient.recuperacao_judicial ? "Recuperação Judicial" : "Ativo"}
                  </Badge>
                </div>
              </div>
              
              {selectedClient.atividades && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Atividades</p>
                    <p className="text-sm">{selectedClient.atividades}</p>
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
                <p>{selectedClient.logradouro || ""} {selectedClient.numero || ""}</p>
                {selectedClient.complemento && <p>{selectedClient.complemento}</p>}
                <p>{selectedClient.bairro || ""} - {selectedClient.municipio || ""}/{selectedClient.uf || ""}</p>
                {selectedClient.cep && <p>CEP: {selectedClient.cep}</p>}
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
                  <p className="text-sm text-muted-foreground">Email de Contato</p>
                  <p>{selectedClient.email_contato || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone de Contato</p>
                  <p>{selectedClient.telefone_contato || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Comercial</p>
                  <p>{selectedClient.email_comercial || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone Comercial</p>
                  <p>{selectedClient.telefone_comercial || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {selectedClient.website ? (
                    <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedClient.website}
                    </a>
                  ) : (
                    <p>-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável Financeiro</p>
                  <p>{selectedClient.responsavel_financeiro || "-"}</p>
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
                <p>{selectedClient.quadro_societario || "Não informado"}</p>
                {selectedClient.cargos && (
                  <p className="text-sm text-muted-foreground">Cargos: {selectedClient.cargos}</p>
                )}
                {selectedClient.contador_responsavel && (
                  <p className="text-sm text-muted-foreground">Contador: {selectedClient.contador_responsavel}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anotações e Observações</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient.anotacoes_anteriores ? (
                <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md">
                  {selectedClient.anotacoes_anteriores}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhuma anotação ou observação foi adicionada para este cliente.
                </p>
              )}
            </CardContent>
          </Card>
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

          {clientPerdComps.length === 0 ? (
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
          ) : (
            <div className="grid gap-4">
              {clientPerdComps.map((perdcomp) => (
                <Card 
                  key={perdcomp.id} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handlePerdCompClick(perdcomp)}
                >
                  <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{perdcomp.numero}</span>
                            <Badge variant="outline">{perdcomp.tributo_pedido}</Badge>
                            <Badge 
                              variant={
                                perdcomp.status === "DEFERIDO" ? "default" :
                                perdcomp.status === "INDEFERIDO" ? "destructive" :
                                "secondary"
                              }
                            >
                              {perdcomp.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Competência: {perdcomp.competencia} | 
                            Transmissão: {perdcomp.data_transmissao ? formatDate(perdcomp.data_transmissao) : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Pedido</p>
                          <p className="font-semibold">{formatCurrency(parseFloat(perdcomp.valor_pedido || '0'))}</p>
                          {parseFloat(perdcomp.valor_recebido || '0') > 0 && (
                            <>
                              <p className="text-sm text-muted-foreground mt-1">Recebido</p>
                              <p className="font-semibold text-success">{formatCurrency(parseFloat(perdcomp.valor_recebido || '0'))}</p>
                            </>
                          )}
                        </div>
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* PerdComp Detail Modal */}
      <PerdCompDetailModal
        perdcomp={selectedPerdComp}
        isOpen={isPerdCompModalOpen}
        onClose={() => setIsPerdCompModalOpen(false)}
        onViewFull={handleViewFullPerdComp}
      />
    </div>
  );
}