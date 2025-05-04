import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownRight, CalendarIcon, Filter, Search, Plus } from "lucide-react";
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
import { TransactionStatus } from "@shared/schema";

const AccountsPayable = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Query para obter contas a pagar
  const { data: payables, isLoading } = useQuery({
    queryKey: ["/api/transactions/accounts-payable", filterStatus],
    queryFn: async () => {
      let url = '/api/transactions/accounts-payable';
      const params = new URLSearchParams();
      
      if (filterStatus) params.append('status', filterStatus);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Falha ao carregar contas a pagar");
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar contas a pagar",
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

  // Filtrar contas com base na busca
  const filteredPayables = payables?.filter(payable => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payable.description.toLowerCase().includes(query) ||
      payable.category.toLowerCase().includes(query) ||
      formatCurrency(payable.amount).includes(query)
    );
  });

  // Calcular total a pagar
  const totalPayable = filteredPayables?.reduce((total, item) => {
    return total + parseFloat(item.amount);
  }, 0) || 0;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Resumo de contas a pagar */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? "Carregando..." : formatCurrency(totalPayable)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
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
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.OVERDUE)}>
              Atrasado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus(TransactionStatus.PAID)}>
              Pago
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela de contas a pagar */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Carregando contas a pagar...</div>
          ) : filteredPayables?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable) => (
                  <TableRow key={payable.id}>
                    <TableCell>{formatDate(payable.date)}</TableCell>
                    <TableCell>{payable.description}</TableCell>
                    <TableCell>{payable.category}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusStyles(payable.status)}`}
                      >
                        {getStatusLabel(payable.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ArrowDownRight className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma conta a pagar encontrada</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Tente ajustar os filtros ou termos de busca"
                  : "Todas as suas contas estão em dia!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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

export default AccountsPayable;
