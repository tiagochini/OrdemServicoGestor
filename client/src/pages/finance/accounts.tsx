import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Search, Edit, Trash2, CreditCard, Wallet, TrendingUp, Building2 } from "lucide-react";
import AccountForm from "@/components/finance/account-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formatCurrency = (value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

const getAccountTypeLabel = (type: string) => {
  const typeMap = {
    'checking': 'Conta Corrente',
    'savings': 'Poupança',
    'investment': 'Investimento',
    'credit': 'Cartão de Crédito',
    'cash': 'Dinheiro',
    'other': 'Outros',
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getAccountTypeIcon = (type: string) => {
  const iconMap = {
    'checking': <Building2 className="h-4 w-4" />,
    'savings': <Wallet className="h-4 w-4" />,
    'investment': <TrendingUp className="h-4 w-4" />,
    'credit': <CreditCard className="h-4 w-4" />,
    'cash': <Wallet className="h-4 w-4" />,
    'other': <Building2 className="h-4 w-4" />,
  };
  return iconMap[type as keyof typeof iconMap] || <Building2 className="h-4 w-4" />;
};

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-green-600';
  if (balance < 0) return 'text-red-600';
  return 'text-gray-600';
};

const Accounts = () => {
  const { toast } = useToast();
  
  // Form state
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | undefined>();
  const [isBalanceUpdateOpen, setIsBalanceUpdateOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch accounts
  const { data: accounts = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/accounts'],
  });

  // Fetch account balances summary
  const { data: balancesSummary } = useQuery<any>({
    queryKey: ['/api/accounts/balances'],
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/accounts/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({ 
        title: "Conta excluída",
        description: "A conta bancária foi excluída com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balances'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Balance update form
  const balanceSchema = z.object({
    amount: z.string().or(z.number()).pipe(
      z.coerce.number().min(-999999, "Valor muito baixo").max(999999, "Valor muito alto")
    ),
  });

  const balanceForm = useForm<z.infer<typeof balanceSchema>>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (values: { id: number; amount: number }) => {
      const response = await apiRequest('PUT', `/api/accounts/${values.id}/balance`, { amount: values.amount });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Saldo atualizado",
        description: "O saldo da conta foi atualizado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balances'] });
      setIsBalanceUpdateOpen(false);
      setSelectedAccountId(undefined);
      balanceForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar saldo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleUpdateBalance = (accountId: number) => {
    setSelectedAccountId(accountId);
    setIsBalanceUpdateOpen(true);
  };

  const onSubmitBalance = (values: z.infer<typeof balanceSchema>) => {
    if (selectedAccountId) {
      updateBalanceMutation.mutate({ id: selectedAccountId, amount: values.amount });
    }
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      account.name?.toLowerCase().includes(searchLower) ||
      account.type?.toLowerCase().includes(searchLower) ||
      account.description?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals by type
  const accountsByType = filteredAccounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = { count: 0, balance: 0 };
    }
    acc[type].count += 1;
    acc[type].balance += parseFloat(account.balance || '0');
    return acc;
  }, {} as Record<string, { count: number; balance: number }>);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Erro ao carregar contas: {error.message}
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
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e controle de saldos
          </p>
        </div>
        <Button onClick={() => setIsNewAccountOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAccounts.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(balancesSummary?.totalBalance || 0)}`}>
              {formatCurrency(balancesSummary?.totalBalance || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredAccounts.filter(acc => acc.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Conta</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(accountsByType).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar</CardTitle>
          <CardDescription>
            Encontre contas específicas por nome, tipo ou descrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas</CardTitle>
          <CardDescription>
            {filteredAccounts.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando contas...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getAccountTypeIcon(account.type)}
                          {account.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAccountTypeLabel(account.type)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getBalanceColor(parseFloat(account.balance || '0'))}`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={account.description}>
                          {account.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(account.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateBalance(account.id)}
                            title="Atualizar saldo"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAccountId(account.id)}
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
                                  Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(account.id)}
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

      {/* Account Form Modal */}
      <AccountForm 
        isOpen={isNewAccountOpen || !!editingAccountId}
        onClose={() => {
          setIsNewAccountOpen(false);
          setEditingAccountId(undefined);
        }}
        accountId={editingAccountId}
      />

      {/* Balance Update Modal */}
      <Dialog open={isBalanceUpdateOpen} onOpenChange={setIsBalanceUpdateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atualizar Saldo</DialogTitle>
            <DialogDescription>
              Digite o novo saldo para a conta selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...balanceForm}>
            <form onSubmit={balanceForm.handleSubmit(onSubmitBalance)} className="space-y-4">
              <FormField
                control={balanceForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Saldo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBalanceUpdateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateBalanceMutation.isPending}>
                  {updateBalanceMutation.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;