import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Users, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequestStore } from "@/stores/requestStore";
import RequestsTable from "@/components/requests/RequestsTable";
import RequestFilters from "@/components/requests/RequestFilters";
import CreateRequestModal from "@/components/requests/CreateRequestModal";
import DangerZoneModal from "@/components/requests/DangerZoneModal";
import { Separator } from "@/components/ui/separator";

export default function Requests() {
  const { 
    requests, 
    isLoading, 
    error,
    currentPage,
    totalPages,
    totalCount,
    fetchRequests,
    setCurrentPage,
    setSelectedRequest,
    createRequest,
    updateRequest,
    deleteRequest,
    revokeRequest,
    applyFilters
  } = useRequestStore();

  const [selectedRequest, setSelectedRequestLocal] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerAction, setDangerAction] = useState<'revoke' | 'clear' | null>(null);
  const [isProcessingDanger, setIsProcessingDanger] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFiltersChange = useCallback((filters: any) => {
    applyFilters(filters);
  }, [applyFilters]);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "pending").length;
  const approvedRequests = requests.filter(r => r.status === "approved" || r.status === "executed").length;
  const rejectedRequests = requests.filter(r => r.status === "rejected" || r.status === "cancelled").length;

  const quickStats = [
    {
      title: "Total de Solicitações",
      value: totalRequests.toString(),
      change: "+12.5%",
      icon: FileText,
      trend: "up",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Pendentes",
      value: pendingRequests.toString(),
      change: "+5.2%",
      icon: Clock,
      trend: "up",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Aprovadas",
      value: approvedRequests.toString(),
      change: "+18.3%",
      icon: CheckCircle,
      trend: "up",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Rejeitadas",
      value: rejectedRequests.toString(),
      change: "-8.1%",
      icon: XCircle,
      trend: "down",
      color: "from-red-500 to-red-600"
    }
  ];

  const getTabData = () => {
    switch (activeTab) {
      case "clients":
        return requests.filter(r => r.resource_type.includes('Client'));
      case "perdcomps":
        return requests.filter(r => r.resource_type.includes('PerdComp'));
      default:
        return requests;
    }
  };

  const handleDangerAction = (action: 'revoke' | 'clear') => {
    setDangerAction(action);
    setDangerModalOpen(true);
  };

  const executeDangerAction = async () => {
    if (!dangerAction) return;
    
    setIsProcessingDanger(true);
    try {
      if (dangerAction === 'revoke') {
        // Implement revoke pending requests logic
        console.log("Revoking all pending requests...");
        // await revokeAllPendingRequests();
      } else if (dangerAction === 'clear') {
        // Implement clear old requests logic
        console.log("Clearing old requests...");
        // await clearOldRequests();
      }
    } catch (error) {
      console.error("Error executing danger action:", error);
    } finally {
      setIsProcessingDanger(false);
      setDangerAction(null);
    }
  };

  const getDangerModalConfig = () => {
    if (dangerAction === 'revoke') {
      return {
        title: "Revogar Solicitações Pendentes",
        description: "Esta ação irá revogar todas as solicitações pendentes no sistema. Todas as solicitações com status 'pendente' serão marcadas como revogadas.",
        confirmationText: "REVOGAR PENDENTES"
      };
    } else if (dangerAction === 'clear') {
      return {
        title: "Limpar Solicitações Antigas",
        description: "Esta ação irá remover permanentemente todas as solicitações antigas do sistema. Considere fazer um backup antes de continuar.",
        confirmationText: "LIMPAR ANTIGAS"
      };
    }
    return {
      title: "",
      description: "",
      confirmationText: ""
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Gerenciamento de Solicitações
              </h1>
              <p className="text-muted-foreground text-lg">
                Visualize e gerencie todas as solicitações do sistema
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </Card>
            );
          })}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Solicitações do Sistema</CardTitle>
                  <CardDescription>
                    Gerencie todas as solicitações de clientes e PER/DCOMP
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-primary/10">
                    {totalRequests} total
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {pendingRequests} pendentes
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <TabsList className="grid w-full lg:w-auto grid-cols-3 mb-4 lg:mb-0">
                    <TabsTrigger value="all" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Todas</span>
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Clientes</span>
                    </TabsTrigger>
                    <TabsTrigger value="perdcomps" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>PER/DCOMP</span>
                    </TabsTrigger>
                  </TabsList>
                  <RequestFilters onFiltersChange={handleFiltersChange} />
                </div>

                <Separator className="mb-6" />

                <TabsContent value="all">
                  <RequestsTable 
                    requests={getTabData()} 
                    isLoading={isLoading}
                    type="all"
                  />
                </TabsContent>
                
                <TabsContent value="clients">
                  <RequestsTable 
                    requests={getTabData()} 
                    isLoading={isLoading}
                    type="clients"
                  />
                </TabsContent>
                
                <TabsContent value="perdcomps">
                  <RequestsTable 
                    requests={getTabData()} 
                    isLoading={isLoading}
                    type="perdcomps"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-700 dark:text-red-400">
                  Zona de Perigo
                </CardTitle>
              </div>
              <CardDescription className="text-red-600 dark:text-red-300">
                Ações irreversíveis que afetam o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDangerAction('revoke')}
                >
                  Revogar Solicitações Pendentes
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                  onClick={() => handleDangerAction('clear')}
                >
                  Limpar Solicitações Antigas
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Request Modal */}
        <CreateRequestModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />

        {/* Danger Zone Modal */}
        <DangerZoneModal
          open={dangerModalOpen}
          onOpenChange={setDangerModalOpen}
          title={getDangerModalConfig().title}
          description={getDangerModalConfig().description}
          confirmationText={getDangerModalConfig().confirmationText}
          onConfirm={executeDangerAction}
          isLoading={isProcessingDanger}
        />
      </div>
    </div>
  );
}