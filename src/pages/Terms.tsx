import { motion } from "framer-motion";
import { ScrollText, Calendar, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Aceitação dos Termos",
      content: "Ao utilizar o sistema Miele, você concorda com todos os termos e condições estabelecidos neste documento. Se você não concordar com qualquer parte destes termos, não poderá utilizar nossos serviços."
    },
    {
      title: "2. Uso do Serviço",
      content: "O sistema Miele é destinado exclusivamente para gerenciamento de processos tributários e administrativos. É proibido o uso do sistema para atividades ilegais ou não autorizadas."
    },
    {
      title: "3. Conta de Usuário",
      content: "Você é responsável por manter a confidencialidade de sua conta e senha, bem como por todas as atividades que ocorram sob sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado."
    },
    {
      title: "4. Propriedade Intelectual",
      content: "Todo o conteúdo, recursos e funcionalidades do sistema Miele são propriedade exclusiva da empresa e estão protegidos por leis de direitos autorais e propriedade intelectual."
    },
    {
      title: "5. Limitação de Responsabilidade",
      content: "O sistema Miele é fornecido 'como está'. Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. Não nos responsabilizamos por perdas ou danos decorrentes do uso do sistema."
    },
    {
      title: "6. Modificações dos Termos",
      content: "Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação. O uso continuado do sistema constitui aceitação dos termos modificados."
    },
    {
      title: "7. Rescisão",
      content: "Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por qualquer motivo, incluindo violação destes termos de serviço."
    },
    {
      title: "8. Lei Aplicável",
      content: "Estes termos são regidos pelas leis do Brasil. Qualquer disputa relacionada a estes termos será resolvida nos tribunais competentes do Brasil."
    }
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
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Termos de Serviço</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <p className="text-sm">Última atualização: Janeiro de 2024</p>
            </div>
          </div>

          <Card className="p-8 border-border/50 bg-card/50 backdrop-blur">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground mb-8">
                Estes Termos de Serviço ("Termos") regem o uso do sistema Miele e todos os serviços relacionados. 
                Por favor, leia atentamente antes de utilizar nosso sistema.
              </p>

              <div className="space-y-8">
                {sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-3">Contato</h3>
                <p className="text-sm text-muted-foreground">
                  Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li>Email: juridico@miele.com.br</li>
                  <li>Telefone: (11) 9999-9999</li>
                  <li>Endereço: Av. Principal, 1000 - São Paulo, SP</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}