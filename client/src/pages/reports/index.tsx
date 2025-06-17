import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  BarChart3,
  PieChart,
  DollarSign,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);

  // Fetch data for reports
  const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders'],
  });

  const { data: technicians = [], isLoading: isLoadingTechnicians } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  // Calculate date range based on selected period
  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Calculate performance metrics for technicians
  const calculateTechnicianPerformance = () => {
    const { start, end } = getDateRange(selectedPeriod);
    
    return technicians.map(technician => {
      const techOrders = workOrders.filter(order => 
        order.technicianId === technician.id &&
        new Date(order.createdAt) >= start &&
        new Date(order.createdAt) <= end
      );

      const completedOrders = techOrders.filter(order => order.status === 'completed');
      const totalOrders = techOrders.length;
      const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

      // Calculate average resolution time based on actual data
      const avgResolutionTime = completedOrders.length > 0 ? 
        completedOrders.reduce((sum, order) => {
          const created = new Date(order.createdAt);
          const updated = new Date(order.updatedAt);
          const diff = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + diff;
        }, 0) / completedOrders.length : 0;

      return {
        ...technician,
        totalOrders,
        completedOrders: completedOrders.length,
        completionRate,
        avgResolutionTime: Math.round(avgResolutionTime)
      };
    });
  };

  // Calculate profitability metrics
  const calculateProfitability = () => {
    const { start, end } = getDateRange(selectedPeriod);
    
    const periodTransactions = transactions.filter(t => 
      new Date(t.date) >= start && new Date(t.date) <= end
    );

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;

    // Group by category
    const incomeByCategory = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount || '0');
        return acc;
      }, {} as Record<string, number>);

    const expensesByCategory = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount || '0');
        return acc;
      }, {} as Record<string, number>);

    return {
      income,
      expenses,
      profit,
      profitMargin,
      incomeByCategory,
      expensesByCategory,
      totalTransactions: periodTransactions.length
    };
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const labels = {
      'sales': 'Vendas',
      'service': 'Serviços',
      'taxes': 'Impostos',
      'payroll': 'Folha de Pagamento',
      'rent': 'Aluguel',
      'utilities': 'Utilidades',
      'supplies': 'Suprimentos',
      'maintenance': 'Manutenção',
      'insurance': 'Seguro',
      'other': 'Outros'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const technicianPerformance = calculateTechnicianPerformance();
  const profitabilityData = calculateProfitability();
  const filteredPerformance = selectedTechnician === 'all' ? 
    technicianPerformance : 
    technicianPerformance.filter(t => t.id.toString() === selectedTechnician);

  const isLoading = isLoadingOrders || isLoadingTechnicians || isLoadingCustomers || isLoadingTransactions;

  // PDF Generation Functions
  const generatePerformancePDF = async () => {
    setIsGeneratingPDF('performance');
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(31, 81, 255);
      pdf.text('Relatório de Performance - Técnicos', pageWidth / 2, 20, { align: 'center' });
      
      // Period info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const periodLabel = selectedPeriod === 'month' ? 'Mês Atual' : 
                         selectedPeriod === 'quarter' ? 'Último Trimestre' : 'Último Ano';
      const dateRange = getDateRange(selectedPeriod);
      pdf.text(`Período: ${periodLabel} (${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')})`, 20, 35);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      // Performance data
      const performanceData = calculateTechnicianPerformance();
      const filteredData = selectedTechnician === 'all' ? performanceData : 
                          performanceData.filter(tech => tech.id.toString() === selectedTechnician);
      
      let yPosition = 65;
      
      filteredData.forEach((tech, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Technician name
        pdf.setFontSize(14);
        pdf.setTextColor(31, 81, 255);
        pdf.text(tech.name, 20, yPosition);
        yPosition += 10;
        
        // Specialization
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Especialização: ${tech.specialization || 'N/A'}`, 20, yPosition);
        yPosition += 15;
        
        // Metrics
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Ordens Totais: ${tech.totalOrders}`, 20, yPosition);
        pdf.text(`Ordens Concluídas: ${tech.completedOrders}`, 80, yPosition);
        pdf.text(`Taxa de Conclusão: ${formatPercentage(tech.completionRate)}`, 150, yPosition);
        yPosition += 10;
        pdf.text(`Tempo Médio de Resolução: ${tech.avgResolutionTime} dias`, 20, yPosition);
        yPosition += 20;
        
        // Separator line
        if (index < filteredData.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPosition, pageWidth - 20, yPosition);
          yPosition += 10;
        }
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sistema de Gerenciamento de Serviços - Relatório de Performance', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      pdf.save(`relatorio-performance-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const generateFinancialPDF = async () => {
    setIsGeneratingPDF('financial');
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Relatório Financeiro - Lucratividade', pageWidth / 2, 20, { align: 'center' });
      
      // Period info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const periodLabel = selectedPeriod === 'month' ? 'Mês Atual' : 
                         selectedPeriod === 'quarter' ? 'Último Trimestre' : 'Último Ano';
      const dateRange = getDateRange(selectedPeriod);
      pdf.text(`Período: ${periodLabel} (${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')})`, 20, 35);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      // Financial summary
      const profitData = calculateProfitability();
      let yPosition = 65;
      
      // Summary section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumo Financeiro', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Receita Total: ${formatCurrency(profitData.income)}`, 20, yPosition);
      yPosition += 10;
      
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Despesas Totais: ${formatCurrency(profitData.expenses)}`, 20, yPosition);
      yPosition += 10;
      
      pdf.setTextColor(profitData.profit >= 0 ? 34 : 239, profitData.profit >= 0 ? 197 : 68, profitData.profit >= 0 ? 94 : 68);
      pdf.text(`Lucro Líquido: ${formatCurrency(profitData.profit)}`, 20, yPosition);
      yPosition += 25;
      
      // Income by category
      if (Object.keys(profitData.incomeByCategory).length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Receita por Categoria', 20, yPosition);
        yPosition += 15;
        
        Object.entries(profitData.incomeByCategory).forEach(([category, amount]) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${getCategoryLabel(category)}: ${formatCurrency(amount as number)}`, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }
      
      // Expenses by category
      if (Object.keys(profitData.expensesByCategory).length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Despesas por Categoria', 20, yPosition);
        yPosition += 15;
        
        Object.entries(profitData.expensesByCategory).forEach(([category, amount]) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${getCategoryLabel(category)}: ${formatCurrency(amount as number)}`, 25, yPosition);
          yPosition += 8;
        });
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sistema de Gerenciamento de Serviços - Relatório Financeiro', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      pdf.save(`relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const generateCustomerPDF = async () => {
    setIsGeneratingPDF('customer');
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(168, 85, 247);
      pdf.text('Relatório de Clientes', pageWidth / 2, 20, { align: 'center' });
      
      // Period info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const dateRange = getDateRange(selectedPeriod);
      pdf.text(`Período: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`, 20, 35);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      let yPosition = 65;
      
      // Customer summary
      pdf.setFontSize(14);
      pdf.text('Resumo de Clientes', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Total de Clientes: ${customers.length}`, 20, yPosition);
      yPosition += 10;
      
      const activeCustomers = customers.filter(customer => 
        workOrders.some(order => order.customerId === customer.id)
      );
      pdf.text(`Clientes Ativos: ${activeCustomers.length}`, 20, yPosition);
      yPosition += 20;
      
      // Customer details
      customers.forEach((customer, index) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const customerOrders = workOrders.filter(order => order.customerId === customer.id);
        
        pdf.setFontSize(12);
        pdf.setTextColor(168, 85, 247);
        pdf.text(customer.name, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Email: ${customer.email || 'N/A'}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Telefone: ${customer.phone || 'N/A'}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Ordens de Serviço: ${customerOrders.length}`, 25, yPosition);
        yPosition += 15;
        
        if (index < customers.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPosition, pageWidth - 20, yPosition);
          yPosition += 10;
        }
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sistema de Gerenciamento de Serviços - Relatório de Clientes', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      pdf.save(`relatorio-clientes-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const generateProductivityPDF = async () => {
    setIsGeneratingPDF('productivity');
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(251, 146, 60);
      pdf.text('Relatório de Produtividade', pageWidth / 2, 20, { align: 'center' });
      
      // Period info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const dateRange = getDateRange(selectedPeriod);
      pdf.text(`Período: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`, 20, 35);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      let yPosition = 65;
      
      // Productivity metrics
      const totalOrders = workOrders.length;
      const completedOrders = workOrders.filter(order => order.status === 'completed').length;
      const avgCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      
      pdf.setFontSize(14);
      pdf.text('Métricas de Produtividade', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Total de Ordens: ${totalOrders}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Ordens Concluídas: ${completedOrders}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Taxa de Conclusão Geral: ${formatPercentage(avgCompletionRate)}`, 20, yPosition);
      yPosition += 20;
      
      // Technician productivity
      const performanceData = calculateTechnicianPerformance();
      
      pdf.setFontSize(14);
      pdf.text('Produtividade por Técnico', 20, yPosition);
      yPosition += 15;
      
      performanceData.forEach((tech, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(251, 146, 60);
        pdf.text(tech.name, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Eficiência: ${formatPercentage(tech.completionRate)}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Tempo Médio: ${tech.avgResolutionTime} dias`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Ordens Processadas: ${tech.totalOrders}`, 25, yPosition);
        yPosition += 15;
        
        if (index < performanceData.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPosition, pageWidth - 20, yPosition);
          yPosition += 10;
        }
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sistema de Gerenciamento de Serviços - Relatório de Produtividade', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      pdf.save(`relatorio-produtividade-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl">
                Relatórios Detalhados
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Análises e relatórios de performance do negócio
              </p>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Report Cards Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Totais</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(profitabilityData.income)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(profitabilityData.profitMargin)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(profitabilityData.profit)} lucro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Técnicos Ativos</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {technicians.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Equipe total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance de Técnicos</TabsTrigger>
            <TabsTrigger value="profitability">Lucratividade</TabsTrigger>
            <TabsTrigger value="export">Exportar Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Performance de Técnicos</CardTitle>
                    <CardDescription>
                      Análise de produtividade e eficiência da equipe técnica
                    </CardDescription>
                  </div>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecionar técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Técnicos</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Carregando dados de performance...</div>
                ) : filteredPerformance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum dado de performance encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPerformance.map((tech) => (
                      <div key={tech.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{tech.name}</h3>
                            <p className="text-sm text-muted-foreground">{tech.specialization}</p>
                          </div>
                          <Badge variant={tech.completionRate >= 80 ? "default" : tech.completionRate >= 60 ? "secondary" : "destructive"}>
                            {formatPercentage(tech.completionRate)} conclusão
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{tech.totalOrders}</div>
                            <div className="text-xs text-muted-foreground">Ordens Totais</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{tech.completedOrders}</div>
                            <div className="text-xs text-muted-foreground">Concluídas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{tech.avgResolutionTime}d</div>
                            <div className="text-xs text-muted-foreground">Tempo Médio</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Lucratividade</CardTitle>
                <CardDescription>
                  Análise financeira detalhada por período e categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Carregando dados financeiros...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(profitabilityData.income)}
                        </div>
                        <div className="text-sm text-muted-foreground">Receita Total</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(profitabilityData.expenses)}
                        </div>
                        <div className="text-sm text-muted-foreground">Despesas Totais</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className={`text-2xl font-bold ${profitabilityData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(profitabilityData.profit)}
                        </div>
                        <div className="text-sm text-muted-foreground">Lucro Líquido</div>
                      </div>
                    </div>

                    {/* Income by Category */}
                    <div>
                      <h4 className="font-medium mb-3">Receita por Categoria</h4>
                      <div className="space-y-2">
                        {Object.entries(profitabilityData.incomeByCategory).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm">{getCategoryLabel(category)}</span>
                            <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expenses by Category */}
                    <div>
                      <h4 className="font-medium mb-3">Despesas por Categoria</h4>
                      <div className="space-y-2">
                        {Object.entries(profitabilityData.expensesByCategory).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm">{getCategoryLabel(category)}</span>
                            <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Relatórios</CardTitle>
                <CardDescription>
                  Gere e baixe relatórios em diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      <h4 className="font-medium">Relatório de Performance</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Dados completos de performance de técnicos e ordens de serviço
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generatePerformancePDF}
                      disabled={isGeneratingPDF === 'performance'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingPDF === 'performance' ? 'Gerando PDF...' : 'Exportar PDF'}
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <PieChart className="h-5 w-5 mr-2 text-green-600" />
                      <h4 className="font-medium">Relatório Financeiro</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análise detalhada de receitas, despesas e lucratividade
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generateFinancialPDF}
                      disabled={isGeneratingPDF === 'financial'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingPDF === 'financial' ? 'Gerando PDF...' : 'Exportar PDF'}
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FileText className="h-5 w-5 mr-2 text-purple-600" />
                      <h4 className="font-medium">Relatório de Clientes</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Base de clientes, histórico de ordens e satisfação
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generateCustomerPDF}
                      disabled={isGeneratingPDF === 'customer'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingPDF === 'customer' ? 'Gerando PDF...' : 'Exportar PDF'}
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="h-5 w-5 mr-2 text-orange-600" />
                      <h4 className="font-medium">Relatório de Produtividade</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Métricas de tempo, eficiência e utilização de recursos
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generateProductivityPDF}
                      disabled={isGeneratingPDF === 'productivity'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingPDF === 'productivity' ? 'Gerando PDF...' : 'Exportar PDF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;