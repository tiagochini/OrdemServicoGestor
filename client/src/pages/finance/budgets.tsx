import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertBudget, TransactionCategory } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarIcon, PlusCircle, Pencil, Trash2, Target, AlertTriangle, BarChart4 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore } from 'date-fns';
import { z } from "zod";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Budgets = () => {
  const { toast } = useToast();
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

  // Consultar todos os orçamentos
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar orçamentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consultar transações para cálculo de gastos reais
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para criar novo orçamento
  const createMutation = useMutation({
    mutationFn: async (data: InsertBudget) => {
      const response = await apiRequest("POST", "/api/budgets", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar orçamento");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso",
      });
      setIsNewBudgetOpen(false);
      setEditingBudget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar orçamento
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBudget> }) => {
      const response = await apiRequest("PATCH", `/api/budgets/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar orçamento");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso",
      });
      setIsNewBudgetOpen(false);
      setEditingBudget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir orçamento
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/budgets/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir orçamento");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso",
      });
      setIsConfirmDeleteOpen(false);
      setBudgetToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Esquema para validação do formulário
  const budgetFormSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    category: z.string().min(1, "A categoria é obrigatória"),
    amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
    startDate: z.date({
      required_error: "A data inicial é obrigatória",
    }),
    endDate: z.date({
      required_error: "A data final é obrigatória",
    }),
    description: z.string().optional(),
  }).refine((data) => isBefore(data.startDate, data.endDate), {
    message: "A data final deve ser posterior à data inicial",
    path: ["endDate"],
  });

  // Configuração do formulário
  const form = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: editingBudget?.name || "",
      category: editingBudget?.category || TransactionCategory.SUPPLIES,
      amount: editingBudget?.amount || undefined,
      startDate: editingBudget?.startDate ? new Date(editingBudget.startDate) : new Date(),
      endDate: editingBudget?.endDate ? new Date(editingBudget.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      description: editingBudget?.description || "",
    },
  });

  // Resetar form quando editingBudget muda
  const resetForm = () => {
    form.reset({
      name: editingBudget?.name || "",
      category: editingBudget?.category || TransactionCategory.SUPPLIES,
      amount: editingBudget?.amount || undefined,
      startDate: editingBudget?.startDate ? new Date(editingBudget.startDate) : new Date(),
      endDate: editingBudget?.endDate ? new Date(editingBudget.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      description: editingBudget?.description || "",
    });
  };

  // Manipular o clique em editar
  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setIsNewBudgetOpen(true);
    setTimeout(resetForm, 100); // Dar tempo para o estado ser atualizado
  };

  // Manipular o clique em excluir
  const handleDelete = (budgetId: number) => {
    setBudgetToDelete(budgetId);
    setIsConfirmDeleteOpen(true);
  };

  // Processar o envio do formulário
  const onSubmit = async (values: z.infer<typeof budgetFormSchema>) => {
    try {
      if (editingBudget) {
        await updateMutation.mutateAsync({ id: editingBudget.id, data: values });
      } else {
        await createMutation.mutateAsync(values as InsertBudget);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  };

  // Calcular valor atual gasto para um orçamento
  const calculateActualSpending = (budget: any) => {
    if (!transactions) return 0;
    
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    return transactions
      .filter((transaction: any) => {
        // Verificar se a transação está dentro do período do orçamento
        const transactionDate = new Date(transaction.date);
        return (
          transaction.category === budget.category &&
          transaction.type === 'expense' &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .reduce((total: number, transaction: any) => {
        return total + parseFloat(transaction.amount);
      }, 0);
  };

  // Calcular progresso do orçamento
  const calculateProgress = (budget: any) => {
    const actualSpending = calculateActualSpending(budget);
    const budgetAmount = parseFloat(budget.amount);
    return (actualSpending / budgetAmount) * 100;
  };

  // Formatar categoria
  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      supplies: "Suprimentos",
      rent: "Aluguel",
      payroll: "Folha de Pagamento",
      taxes: "Impostos",
      utilities: "Utilidades",
      sales: "Vendas",
      services: "Serviços",
      other: "Outros",
    };
    return categories[category] || category;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
        <Button onClick={() => { setEditingBudget(null); setIsNewBudgetOpen(true); form.reset(); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Lista de orçamentos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-8">
            <p>Carregando orçamentos...</p>
          </div>
        ) : budgets?.length > 0 ? (
          budgets.map((budget: any) => {
            const progress = calculateProgress(budget);
            const actualSpending = calculateActualSpending(budget);
            const isOverBudget = actualSpending > parseFloat(budget.amount);
            const bgBarClass = isOverBudget ? "bg-destructive" : "bg-primary";
            const displayedProgress = Math.min(progress, 100);
            
            return (
              <Card key={budget.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{budget.name}</CardTitle>
                      <CardDescription>
                        {formatCategory(budget.category)} - {new Date(budget.startDate).toLocaleDateString('pt-BR')} até {new Date(budget.endDate).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(budget)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(budget.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Meta: {formatCurrency(parseFloat(budget.amount))}</span>
                      <span className={`text-sm font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                        Atual: {formatCurrency(actualSpending)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bgBarClass} transition-all`}
                        style={{ width: `${displayedProgress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        {isOverBudget ? (
                          <span className="text-destructive font-medium">Estourado em {formatCurrency(actualSpending - parseFloat(budget.amount))}</span>
                        ) : (
                          <span>Restante: {formatCurrency(parseFloat(budget.amount) - actualSpending)}</span>
                        )}
                      </span>
                      <span className={`font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <Target className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="mt-2 text-lg font-semibold">Nenhum orçamento cadastrado</h3>
            <p className="text-muted-foreground mt-1">
              Comece adicionando um orçamento para controlar seus gastos por categoria.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setEditingBudget(null);
                setIsNewBudgetOpen(true);
                form.reset();
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Button>
          </div>
        )}
      </div>

      {budgets?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5 text-primary" />
              Visão Geral dos Orçamentos
            </CardTitle>
            <CardDescription>
              Analise o progresso de todos os seus orçamentos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget: any) => {
                  const actualSpending = calculateActualSpending(budget);
                  const progress = calculateProgress(budget);
                  const isOverBudget = actualSpending > parseFloat(budget.amount);
                  
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.name}</TableCell>
                      <TableCell>{formatCategory(budget.category)}</TableCell>
                      <TableCell>
                        {new Date(budget.startDate).toLocaleDateString('pt-BR')} - {new Date(budget.endDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(budget.amount))}
                      </TableCell>
                      <TableCell className={`text-right ${isOverBudget ? 'text-destructive font-medium' : ''}`}>
                        {formatCurrency(actualSpending)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isOverBudget ? 'bg-destructive' : 'bg-primary'} transition-all`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal para Novo/Editar Orçamento */}
      <Dialog open={isNewBudgetOpen} onOpenChange={setIsNewBudgetOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Editar Orçamento" : "Novo Orçamento"}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? "Atualize as informações do orçamento selecionado."
                : "Adicione um novo orçamento para controlar seus gastos."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Orçamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Suprimentos de Escritório" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome que identifica o orçamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransactionCategory.SUPPLIES}>Suprimentos</SelectItem>
                        <SelectItem value={TransactionCategory.RENT}>Aluguel</SelectItem>
                        <SelectItem value={TransactionCategory.PAYROLL}>Folha de Pagamento</SelectItem>
                        <SelectItem value={TransactionCategory.TAXES}>Impostos</SelectItem>
                        <SelectItem value={TransactionCategory.UTILITIES}>Utilidades</SelectItem>
                        <SelectItem value={TransactionCategory.SALES}>Vendas</SelectItem>
                        <SelectItem value={TransactionCategory.SERVICES}>Serviços</SelectItem>
                        <SelectItem value={TransactionCategory.OTHER}>Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Orçamento (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O valor máximo planejado para esta categoria
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Inicial</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Final</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                        placeholder="Observações adicionais sobre o orçamento"
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
                  onClick={() => setIsNewBudgetOpen(false)}
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
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => budgetToDelete && deleteMutation.mutate(budgetToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Orçamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;
