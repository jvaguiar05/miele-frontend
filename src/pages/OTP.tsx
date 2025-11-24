import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";

export default function OTPPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Código verificado!",
        description: "Você será redirecionado em instantes.",
      });
      
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Código inválido ou expirado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      // Simulate resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Código reenviado",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao reenviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <ThemeToggle variant="auth" />
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Verificação OTP
            </h1>
            <p className="text-muted-foreground">
              Digite o código de 6 dígitos enviado para seu email
            </p>
          </div>
        </div>

        {/* OTP Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Código de verificação
            </label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono h-14"
              maxLength={6}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground text-center">
              {otp.length}/6 dígitos
            </p>
          </div>

          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar Código"
            )}
          </Button>

          {/* Resend Section */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-primary hover:text-primary/80"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                "Reenviar código"
              )}
            </Button>
          </div>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <Button variant="ghost" asChild>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Link>
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Dica de Segurança</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Nunca compartilhe seu código OTP com outras pessoas. O código expira em 10 minutos.
          </p>
        </div>
      </div>
    </div>
  );
}