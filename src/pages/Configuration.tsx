import { useState, useEffect } from "react";
import { useSettingsStore, DashboardFilter } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Settings,
  Monitor,
  Bell,
  Database,
  Activity,
  Save,
  RefreshCw,
  Wifi,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/providers/theme-provider";

export default function Configuration() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Settings state from Zustand
  const {
    notifications,
    emailNotifications,
    soundEnabled,
    period: dashboardFilter,
    systemStatus,
    setNotifications,
    setEmailNotifications,
    setSoundEnabled,
    setDashboardFilter,
    checkSystemStatus,
    saveAllSettings,
  } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);

  useEffect(() => {
    // Carregar status inicial do sistema
    checkSystemStatus();
  }, [checkSystemStatus]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await saveAllSettings();

      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setIsCheckingConnectivity(true);
    try {
      await checkSystemStatus();
      toast({
        title: "Teste concluído",
        description: "Conectividade verificada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao verificar conectividade.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingConnectivity(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Personalize as configurações do sistema e dashboard
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Preferences */}
          <div className="space-y-6">
            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Aparência
                </CardTitle>
                <CardDescription>
                  Personalize a interface do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tema</Label>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre claro, escuro ou automático
                    </p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Configure como os dados são exibidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Filtro de dados</Label>
                    <p className="text-sm text-muted-foreground">
                      Período padrão para informações de ações
                    </p>
                  </div>
                  <Select
                    value={dashboardFilter}
                    onValueChange={(value) =>
                      setDashboardFilter(value as DashboardFilter)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como você quer ser notificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações no sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações dentro do aplicativo
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber emails sobre atividades importantes
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sons de notificação</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir sons para notificações
                    </p>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="space-y-6">
            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status do Banco de Dados
                </CardTitle>
                <CardDescription>
                  Informações sobre conectividade e performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Status da conexão
                  </Label>
                  <div className="flex items-center gap-2">
                    {systemStatus.database.status === "checking" ? (
                      <Clock className="h-4 w-4 animate-spin text-yellow-500" />
                    ) : systemStatus.database.status === "online" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground capitalize">
                      {systemStatus.database.status === "checking"
                        ? "Verificando..."
                        : systemStatus.database.status === "online"
                        ? "Conectado"
                        : "Desconectado"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Tempo de resposta
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.database.responseTime}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Uptime</Label>
                  <Badge variant="secondary" className="text-xs">
                    {systemStatus.database.uptime}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status da API
                </CardTitle>
                <CardDescription>
                  Health check e performance da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Status do serviço
                  </Label>
                  <div className="flex items-center gap-2">
                    {systemStatus.api.status === "checking" ? (
                      <Clock className="h-4 w-4 animate-spin text-yellow-500" />
                    ) : systemStatus.api.status === "online" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground capitalize">
                      {systemStatus.api.status === "checking"
                        ? "Verificando..."
                        : systemStatus.api.status === "online"
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Tempo de resposta
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.api.responseTime}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Disponibilidade</Label>
                  <Badge variant="secondary" className="text-xs">
                    {systemStatus.api.uptime}
                  </Badge>
                </div>

                {systemStatus.lastChecked && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Última verificação
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {format(systemStatus.lastChecked, "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleTestConnectivity}
                  disabled={isCheckingConnectivity}
                >
                  {isCheckingConnectivity ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4 mr-2" />
                  )}
                  {isCheckingConnectivity
                    ? "Testando..."
                    : "Testar conectividade"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar configurações
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
