import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Clock,
  FileText,
  Users,
  ArrowRight,
  Info,
  RefreshCw,
  LogIn,
  LogOut,
  User,
  AtSign,
  MapPin,
} from "lucide-react";

export function ActivityTable() {
  const navigate = useNavigate();
  const { activities, loading, totalCount, fetchRecentActivities } =
    useActivityStore();
  const period = useSettingsStore((state) => state.period);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Buscar atividades sempre que o período mudar via Zustand
    fetchRecentActivities(period);
  }, [period, fetchRecentActivities]);

  const refreshActivities = () => {
    fetchRecentActivities(period);
  };

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

  const getDisplayName = (activity: any) => {
    const userName =
      activity.user_name ||
      activity.user_email ||
      `Usuário ${activity.user_id}` ||
      "N/A";

    // Para atividades de login/logout, mostra nome + username
    if (
      activity.action?.toLowerCase().includes("login") ||
      activity.action?.toLowerCase().includes("logout")
    ) {
      const username =
        activity.new_data?.username ||
        activity.old_data?.username ||
        activity.metadata?.username;
      if (username) {
        return `${userName} • ${username}`;
      }
      return userName;
    }

    // Para atividades relacionadas a usuários (CREATE, UPDATE, PATCH, DELETE)
    if (
      activity.entity_type === "user" ||
      activity.resource_type?.includes("user")
    ) {
      const userData = activity.new_data || activity.old_data || {};
      const username = userData.username;

      if (username) {
        return `${userName} • ${username}`;
      }
      return userName;
    }

    // Para atividades relacionadas a clientes (CREATE, UPDATE, PATCH, DELETE)
    if (
      activity.entity_type === "client" ||
      activity.resource_type?.includes("client") ||
      activity.resource_type?.includes("Cliente")
    ) {
      const clientData = activity.new_data || activity.old_data || {};
      const cnpj =
        clientData.cnpj || clientData.document || clientData.cnpj_cpf;
      const razaoSocial =
        clientData.razao_social ||
        clientData.company_name ||
        clientData.name ||
        clientData.nome ||
        activity.resource_display_name;

      // Para CREATE, mostra CNPJ + Razão Social se disponível
      if (activity.action?.includes("CREATE") && cnpj && razaoSocial) {
        return `${userName} • ${cnpj} • ${razaoSocial}`;
      }

      // Para UPDATE/PATCH/DELETE, mostra apenas nome + razão social
      if (razaoSocial) {
        return `${userName} • ${razaoSocial}`;
      } else if (cnpj) {
        return `${userName} • ${cnpj}`;
      }
    }

    // Para atividades relacionadas a perdcomps (CREATE, UPDATE, PATCH, DELETE)
    if (
      activity.entity_type === "perdcomp" ||
      activity.resource_type?.includes("perdcomp")
    ) {
      const perdcompData = activity.new_data || activity.old_data || {};
      const resourceDisplayName = activity.resource_display_name; // Ex: "PER/DCOMP 001/02"
      const numero = perdcompData.numero || perdcompData.number; // Número da perdcomp
      const clientCnpj = perdcompData.cnpj; // CNPJ do cliente

      // Para CREATE, mostra número + CNPJ se disponível
      if (activity.action?.includes("CREATE")) {
        if (resourceDisplayName && clientCnpj) {
          return `${userName} • ${resourceDisplayName} • ${clientCnpj}`;
        } else if (numero && clientCnpj) {
          return `${userName} • ${numero} • ${clientCnpj}`;
        }
      }

      // Para UPDATE/PATCH/DELETE, mostra apenas nome + número
      if (resourceDisplayName) {
        return `${userName} • ${resourceDisplayName}`;
      } else if (numero) {
        return `${userName} • ${numero}`;
      }
    }

    // Fallback padrão
    return userName;
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case "client":
        return "Cliente";
      case "perdcomp":
        return "PER/DCOMP";
      case "user":
        return "Usuário";
      default:
        return entityType;
    }
  };

  const getActionColor = (action: string) => {
    if (
      action.includes("CREATE") ||
      action.includes("cadastrado") ||
      action.includes("criado")
    )
      return "default";
    if (action.includes("UPDATE") || action.includes("atualizado"))
      return "secondary";
    if (action.includes("DELETE") || action.includes("removido"))
      return "destructive";
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

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Hoje";
      case "week":
        return "Esta semana";
      case "month":
        return "Este mês";
      default:
        return "Hoje";
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
          <Skeleton className="h-6 w-24" />
        </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getPeriodLabel()} • {totalCount} itens
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshActivities}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {activities.length === 0 && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade registrada para {getPeriodLabel().toLowerCase()}.
          </div>
        ) : (
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
                      {getIcon(
                        activity.entity_type ||
                          activity.resource_type.split(".")[1]
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {getDisplayName(activity)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(
                            activity.entity_type ||
                              activity.resource_type.split(".")[1]
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp || activity.created_at)}
                    </span>
                    <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
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
              {/* UI especial para LOGIN/LOGOUT */}
              {selectedActivity.action?.toLowerCase().includes("login") ||
              selectedActivity.action?.toLowerCase().includes("logout") ? (
                <div className="space-y-6">
                  {/* Header da atividade */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="p-3 rounded-full bg-primary/20">
                      {selectedActivity.action
                        ?.toLowerCase()
                        .includes("login") ? (
                        <LogIn className="h-5 w-5 text-primary" />
                      ) : (
                        <LogOut className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedActivity.action}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(
                            selectedActivity.timestamp ||
                              selectedActivity.created_at
                          ),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Informações do usuário */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {selectedActivity.user_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedActivity.metadata?.username}
                        </p>
                      </div>
                    </div>

                    {/* Email se disponível */}
                    {selectedActivity.user_email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {selectedActivity.user_email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Endereço de email
                          </p>
                        </div>
                      </div>
                    )}

                    {/* IP Address se disponível */}
                    {selectedActivity.ip_address && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {selectedActivity.ip_address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Endereço IP
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* UI padrão para outras atividades */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ação</p>
                      <p className="font-medium">{selectedActivity.action}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <Badge variant={getActionColor(selectedActivity.action)}>
                        {getEntityTypeLabel(
                          selectedActivity.entity_type ||
                            selectedActivity.resource_type.split(".")[1]
                        )}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entidade</p>
                      <p className="font-medium">
                        {getDisplayName(selectedActivity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data/Hora</p>
                      <p className="font-medium">
                        {format(
                          new Date(
                            selectedActivity.timestamp ||
                              selectedActivity.created_at
                          ),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedActivity.user_email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Usuário</p>
                      <p className="font-medium">
                        {selectedActivity.user_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedActivity.user_email}
                      </p>
                    </div>
                  )}

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
                        Acessar{" "}
                        {getEntityTypeLabel(
                          selectedActivity.entity_type ||
                            selectedActivity.resource_type.split(".")[1]
                        )}
                      </span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
