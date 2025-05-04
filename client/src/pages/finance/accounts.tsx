import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building, CreditCard, Plus, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";

const Accounts = () => {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Query para obter contas
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar contas",
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

  // Altera status de uma conta
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/accounts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao atualizar status da conta");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Status atualizado",
        description: "O status da conta foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para alterar o status
  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  // Filtrar contas com base na busca
  const filteredAccounts = accounts?.filter(account => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      account.name.toLowerCase().includes(query) ||
      account.type.toLowerCase().includes(query) ||
      formatCurrency(account.balance).includes(query)
    );
  });

  // Calcular saldo total
  const totalBalance = filteredAccounts?.reduce((total, account) => {
    return account.isActive ? total + parseFloat(account.balance) : total;
  }, 0) || 0;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Resumo de contas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Bank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Carregando..." : formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contas..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de contas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="opacity-50">
              <CardHeader>
                <CardTitle>Carregando...</CardTitle>
                <CardDescription>Aguarde</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredAccounts?.length ? (
          filteredAccounts.map((account) => (
            <Card key={account.id} className={!account.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{account.name}</CardTitle>
                    <CardDescription>{account.type}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`status-${account.id}`}
                      checked={account.isActive}
                      onCheckedChange={() => handleToggleStatus(account.id, account.isActive)}
                    />
                    <Label htmlFor={`status-${account.id}`}>
                      {account.isActive ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(account.balance)}
                </div>
                {account.description && (
                  <p className="text-sm text-muted-foreground mt-2">{account.description}</p>
                )}
              </CardContent>
              <CardFooter className="border-t pt-3 flex justify-between">
                <span className="text-xs text-muted-foreground">
                  Última atualização: {new Date(account.updatedAt).toLocaleDateString('pt-BR')}
                </span>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma conta encontrada</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Tente ajustar os termos de busca"
                : "Cadastre contas para controlar seu saldo"}
            </p>
            <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        )}
      </div>

      {/* Modal de nova conta */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
            <DialogDescription>
              Adicione uma nova conta bancária ou caixa para controle financeiro.
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

export default Accounts;
