import { useEffect, useState } from "react";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerdCompStore } from "@/stores/perdcompStore";
import { useClientStore } from "@/stores/clientStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import PerdCompFileManager from "./PerdCompFileManager";

interface PerdCompDetailProps {
  perdcompId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function PerdCompDetail({ perdcompId, onBack, onEdit }: PerdCompDetailProps) {
  const { selectedPerdComp, fetchPerdCompById } = usePerdCompStore();
  const { fetchClientById } = useClientStore();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const perdcomp = await fetchPerdCompById(perdcompId);
        if (perdcomp?.client_id) {
          const clientData = await fetchClientById(perdcomp.client_id);
          setClient(clientData);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [perdcompId]);

  if (loading || !selectedPerdComp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado": return "default";
      case "Recusado": return "destructive";
      case "Em Análise": return "secondary";
      default: return "outline";
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
          <TabsTrigger value="notes">Notas</TabsTrigger>
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
                  <Badge variant="outline">{selectedPerdComp.tributo_pedido}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Competência</p>
                  <p>{selectedPerdComp.competencia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Transmissão</p>
                  <p>{selectedPerdComp.data_transmissao ? formatDate(selectedPerdComp.data_transmissao) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p>{selectedPerdComp.created_at ? formatDate(selectedPerdComp.created_at) : "-"}</p>
                </div>
              </div>

              {client && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Informações do Cliente</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Razão Social</p>
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
                        <p className="text-sm text-muted-foreground">Telefone</p>
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
                    <p className="text-sm text-muted-foreground">Número PER/DCOMP</p>
                    <p className="font-mono">{selectedPerdComp.numero_perdcomp}</p>
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
                  <span className="text-sm text-muted-foreground">Valor do Pedido</span>
                  <span className="text-xl font-semibold">{formatCurrency(parseFloat(selectedPerdComp.valor_pedido || '0'))}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Valor Compensado</span>
                  <span className="text-xl font-semibold text-blue-600">
                    {formatCurrency(parseFloat(selectedPerdComp.valor_compensado || '0'))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Valor Recebido</span>
                  <span className="text-xl font-semibold text-success">
                    {formatCurrency(parseFloat(selectedPerdComp.valor_recebido || '0'))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Valor SELIC</span>
                  <span className="text-xl font-semibold text-purple-600">
                    {formatCurrency(parseFloat(selectedPerdComp.valor_selic || '0'))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className="text-xl font-semibold text-orange-600">
                    {formatCurrency(parseFloat(selectedPerdComp.valor_saldo || '0'))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPerdComp.processo_protocolo && (
                <div>
                  <p className="text-sm text-muted-foreground">Protocolo do Processo</p>
                  <p className="font-mono">{selectedPerdComp.processo_protocolo}</p>
                </div>
              )}
              {selectedPerdComp.data_vencimento && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p>{formatDate(selectedPerdComp.data_vencimento)}</p>
                </div>
              )}
              {selectedPerdComp.data_competencia && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Competência</p>
                  <p>{formatDate(selectedPerdComp.data_competencia)}</p>
                </div>
              )}
              {!selectedPerdComp.processo_protocolo && !selectedPerdComp.data_vencimento && !selectedPerdComp.data_competencia && (
                <p className="text-muted-foreground text-sm">
                  Nenhuma informação adicional disponível.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <PerdCompFileManager perdcompId={selectedPerdComp.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}