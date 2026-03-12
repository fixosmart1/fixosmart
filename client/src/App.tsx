import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-api";
import { ReactNode } from "react";

import { LanguageProvider } from "./hooks/use-language";
import { Layout } from "./components/Layout";

// Customer Pages
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { Products } from "./pages/Products";
import { Booking } from "./pages/Booking";
import { ExpatTools } from "./pages/ExpatTools";
import { Profile } from "./pages/Profile";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminServices } from "./pages/admin/AdminServices";
import { AdminProducts } from "./pages/admin/AdminProducts";

// Technician Pages
import { TechnicianDashboard } from "./pages/technician/TechnicianDashboard";
import { TechnicianJobs } from "./pages/technician/TechnicianJobs";
import { TechnicianEarnings } from "./pages/technician/TechnicianEarnings";

// ─── Route Guards ───────────────────────────────────────────────────────────

function RequireAuth({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Not logged in → go to profile/login
    setLocation('/profile');
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role || 'customer')) {
    // Wrong role → redirect to their home
    const home = user.role === 'admin' ? '/admin' : user.role === 'technician' ? '/technician/dashboard' : '/';
    setLocation(home);
    return null;
  }

  return <>{children}</>;
}

// ─── Router ─────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public customer pages */}
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/products" component={Products} />
        <Route path="/profile" component={Profile} />

        {/* Protected customer pages */}
        <Route path="/dashboard">
          <RequireAuth allowedRoles={['customer', 'admin']}>
            <Dashboard />
          </RequireAuth>
        </Route>
        <Route path="/booking">
          <RequireAuth>
            <Booking />
          </RequireAuth>
        </Route>
        <Route path="/expat-tools">
          <RequireAuth>
            <ExpatTools />
          </RequireAuth>
        </Route>

        {/* Admin-only routes */}
        <Route path="/admin">
          <RequireAuth allowedRoles={['admin']}>
            <AdminDashboard />
          </RequireAuth>
        </Route>
        <Route path="/admin/users">
          <RequireAuth allowedRoles={['admin']}>
            <AdminUsers />
          </RequireAuth>
        </Route>
        <Route path="/admin/bookings">
          <RequireAuth allowedRoles={['admin']}>
            <AdminBookings />
          </RequireAuth>
        </Route>
        <Route path="/admin/services">
          <RequireAuth allowedRoles={['admin']}>
            <AdminServices />
          </RequireAuth>
        </Route>
        <Route path="/admin/products">
          <RequireAuth allowedRoles={['admin']}>
            <AdminProducts />
          </RequireAuth>
        </Route>

        {/* Technician-only routes */}
        <Route path="/technician/dashboard">
          <RequireAuth allowedRoles={['technician', 'admin']}>
            <TechnicianDashboard />
          </RequireAuth>
        </Route>
        <Route path="/technician/jobs">
          <RequireAuth allowedRoles={['technician', 'admin']}>
            <TechnicianJobs />
          </RequireAuth>
        </Route>
        <Route path="/technician/earnings">
          <RequireAuth allowedRoles={['technician', 'admin']}>
            <TechnicianEarnings />
          </RequireAuth>
        </Route>
        <Route path="/technician/profile">
          <RequireAuth allowedRoles={['technician', 'admin']}>
            <Profile />
          </RequireAuth>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
