import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { useActivityStore } from "@/stores/activityStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// API Response interfaces
interface DashboardApiResponse {
  main_cards: {
    clients: {
      total_active: number;
      new_this_month: number;
    };
    perdcomps_expiring: {
      expiring_this_month: number;
    };
    perdcomps_total: {
      total: number;
      new_this_month: number;
    };
    approval_rate: {
      rate_percentage: number;
      approved_count: number;
      total_count: number;
    };
  };
  charts: {
    clients_last_6_months: {
      month: string;
      year: number;
      count: number;
    }[];
    perdcomps_last_6_months: {
      month: string;
      year: number;
      count: number;
    }[];
    perdcomps_status_distribution: {
      deferido: number;
      indeferido: number;
      em_analise: number;
    };
  };
  metadata: {
    generated_at: string;
    current_month: string;
    current_year: number;
  };
}

interface DashboardStats {
  totalClients: number;
  newClientsThisMonth: number;
  clientsGrowth: number;
  expiringThisMonth: number;
  newPerdcompsThisMonth: number;
  perdcompsGrowth: number;
  approvalRate: number;
  approvedCount: number;
  definedCount: number;
}

interface MonthlyData {
  month: string;
  clientes: number;
  perdcomps: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

// Transform API data to component format
const processApiData = (apiData: DashboardApiResponse) => {
  // Process monthly chart data
  const monthlyData: MonthlyData[] = apiData.charts.clients_last_6_months.map(
    (clientData, index) => {
      const perdcompData = apiData.charts.perdcomps_last_6_months[index];
      return {
        month: clientData.month,
        clientes: clientData.count,
        perdcomps: perdcompData ? perdcompData.count : 0,
      };
    }
  );

  // Process status data
  const statusData: StatusData[] = [
    {
      name: "Deferido",
      value: apiData.charts.perdcomps_status_distribution.deferido,
      color: "#22c55e",
    },
    {
      name: "Em Análise",
      value: apiData.charts.perdcomps_status_distribution.em_analise,
      color: "#f59e0b",
    },
    {
      name: "Indeferido",
      value: apiData.charts.perdcomps_status_distribution.indeferido,
      color: "#ef4444",
    },
  ];

  // Process dashboard stats
  const dashboardStats: DashboardStats = {
    totalClients: apiData.main_cards.clients.total_active,
    newClientsThisMonth: apiData.main_cards.clients.new_this_month,
    clientsGrowth: apiData.main_cards.clients.new_this_month,
    expiringThisMonth:
      apiData.main_cards.perdcomps_expiring.expiring_this_month,
    newPerdcompsThisMonth: apiData.main_cards.perdcomps_total.total,
    perdcompsGrowth: apiData.main_cards.perdcomps_total.new_this_month,
    approvalRate: apiData.main_cards.approval_rate.rate_percentage,
    approvedCount: apiData.main_cards.approval_rate.approved_count,
    definedCount: apiData.main_cards.approval_rate.total_count,
  };

  return { monthlyData, statusData, dashboardStats };
};

// Fetch dashboard data from API
const fetchDashboardStats = async (): Promise<DashboardApiResponse> => {
  try {
    const response = await api.get("/dashboard/dashboard/stats/");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return fallback data structure
    return {
      main_cards: {
        clients: { total_active: 0, new_this_month: 0 },
        perdcomps_expiring: { expiring_this_month: 0 },
        perdcomps_total: { total: 0, new_this_month: 0 },
        approval_rate: {
          rate_percentage: 0,
          approved_count: 0,
          total_count: 0,
        },
      },
      charts: {
        clients_last_6_months: [],
        perdcomps_last_6_months: [],
        perdcomps_status_distribution: {
          deferido: 0,
          indeferido: 0,
          em_analise: 0,
        },
      },
      metadata: {
        generated_at: new Date().toISOString(),
        current_month: new Date().toISOString().slice(0, 7),
        current_year: new Date().getFullYear(),
      },
    };
  }
};

const getNavigationCards = (stats: DashboardStats) => [
  {
    title: "Clientes",
    description: "Gerencie seus clientes e informações",
    icon: Users,
    href: "/clients",
    stats: `${stats.newClientsThisMonth} novos este mês`,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "PER/DCOMP",
    description: "Pedidos e compensações tributárias",
    icon: FileText,
    href: "/perdcomps",
    stats: `${stats.expiringThisMonth} vencendo este mês`,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Relatórios",
    description: "Analytics e insights detalhados",
    icon: BarChart3,
    href: "/reports",
    stats: "Dashboard completo",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Atividades",
    description: "Histórico e log do sistema",
    icon: Activity,
    href: "/activity",
    stats: "Log em tempo real",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
];

const getQuickStats = (stats: DashboardStats) => {
  return [
    {
      title: "Total de Clientes",
      value: stats.totalClients.toString(),
      change: `${stats.clientsGrowth >= 0 ? "+" : ""}${
        stats.clientsGrowth
      } este mês`,
      icon: Users,
      trend:
        stats.clientsGrowth > 0
          ? "up"
          : stats.clientsGrowth < 0
          ? "down"
          : "neutral",
    },
    {
      title: "Vencendo Este Mês",
      value: stats.expiringThisMonth.toString(),
      change: "PER/DCOMPs",
      icon: AlertTriangle,
      trend: stats.expiringThisMonth > 5 ? "down" : "neutral",
    },
    {
      title: "PER/DCOMPs Registradas",
      value: stats.newPerdcompsThisMonth.toString(),
      change: `${stats.perdcompsGrowth >= 0 ? "+" : ""}${
        stats.perdcompsGrowth
      } registradas este mês`,
      icon: FileText,
      trend:
        stats.perdcompsGrowth > 0
          ? "up"
          : stats.perdcompsGrowth < 0
          ? "down"
          : "neutral",
    },
    {
      title: "Taxa de Aprovação",
      value: `${stats.approvalRate}%`,
      change: `${stats.approvedCount}/${stats.definedCount} definidos`,
      icon: Target,
      trend:
        stats.approvalRate >= 80
          ? "up"
          : stats.approvalRate >= 60
          ? "neutral"
          : "down",
    },
  ];
};

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const {
    loading: activityLoading,
    totalCount,
    fetchRecentActivities,
  } = useActivityStore();
  const period = useSettingsStore((state) => state.period);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClients: 0,
    newClientsThisMonth: 0,
    clientsGrowth: 0,
    expiringThisMonth: 0,
    newPerdcompsThisMonth: 0,
    perdcompsGrowth: 0,
    approvalRate: 0,
    approvedCount: 0,
    definedCount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (isAdmin) return; // Admin uses different dashboard

      setIsLoading(true);
      setError(null);

      try {
        const apiData = await fetchDashboardStats();
        const processedData = processApiData(apiData);

        setDashboardStats(processedData.dashboardStats);
        setMonthlyData(processedData.monthlyData);
        setStatusData(processedData.statusData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Erro ao carregar dados do dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isAdmin]);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Erro no Dashboard
                </h2>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navigationCards = getNavigationCards(dashboardStats);
  const quickStats = getQuickStats(dashboardStats);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-emerald-600" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleCardClick = (href: string) => {
    if (href === "/activity") {
      // Scroll to recent activities section instead of navigating
      const element = document.getElementById("recent-activities");
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      navigate(href);
    }
  };

  // Helper functions for contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Bom dia" };
    if (hour < 18) return { text: "Boa tarde" };
    return { text: "Boa noite" };
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Explore todas as funcionalidades do seu painel!",
      "Gerencie seus processos com eficiência!",
      "Mantenha tudo organizado e sob controle!",
      "Acesse relatórios e análises detalhadas!",
      "Otimize seu tempo com ferramentas inteligentes!",
      "Tenha visibilidade completa dos seus dados!",
    ];
    const sessionId = Date.now().toString().slice(-1); // Muda a cada login
    const messageIndex = parseInt(sessionId) % messages.length;
    return messages[messageIndex];
  };

  const greeting = getGreeting();
  const motivationalMsg = getMotivationalMessage();
  const displayName =
    user?.first_name || user?.username || user?.email || "Usuário";

  const refreshActivities = () => {
    fetchRecentActivities(period);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-emerald-50/80 dark:from-blue-950/20 dark:via-purple-950/15 dark:to-emerald-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.03),transparent_50%)]" />

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/20 dark:to-purple-800/20 blur-xl" />
        <div className="absolute bottom-6 left-8 h-12 w-12 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 dark:from-emerald-800/25 dark:to-teal-800/25 blur-lg" />

        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left Side - Greeting & Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                    <div className="h-full w-full rounded-2xl bg-background flex items-center justify-center">
                      <span className="text-lg font-semibold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
                </motion.div>

                {/* Greeting */}
                <div className="space-y-1">
                  <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-2xl md:text-3xl font-bold tracking-tight"
                  >
                    {greeting.text}, {displayName}!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="text-sm md:text-base text-muted-foreground font-medium"
                  >
                    {motivationalMsg}
                  </motion.p>
                </div>
              </div>

              {/* System Features Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 border border-blue-200 dark:border-blue-800/50">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Analytics Avançados
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Sistema Saudável
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 border border-purple-200 dark:border-purple-800/50">
                  <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Gestão Completa
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right Side - System Info */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-right space-y-2"
            >
              <div className="text-sm text-muted-foreground">
                {formattedDate}
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 border border-slate-200 dark:border-slate-700/50">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    v1.0.0
                  </span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  Build #2025.11.29
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border border-border/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                          {stat.title}
                        </span>
                        {isLoading ? (
                          <div className="mt-1 h-7 w-16 rounded bg-muted animate-pulse" />
                        ) : (
                          <span className="mt-1 text-2xl font-semibold">
                            {stat.value}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1">{getTrendIcon(stat.trend)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </Card>
            );
          })}
        </motion.section>

        {/* Navigation Cards */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {navigationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card
                  className="h-full cursor-pointer border border-border/70 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                  onClick={() => handleCardClick(card.href)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`h-10 w-10 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                        {card.title}
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      {card.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        {card.stats}
                      </span>
                      <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Charts */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Monthly Activity Chart */}
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Atividade dos Últimos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="opacity-20 dark:opacity-30 text-muted-foreground"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-foreground"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-foreground"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar
                    dataKey="clientes"
                    fill="#3b82f6"
                    name="Novos Clientes"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="perdcomps"
                    fill="#8b5cf6"
                    name="Novos PER/DCOMPs"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Distribuição de Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                      fontSize: "14px",
                    }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          id="recent-activities"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="h-4 w-4 text-primary" />
                  Atividade Recente
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getPeriodLabel()} • {totalCount} itens
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshActivities}
                    disabled={activityLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        activityLoading ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityTable />
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
