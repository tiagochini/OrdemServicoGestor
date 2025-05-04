import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Receipt, CreditCard, ArrowDownRight, ArrowUpRight, BarChart, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const FinanceOverview = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");

  // Consulta para obter saldos das contas
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["/api/accounts/balances"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar saldos das contas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter contas a pagar
  const { data: payableData, isLoading: isLoadingPayable } = useQuery({
    queryKey: ["/api/transactions/accounts-payable"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter contas a receber
  const { data: receivableData, isLoading: isLoadingReceivable } = useQuery({
    queryKey: ["/api/transactions/accounts-receivable"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar contas a receber",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Determinar a data inicial com base no período selecionado
  const getStartDate = () => {
    const today = new Date();
    const startDate = new Date(today);

    if (period === "week") {
      startDate.setDate(today.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    return startDate.toISOString().split('T')[0];
  };

  // Consulta para obter fluxo de caixa
  const { data: cashFlowData, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ["/api/reports/cash-flow", period],
    queryFn: async () => {
      const startDate = getStartDate();
      const endDate = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de fluxo de caixa");
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar fluxo de caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingAccounts || isLoadingPayable || isLoadingReceivable || isLoadingCashFlow;

  // Estatísticas financeiras
  const totalBalance = accountsData?.totalBalance || 0;
  const totalPayable = payableData?.reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0) || 0;
  const totalReceivable = receivableData?.reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0) || 0;
  const netCashFlow = cashFlowData?.netCashFlow || 0;

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Categorias financeiras
  const financeCategories = [
    {
      title: "Transações",
      description: "Gerenciar transações financeiras",
      icon: Receipt,
      href: "/finance/transactions",
    },
    {
      title: "Contas a Pagar",
      description: "Visualizar e gerenciar despesas pendentes",
      icon: ArrowDownRight,
      href: "/finance/accounts-payable",
    },
    {
      title: "Contas a Receber",
      description: "Visualizar e gerenciar receitas pendentes",
      icon: ArrowUpRight,
      href: "/finance/accounts-receivable",
    },
    {
      title: "Contas Bancárias",
      description: "Gerenciar contas e saldos",
      icon: CreditCard,
      href: "/finance/accounts",
    },
    {
      title: "Orçamentos",
      description: "Controlar orçamentos e metas financeiras",
      icon: PieChart,
      href: "/finance/budgets",
    },
    {
      title: "Relatórios",
      description: "Visualizar relatórios financeiros detalhados",
      icon: BarChart,
      href: "/finance/reports",
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <Button asChild>
          <Link href="/finance/transactions?new=true" className="inline-flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Nova Transação
          </Link>
        </Button>
      </div>

      {/* Resumo financeiro */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Carregando..." : formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? "Carregando..." : formatCurrency(totalPayable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "Carregando..." : formatCurrency(totalReceivable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {isLoading ? "Carregando..." : formatCurrency(netCashFlow)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de fluxo de caixa */}
      <Card>
        <CardHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle>Fluxo de Caixa</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Receitas e despesas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCashFlow ? (
            <div className="flex justify-center items-center h-64">
              <p>Carregando dados...</p>
            </div>
          ) : cashFlowData ? (
            <div className="h-64 flex flex-col justify-center items-center">
              <p>Receitas: {formatCurrency(cashFlowData.totalIncome)}</p>
              <p>Despesas: {formatCurrency(cashFlowData.totalExpense)}</p>
              <p>Resultado: {formatCurrency(cashFlowData.netCashFlow)}</p>
              <p className="text-muted-foreground text-sm mt-4">Gráfico será implementado em breve</p>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p>Não há dados disponíveis para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorias financeiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeCategories.map((category) => (
          <Card key={category.title} className="hover:bg-accent/50 transition-colors">
            <Link href={category.href}>
              <CardHeader className="flex flex-row items-start space-y-0">
                <div className="flex-1">
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <category.icon className="h-6 w-6 text-primary" />
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FinanceOverview;
