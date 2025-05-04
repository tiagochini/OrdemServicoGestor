import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Filter, PieChart, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Budgets = () => {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [period, setPeriod] = useState("current");
  
  // Query para obter orçamentos
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets", period, filterCategory],
    queryFn: async () => {
      let url = '/api/budgets';
      const params = new URLSearchParams();
      
      if (period) params.append('period', period);
      if (filterCategory) params.append('category', filterCategory);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Falha ao carregar orçamentos");
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar orçamentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query para obter gastos reais
  const { data: actualSpending, isLoading: isLoadingSpending } = useQuery({
    queryKey: ["/api/reports/budget-vs-actual", period],
    enabled: !!budgets,
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar dados de gastos reais",
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

  // Filtrar orçamentos com base na busca
  const filteredBudgets = budgets?.filter(budget => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      budget.category.toLowerCase().includes(query) ||
      (budget.description && budget.description.toLowerCase().includes(query)) ||
      formatCurrency(budget.amount).includes(query)
    );
  });

  // Obter gastos reais por categoria
  const getActualSpending = (category: string) => {
    if (!actualSpending) return 0;
    const match = actualSpending.find((item: any) => item.category === category);
    return match ? parseFloat(match.actual) : 0;
  };

  // Calcular porcentagem utilizada do orçamento
  const calculateUsage = (budget: any) => {
    const actual = getActualSpending(budget.category);
    const budgeted = parseFloat(budget.amount);
    if (budgeted === 0) return 0;
    return Math.min(Math.round((actual / budgeted) * 100), 100);
  };

  // Obter cor da barra de progresso baseada no percentual de uso
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 75) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar orçamentos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês atual</SelectItem>
            <SelectItem value="previous">Mês anterior</SelectItem>
            <SelectItem value="year">Ano atual</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Categoria
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterCategory("")}>Todas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("sales")}>Vendas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("service")}>Serviços</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("taxes")}>Impostos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("payroll")}>Folha de Pagamento</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("rent")}>Aluguel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("utilities")}>Utilidades</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("supplies")}>Suprimentos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("maintenance")}>Manutenção</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("insurance")}>Seguros</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterCategory("other")}>Outros</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lista de orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos {period === "current" ? "do Mês Atual" : period === "previous" ? "do Mês Anterior" : "do Ano Atual"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingSpending ? (
            <div className="flex justify-center py-8">Carregando orçamentos...</div>
          ) : filteredBudgets?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Orçado</TableHead>
                  <TableHead>Realizado</TableHead>
                  <TableHead>Utilização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const actualAmount = getActualSpending(budget.category);
                  const usagePercent = calculateUsage(budget);
                  const progressColor = getProgressColor(usagePercent);
                  
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.category}</TableCell>
                      <TableCell>{budget.description || "—"}</TableCell>
                      <TableCell>{formatCurrency(budget.amount)}</TableCell>
                      <TableCell>{formatCurrency(actualAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={usagePercent} 
                            max={100} 
                            className="h-2 w-24"
                            indicatorClassName={progressColor}
                          />
                          <span className="text-sm">{usagePercent}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterCategory
                  ? "Tente ajustar os filtros ou termos de busca"
                  : "Crie orçamentos para controlar melhor suas finanças"}
              </p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de novo orçamento */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>
              Defina um novo orçamento para controlar seus gastos por categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Formulário será implementado em breve</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;
