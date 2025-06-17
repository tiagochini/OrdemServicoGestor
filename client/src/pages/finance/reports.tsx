import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Download, BarChart3, PieChart, TrendingUp, DollarSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Reports = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("cash-flow");
  const [period, setPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Determinar a data inicial com base no período selecionado
  const getReportDates = () => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    if (period === "custom" && dateRange?.from) {
      startDate = dateRange.from;
      endDate = dateRange.to || today;
    } else if (period === "month") {
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
    } else if (period === "last-month") {
      const lastMonth = subMonths(today, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
    } else if (period === "quarter") {
      startDate = subMonths(today, 3);
    } else if (period === "year") {
      startDate = startOfYear(today);
      endDate = endOfYear(today);
    } else if (period === "last-year") {
      const lastYear = subYears(today, 1);
      startDate = startOfYear(lastYear);
      endDate = endOfYear(lastYear);
    } else {
      // Padrão para qualquer outra opção é o mês atual
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };

  // Consulta para obter fluxo de caixa
  const { data: cashFlowData, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ["/api/reports/cash-flow", period, dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getReportDates();
      const response = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de fluxo de caixa");
      }
      return response.json();
    },
    enabled: reportType === "cash-flow",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar fluxo de caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter DRE (Demonstração de Resultados)
  const { data: profitLossData, isLoading: isLoadingProfitLoss } = useQuery({
    queryKey: ["/api/reports/profit-and-loss", period, dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getReportDates();
      const response = await fetch(`/api/reports/profit-and-loss?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de lucros e perdas");
      }
      return response.json();
    },
    enabled: reportType === "profit-loss",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar lucros e perdas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter Budget vs Atual
  const { data: budgetVsActualData, isLoading: isLoadingBudgetVsActual } = useQuery({
    queryKey: ["/api/reports/budget-vs-actual", period, dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getReportDates();
      const response = await fetch(`/api/reports/budget-vs-actual?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados de orçamento vs real");
      }
      return response.json();
    },
    enabled: reportType === "budget-vs-actual",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar orçamento vs real",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter saldos das contas
  const { data: accountBalancesData, isLoading: isLoadingAccountBalances } = useQuery({
    queryKey: ["/api/reports/account-balances"],
    queryFn: async () => {
      const response = await fetch(`/api/accounts/balances`);
      if (!response.ok) {
        throw new Error("Falha ao carregar saldos das contas");
      }
      return response.json();
    },
    enabled: reportType === "account-balances",
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar saldos das contas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingCashFlow || isLoadingProfitLoss || isLoadingBudgetVsActual || isLoadingAccountBalances;

  // Formatar exibição do período
  const formatPeriodDisplay = () => {
    const { startDate, endDate } = getReportDates();
    return `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
  };

  const generateFinancialReportPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Configurar cores baseadas no tipo de relatório
      const colors = {
        'cash-flow': [67, 56, 202], // Indigo
        'profit-loss': [220, 38, 127], // Pink
        'budget-vs-actual': [16, 185, 129], // Emerald
        'account-balances': [245, 158, 11] // Amber
      };
      
      const [r, g, b] = colors[reportType as keyof typeof colors] || [67, 56, 202];
      
      // Cabeçalho
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('SISTEMA DE GESTÃO FINANCEIRA', 20, 25);
      
      // Título do relatório
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      let reportTitle = '';
      switch (reportType) {
        case 'cash-flow': reportTitle = 'Relatório de Fluxo de Caixa'; break;
        case 'profit-loss': reportTitle = 'Demonstração de Resultados (DRE)'; break;
        case 'budget-vs-actual': reportTitle = 'Orçamento vs Valores Reais'; break;
        case 'account-balances': reportTitle = 'Saldos das Contas'; break;
      }
      pdf.text(reportTitle, 20, 55);
      
      // Período
      pdf.setFontSize(12);
      pdf.text(`Período: ${formatPeriodDisplay()}`, 20, 70);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}`, 20, 85);
      
      let yPosition = 100;
      
      // Conteúdo baseado no tipo de relatório
      if (reportType === 'cash-flow' && cashFlowData) {
        // Resumo do Fluxo de Caixa
        pdf.setFontSize(14);
        pdf.text('RESUMO EXECUTIVO', 20, yPosition);
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.text(`Receitas Totais: ${formatCurrency(cashFlowData.totalIncome)}`, 20, yPosition);
        yPosition += 15;
        pdf.text(`Despesas Totais: ${formatCurrency(cashFlowData.totalExpense)}`, 20, yPosition);
        yPosition += 15;
        pdf.text(`Resultado Líquido: ${formatCurrency(cashFlowData.netCashFlow)}`, 20, yPosition);
        yPosition += 25;
        
        // Receitas por categoria
        if (cashFlowData.incomeByCategory && Object.keys(cashFlowData.incomeByCategory).length > 0) {
          pdf.setFontSize(14);
          pdf.text('RECEITAS POR CATEGORIA', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(11);
          Object.entries(cashFlowData.incomeByCategory).forEach(([category, amount]) => {
            pdf.text(`• ${category}: ${formatCurrency(amount as number)}`, 25, yPosition);
            yPosition += 12;
          });
          yPosition += 10;
        }
        
        // Despesas por categoria
        if (cashFlowData.expenseByCategory && Object.keys(cashFlowData.expenseByCategory).length > 0) {
          pdf.setFontSize(14);
          pdf.text('DESPESAS POR CATEGORIA', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(11);
          Object.entries(cashFlowData.expenseByCategory).forEach(([category, amount]) => {
            pdf.text(`• ${category}: ${formatCurrency(amount as number)}`, 25, yPosition);
            yPosition += 12;
          });
        }
      }
      
      else if (reportType === 'profit-loss' && profitLossData) {
        // DRE
        pdf.setFontSize(14);
        pdf.text('DEMONSTRAÇÃO DE RESULTADOS', 20, yPosition);
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.text(`Receita Bruta: ${formatCurrency(profitLossData.revenue)}`, 20, yPosition);
        yPosition += 15;
        pdf.text(`(-) Despesas Operacionais: ${formatCurrency(profitLossData.expenses)}`, 20, yPosition);
        yPosition += 15;
        pdf.text(`Resultado do Período: ${formatCurrency(profitLossData.profit)}`, 20, yPosition);
        yPosition += 25;
        
        // Análise
        pdf.setFontSize(14);
        pdf.text('ANÁLISE DE RESULTADOS', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(11);
        const margin = profitLossData.revenue > 0 ? ((profitLossData.profit / profitLossData.revenue) * 100).toFixed(1) : '0';
        pdf.text(`• Margem de Lucro: ${margin}%`, 25, yPosition);
        yPosition += 12;
        
        const status = profitLossData.profit >= 0 ? 'POSITIVO' : 'NEGATIVO';
        pdf.text(`• Status do Resultado: ${status}`, 25, yPosition);
      }
      
      else if (reportType === 'budget-vs-actual' && budgetVsActualData) {
        pdf.setFontSize(14);
        pdf.text('ORÇAMENTO VS VALORES REAIS', 20, yPosition);
        yPosition += 20;
        
        if (budgetVsActualData.length > 0) {
          pdf.setFontSize(11);
          budgetVsActualData.forEach((item: any) => {
            pdf.text(`${item.category}:`, 20, yPosition);
            yPosition += 12;
            pdf.text(`  Orçado: ${formatCurrency(item.budgeted)}`, 25, yPosition);
            yPosition += 12;
            pdf.text(`  Realizado: ${formatCurrency(item.actual)}`, 25, yPosition);
            yPosition += 12;
            pdf.text(`  Variação: ${formatCurrency(item.variance)}`, 25, yPosition);
            yPosition += 15;
          });
        } else {
          pdf.setFontSize(12);
          pdf.text('Nenhum dado de orçamento disponível para o período selecionado.', 20, yPosition);
        }
      }
      
      else if (reportType === 'account-balances' && accountBalancesData) {
        pdf.setFontSize(14);
        pdf.text('SALDOS DAS CONTAS', 20, yPosition);
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.text(`Saldo Total: ${formatCurrency(accountBalancesData.totalBalance)}`, 20, yPosition);
        yPosition += 25;
        
        if (accountBalancesData.accounts && accountBalancesData.accounts.length > 0) {
          pdf.setFontSize(14);
          pdf.text('DETALHAMENTO POR CONTA', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(11);
          accountBalancesData.accounts.forEach((account: any) => {
            const accountType = {
              'checking': 'Conta Corrente',
              'savings': 'Conta Poupança',
              'investment': 'Investimento',
              'cash': 'Caixa/Dinheiro',
              'credit': 'Cartão de Crédito',
              'other': 'Outro'
            }[account.type] || account.type;
            
            pdf.text(`• ${account.name} (${accountType}): ${formatCurrency(parseFloat(account.balance))}`, 25, yPosition);
            yPosition += 12;
          });
        } else {
          pdf.setFontSize(12);
          pdf.text('Nenhuma conta cadastrada no sistema.', 20, yPosition);
        }
      }
      
      // Rodapé
      const footerY = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Sistema de Gestão Financeira - Relatório Gerado Automaticamente', 20, footerY);
      pdf.text(`Página 1 de 1`, pageWidth - 40, footerY);
      
      // Download do PDF
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      const filename = `relatorio-${reportType}-${timestamp}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: `O relatório ${reportTitle.toLowerCase()} foi baixado.`,
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <Button 
          variant="outline" 
          disabled={isLoading || isGeneratingPDF}
          onClick={generateFinancialReportPDF}
        >
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPDF ? 'Gerando PDF...' : 'Exportar Relatório'}
        </Button>
      </div>

      {/* Seleção de relatório e período */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações do Relatório</CardTitle>
          <CardDescription>
            Selecione o tipo de relatório e o período de tempo desejado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Tipo de Relatório</label>
              <Tabs 
                value={reportType}
                onValueChange={setReportType}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                  <TabsTrigger value="cash-flow" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Fluxo de Caixa</span>
                  </TabsTrigger>
                  <TabsTrigger value="profit-loss" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>DRE</span>
                  </TabsTrigger>
                  <TabsTrigger value="budget-vs-actual" className="flex items-center space-x-2">
                    <PieChart className="h-4 w-4" />
                    <span>Orçado vs Real</span>
                  </TabsTrigger>
                  <TabsTrigger value="account-balances" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Saldos</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">Período</label>
              <div className="flex items-center space-x-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mês atual</SelectItem>
                    <SelectItem value="last-month">Mês anterior</SelectItem>
                    <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                    <SelectItem value="year">Ano atual</SelectItem>
                    <SelectItem value="last-year">Ano anterior</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {period === "custom" && (
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "min-w-[240px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span>Selecione um período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {reportType === "cash-flow" && <TrendingUp className="mr-2 h-5 w-5 text-primary" />}
            {reportType === "profit-loss" && <BarChart3 className="mr-2 h-5 w-5 text-primary" />}
            {reportType === "budget-vs-actual" && <PieChart className="mr-2 h-5 w-5 text-primary" />}
            {reportType === "account-balances" && <DollarSign className="mr-2 h-5 w-5 text-primary" />}
            
            {reportType === "cash-flow" && "Relatório de Fluxo de Caixa"}
            {reportType === "profit-loss" && "Demonstração de Resultados (DRE)"}
            {reportType === "budget-vs-actual" && "Orçamento vs Valores Reais"}
            {reportType === "account-balances" && "Saldos das Contas"}
          </CardTitle>
          {reportType !== "account-balances" && (
            <CardDescription>Período: {formatPeriodDisplay()}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <p>Carregando dados do relatório...</p>
            </div>
          ) : (
            <div>
              {/* Relatório de Fluxo de Caixa */}
              {reportType === "cash-flow" && cashFlowData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Receitas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(cashFlowData.totalIncome)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Despesas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(cashFlowData.totalExpense)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Resultado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${cashFlowData.netCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatCurrency(cashFlowData.netCashFlow)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Detalhamento por Categoria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Receitas por Categoria</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Categoria</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(cashFlowData.incomeByCategory || {}).map(([category, amount]) => (
                              <TableRow key={category}>
                                <TableCell>{category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(amount as number)}</TableCell>
                              </TableRow>
                            ))}
                            {Object.keys(cashFlowData.incomeByCategory || {}).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  Nenhuma receita registrada neste período
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Despesas por Categoria</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Categoria</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(cashFlowData.expenseByCategory || {}).map(([category, amount]) => (
                              <TableRow key={category}>
                                <TableCell>{category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(amount as number)}</TableCell>
                              </TableRow>
                            ))}
                            {Object.keys(cashFlowData.expenseByCategory || {}).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  Nenhuma despesa registrada neste período
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Relatório de Lucros e Perdas (DRE) */}
              {reportType === "profit-loss" && profitLossData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Receitas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(profitLossData.revenue)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Despesas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(profitLossData.expenses)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Lucro/Prejuízo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${profitLossData.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatCurrency(profitLossData.profit)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Demonstração de Resultados</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60%]">Item</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Receita Bruta</TableCell>
                          <TableCell className="text-right">{formatCurrency(profitLossData.revenue)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">(-) Despesas Operacionais</TableCell>
                          <TableCell className="text-right">{formatCurrency(profitLossData.expenses)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Resultado do Período</TableCell>
                          <TableCell className={`text-right font-bold ${profitLossData.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {formatCurrency(profitLossData.profit)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* Orçamento vs Real */}
              {reportType === "budget-vs-actual" && budgetVsActualData && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Comparativo de Orçamento vs Gastos Reais</h3>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Orçado</TableHead>
                        <TableHead className="text-right">Realizado</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetVsActualData.length > 0 ? (
                        budgetVsActualData.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.budgeted)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                            <TableCell className={`text-right ${item.variance > 0 ? 'text-destructive' : 'text-primary'}`}>
                              {formatCurrency(item.variance)}
                            </TableCell>
                            <TableCell className={`text-right ${item.variance > 0 ? 'text-destructive' : 'text-primary'}`}>
                              {item.budgeted > 0 ? Math.abs((item.variance / item.budgeted) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            Nenhum dado de orçamento disponível para o período selecionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Saldos das Contas */}
              {reportType === "account-balances" && accountBalancesData && (
                <div className="space-y-6">
                  <div className="bg-muted/40 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-2">Saldo Total</h3>
                    <p className="text-3xl font-bold">{formatCurrency(accountBalancesData.totalBalance)}</p>
                  </div>
                  
                  <h3 className="text-lg font-medium">Detalhamento por Conta</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead className="text-right">Saldo Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountBalancesData.accounts && accountBalancesData.accounts.length > 0 ? (
                        accountBalancesData.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>
                              {account.type === "checking" && "Conta Corrente"}
                              {account.type === "savings" && "Conta Poupança"}
                              {account.type === "investment" && "Investimento"}
                              {account.type === "cash" && "Caixa/Dinheiro"}
                              {account.type === "credit" && "Cartão de Crédito"}
                              {account.type === "other" && "Outro"}
                            </TableCell>
                            <TableCell>{account.bankName || "--"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(account.balance))}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                            Nenhuma conta cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
