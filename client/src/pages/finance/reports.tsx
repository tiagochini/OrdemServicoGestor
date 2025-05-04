import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, PieChart, LineChart, DownloadIcon, RefreshCw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Reports = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cash-flow");
  const [period, setPeriod] = useState("month");

  // Determinar a data inicial com base no período selecionado
  const getDateRange = () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    const startDate = new Date(today);
    if (period === "week") {
      startDate.setDate(today.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(today.getMonth() - 3);
    } else if (period === "year") {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    return { startDate: startDate.toISOString().split('T')[0], endDate };
  };

  // Query para obter fluxo de caixa
  const { data: cashFlowData, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ["/api/reports/cash-flow", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de fluxo de caixa");
      }
      return response.json();
    },
    enabled: activeTab === "cash-flow",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar fluxo de caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query para obter lucros e perdas
  const { data: profitLossData, isLoading: isLoadingProfitLoss } = useQuery({
    queryKey: ["/api/reports/profit-and-loss", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/reports/profit-and-loss?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de lucros e perdas");
      }
      return response.json();
    },
    enabled: activeTab === "profit-loss",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar lucros e perdas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query para obter orçamento vs realizado
  const { data: budgetData, isLoading: isLoadingBudget } = useQuery({
    queryKey: ["/api/reports/budget-vs-actual", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/reports/budget-vs-actual?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de orçamento vs realizado");
      }
      return response.json();
    },
    enabled: activeTab === "budget",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar orçamento vs realizado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formatação de moeda
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <div className="flex space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Escolha o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="cash-flow">
            <LineChart className="h-4 w-4 mr-2" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="profit-loss">
            <BarChart className="h-4 w-4 mr-2" />
            Lucros e Perdas
          </TabsTrigger>
          <TabsTrigger value="budget">
            <PieChart className="h-4 w-4 mr-2" />
            Orçamento vs Realizado
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Fluxo de Caixa */}
        <TabsContent value="cash-flow" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {isLoadingCashFlow ? "Carregando..." : formatCurrency(cashFlowData?.totalIncome || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoadingCashFlow ? "Carregando..." : formatCurrency(cashFlowData?.totalExpense || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {isLoadingCashFlow ? "Carregando..." : formatCurrency(cashFlowData?.netCashFlow || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa por Período</CardTitle>
              <CardDescription>
                Movimentação financeira no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCashFlow ? (
                <div className="flex justify-center items-center h-[300px]">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-[300px]">
                  <p className="text-muted-foreground">
                    Gráfico de fluxo de caixa será implementado em breve
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 mr-1" />
                Período: {period === "week" ? "Última semana" : period === "month" ? "Último mês" : period === "quarter" ? "Último trimestre" : "Último ano"}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Lucros e Perdas */}
        <TabsContent value="profit-loss" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {isLoadingProfitLoss ? "Carregando..." : formatCurrency(profitLossData?.revenue || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoadingProfitLoss ? "Carregando..." : formatCurrency(profitLossData?.expenses || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(profitLossData?.profit || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {isLoadingProfitLoss ? "Carregando..." : formatCurrency(profitLossData?.profit || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Lucros e Perdas</CardTitle>
              <CardDescription>
                Receitas e despesas por categoria no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfitLoss ? (
                <div className="flex justify-center items-center h-[300px]">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-[300px]">
                  <p className="text-muted-foreground">
                    Gráfico de lucros e perdas será implementado em breve
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 mr-1" />
                Período: {period === "week" ? "Última semana" : period === "month" ? "Último mês" : period === "quarter" ? "Último trimestre" : "Último ano"}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Orçamento vs Realizado */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamento vs Realizado</CardTitle>
              <CardDescription>
                Comparação entre valores orçados e realizados por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBudget ? (
                <div className="flex justify-center items-center h-[400px]">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !budgetData || budgetData.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-[400px]">
                  <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">
                    Não há dados de orçamento para o período selecionado
                  </p>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-[400px]">
                  <p className="text-muted-foreground">
                    Gráfico de orçamento vs realizado será implementado em breve
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 mr-1" />
                Período: {period === "week" ? "Última semana" : period === "month" ? "Último mês" : period === "quarter" ? "Último trimestre" : "Último ano"}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
