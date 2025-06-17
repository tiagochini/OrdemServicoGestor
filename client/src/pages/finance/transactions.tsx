import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TransactionType, TransactionStatus, TransactionCategory } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, ArrowDownRight, ArrowUpRight, Search, FilterX, Edit, Trash2, FileText } from "lucide-react";
import TransactionForm from "@/components/finance/transaction-form";

const formatCurrency = (value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

const getStatusBadge = (status: string) => {
  const statusMap = {
    [TransactionStatus.PENDING]: { label: "Pendente", variant: "secondary" as const },
    [TransactionStatus.PAID]: { label: "Pago", variant: "default" as const },
    [TransactionStatus.OVERDUE]: { label: "Vencido", variant: "destructive" as const },
    [TransactionStatus.CANCELLED]: { label: "Cancelado", variant: "outline" as const },
  };
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

const getCategoryLabel = (category: string) => {
  const categoryMap = {
    [TransactionCategory.SALES]: "Vendas",
    [TransactionCategory.SERVICE]: "Serviços",
    [TransactionCategory.TAXES]: "Impostos",
    [TransactionCategory.PAYROLL]: "Folha de Pagamento",
    [TransactionCategory.RENT]: "Aluguel",
    [TransactionCategory.UTILITIES]: "Utilidades",
    [TransactionCategory.SUPPLIES]: "Suprimentos",
    [TransactionCategory.MAINTENANCE]: "Manutenção",
    [TransactionCategory.INSURANCE]: "Seguro",
    [TransactionCategory.OTHER]: "Outros",
  };
  return categoryMap[category as keyof typeof categoryMap] || category;
};

const Transactions = () => {
  const { toast } = useToast();
  
  // Form state
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | undefined>();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Fetch transactions with filters
  const { data: transactions = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/transactions', filterType, filterStatus, filterCategory],
    queryFn: async () => {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Fetch customers for display names
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch work orders for display names
  const { data: workOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/work-orders'],
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/transactions/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({ 
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.documentRef?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === TransactionType.INCOME) {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterCategory("all");
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return "-";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || `Cliente #${customerId}`;
  };

  const getWorkOrderRef = (workOrderId: number | null) => {
    if (!workOrderId) return "-";
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    return workOrder ? `#${workOrder.orderNumber}` : `#${workOrderId}`;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Erro ao carregar transações: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações Financeiras</h1>
          <p className="text-muted-foreground">
            Gerencie receitas, despesas e controle financeiro
          </p>
        </div>
        <Button onClick={() => setIsNewTransactionOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.income)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.expense)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totals.income - totals.expense >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totals.income - totals.expense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar transações específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>Pendente</SelectItem>
                <SelectItem value={TransactionStatus.PAID}>Pago</SelectItem>
                <SelectItem value={TransactionStatus.OVERDUE}>Vencido</SelectItem>
                <SelectItem value={TransactionStatus.CANCELLED}>Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value={TransactionCategory.SALES}>Vendas</SelectItem>
                <SelectItem value={TransactionCategory.SERVICE}>Serviços</SelectItem>
                <SelectItem value={TransactionCategory.TAXES}>Impostos</SelectItem>
                <SelectItem value={TransactionCategory.PAYROLL}>Folha de Pagamento</SelectItem>
                <SelectItem value={TransactionCategory.RENT}>Aluguel</SelectItem>
                <SelectItem value={TransactionCategory.UTILITIES}>Utilidades</SelectItem>
                <SelectItem value={TransactionCategory.SUPPLIES}>Suprimentos</SelectItem>
                <SelectItem value={TransactionCategory.MAINTENANCE}>Manutenção</SelectItem>
                <SelectItem value={TransactionCategory.INSURANCE}>Seguro</SelectItem>
                <SelectItem value={TransactionCategory.OTHER}>Outros</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando transações...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === TransactionType.INCOME ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          {transaction.type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryLabel(transaction.category)}
                      </TableCell>
                      <TableCell>
                        <span className={
                          transaction.type === TransactionType.INCOME 
                            ? 'text-green-600 font-medium' 
                            : 'text-red-600 font-medium'
                        }>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {getCustomerName(transaction.customerId)}
                      </TableCell>
                      <TableCell>
                        {getWorkOrderRef(transaction.workOrderId)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTransactionId(transaction.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(transaction.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Modal */}
      <TransactionForm 
        isOpen={isNewTransactionOpen || !!editingTransactionId}
        onClose={() => {
          setIsNewTransactionOpen(false);
          setEditingTransactionId(undefined);
        }}
        transactionId={editingTransactionId}
      />
    </div>
  );
};

export default Transactions;