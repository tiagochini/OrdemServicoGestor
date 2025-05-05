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
import CustomersList from "@/pages/customers";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import FinanceOverview from "@/pages/finance";
import Transactions from "@/pages/finance/transactions";
import AccountsPayable from "@/pages/finance/accounts-payable";
import AccountsReceivable from "@/pages/finance/accounts-receivable";
import Accounts from "@/pages/finance/accounts";
import Budgets from "@/pages/finance/budgets";
import Reports from "@/pages/finance/reports";
import Catalog from "@/pages/catalog";
import CatalogItemDetails from "@/pages/catalog/[id]";
import NewCatalogItem from "@/pages/catalog/new";
import EditCatalogItem from "@/pages/catalog/edit/[id]";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/orders" component={OrdersList} />
      <ProtectedRoute path="/orders/:id" component={OrderDetails} />
      <ProtectedRoute path="/technicians" component={TechniciansList} />
      <ProtectedRoute path="/customers" component={CustomersList} />
      <ProtectedRoute path="/finance" component={FinanceOverview} />
      <ProtectedRoute path="/finance/transactions" component={Transactions} />
      <ProtectedRoute path="/finance/accounts-payable" component={AccountsPayable} />
      <ProtectedRoute path="/finance/accounts-receivable" component={AccountsReceivable} />
      <ProtectedRoute path="/finance/accounts" component={Accounts} />
      <ProtectedRoute path="/finance/budgets" component={Budgets} />
      <ProtectedRoute path="/finance/reports" component={Reports} />
      <ProtectedRoute path="/catalog" component={Catalog} />
      <ProtectedRoute path="/catalog/new" component={NewCatalogItem} />
      <ProtectedRoute path="/catalog/edit/:id" component={EditCatalogItem} />
      <ProtectedRoute path="/catalog/:id" component={CatalogItemDetails} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <MainLayout>
            <Router />
          </MainLayout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
