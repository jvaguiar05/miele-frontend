import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, Clock, Users, FileText, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for metrics
const metrics = {
  totalUsers: 1247,
  pendingRequests: 23,
  approvedRequests: 156,
  rejectedRequests: 34,
  activeClients: 89,
  activePerdComps: 142,
};

// Mock data for charts
const monthlyData = [
  { month: 'Jan', solicitacoes: 45, aprovadas: 38, recusadas: 7 },
  { month: 'Fev', solicitacoes: 52, aprovadas: 44, recusadas: 8 },
  { month: 'Mar', solicitacoes: 61, aprovadas: 53, recusadas: 8 },
  { month: 'Abr', solicitacoes: 58, aprovadas: 49, recusadas: 9 },
  { month: 'Mai', solicitacoes: 67, aprovadas: 58, recusadas: 9 },
  { month: 'Jun', solicitacoes: 73, aprovadas: 65, recusadas: 8 },
];

const requestTypeData = [
  { name: 'Retificação', value: 45, color: '#3b82f6' },
  { name: 'Cancelamento', value: 28, color: '#ef4444' },
  { name: 'Atualização', value: 67, color: '#10b981' },
  { name: 'Consulta', value: 34, color: '#f59e0b' },
];

interface Request {
  id: string;
  subject: string;
  user: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  resource: string;
}

const mockRequests: Request[] = [
  { id: 'REQ-001', subject: 'Retificação de dados cadastrais', user: 'João Silva', type: 'retificacao', status: 'pending', date: '2025-10-03 09:15', resource: 'Cliente ABC Ltda' },
  { id: 'REQ-002', subject: 'Cancelamento de processo', user: 'Maria Santos', type: 'cancelamento', status: 'pending', date: '2025-10-03 08:45', resource: 'Processo 12345/2024' },
  { id: 'REQ-003', subject: 'Atualização de valores', user: 'Pedro Costa', type: 'atualizacao', status: 'pending', date: '2025-10-03 08:20', resource: 'PER/DCOMP 789' },
  { id: 'REQ-004', subject: 'Consulta de status', user: 'Ana Paula', type: 'consulta', status: 'approved', date: '2025-10-02 16:30', resource: 'Cliente XYZ S.A.' },
  { id: 'REQ-005', subject: 'Retificação de endereço', user: 'Carlos Oliveira', type: 'retificacao', status: 'pending', date: '2025-10-02 15:10', resource: 'Cliente DEF ME' },
  { id: 'REQ-006', subject: 'Cancelamento de solicitação', user: 'Fernanda Lima', type: 'cancelamento', status: 'rejected', date: '2025-10-02 14:00', resource: 'Processo 67890/2024' },
];

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  action: string;
  user: string;
  details: string;
}

const mockLogs: SystemLog[] = [
  { id: 'LOG-001', timestamp: '2025-10-03 10:25:34', level: 'info', action: 'Login', user: 'admin@sistema.com', details: 'Login bem-sucedido' },
  { id: 'LOG-002', timestamp: '2025-10-03 10:20:15', level: 'info', action: 'Aprovação', user: 'admin@sistema.com', details: 'Solicitação REQ-004 aprovada' },
  { id: 'LOG-003', timestamp: '2025-10-03 09:45:22', level: 'warning', action: 'Tentativa de acesso', user: 'joao@email.com', details: 'Tentativa de acesso a área restrita' },
  { id: 'LOG-004', timestamp: '2025-10-03 09:30:11', level: 'info', action: 'Cadastro', user: 'maria@email.com', details: 'Novo cliente cadastrado: ABC Ltda' },
  { id: 'LOG-005', timestamp: '2025-10-03 09:15:45', level: 'error', action: 'Erro de validação', user: 'pedro@email.com', details: 'Falha ao validar CNPJ' },
  { id: 'LOG-006', timestamp: '2025-10-03 08:50:33', level: 'info', action: 'Atualização', user: 'ana@email.com', details: 'Dados do processo 12345/2024 atualizados' },
];

export default function AdminDashboard() {
  const [requests, setRequests] = useState<Request[]>(mockRequests);

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    ));
    toast.success('Solicitação aprovada com sucesso!');
  };

  const handleReject = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    ));
    toast.error('Solicitação recusada.');
  };

  const getStatusBadge = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Recusada</Badge>;
    }
  };

  const getLogLevelBadge = (level: SystemLog['level']) => {
    switch (level) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Info</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema e gerenciamento de solicitações</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 text-green-500" /> +12% desde último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recusadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rejectedRequests}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Solicitações</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="solicitacoes" stroke="#3b82f6" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="aprovadas" stroke="#10b981" strokeWidth={2} name="Aprovadas" />
                <Line type="monotone" dataKey="recusadas" stroke="#ef4444" strokeWidth={2} name="Recusadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Solicitação</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {requestTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">
            <FileText className="w-4 h-4 mr-2" />
            Gerenciador de Solicitações
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="w-4 h-4 mr-2" />
            Logs do Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>Gerencie as solicitações dos usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">{request.id}</TableCell>
                      <TableCell className="font-medium">{request.subject}</TableCell>
                      <TableCell>{request.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{request.resource}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm">{request.date}</TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-muted-foreground">Finalizada</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Histórico de atividades e eventos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
