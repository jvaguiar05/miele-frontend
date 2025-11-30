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
                className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-border/80 hover:bg-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer group bg-gradient-to-r from-card to-card/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
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
                      <Badge
                        variant="outline"
                        className="text-xs bg-gradient-to-r from-background to-muted/30 border-border/60 shadow-sm"
                      >
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

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20">
                    <div className="p-3 rounded-full bg-primary/20 shadow-sm border border-primary/30">
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
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-gradient-to-r from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
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
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-gradient-to-r from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
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
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-gradient-to-r from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
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
              ) : selectedActivity.action?.includes("CREATE") &&
                (selectedActivity.entity_type === "client" ||
                  selectedActivity.resource_type?.includes("client") ||
                  selectedActivity.entity_type === "perdcomp" ||
                  selectedActivity.resource_type?.includes("perdcomp")) ? (
                /* UI melhorada para CREATE de Cliente/PER/DCOMP */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/50 dark:border-green-800/30">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Ação
                      </p>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        {selectedActivity.action}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Tipo
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700"
                      >
                        {getEntityTypeLabel(
                          selectedActivity.entity_type ||
                            selectedActivity.resource_type.split(".")[1]
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações da entidade */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Informações da Entidade
                    </p>
                    <div className="p-4 rounded-xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-card/70 shadow-lg space-y-3">
                      {selectedActivity.entity_type === "client" ||
                      selectedActivity.resource_type?.includes("client") ? (
                        <>
                          {selectedActivity.new_data?.razao_social && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Razão Social:
                              </span>
                              <span className="font-semibold text-right sm:max-w-xs break-words">
                                {selectedActivity.new_data.razao_social}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.cnpj && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                CNPJ:
                              </span>
                              <span className="font-semibold font-mono">
                                {selectedActivity.new_data.cnpj}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.email && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Email:
                              </span>
                              <span className="font-semibold text-right break-all">
                                {selectedActivity.new_data.email}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {selectedActivity.resource_display_name && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Número:
                              </span>
                              <span className="font-semibold text-lg">
                                {selectedActivity.resource_display_name}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.cnpj && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                CNPJ do Cliente:
                              </span>
                              <span className="font-semibold font-mono">
                                {selectedActivity.new_data.cnpj}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.periodo && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Período:
                              </span>
                              <span className="font-semibold">
                                {selectedActivity.new_data.periodo}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Informações do usuário */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Criado por
                    </p>
                    <div className="p-4 rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/20 shadow-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Usuário:
                        </span>
                        <span className="font-semibold text-right">
                          {selectedActivity.user_name}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Email:
                        </span>
                        <span className="font-semibold text-right break-all">
                          {selectedActivity.user_email}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Data/Hora:
                        </span>
                        <span className="font-semibold text-right">
                          {format(
                            new Date(
                              selectedActivity.timestamp ||
                                selectedActivity.created_at
                            ),
                            "dd/MM/yyyy 'às' HH:mm:ss",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de navegação */}
                  {selectedActivity.entity_id && (
                    <Button
                      onClick={handleNavigateToEntity}
                      className="w-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0"
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
              ) : (selectedActivity.action?.includes("UPDATE") ||
                  selectedActivity.action?.includes("PATCH")) &&
                (selectedActivity.entity_type === "client" ||
                  selectedActivity.resource_type?.includes("client") ||
                  selectedActivity.entity_type === "perdcomp" ||
                  selectedActivity.resource_type?.includes("perdcomp")) ? (
                /* UI melhorada para UPDATE de Cliente/PER/DCOMP */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border border-orange-200/50 dark:border-orange-800/30">
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        Ação
                      </p>
                      <p className="font-semibold text-orange-800 dark:text-orange-200">
                        {selectedActivity.action}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Tipo
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700"
                      >
                        {getEntityTypeLabel(
                          selectedActivity.entity_type ||
                            selectedActivity.resource_type.split(".")[1]
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações alteradas */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Alterações Realizadas
                    </p>
                    <div className="p-4 rounded-xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-card/70 shadow-lg space-y-3">
                      {selectedActivity.entity_type === "client" ||
                      selectedActivity.resource_type?.includes("client") ? (
                        <>
                          {selectedActivity.new_data?.razao_social && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Razão Social:
                              </span>
                              <span className="font-semibold text-right sm:max-w-xs break-words">
                                {selectedActivity.new_data.razao_social}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.email && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Email:
                              </span>
                              <span className="font-semibold text-right break-all">
                                {selectedActivity.new_data.email}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.telefone && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Telefone:
                              </span>
                              <span className="font-semibold text-right">
                                {selectedActivity.new_data.telefone}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.endereco && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Endereço:
                              </span>
                              <span className="font-semibold text-right break-words">
                                {selectedActivity.new_data.endereco}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {selectedActivity.new_data?.status && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Status:
                              </span>
                              <span className="font-semibold text-lg">
                                {selectedActivity.new_data.status}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.observacoes && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Observações:
                              </span>
                              <span className="font-semibold text-right break-words">
                                {selectedActivity.new_data.observacoes}
                              </span>
                            </div>
                          )}
                          {selectedActivity.new_data?.data_entrega && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="font-medium text-muted-foreground">
                                Data de Entrega:
                              </span>
                              <span className="font-semibold text-right">
                                {(() => {
                                  const formatValue = (
                                    key: string,
                                    val: any
                                  ) => {
                                    const strVal = String(val);
                                    const isDateField =
                                      /data|date|created|updated|vencimento|competencia|entrega|inicio|fim|nascimento|cadastro/i.test(
                                        key
                                      );
                                    const isDateValue =
                                      strVal.match(
                                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[Z+-]/
                                      ) ||
                                      strVal.match(/^\d{4}-\d{2}-\d{2}$/) ||
                                      isDateField;

                                    if (isDateValue) {
                                      try {
                                        if (
                                          strVal.match(
                                            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[Z+-]/
                                          )
                                        ) {
                                          return format(
                                            new Date(strVal),
                                            "dd/MM/yyyy 'às' HH:mm",
                                            { locale: ptBR }
                                          );
                                        }
                                        if (
                                          strVal.match(/^\d{4}-\d{2}-\d{2}$/)
                                        ) {
                                          return format(
                                            new Date(strVal + "T00:00:00"),
                                            "dd/MM/yyyy",
                                            { locale: ptBR }
                                          );
                                        }
                                        if (isDateField) {
                                          return format(
                                            new Date(strVal),
                                            "dd/MM/yyyy 'às' HH:mm",
                                            { locale: ptBR }
                                          );
                                        }
                                      } catch {
                                        return strVal;
                                      }
                                    }
                                    return strVal;
                                  };

                                  return formatValue(
                                    "data_entrega",
                                    selectedActivity.new_data.data_entrega
                                  );
                                })()}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Mostra outros campos que podem ter sido alterados */}
                      {selectedActivity.new_data &&
                        Object.keys(selectedActivity.new_data).length > 0 &&
                        Object.entries(selectedActivity.new_data).map(
                          ([key, value]) => {
                            // Pula campos já mostrados acima
                            if (
                              [
                                "razao_social",
                                "email",
                                "telefone",
                                "endereco",
                                "status",
                                "observacoes",
                                "data_entrega",
                              ].includes(key)
                            ) {
                              return null;
                            }

                            // Pula campos técnicos ou vazios
                            if (
                              !value ||
                              typeof value === "object" ||
                              key.startsWith("_")
                            ) {
                              return null;
                            }

                            // Formata valores de data
                            const formatValue = (key: string, val: any) => {
                              const strVal = String(val);

                              // Detecta campos de data pelo nome (case insensitive)
                              const isDateField =
                                /data|date|created|updated|vencimento|competencia|entrega|inicio|fim|nascimento|cadastro/i.test(
                                  key
                                );

                              // Detecta formatos de data ISO ou se o campo indica que é uma data
                              const isDateValue =
                                strVal.match(
                                  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[Z+-]/
                                ) ||
                                strVal.match(/^\d{4}-\d{2}-\d{2}$/) ||
                                isDateField;

                              if (isDateValue) {
                                try {
                                  // Formato ISO com timezone
                                  if (
                                    strVal.match(
                                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[Z+-]/
                                    )
                                  ) {
                                    return format(
                                      new Date(strVal),
                                      "dd/MM/yyyy 'às' HH:mm",
                                      { locale: ptBR }
                                    );
                                  }
                                  // Formato de data simples
                                  if (strVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    return format(
                                      new Date(strVal + "T00:00:00"),
                                      "dd/MM/yyyy",
                                      { locale: ptBR }
                                    );
                                  }
                                  // Tenta outros formatos se o campo indica data
                                  if (isDateField) {
                                    return format(
                                      new Date(strVal),
                                      "dd/MM/yyyy 'às' HH:mm",
                                      { locale: ptBR }
                                    );
                                  }
                                } catch {
                                  // Se falhar na formatação, retorna o valor original
                                  return strVal;
                                }
                              }

                              return strVal;
                            };

                            return (
                              <div
                                key={key}
                                className="flex flex-col sm:flex-row sm:justify-between gap-1"
                              >
                                <span className="font-medium text-muted-foreground capitalize">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="font-semibold text-right break-words">
                                  {formatValue(key, value)}
                                </span>
                              </div>
                            );
                          }
                        )}
                    </div>
                  </div>

                  {/* Informações do usuário */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Alterado por
                    </p>
                    <div className="p-4 rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/20 shadow-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Usuário:
                        </span>
                        <span className="font-semibold text-right">
                          {selectedActivity.user_name}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Email:
                        </span>
                        <span className="font-semibold text-right break-all">
                          {selectedActivity.user_email}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Data/Hora:
                        </span>
                        <span className="font-semibold text-right">
                          {format(
                            new Date(
                              selectedActivity.timestamp ||
                                selectedActivity.created_at
                            ),
                            "dd/MM/yyyy 'às' HH:mm:ss",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de navegação */}
                  {selectedActivity.entity_id && (
                    <Button
                      onClick={handleNavigateToEntity}
                      className="w-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0"
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
