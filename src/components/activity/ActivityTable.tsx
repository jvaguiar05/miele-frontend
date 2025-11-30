import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityStore, ActivityLog } from "@/stores/activityStore";
import { Clock, FileText, Users, ArrowRight, Info } from "lucide-react";

export function ActivityTable() {
  const navigate = useNavigate();
  const {
    activities,
    loading,
    totalCount,
    currentPage,
    pageSize,
    fetchActivities,
    setCurrentPage,
  } = useActivityStore();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchActivities(1);
  }, []);

  const getIcon = (entityType: string) => {
    switch (entityType) {
      case "client":
        return <Users className="h-4 w-4" />;
      case "perdcomp":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case "client":
        return "Cliente";
      case "perdcomp":
        return "PER/DCOMP";
      default:
        return entityType;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("cadastrado") || action.includes("criado"))
      return "default";
    if (action.includes("atualizado")) return "secondary";
    if (action.includes("removido")) return "destructive";
    return "outline";
  };

  const handleActivityClick = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setShowPreview(true);
  };

  const handleNavigateToEntity = () => {
    if (!selectedActivity || !selectedActivity.entity_id) return;

    switch (selectedActivity.entity_type) {
      case "client":
        navigate(`/clients/${selectedActivity.entity_id}`);
        break;
      case "perdcomp":
        navigate(`/perdcomps/${selectedActivity.entity_id}`);
        break;
      default:
        break;
    }
    setShowPreview(false);
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - activityDate.getTime()) / (1000 * 60)
      );
      return `há ${diffInMinutes} ${
        diffInMinutes === 1 ? "minuto" : "minutos"
      }`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
    } else if (diffInHours < 48) {
      return "ontem";
    } else {
      return format(activityDate, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getIcon(activity.entity_type)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.entity_name && (
                            <span className="text-sm text-muted-foreground">
                              {activity.entity_name}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(activity.entity_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(activity.created_at)}
                      </span>
                      <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 && setCurrentPage(currentPage - 1)
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page}>...</span>;
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          setCurrentPage(currentPage + 1)
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Atividade</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta atividade
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ação</p>
                  <p className="font-medium">{selectedActivity.action}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant={getActionColor(selectedActivity.action)}>
                    {getEntityTypeLabel(selectedActivity.entity_type)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entidade</p>
                  <p className="font-medium">
                    {selectedActivity.entity_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedActivity.created_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              </div>

              {selectedActivity.metadata &&
                Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Informações Adicionais
                    </p>
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      {Object.entries(selectedActivity.metadata).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="text-sm font-medium">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedActivity.entity_id && (
                <Button
                  onClick={handleNavigateToEntity}
                  className="w-full"
                  variant="default"
                >
                  <span>
                    Acessar {getEntityTypeLabel(selectedActivity.entity_type)}
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
