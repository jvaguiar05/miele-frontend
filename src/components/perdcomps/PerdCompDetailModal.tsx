import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, DollarSign, FileText, Info } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PerdComp {
  id: string;
  numero: string;
  imposto: string;
  competencia: string;
  status: string;
  data_transmissao?: string;
  valor_solicitado: number;
  valor_recebido: number;
  protocolo?: string;
  observacoes?: string;
  tipo_perdcomp: string;
}

interface PerdCompDetailModalProps {
  perdcomp: PerdComp | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFull: (perdcompId: string) => void;
}

export default function PerdCompDetailModal({ 
  perdcomp, 
  isOpen, 
  onClose, 
  onViewFull 
}: PerdCompDetailModalProps) {
  if (!perdcomp) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "default";
      case "Recusado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PER/DCOMP {perdcomp.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{perdcomp.imposto}</Badge>
            <Badge variant={getStatusVariant(perdcomp.status)}>
              {perdcomp.status}
            </Badge>
            <Badge variant="outline">{perdcomp.tipo_perdcomp}</Badge>
          </div>

          <Separator />

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Competência</p>
                <p className="font-medium">{perdcomp.competencia}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Transmissão</p>
                <p className="font-medium">
                  {perdcomp.data_transmissao ? formatDate(perdcomp.data_transmissao) : "Não transmitido"}
                </p>
              </div>
            </div>

            {perdcomp.protocolo && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Protocolo</p>
                <p className="font-mono text-sm">{perdcomp.protocolo}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Values */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                <p className="text-lg font-bold">{formatCurrency(perdcomp.valor_solicitado)}</p>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Recebido</p>
                <p className={`text-lg font-bold ${perdcomp.valor_recebido > 0 ? 'text-green-600' : ''}`}>
                  {formatCurrency(perdcomp.valor_recebido)}
                </p>
              </div>
            </div>

            {perdcomp.valor_recebido > 0 && perdcomp.valor_recebido < perdcomp.valor_solicitado && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Diferença:</strong> {formatCurrency(perdcomp.valor_solicitado - perdcomp.valor_recebido)}
                </p>
              </div>
            )}
          </div>

          {/* Observations */}
          {perdcomp.observacoes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  Observações
                </h4>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{perdcomp.observacoes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => onViewFull(perdcomp.id)}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Detalhes Completos
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}