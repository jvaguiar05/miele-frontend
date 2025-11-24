import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(50, "Nome deve ter no máximo 50 caracteres"),
    lastName: z
      .string()
      .trim()
      .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
      .max(50, "Sobrenome deve ter no máximo 50 caracteres"),
    email: z
      .string()
      .trim()
      .email("Email inválido")
      .max(255, "Email deve ter no máximo 255 caracteres"),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await signUp(
        data.email,
        data.password,
        data.firstName,
        data.lastName
      );

      toast({
        title: "Conta criada com sucesso!",
        description: `${result.message} Sua conta está pendente de aprovação pelos administradores.`,
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <ThemeToggle variant="auth" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>

        <div className="bg-card border rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Criar conta
            </h2>
            <p className="text-muted-foreground mt-2">
              Preencha os dados abaixo para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="João"
                  {...register("firstName")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Silva"
                  {...register("lastName")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
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
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Criando conta...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar conta
                </span>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
