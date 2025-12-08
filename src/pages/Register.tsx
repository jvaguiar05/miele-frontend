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
    username: z
      .string()
      .trim()
      .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
      .max(30, "Nome de usuário deve ter no máximo 30 caracteres")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Nome de usuário deve conter apenas letras, números e underscore"
      ),
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
        data.lastName,
        data.username
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
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-background via-background to-primary/5">
      <ThemeToggle variant="auth" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md lg:max-w-3xl xl:max-w-4xl"
      >
        <Button
          variant="ghost"
          className="mb-3 sm:mb-4 lg:mb-6 w-full sm:w-auto justify-start"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>

        <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
          <div className="lg:grid lg:grid-cols-5 lg:gap-0">
            {/* Left side - Header (desktop) / Top (mobile) */}
            <div className="lg:col-span-2 lg:flex lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-primary/5 lg:to-primary/10 p-4 sm:p-6 lg:p-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-3 sm:mb-4 lg:mb-6 shadow-lg">
                  <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2 lg:mb-3">
                  Criar conta
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md lg:max-w-none">
                  Preencha os dados abaixo para criar sua conta e começar a usar
                  nossa plataforma
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="lg:col-span-3 p-4 sm:p-6 lg:p-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3 sm:space-y-4 lg:space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Nome
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="João"
                      {...register("firstName")}
                      className={`h-9 sm:h-10 lg:h-11 text-sm ${
                        errors.firstName ? "border-destructive" : ""
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Sobrenome
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Silva"
                      {...register("lastName")}
                      className={`h-9 sm:h-10 lg:h-11 text-sm ${
                        errors.lastName ? "border-destructive" : ""
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@exemplo.com"
                    {...register("email")}
                    className={`h-9 sm:h-10 lg:h-11 text-sm ${
                      errors.email ? "border-destructive" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Nome de usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="joaosilva"
                    {...register("username")}
                    className={`h-9 sm:h-10 lg:h-11 text-sm ${
                      errors.username ? "border-destructive" : ""
                    }`}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      className={`h-9 sm:h-10 lg:h-11 text-sm ${
                        errors.password ? "border-destructive" : ""
                      }`}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                      className={`h-9 sm:h-10 lg:h-11 text-sm ${
                        errors.confirmPassword ? "border-destructive" : ""
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 sm:pt-3 lg:pt-4">
                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-11 lg:h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm font-medium"
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
                </div>

                <div className="text-center pt-1 sm:pt-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Fazer login
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
