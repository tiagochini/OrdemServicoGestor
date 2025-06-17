import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownRight, CalendarIcon, Filter, Search, Plus, Edit, Trash2, Check, Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionStatus } from "@shared/schema";
import PayableReceivableForm from "@/components/finance/payable-receivable-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AccountsPayable = () => {
  const { toast } = useToast();
  
  // Form states
  const [isNewPayableOpen, setIsNewPayableOpen] = useState(false);
  const [editingPayableId, setEditingPayableId] = useState<number | undefined>();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<string>("all");

  // Query para obter contas a pagar
  const { data: payables = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/transactions/accounts-payable", filterStatus, filterDateRange],
    queryFn: async () => {
      let url = '/api/transactions/accounts-payable';
      const params = new URLSearchParams();
      
      if (filterStatus && filterStatus !== "all") params.append('status', filterStatus);
      if (filterDateRange && filterDateRange !== "all") params.append('dateRange', filterDateRange);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Falha ao carregar contas a pagar");
      }
      return response.json();
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/transactions/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({ 
        title: "Conta a pagar excluída",
        description: "A conta a pagar foi excluída com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/accounts-payable'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir conta a pagar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/transactions/${id}`, { 
        status: TransactionStatus.PAID 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Conta marcada como paga",
        description: "A conta a pagar foi marcada como paga"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/accounts-payable'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao marcar como pago",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Formatação de moeda
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Check if due date is overdue
  const isOverdue = (dueDate: string, status: string) => {
    if (status === TransactionStatus.PAID) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filtrar contas com base na busca
  const filteredPayables = payables.filter(payable => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payable.description?.toLowerCase().includes(query) ||
      payable.category?.toLowerCase().includes(query) ||
      formatCurrency(payable.amount).includes(query) ||
      payable.documentRef?.toLowerCase().includes(query)
    );
  });

  // Calcular estatísticas
  const stats = filteredPayables.reduce((acc, payable) => {
    const amount = parseFloat(payable.amount || '0');
    acc.total += amount;
    
    if (payable.status === TransactionStatus.PAID) {
      acc.paid += amount;
    } else if (payable.status === TransactionStatus.PENDING) {
      if (isOverdue(payable.dueDate, payable.status)) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { total: 0, paid: 0, pending: 0, overdue: 0 });

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Erro ao carregar contas a pagar: {error.message}
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
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas a pagar e acompanhe vencimentos
          </p>
        </div>
        <Button onClick={() => setIsNewPayableOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta a Pagar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.overdue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paid)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
          <CardDescription>
            Encontre contas específicas por descrição, categoria ou documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contas a pagar..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {filterStatus ? getStatusLabel(filterStatus) : "Todos"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus(null)}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.PENDING)}>
                  Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.OVERDUE)}>
                  Vencidas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.PAID)}>
                  Pagas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.CANCELLED)}>
                  Canceladas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Período: {filterDateRange === "all" ? "Todos" : filterDateRange}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterDateRange("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDateRange("today")}>
                  Hoje
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDateRange("week")}>
                  Esta Semana
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDateRange("month")}>
                  Este Mês
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDateRange("overdue")}>
                  Vencidas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Payable Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
          <CardDescription>
            {filteredPayables.length} conta(s) a pagar encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando contas a pagar...</div>
          ) : filteredPayables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowDownRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium">Nenhuma conta a pagar encontrada</h3>
              <p className="text-sm">
                {searchQuery || filterStatus || filterDateRange !== "all"
                  ? "Tente ajustar os filtros ou termos de busca"
                  : "Registre suas primeiras contas a pagar para começar"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{payable.description}</div>
                          {payable.notes && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {payable.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`${isOverdue(payable.dueDate, payable.status) ? 'text-red-600 font-medium' : ''}`}>
                          {formatDate(payable.dueDate || payable.date)}
                          {isOverdue(payable.dueDate, payable.status) && (
                            <div className="text-xs text-red-500">Vencida</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(payable.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payable.status === TransactionStatus.PAID ? "default" : 
                                 payable.status === TransactionStatus.OVERDUE ? "destructive" : "secondary"}
                        >
                          {getStatusIcon(payable.status)}
                          {getStatusLabel(payable.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          {formatCurrency(payable.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payable.documentRef || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {payable.status !== TransactionStatus.PAID && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsPaidMutation.mutate(payable.id)}
                              disabled={markAsPaidMutation.isPending}
                              title="Marcar como paga"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPayableId(payable.id)}
                            title="Editar conta"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir conta">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(payable.id)}
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

      {/* Form Modal */}
      <PayableReceivableForm 
        isOpen={isNewPayableOpen || !!editingPayableId}
        onClose={() => {
          setIsNewPayableOpen(false);
          setEditingPayableId(undefined);
        }}
        transactionId={editingPayableId}
        type="payable"
      />
    </div>
  );
};

// Funções auxiliares para formatar status
function getStatusStyles(status: string): string {
  switch (status) {
    case TransactionStatus.PAID:
      return "bg-green-100 text-green-700";
    case TransactionStatus.PENDING:
      return "bg-yellow-100 text-yellow-700";
    case TransactionStatus.OVERDUE:
      return "bg-red-100 text-red-700";
    case TransactionStatus.CANCELLED:
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case TransactionStatus.PAID:
      return "Pago";
    case TransactionStatus.PENDING:
      return "Pendente";
    case TransactionStatus.OVERDUE:
      return "Vencido";
    case TransactionStatus.CANCELLED:
      return "Cancelado";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case TransactionStatus.PAID:
      return <Check className="h-3 w-3 mr-1" />;
    case TransactionStatus.PENDING:
      return <Clock className="h-3 w-3 mr-1" />;
    case TransactionStatus.OVERDUE:
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    case TransactionStatus.CANCELLED:
      return <X className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
}

function getCategoryLabel(category: string): string {
  const categoryMap = {
    'sales': 'Vendas',
    'service': 'Serviços', 
    'taxes': 'Impostos',
    'payroll': 'Folha de Pagamento',
    'rent': 'Aluguel',
    'utilities': 'Utilidades',
    'supplies': 'Suprimentos',
    'maintenance': 'Manutenção',
    'insurance': 'Seguro',
    'other': 'Outros',
  };
  return categoryMap[category as keyof typeof categoryMap] || category;
}

export default AccountsPayable;
