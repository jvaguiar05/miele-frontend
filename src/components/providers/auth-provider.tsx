import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
];

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app start
    initialize();
  }, [initialize]);

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      location.pathname.startsWith(route)
    );

    if (!isAuthenticated && !isPublicRoute) {
      navigate("/login", { replace: true });
    } else if (
      isAuthenticated &&
      (location.pathname === "/login" || location.pathname === "/register")
    ) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return <>{children}</>;
}
