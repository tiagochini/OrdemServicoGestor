import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import OrdersList from "@/pages/orders";
import OrderDetails from "@/pages/orders/[id]";
import TechniciansList from "@/pages/technicians";
import TechnicianDetails from "@/pages/technicians/[id]";
import CustomersList from "@/pages/customers";
import CustomerDetails from "@/pages/customers/[id]";
import Settings from "@/pages/settings";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import FinanceOverview from "@/pages/finance";
import Transactions from "@/pages/finance/transactions";
import AccountsPayable from "@/pages/finance/accounts-payable";
import AccountsReceivable from "@/pages/finance/accounts-receivable";
import Accounts from "@/pages/finance/accounts";
import Budgets from "@/pages/finance/budgets";
import Reports from "@/pages/finance/reports";
import DetailedReports from "@/pages/reports";
import Catalog from "@/pages/catalog";
import CatalogItemDetails from "@/pages/catalog/[id]";
import NewCatalogItem from "@/pages/catalog/new";
import EditCatalogItem from "@/pages/catalog/edit/[id]";
import UsersPage from "@/pages/admin/users";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Route path={path}><Login /></Route>;
  }
  
  if (user?.mustChangePassword) {
    return <Route path={path}><ChangePassword /></Route>;
  }
  
  return <Route path={path} component={Component} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/change-password" component={ChangePassword} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/orders" component={OrdersList} />
      <ProtectedRoute path="/orders/:id" component={OrderDetails} />
      <ProtectedRoute path="/technicians/:id" component={TechnicianDetails} />
      <ProtectedRoute path="/technicians" component={TechniciansList} />
      <ProtectedRoute path="/customers/:id" component={CustomerDetails} />
      <ProtectedRoute path="/customers" component={CustomersList} />
      <ProtectedRoute path="/finance" component={FinanceOverview} />
      <ProtectedRoute path="/finance/transactions" component={Transactions} />
      <ProtectedRoute path="/finance/accounts-payable" component={AccountsPayable} />
      <ProtectedRoute path="/finance/accounts-receivable" component={AccountsReceivable} />
      <ProtectedRoute path="/finance/accounts" component={Accounts} />
      <ProtectedRoute path="/finance/budgets" component={Budgets} />
      <ProtectedRoute path="/finance/reports" component={Reports} />
      <ProtectedRoute path="/reports" component={DetailedReports} />
      <ProtectedRoute path="/catalog" component={Catalog} />
      <ProtectedRoute path="/catalog/new" component={NewCatalogItem} />
      <ProtectedRoute path="/catalog/edit/:id" component={EditCatalogItem} />
      <ProtectedRoute path="/catalog/:id" component={CatalogItemDetails} />
      <ProtectedRoute path="/admin/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Toaster />
      <MainLayout>
        <Router />
      </MainLayout>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
