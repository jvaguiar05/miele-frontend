import { motion } from "framer-motion";
import { MessageCircle, Mail, Phone, Clock, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Chat ao Vivo",
    description: "Converse com nossa equipe em tempo real",
    availability: "Seg-Sex, 9h-18h",
    action: "Iniciar Chat",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Envie suas dúvidas por email",
    availability: "Resposta em até 24h",
    action: "suporte@miele.com.br",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Phone,
    title: "Telefone",
    description: "Fale diretamente com nossos especialistas",
    availability: "Seg-Sex, 8h-20h",
    action: "(11) 9999-9999",
    color: "from-purple-500 to-purple-600",
  },
];

const faqItems = [
  {
    question: "Como faço para redefinir minha senha?",
    answer: "Você pode redefinir sua senha clicando em 'Esqueci minha senha' na tela de login.",
  },
  {
    question: "Como exporto relatórios?",
    answer: "Na página de relatórios, clique no botão 'Exportar' e escolha o formato desejado.",
  },
  {
    question: "Qual o limite de clientes que posso cadastrar?",
    answer: "O limite varia de acordo com seu plano. Consulte a página de configurações para mais detalhes.",
  },
];

export default function Support() {
  const navigate = useNavigate();

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
            <h1 className="text-4xl font-bold mb-4">Central de Suporte</h1>
            <p className="text-lg text-muted-foreground">
              Estamos aqui para ajudar. Escolha como prefere entrar em contato.
            </p>
          </div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${channel.color} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{channel.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {channel.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Clock className="h-3 w-3" />
                      {channel.availability}
                    </div>
                    <Button className="w-full" variant="outline">
                      {channel.action}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card
                  key={index}
                  className="p-6 border-border/50 bg-card/50 backdrop-blur"
                >
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}