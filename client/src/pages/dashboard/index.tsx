import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  DollarSign, 
  Users, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Calendar,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "@/components/orders/order-card";
import StatCard from "@/components/dashboard/stat-card";
import OrderFilter from "@/components/orders/order-filter";
import OrderForm from "@/components/orders/order-form";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  
  // Date ranges for different periods
  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Fetch work order stats
  const { data: orderStats, isLoading: isLoadingOrderStats } = useQuery<any>({
    queryKey: ['/api/stats'],
  });
  
  // Fetch work orders
  const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders', { status: statusFilter, technicianId: technicianFilter }],
  });
  
  // Fetch customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch technicians
  const { data: technicians = [], isLoading: isLoadingTechnicians } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });

  // Fetch financial data
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  // Fetch accounts payable
  const { data: accountsPayable = [], isLoading: isLoadingPayable } = useQuery<any[]>({
    queryKey: ['/api/transactions/accounts-payable'],
  });

  // Fetch accounts receivable
  const { data: accountsReceivable = [], isLoading: isLoadingReceivable } = useQuery<any[]>({
    queryKey: ['/api/transactions/accounts-receivable'],
  });

  // Fetch account balances
  const { data: accountBalances, isLoading: isLoadingBalances } = useQuery<any>({
    queryKey: ['/api/accounts/balances'],
  });

  // Fetch cash flow data
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useQuery<any>({
    queryKey: ['/api/reports/cash-flow'],
    queryFn: async () => {
      const { start, end } = getDateRange(selectedPeriod);
      const startDate = start.toISOString();
      const endDate = end.toISOString();
      
      const response = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch cash flow');
      return response.json();
    },
  });
  
  // Currency formatter
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue || 0);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  // Calculate financial KPIs
  const calculateFinancialKPIs = () => {
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    
    // Current month revenue
    const currentRevenue = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth(currentMonth))
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    // Last month revenue for comparison
    const lastMonthRevenue = transactions
      .filter(t => t.type === 'income' && 
        new Date(t.date) >= startOfMonth(lastMonth) && 
        new Date(t.date) < startOfMonth(currentMonth))
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    // Calculate growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Total payable amount
    const totalPayable = accountsPayable
      .filter(t => t.status !== 'paid')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    // Total receivable amount
    const totalReceivable = accountsReceivable
      .filter(t => t.status !== 'paid')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    // Overdue amounts
    const overduePayable = accountsPayable
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    const overdueReceivable = accountsReceivable
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    return {
      currentRevenue,
      revenueGrowth,
      totalPayable,
      totalReceivable,
      overduePayable,
      overdueReceivable,
      netCashFlow: (cashFlow?.netCashFlow || 0),
      totalBalance: (accountBalances?.totalBalance || 0)
    };
  };

  // Calculate customer KPIs
  const calculateCustomerKPIs = () => {
    const activeCustomers = customers.filter(c => c.isActive !== false).length;
    const totalCustomers = customers.length;
    
    // Customers with active orders
    const customersWithOrders = new Set(
      workOrders
        .filter(o => ['pending', 'in_progress'].includes(o.status))
        .map(o => o.customerId)
    ).size;

    return {
      totalCustomers,
      activeCustomers,
      customersWithOrders,
      customerRetentionRate: totalCustomers > 0 ? (customersWithOrders / totalCustomers) * 100 : 0
    };
  };

  // Find customer and technician by ID
  const findCustomer = (customerId: number) => {
    return customers.find(customer => customer.id === customerId) || { name: "Cliente Desconhecido" };
  };
  
  const findTechnician = (technicianId: number | null) => {
    if (!technicianId) return undefined;
    return technicians.find(technician => technician.id === technicianId);
  };

  // Calculate KPIs
  const financialKPIs = calculateFinancialKPIs();
  const customerKPIs = calculateCustomerKPIs();

  // Get recent orders (last 6)
  const recentOrders = workOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Loading state
  const isLoading = isLoadingOrderStats || isLoadingCustomers || isLoadingTechnicians || 
                   isLoadingTransactions || isLoadingBalances;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
              Dashboard Principal
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Resumo executivo do seu negócio • {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/finance'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Financeiro
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
            <TabsList>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="month">Este Mês</TabsTrigger>
              <TabsTrigger value="quarter">Trimestre</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Financial KPIs Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "..." : formatCurrency(financialKPIs.currentRevenue)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {financialKPIs.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={financialKPIs.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatPercentage(financialKPIs.revenueGrowth)}
                </span>
                <span className="ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Consolidado</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingBalances ? "..." : formatCurrency(financialKPIs.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo total das contas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {isLoadingReceivable ? "..." : formatCurrency(financialKPIs.totalReceivable)}
              </div>
              {financialKPIs.overdueReceivable > 0 && (
                <div className="flex items-center text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {formatCurrency(financialKPIs.overdueReceivable)} vencido
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoadingPayable ? "..." : formatCurrency(financialKPIs.totalPayable)}
              </div>
              {financialKPIs.overduePayable > 0 && (
                <div className="flex items-center text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {formatCurrency(financialKPIs.overduePayable)} vencido
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operations KPIs Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {isLoadingOrderStats ? "..." : orderStats?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando início
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingOrderStats ? "..." : orderStats?.inProgress || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Em execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingOrderStats ? "..." : orderStats?.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {isLoadingCustomers ? "..." : customerKPIs.activeCustomers}
              </div>
              <p className="text-xs text-muted-foreground">
                {customerKPIs.customersWithOrders} com ordens ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Ordens Recentes</TabsTrigger>
            <TabsTrigger value="financial">Resumo Financeiro</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ordens de Serviço Recentes</CardTitle>
                    <CardDescription>
                      Últimas ordens criadas no sistema
                    </CardDescription>
                  </div>
                  <OrderFilter 
                    onStatusChange={setStatusFilter}
                    onTechnicianChange={setTechnicianFilter}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="text-center py-10">Carregando ordens de serviço...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhuma ordem de serviço encontrada.</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Criar primeira ordem
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentOrders.map((order) => (
                      <OrderCard 
                        key={order.id}
                        order={order}
                        customer={findCustomer(order.customerId)}
                        technician={findTechnician(order.technicianId)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Fluxo de Caixa
                  </CardTitle>
                  <CardDescription>
                    Movimentação financeira do período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Entradas</span>
                    <span className="font-medium text-green-600">
                      {isLoadingCashFlow ? "..." : formatCurrency(cashFlow?.totalIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Saídas</span>
                    <span className="font-medium text-red-600">
                      {isLoadingCashFlow ? "..." : formatCurrency(cashFlow?.totalExpense || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Fluxo Líquido</span>
                      <span className={`font-bold ${financialKPIs.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {isLoadingCashFlow ? "..." : formatCurrency(financialKPIs.netCashFlow)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Contas em Atraso
                  </CardTitle>
                  <CardDescription>
                    Valores vencidos que requerem atenção
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">A Receber Vencido</span>
                    <Badge variant={financialKPIs.overdueReceivable > 0 ? "destructive" : "secondary"}>
                      {formatCurrency(financialKPIs.overdueReceivable)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">A Pagar Vencido</span>
                    <Badge variant={financialKPIs.overduePayable > 0 ? "destructive" : "secondary"}>
                      {formatCurrency(financialKPIs.overduePayable)}
                    </Badge>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total em Atraso</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(financialKPIs.overduePayable + financialKPIs.overdueReceivable)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Base de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Clientes</span>
                    <span className="font-medium">{customerKPIs.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clientes Ativos</span>
                    <span className="font-medium">{customerKPIs.activeCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Com Ordens Ativas</span>
                    <span className="font-medium">{customerKPIs.customersWithOrders}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Técnicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Técnicos</span>
                    <span className="font-medium">{technicians.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Com Ordens Ativas</span>
                    <span className="font-medium">
                      {new Set(workOrders.filter(o => o.status === 'in_progress').map(o => o.technicianId)).size}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Eficiência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                    <span className="font-medium">
                      {workOrders.length > 0 ? 
                        `${Math.round((orderStats?.completed || 0) / workOrders.length * 100)}%` : 
                        '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ordens Canceladas</span>
                    <span className="font-medium">{orderStats?.cancelled || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <OrderForm 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;