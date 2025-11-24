import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRequestStore } from "@/stores/requestStore";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateRequestModal({ open, onOpenChange }: CreateRequestModalProps) {
  const { createRequest } = useRequestStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    reason: "",
    details: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.reason) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha o assunto e a justificativa.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await createRequest({
        subject: formData.subject,
        reason: formData.reason,
        action: 'custom',
        resource_type: 'custom',
        resource_id: `custom_${Date.now()}`,
        payload_diff: {
          details: formData.details || 'Sem detalhes adicionais'
        },
        metadata: {
          created_manually: true,
          creation_timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Solicitação criada",
        description: "Sua solicitação personalizada foi criada com sucesso e está aguardando aprovação.",
      });
      
      // Reset form
      setFormData({
        subject: "",
        reason: "",
        details: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar a solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      subject: "",
      reason: "",
      details: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Solicitação Personalizada</DialogTitle>
          <DialogDescription>
            Crie solicitações personalizadas para ações que não são geradas automaticamente pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Nota:</strong> Solicitações relacionadas a clientes e PER/DCOMP são criadas automaticamente 
            quando você tenta realizar ações sensíveis no sistema. Use este formulário apenas para 
            solicitações personalizadas ou ações especiais.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Ex: Solicitação de acesso especial ao relatório X"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Descreva brevemente o que você está solicitando
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Justificativa *</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo desta solicitação e por que ela é necessária..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="min-h-[100px] resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Forneça uma justificativa clara para facilitar a análise pelo aprovador
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detalhes Adicionais (Opcional)</Label>
            <Textarea
              id="details"
              placeholder="Inclua qualquer informação adicional relevante..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Solicitação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
