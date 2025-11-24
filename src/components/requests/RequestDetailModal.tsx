import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Calendar, 
  FileText, 
  Settings,
  Edit,
  Trash2,
  Check,
  X,
  Play,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Request {
  id: string;
  public_id?: string;
  subject: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'custom';
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  resource_type: string;
  resource_id: string;
  payload_diff: any;
  reason: string;
  requested_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  executed_at?: string;
  metadata?: any;
  approval_notes?: string;
}

interface RequestDetailModalProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (request: Request) => void;
  onDelete?: (request: Request) => void;
}

export default function RequestDetailModal({ 
  request, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}: RequestDetailModalProps) {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "executed": return "default";
      case "rejected": return "destructive";
      case "cancelled": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Aprovado";
      case "executed": return "Executado";
      case "rejected": return "Rejeitado";
      case "cancelled": return "Cancelado";
      case "pending": return "Pendente";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return Check;
      case "executed": return Play;
      case "rejected": return X;
      case "cancelled": return X;
      default: return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "default";
      case "update": return "secondary";
      case "delete": return "destructive";
      case "activate": return "default";
      case "deactivate": return "outline";
      case "custom": return "outline";
      default: return "outline";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "create": return "Criar";
      case "update": return "Atualizar";
      case "delete": return "Excluir";
      case "activate": return "Ativar";
      case "deactivate": return "Desativar";
      case "custom": return "Personalizada";
      default: return action;
    }
  };

  const getResourceTypeIcon = (resourceType: string) => {
    if (resourceType.includes('Client')) return User;
    if (resourceType.includes('PerdComp')) return FileText;
    return Settings;
  };

  const getResourceTypeText = (resourceType: string) => {
    if (resourceType.includes('Client')) return "Cliente";
    if (resourceType.includes('PerdComp')) return "PER/DCOMP";
    if (resourceType === 'custom') return "Personalizado";
    return resourceType;
  };

  const ResourceIcon = getResourceTypeIcon(request.resource_type);
  const StatusIcon = getStatusIcon(request.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center space-x-2">
              <ResourceIcon className="h-5 w-5" />
              <span>Detalhes da Solicitação</span>
            </DialogTitle>
            <div className="flex space-x-2">
              {onEdit && request.status === 'pending' && (
                <Button variant="outline" size="sm" onClick={() => onEdit(request)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(request)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{request.subject}</h3>
                <p className="text-muted-foreground">{request.reason}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {getResourceTypeText(request.resource_type)}
                </Badge>
                <Badge variant={getActionColor(request.action)}>
                  {getActionText(request.action)}
                </Badge>
                <Badge variant={getStatusColor(request.status)}>
                  {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                  {getStatusText(request.status)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Pessoas Envolvidas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Solicitante:</span>
                    <p className="font-medium">{request.requested_by}</p>
                  </div>
                  {request.approved_by && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {request.status === 'approved' || request.status === 'executed' ? 'Aprovado por:' : 'Rejeitado por:'}
                      </span>
                      <p className="font-medium">{request.approved_by}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Datas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Criado em:</span>
                    <p className="font-medium">{formatDate(request.created_at)}</p>
                  </div>
                  {request.approved_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {request.status === 'approved' || request.status === 'executed' ? 'Aprovado em:' : 'Rejeitado em:'}
                      </span>
                      <p className="font-medium">{formatDate(request.approved_at)}</p>
                    </div>
                  )}
                  {request.executed_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Executado em:</span>
                      <p className="font-medium">{formatDate(request.executed_at)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resource Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Informações do Recurso</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo de Recurso:</span>
                  <p className="font-medium">{request.resource_type}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ID do Recurso:</span>
                  <p className="font-medium font-mono text-sm">{request.resource_id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payload Diff */}
            {request.payload_diff && Object.keys(request.payload_diff).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Alterações Solicitadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(request.payload_diff, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Notes */}
            {request.approval_notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Observações do Aprovador</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{request.approval_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {request.metadata && Object.keys(request.metadata).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Metadados Adicionais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(request.metadata, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
