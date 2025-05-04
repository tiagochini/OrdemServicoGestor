import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Search, Filter, ArrowDownRight, ArrowUpRight, Plus, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { TransactionType, TransactionStatus, TransactionCategory } from "@shared/schema";

const Transactions = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/finance/transactions");
  
  // Extrair parâmetros da URL de forma segura
  const searchParams = new URLSearchParams(window.location.search);
  const showNewDialog = searchParams.get("new") === "true";
  
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Query para obter transações
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", filterType, filterStatus],
    queryFn: async () => {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Falha ao carregar transações");
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar transações",
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

  // Formatação de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Filtrar transações com base na busca
  const filteredTransactions = transactions?.filter(transaction => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(query) ||
      transaction.category.toLowerCase().includes(query) ||
      formatCurrency(transaction.amount).includes(query)
    );
  });

  const handleAddTransaction = () => {
    setLocation("/finance/transactions?new=true");
  };

  const handleCloseDialog = () => {
    setLocation("/finance/transactions");
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transações Financeiras</h1>
        <Button onClick={handleAddTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar Tipo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType(null)}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType(TransactionType.INCOME)}>
              <ArrowUpRight className="mr-2 h-4 w-4 text-primary" />
              Receitas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType(TransactionType.EXPENSE)}>
              <ArrowDownRight className="mr-2 h-4 w-4 text-destructive" />
              Despesas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.PENDING)}>
              Pendente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.PAID)}>
              Pago
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.OVERDUE)}>
              Atrasado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.CANCELLED)}>
              Cancelado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Carregando transações...</div>
          ) : filteredTransactions?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusStyles(transaction.status)}`}
                      >
                        {getStatusLabel(transaction.status)}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === TransactionType.INCOME ? 'text-primary' : 'text-destructive'}`}>
                      {transaction.type === TransactionType.INCOME ? '+ ' : '- '}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Tente ajustar os filtros ou termos de busca"
                  : "Comece a registrar suas transações financeiras"}
              </p>
              <Button className="mt-4" onClick={handleAddTransaction}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de nova transação */}
      <Dialog open={showNewDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Adicione uma nova transação financeira ao sistema.
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
      return "Atrasado";
    case TransactionStatus.CANCELLED:
      return "Cancelado";
    default:
      return status;
  }
}

export default Transactions;
