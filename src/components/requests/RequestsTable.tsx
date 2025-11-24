import { useState } from "react";
import { Eye, Edit, Trash2, MoreVertical, AlertTriangle, User, Calendar, FileText, Settings, Check, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils";
import { useRequestStore } from "@/stores/requestStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import RequestDetailModal from "./RequestDetailModal";

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

interface RequestsTableProps {
  requests: Request[];
  isLoading: boolean;
  type: 'all' | 'clients' | 'perdcomps';
}

export default function RequestsTable({ requests, isLoading, type }: RequestsTableProps) {
  const { deleteRequest, revokeRequest, currentPage, totalPages, setCurrentPage } = useRequestStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

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

  const handleDelete = async () => {
    if (selectedRequest) {
      await deleteRequest(selectedRequest.id);
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleRevoke = async () => {
    if (selectedRequest) {
      await revokeRequest(selectedRequest.id);
      setRevokeDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Recurso</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const ResourceIcon = getResourceTypeIcon(request.resource_type);
                const StatusIcon = getStatusIcon(request.status);
                return (
                  <TableRow 
                    key={request.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewRequest(request)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {getResourceTypeText(request.resource_type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(request.action)} className="text-xs">
                        {getActionText(request.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{request.subject}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {request.reason}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[120px]">
                          {request.requested_by ? request.requested_by.split('@')[0] : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={getStatusColor(request.status)} className="text-xs">
                          {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewRequest(request);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          {request.status === 'pending' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit request:', request.id);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {request.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setRevokeDialogOpen(true);
                              }}
                              className="text-orange-600"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Revogar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={(request) => {
          console.log('Edit request:', request.id);
          setDetailModalOpen(false);
        }}
        onDelete={(request) => {
          setDetailModalOpen(false);
          setSelectedRequest(request);
          setDeleteDialogOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a solicitação "{selectedRequest?.subject}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Revogação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar a solicitação "{selectedRequest?.subject}"? 
              Esta ação irá marcar a solicitação como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-orange-600 hover:bg-orange-700">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
