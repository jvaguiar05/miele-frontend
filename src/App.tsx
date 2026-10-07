import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthErrorBoundary } from "@/components/providers/auth-error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { lazy, Suspense } from "react";

// Pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/OperationalDashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const PerdComps = lazy(() => import("./pages/PerdComps"));
const Reports = lazy(() => import("./pages/UpcomingReport"));
const StatusReport = lazy(() => import("./pages/StatusReport"));
const QuarterClosing = lazy(() => import("./pages/QuarterClosing"));
const DailyUpdates = lazy(() => import("./pages/DailyUpdates"));
const SelicReport = lazy(() => import("./pages/SelicReport"));
const Profile = lazy(() => import("./pages/Profile"));
const Requests = lazy(() => import("./pages/Requests"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Support = lazy(() => import("./pages/Support"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient();

const PageLoading = () => (
  <div className="flex min-h-screen items-center justify-center" role="status">
    <span className="text-sm text-muted-foreground">Carregando...</span>
  </div>
);

// Layout wrapper for authenticated pages
const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthErrorBoundary>
            <AuthProvider>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/forgot-password"
                    element={<Navigate to="/login" replace />}
                  />
                  <Route path="/otp" element={<Navigate to="/login" replace />} />

                  {/* Protected routes with layout */}
                  <Route element={<AppLayout />}>
                    <Route path="/home" element={<Home />} />
                    <Route
                      path="/admin-dashboard"
                      element={<Navigate to="/home" replace />}
                    />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<Clients />} />
                    <Route path="/perdcomps" element={<PerdComps />} />
                    <Route path="/perdcomps/:id" element={<PerdComps />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/status" element={<StatusReport />} />
                    <Route path="/reports/quarters" element={<QuarterClosing />} />
                    <Route path="/reports/updates" element={<DailyUpdates />} />
                    <Route
                      path="/reports/selic"
                      element={<SelicReport key="accumulated" />}
                    />
                    <Route
                      path="/reports/selic-monthly"
                      element={<SelicReport key="monthly" monthly />}
                    />
                    <Route
                      path="/configuration"
                      element={<Navigate to="/profile" replace />}
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                  </Route>

                  {/* Root redirect */}
                  <Route path="/" element={<Navigate to="/home" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </AuthErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
