import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, Bell, Calendar, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  const privacyFeatures = [
    {
      icon: Lock,
      title: "Criptografia de Dados",
      description: "Todos os dados são criptografados em trânsito e em repouso usando padrões industriais.",
    },
    {
      icon: UserCheck,
      title: "Controle de Acesso",
      description: "Acesso restrito baseado em funções e permissões específicas de cada usuário.",
    },
    {
      icon: Eye,
      title: "Transparência Total",
      description: "Você sempre saberá quais dados coletamos e como são utilizados.",
    },
    {
      icon: Database,
      title: "Backup Seguro",
      description: "Backups regulares e seguros para garantir a integridade dos seus dados.",
    },
  ];

  const sections = [
    {
      title: "Informações que Coletamos",
      items: [
        "Dados de cadastro (nome, email, telefone)",
        "Informações de uso do sistema",
        "Dados de clientes e processos",
        "Logs de atividades para auditoria",
      ],
    },
    {
      title: "Como Usamos suas Informações",
      items: [
        "Fornecer e melhorar nossos serviços",
        "Comunicar atualizações e novidades",
        "Garantir a segurança do sistema",
        "Cumprir obrigações legais e regulatórias",
      ],
    },
    {
      title: "Compartilhamento de Dados",
      items: [
        "Não vendemos seus dados para terceiros",
        "Compartilhamos apenas quando legalmente obrigatório",
        "Parceiros de serviço sob acordos de confidencialidade",
        "Com seu consentimento explícito",
      ],
    },
    {
      title: "Seus Direitos",
      items: [
        "Acessar seus dados pessoais",
        "Corrigir informações incorretas",
        "Solicitar exclusão de dados",
        "Exportar seus dados em formato padrão",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Sua privacidade é nossa prioridade
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <p className="text-sm">Última atualização: Janeiro de 2024</p>
            </div>
          </div>

          {/* Privacy Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {privacyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 border-border/50 bg-card/50 backdrop-blur h-full">
                    <Icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Privacy Policy Content */}
          <Card className="p-8 border-border/50 bg-card/50 backdrop-blur mb-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground mb-8">
                O sistema Miele está comprometido em proteger sua privacidade e dados pessoais. 
                Esta política descreve como coletamos, usamos e protegemos suas informações em 
                conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>

              <div className="space-y-8">
                {sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <h2 className="text-xl font-semibold mb-4 text-foreground">
                      {section.title}
                    </h2>
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-muted/30 rounded-lg">
                  <Bell className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Notificações</h3>
                  <p className="text-sm text-muted-foreground">
                    Informaremos sobre qualquer mudança significativa em nossa política de privacidade
                    através do email cadastrado.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <Shield className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Segurança</h3>
                  <p className="text-sm text-muted-foreground">
                    Implementamos medidas técnicas e organizacionais apropriadas para proteger
                    seus dados contra acesso não autorizado.
                  </p>
                </div>
              </div>

              <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/10">
                <h3 className="font-semibold mb-3">Entre em Contato</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Para questões sobre privacidade ou exercer seus direitos:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>DPO: privacidade@miele.com.br</li>
                  <li>Telefone: (11) 9999-9999</li>
                  <li>Ouvidoria: ouvidoria@miele.com.br</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}