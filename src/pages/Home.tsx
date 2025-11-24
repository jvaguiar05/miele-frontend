import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  BarChart3,
  ClipboardList,
  TrendingUp,
  Clock,
  DollarSign,
  FolderOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useClientStore } from "@/stores/clientStore";
import { usePerdCompStore } from "@/stores/perdcompStore";
import { ActivityTable } from "@/components/activity/ActivityTable";
import AdminDashboard from "./AdminDashboard";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalPerdcomps: number;
  openPerdcomps: number;
  pendingRequests: number;
  totalValue: number;
}

const getNavigationCards = (stats: DashboardStats) => [
  {
    title: "Clientes",
    description: "Gerencie seus clientes e informações",
    icon: Users,
    href: "/clients",
    color: "from-blue-500 to-blue-600",
    stats: `${stats.activeClients} ativos`,
  },
  {
    title: "PER/DCOMP",
    description: "Controle de pedidos e compensações",
    icon: FileText,
    href: "/perdcomps",
    color: "from-purple-500 to-purple-600",
    stats: `${stats.openPerdcomps} em aberto`,
  },
  {
    title: "Relatórios",
    description: "Visualize relatórios e análises",
    icon: BarChart3,
    href: "/reports",
    color: "from-green-500 to-green-600",
    stats: "Dashboard",
  },
  {
    title: "Solicitações",
    description: "Gerencie todas as solicitações do sistema",
    icon: ClipboardList,
    href: "/requests",
    color: "from-orange-500 to-orange-600",
    stats: `${stats.pendingRequests} pendentes`,
  },
];

const getQuickStats = (stats: DashboardStats) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return [
    {
      title: "Valor Total Solicitado",
      value: formatCurrency(stats.totalValue),
      change: "",
      icon: DollarSign,
      trend: "neutral" as const,
    },
    {
      title: "Total de Clientes",
      value: stats.totalClients.toString(),
      change: `${stats.activeClients} ativos`,
      icon: Users,
      trend: "up" as const,
    },
    {
      title: "Solicitações Pendentes",
      value: stats.pendingRequests.toString(),
      change: "",
      icon: Clock,
      trend: "neutral" as const,
    },
    {
      title: "PER/DCOMPs Ativos",
      value: stats.totalPerdcomps.toString(),
      change: `${stats.openPerdcomps} em aberto`,
      icon: FolderOpen,
      trend: "up" as const,
    },
  ];
};

export default function Home() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { perdcomps, fetchPerdComps } = usePerdCompStore();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalPerdcomps: 0,
    openPerdcomps: 0,
    pendingRequests: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch initial data - this will populate the stores
        await Promise.all([
          fetchClients(1).catch(() => {}), // Ignore errors for dashboard
          fetchPerdComps(1).catch(() => {}), // Ignore errors for dashboard
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Só busca dados se NÃO for admin
    if (!isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]); // Only depend on isAdmin

  // Separate effect to calculate stats when data changes
  useEffect(() => {
    const activeClients = clients.filter(
      (client) => client.is_active !== false
    ).length;
    const openPerdcomps = perdcomps.filter((perdcomp) =>
      ["RASCUNHO", "TRANSMITIDO", "EM_PROCESSAMENTO"].includes(perdcomp.status)
    ).length;

    const totalValue = perdcomps.reduce(
      (sum, perdcomp) => sum + (Number(perdcomp.valor_pedido) || 0),
      0
    );

    setDashboardStats({
      totalClients: clients.length,
      activeClients: activeClients,
      totalPerdcomps: perdcomps.length,
      openPerdcomps: openPerdcomps,
      pendingRequests: 0, // TODO: Add requests store data when available
      totalValue: totalValue,
    });
  }, [clients, perdcomps]); // Only recalculate when data changes

  // Se for admin, renderiza o AdminDashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  const navigationCards = getNavigationCards(dashboardStats);
  const quickStats = getQuickStats(dashboardStats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Olá, {user?.first_name || user?.username || "Usuário"}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vindo ao painel de controle do Miele
          </p>
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
                  <div className={`p-2 rounded-lg bg-primary/10`}>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {stat.change && (
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === "up"
                          ? "text-green-500"
                          : stat.trend === "neutral"
                          ? "text-muted-foreground"
                          : "text-red-500"
                      }`}
                    >
                      {stat.change}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="h-8 bg-muted animate-pulse rounded mb-1" />
                ) : (
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                )}
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </Card>
            );
          })}
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {navigationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group border-border/50 bg-card/50 backdrop-blur"
                  onClick={() => navigate(card.href)}
                >
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${card.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      {card.stats}
                    </span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <ActivityTable />
        </motion.div>
      </div>
    </div>
  );
}
