import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertTransaction, TransactionType, TransactionStatus, TransactionCategory } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, ArrowDownRight, ArrowUpRight, Search, FilterX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Transactions = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(location.includes("?new=true"));
  const [transactionType, setTransactionType] = useState<string>(TransactionType.INCOME);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Consultar todas as transações
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter contas bancárias para associar à transação
  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar contas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter clientes para associar à transação
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para obter ordens de serviço para associar à transação
  const { data: workOrders } = useQuery({
    queryKey: ["/api/orders"],
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar ordens de serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Aplicar filtros às transações
  const filteredTransactions = transactions?.filter((transaction: any) => {
    let matchesFilter = true;
    
    if (filterType && transaction.type !== filterType) {
      matchesFilter = false;
    }
    
    if (filterStatus && transaction.status !== filterStatus) {
      matchesFilter = false;
    }
    
    if (filterCategory && transaction.category !== filterCategory) {
      matchesFilter = false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.documentRef?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        matchesFilter = false;
      }
    }
    
    return matchesFilter;
  });

  // Mutação para criar nova transação
  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar transação");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/balances"] });
      toast({
        title: "Transação criada",
        description: "A transação foi criada com sucesso",
      });
      setIsNewTransactionOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Definir esquema para validação do formulário
  const transactionFormSchema = z.object({
    date: z.date({
      required_error: "A data é obrigatória",
    }),
    description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
    type: z.string().min(1, "O tipo é obrigatório"),
    status: z.string().min(1, "O status é obrigatório"),
    category: z.string().min(1, "A categoria é obrigatória"),
    accountId: z.coerce.number().optional(),
    customerId: z.coerce.number().optional(),
    workOrderId: z.coerce.number().optional(),
    notes: z.string().optional(),
    documentRef: z.string().optional(),
  });

  // Configuração do formulário
  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      amount: undefined,
      type: TransactionType.INCOME,
      status: TransactionStatus.PENDING,
      category: transactionType === TransactionType.INCOME
        ? TransactionCategory.SALES
        : TransactionCategory.SUPPLIES,
      notes: "",
      documentRef: "",
    },
  });

  // Atualizar valores padrão quando o tipo de transação muda
  const watchType = form.watch("type");
  if (watchType !== transactionType) {
    setTransactionType(watchType);
    form.setValue(
      "category",
      watchType === TransactionType.INCOME
        ? TransactionCategory.SALES
        : TransactionCategory.SUPPLIES
    );
  }

  // Processar envio do formulário
  const onSubmit = async (values: z.infer<typeof transactionFormSchema>) => {
    try {
      await createMutation.mutateAsync(values as InsertTransaction);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilterType(undefined);
    setFilterStatus(undefined);
    setFilterCategory(undefined);
    setSearchTerm("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <Button onClick={() => setIsNewTransactionOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as transações por tipo, status ou categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por descrição..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionStatus.PENDING}>Pendente</SelectItem>
                <SelectItem value={TransactionStatus.PAID}>Pago</SelectItem>
                <SelectItem value={TransactionStatus.OVERDUE}>Atrasado</SelectItem>
                <SelectItem value={TransactionStatus.CANCELLED}>Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionCategory.SALES}>Vendas</SelectItem>
                  <SelectItem value={TransactionCategory.SERVICES}>Serviços</SelectItem>
                  <SelectItem value={TransactionCategory.SUPPLIES}>Suprimentos</SelectItem>
                  <SelectItem value={TransactionCategory.RENT}>Aluguel</SelectItem>
                  <SelectItem value={TransactionCategory.PAYROLL}>Folha de Pagamento</SelectItem>
                  <SelectItem value={TransactionCategory.TAXES}>Impostos</SelectItem>
                  <SelectItem value={TransactionCategory.UTILITIES}>Utilidades</SelectItem>
                  <SelectItem value={TransactionCategory.OTHER}>Outros</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            {filteredTransactions?.length} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Carregando transações...</p>
            </div>
          ) : filteredTransactions?.length > 0 ? (
            <div className="relative w-full overflow-auto">
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
                  {filteredTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            {
                              "bg-yellow-100 text-yellow-800": transaction.status === TransactionStatus.PENDING,
                              "bg-green-100 text-green-800": transaction.status === TransactionStatus.PAID,
                              "bg-red-100 text-red-800": transaction.status === TransactionStatus.OVERDUE,
                              "bg-gray-100 text-gray-800": transaction.status === TransactionStatus.CANCELLED,
                            }
                          )}
                        >
                          {transaction.status === TransactionStatus.PENDING && "Pendente"}
                          {transaction.status === TransactionStatus.PAID && "Pago"}
                          {transaction.status === TransactionStatus.OVERDUE && "Atrasado"}
                          {transaction.status === TransactionStatus.CANCELLED && "Cancelado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn({
                            "text-green-600": transaction.type === TransactionType.INCOME,
                            "text-red-600": transaction.type === TransactionType.EXPENSE,
                          })}
                        >
                          {transaction.type === TransactionType.INCOME ? "+ " : "- "}
                          {formatCurrency(parseFloat(transaction.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center py-8">
              <p>Nenhuma transação encontrada com os filtros atuais.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Nova Transação */}
      <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Adicione uma nova transação ao sistema financeiro.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs
                defaultValue={TransactionType.INCOME}
                value={transactionType}
                onValueChange={(v) => {
                  setTransactionType(v);
                  form.setValue("type", v);
                }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value={TransactionType.INCOME} className="flex items-center">
                    <ArrowUpRight className="mr-2 h-4 w-4 text-green-500" />
                    Receita
                  </TabsTrigger>
                  <TabsTrigger value={TransactionType.EXPENSE} className="flex items-center">
                    <ArrowDownRight className="mr-2 h-4 w-4 text-red-500" />
                    Despesa
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={TransactionType.INCOME} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              {...field}
                            />
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
                          <Input placeholder="Descrição da transação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TransactionStatus.PENDING}>Pendente</SelectItem>
                              <SelectItem value={TransactionStatus.PAID}>Pago</SelectItem>
                              <SelectItem value={TransactionStatus.OVERDUE}>Atrasado</SelectItem>
                              <SelectItem value={TransactionStatus.CANCELLED}>Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <SelectItem value={TransactionCategory.SALES}>Vendas</SelectItem>
                              <SelectItem value={TransactionCategory.SERVICES}>Serviços</SelectItem>
                              <SelectItem value={TransactionCategory.OTHER}>Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Conta bancária para registrar o recebimento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Cliente relacionado a esta receita
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="workOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem de Serviço</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a OS (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workOrders?.map((workOrder: any) => (
                                <SelectItem key={workOrder.id} value={workOrder.id.toString()}>
                                  OS #{workOrder.orderNumber} - {workOrder.description.substring(0, 30)}
                                  {workOrder.description.length > 30 ? "..." : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Ordem de serviço relacionada a esta transação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentRef"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referência/Documento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Número da NF, recibo, etc."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações adicionais"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value={TransactionType.EXPENSE} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              {...field}
                            />
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
                          <Input placeholder="Descrição da transação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TransactionStatus.PENDING}>Pendente</SelectItem>
                              <SelectItem value={TransactionStatus.PAID}>Pago</SelectItem>
                              <SelectItem value={TransactionStatus.OVERDUE}>Atrasado</SelectItem>
                              <SelectItem value={TransactionStatus.CANCELLED}>Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <SelectItem value={TransactionCategory.OTHER}>Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Conta bancária para registrar o pagamento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor/Destinatário</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Fornecedor ou destinatário deste pagamento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="workOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem de Serviço</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a OS (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workOrders?.map((workOrder: any) => (
                                <SelectItem key={workOrder.id} value={workOrder.id.toString()}>
                                  OS #{workOrder.orderNumber} - {workOrder.description.substring(0, 30)}
                                  {workOrder.description.length > 30 ? "..." : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Ordem de serviço relacionada a esta transação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentRef"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referência/Documento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Número da NF, fatura, etc."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações adicionais"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTransactionOpen(false)}
                  className="min-w-[100px]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="min-w-[100px]"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
