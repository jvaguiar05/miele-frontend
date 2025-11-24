import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AdminRoute } from "@/components/providers/admin-route";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Clients from "./pages/Clients";
import PerdComps from "./pages/PerdComps";
import Reports from "./pages/Reports";
import Configuration from "./pages/Configuration";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import OTP from "./pages/OTP";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

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
          <AuthProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp" element={<OTP />} />
            
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/admin-dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<Clients />} />
              <Route path="/perdcomps" element={<PerdComps />} />
              <Route path="/perdcomps/:id" element={<PerdComps />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/configuration" element={<Configuration />} />
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
