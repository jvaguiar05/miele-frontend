"use client";

import {
  LogOut,
  User,
  Settings,
  ChevronRight,
  Briefcase,
  Mail,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/home" },
    { label: "Clientes", href: "/clients" },
    { label: "PER/DCOMP", href: "/perdcomps" },
    { label: "Solicitações", href: "/requests" },
  ];

  const isActive = (path: string) => {
    if (path === "/home" && location.pathname === "/") return true;
    return location.pathname.startsWith(path);
  };

  // Get user data from auth store
  const getUserRole = () => {
    if (!user?.role) return "Usuário";

    switch (user.role) {
      case "admin":
        return "Administrador";
      case "employee":
        return "Funcionário";
      default:
        return "Usuário";
    }
  };

  const userRole = getUserRole();
  const memberSince = user?.date_joined
    ? new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "numeric",
      }).format(new Date(user.date_joined))
    : "N/A";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4">
        <div className="flex h-14 items-center">
          <div className="flex items-center gap-8 flex-1">
            <Link to="/home" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <span className="text-primary-foreground font-bold text-lg">
                  M
                </span>
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block text-foreground">
                Miele
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {isActive(item.href) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative gap-2 px-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {profile?.full_name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                {/* User Profile Section */}
                <div className="p-4 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {user?.username?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {user?.username}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                        >
                          {userRole}
                        </Badge>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Membro desde {memberSince}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1">
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer p-2.5 rounded-md"
                  >
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-3 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">Meu Perfil</p>
                        <p className="text-xs text-muted-foreground">
                          Gerencie suas informações pessoais
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer p-2.5 rounded-md"
                  >
                    <Link to="/configuration" className="flex items-center">
                      <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">Configurações</p>
                        <p className="text-xs text-muted-foreground">
                          Preferências e configurações do sistema
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer p-2.5 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="text-sm font-medium">Encerrar Sessão</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
