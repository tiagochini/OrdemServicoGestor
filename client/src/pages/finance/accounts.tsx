import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertAccount } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, RefreshCcw, Pencil, Trash2, DollarSign, AlertTriangle } from "lucide-react";
import { z } from "zod";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Accounts = () => {
  const { toast } = useToast();
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  // Consultar todas as contas
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

  // Mutação para criar nova conta
  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar conta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/balances"] });
      toast({
        title: "Conta criada",
        description: "A conta foi criada com sucesso",
      });
      setIsNewAccountOpen(false);
      setEditingAccount(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar conta
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAccount> }) => {
      const response = await apiRequest("PATCH", `/api/accounts/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar conta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/balances"] });
      toast({
        title: "Conta atualizada",
        description: "A conta foi atualizada com sucesso",
      });
      setIsNewAccountOpen(false);
      setEditingAccount(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir conta
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/accounts/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir conta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/balances"] });
      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso",
      });
      setIsConfirmDeleteOpen(false);
      setAccountToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Esquema para validação do formulário
  const accountFormSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    type: z.string().min(1, "O tipo é obrigatório"),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    agency: z.string().optional(),
    balance: z.coerce.number().default(0),
    description: z.string().optional(),
  });

  // Configuração do formulário
  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: editingAccount?.name || "",
      type: editingAccount?.type || "checking",
      bankName: editingAccount?.bankName || "",
      accountNumber: editingAccount?.accountNumber || "",
      agency: editingAccount?.agency || "",
      balance: editingAccount?.balance || 0,
      description: editingAccount?.description || "",
    },
  });

  // Resetar form quando editingAccount muda
  const resetForm = () => {
    form.reset({
      name: editingAccount?.name || "",
      type: editingAccount?.type || "checking",
      bankName: editingAccount?.bankName || "",
      accountNumber: editingAccount?.accountNumber || "",
      agency: editingAccount?.agency || "",
      balance: editingAccount?.balance || 0,
      description: editingAccount?.description || "",
    });
  };

  // Manipular o clique em editar
  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setIsNewAccountOpen(true);
    setTimeout(resetForm, 100); // Dar tempo para o estado ser atualizado
  };

  // Manipular o clique em excluir
  const handleDelete = (accountId: number) => {
    setAccountToDelete(accountId);
    setIsConfirmDeleteOpen(true);
  };

  // Processar o envio do formulário
  const onSubmit = async (values: z.infer<typeof accountFormSchema>) => {
    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({ id: editingAccount.id, data: values });
      } else {
        await createMutation.mutateAsync(values as InsertAccount);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  };

  // Formatar tipo de conta
  const formatAccountType = (type: string) => {
    const types: Record<string, string> = {
      checking: "Conta Corrente",
      savings: "Conta Poupança",
      investment: "Investimento",
      cash: "Caixa/Dinheiro",
      credit: "Cartão de Crédito",
      other: "Outro",
    };
    return types[type] || type;
  };

  // Calcular saldo total
  const calculateTotalBalance = () => {
    if (!accounts) return 0;
    return accounts.reduce((total: number, account: any) => {
      return total + parseFloat(account.balance);
    }, 0);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
        <Button onClick={() => { setEditingAccount(null); setIsNewAccountOpen(true); form.reset(); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Card de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Carregando..." : formatCurrency(calculateTotalBalance())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de contas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Suas Contas</CardTitle>
          <CardDescription>
            Gerencie suas contas bancárias, caixa e investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Carregando contas...</p>
            </div>
          ) : accounts?.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência/Conta</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{formatAccountType(account.type)}</TableCell>
                      <TableCell>{account.bankName || "--"}</TableCell>
                      <TableCell>
                        {account.agency && account.accountNumber
                          ? `${account.agency} / ${account.accountNumber}`
                          : account.accountNumber || "--"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(account.balance))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <DollarSign className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-semibold">Nenhuma conta cadastrada</h3>
              <p className="text-muted-foreground mt-1">
                Comece adicionando sua primeira conta bancária ou caixa.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingAccount(null);
                  setIsNewAccountOpen(true);
                  form.reset();
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Nova/Editar Conta */}
      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Atualize as informações da conta selecionada."
                : "Adicione uma nova conta bancária ao sistema."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Conta Principal" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome que identifica facilmente a conta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Conta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Conta Corrente</SelectItem>
                        <SelectItem value="savings">Conta Poupança</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="cash">Caixa/Dinheiro</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do banco" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Inicial (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da agência" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da conta" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a conta"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewAccountOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A exclusão desta conta irá remover permanentemente todos os seus dados do sistema,
              incluindo o histórico de transações associado a ela.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => accountToDelete && deleteMutation.mutate(accountToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
