import { useState } from "react";
import { FileText, Download, Calendar, TrendingUp, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const { toast } = useToast();

  const handleGenerateReport = () => {
    toast({
      title: "Gerando relatório",
      description: "O relatório será baixado em breve.",
    });
  };

  const reportTypes = [
    { id: "clients", name: "Relatório de Clientes", icon: Users, description: "Lista completa de clientes" },
    { id: "perdcomps", name: "Relatório de PER/DCOMPs", icon: FileText, description: "Status de restituições" },
    { id: "financial", name: "Relatório Financeiro", icon: DollarSign, description: "Resumo financeiro" },
    { id: "analytics", name: "Relatório Analítico", icon: TrendingUp, description: "Análise de desempenho" },
  ];

  return (
    <div className="min-h-full p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-sm text-muted-foreground">
              Gere relatórios personalizados do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  reportType === report.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setReportType(report.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {reportType && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações do Relatório</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                    <SelectItem value="quarter">Último Trimestre</SelectItem>
                    <SelectItem value="year">Último Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerateReport}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}