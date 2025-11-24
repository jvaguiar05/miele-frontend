import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Users, FileText, TrendingUp, Shield, ChevronLeft, ChevronRight, Clock, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInAsTestUser } = useAuthStore();
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselItems = [
    {
      icon: Users,
      title: "Gestão Tributária Completa",
      description: "Acompanhe todos os processos fiscais dos seus clientes em uma única plataforma integrada",
      highlight: "Redução de 70% no tempo de análise"
    },
    {
      icon: FileText,
      title: "PER/DCOMP Automatizado",
      description: "Gerencie declarações e compensações tributárias com inteligência e precisão",
      highlight: "100% de conformidade fiscal"
    },
    {
      icon: TrendingUp,
      title: "Relatórios Inteligentes",
      description: "Dashboards personalizados com insights em tempo real para tomada de decisão",
      highlight: "Análises preditivas avançadas"
    },
    {
      icon: Shield,
      title: "Segurança Garantida",
      description: "Seus dados protegidos com criptografia de ponta e backup automático",
      highlight: "Certificação ISO 27001"
    },
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Automatize tarefas repetitivas e foque no que realmente importa",
      highlight: "5 horas economizadas por semana"
    },
    {
      icon: BarChart3,
      title: "Controle Total",
      description: "Visão completa de todos os processos e pendências em um só lugar",
      highlight: "Dashboard executivo em tempo real"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Temporary: bypass authentication - any login works as test user
    signInAsTestUser();
    toast({
      title: "Login realizado com sucesso!",
      description: "Bem-vindo ao Miele (modo teste).",
    });
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex">
      <ThemeToggle variant="auth" />
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">M</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-2">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Lembrar-me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </span>
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Novo por aqui?{" "}
              <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Criar uma conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Dynamic Carousel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        
        <div className="relative flex flex-col items-center justify-center w-full p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-8 max-w-lg"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl">
                {(() => {
                  const Icon = carouselItems[currentSlide].icon;
                  return <Icon className="w-12 h-12 text-primary-foreground" />;
                })()}
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-foreground">
                {carouselItems[currentSlide].title}
              </h3>

              {/* Description */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                {carouselItems[currentSlide].description}
              </p>

              {/* Highlight Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {carouselItems[currentSlide].highlight}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button
              onClick={handlePrevSlide}
              className="p-2 rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-background/70 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentSlide
                      ? "w-8 bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextSlide}
              className="p-2 rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-background/70 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}