import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Cookies from "js-cookie";

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
  const { isAuthenticated, initialize, refreshToken, signOut } = useAuthStore();
  const lastActivityRef = useRef<number>(Date.now());
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Token verification and page visibility management
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenValidity = async () => {
      const accessToken = Cookies.get("access_token");
      const refreshTokenCookie = Cookies.get("refresh_token");

      // If no tokens exist, logout
      if (!accessToken && !refreshTokenCookie) {
        console.log("No tokens found, logging out");
        await signOut();
        return;
      }

      // If access token is missing but refresh token exists, try to refresh
      if (!accessToken && refreshTokenCookie) {
        try {
          console.log("Access token missing, attempting refresh");
          await refreshToken();
          console.log("Token refresh successful");
        } catch (error) {
          console.error("Token refresh failed:", error);
          await signOut();
        }
        return;
      }

      // Parse token to check expiration
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split(".")[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiration = expirationTime - now;

          // If token expires in less than 2 minutes, refresh it proactively
          if (timeUntilExpiration < 2 * 60 * 1000 && timeUntilExpiration > 0) {
            try {
              console.log("Token expiring soon, refreshing proactively");
              await refreshToken();
              console.log("Proactive token refresh successful");
            } catch (error) {
              console.error("Proactive token refresh failed:", error);
              await signOut();
            }
          }
          // If token is already expired
          else if (timeUntilExpiration <= 0) {
            try {
              console.log("Token expired, attempting refresh");
              await refreshToken();
              console.log("Expired token refresh successful");
            } catch (error) {
              console.error("Expired token refresh failed:", error);
              await signOut();
            }
          }
        } catch (error) {
          console.error("Error parsing token:", error);
          await signOut();
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;

        // If page was hidden for more than 5 minutes, check token validity
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          console.log(
            "Page visible after extended background time, checking tokens"
          );
          await checkTokenValidity();
        }

        lastActivityRef.current = now;
      }
    };

    const handleFocus = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // If window was unfocused for more than 5 minutes, check token validity
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        console.log("Window focused after extended time, checking tokens");
        await checkTokenValidity();
      }

      lastActivityRef.current = now;
    };

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Set up periodic token check (every 10 minutes)
    tokenCheckIntervalRef.current = setInterval(async () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        await checkTokenValidity();
      }
    }, 10 * 60 * 1000); // 10 minutes

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", updateActivity);
    document.addEventListener("keypress", updateActivity);
    document.addEventListener("scroll", updateActivity);

    // Initial token check
    checkTokenValidity();

    return () => {
      // Cleanup
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", updateActivity);
      document.removeEventListener("keypress", updateActivity);
      document.removeEventListener("scroll", updateActivity);
    };
  }, [isAuthenticated, refreshToken, signOut]);

  return <>{children}</>;
}
