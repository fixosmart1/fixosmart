import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

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

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Customer Routes */}
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/services" component={Services} />
        <Route path="/products" component={Products} />
        <Route path="/booking" component={Booking} />
        <Route path="/expat-tools" component={ExpatTools} />
        <Route path="/profile" component={Profile} />

        {/* Admin Routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/products" component={AdminProducts} />

        {/* Technician Routes */}
        <Route path="/technician/dashboard" component={TechnicianDashboard} />
        <Route path="/technician/jobs" component={TechnicianJobs} />
        <Route path="/technician/earnings" component={TechnicianEarnings} />
        <Route path="/technician/profile" component={Profile} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

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
