import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  insertTransactionSchema, 
  TransactionType, 
  TransactionStatus, 
  TransactionCategory 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayableReceivableFormProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: number;
  type: 'payable' | 'receivable';
}

const PayableReceivableForm = ({ isOpen, onClose, transactionId, type }: PayableReceivableFormProps) => {
  const { toast } = useToast();
  const [isEdit, setIsEdit] = useState(false);

  const isPayable = type === 'payable';
  const transactionType = isPayable ? TransactionType.EXPENSE : TransactionType.INCOME;

  // Extended schema with validations
  const formSchema = insertTransactionSchema.extend({
    type: z.literal(transactionType),
    status: z.enum([
      TransactionStatus.PENDING,
      TransactionStatus.PAID,
      TransactionStatus.OVERDUE,
      TransactionStatus.CANCELLED,
    ]),
    description: z.string().min(3, {
      message: "A descrição deve ter pelo menos 3 caracteres",
    }),
    amount: z.string().or(z.number()).pipe(
      z.coerce.number().positive("O valor deve ser positivo")
    ),
    date: z.date({
      required_error: "A data é obrigatória",
    }),
    dueDate: z.date({
      required_error: "A data de vencimento é obrigatória",
    }),
    category: z.enum([
      TransactionCategory.SALES,
      TransactionCategory.SERVICE,
      TransactionCategory.TAXES,
      TransactionCategory.PAYROLL,
      TransactionCategory.RENT,
      TransactionCategory.UTILITIES,
      TransactionCategory.SUPPLIES,
      TransactionCategory.MAINTENANCE,
      TransactionCategory.INSURANCE,
      TransactionCategory.OTHER,
    ]),
  });

  // Fetch customers for dropdown
  const { data: customers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch work orders for dropdown
  const { data: workOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders'],
  });

  // Fetch transaction data for edit mode
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery<any>({
    queryKey: ['/api/transactions', transactionId],
    enabled: !!transactionId,
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${transactionId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      return response.json();
    },
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transactionType,
      status: TransactionStatus.PENDING,
      description: "",
      amount: 0,
      date: new Date(),
      dueDate: new Date(),
      category: TransactionCategory.OTHER,
      customerId: undefined,
      workOrderId: undefined,
      notes: "",
      accountId: undefined,
      documentRef: "",
    },
  });

  useEffect(() => {
    if (transactionId && transaction) {
      setIsEdit(true);
      form.reset({
        type: transactionType,
        status: transaction.status,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        date: new Date(transaction.date),
        dueDate: transaction.dueDate ? new Date(transaction.dueDate) : new Date(),
        category: transaction.category,
        customerId: transaction.customerId || undefined,
        workOrderId: transaction.workOrderId || undefined,
        notes: transaction.notes || "",
        accountId: transaction.accountId || undefined,
        documentRef: transaction.documentRef || "",
      });
    } else {
      setIsEdit(false);
      form.reset({
        type: transactionType,
        status: TransactionStatus.PENDING,
        description: "",
        amount: 0,
        date: new Date(),
        dueDate: new Date(),
        category: TransactionCategory.OTHER,
        customerId: undefined,
        workOrderId: undefined,
        notes: "",
        accountId: undefined,
        documentRef: "",
      });
    }
  }, [transactionId, transaction, form, transactionType]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/transactions', values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: `${isPayable ? 'Conta a pagar' : 'Conta a receber'} criada`,
        description: `A ${isPayable ? 'conta a pagar' : 'conta a receber'} foi registrada com sucesso`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/accounts-${type}`] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: `Erro ao criar ${isPayable ? 'conta a pagar' : 'conta a receber'}`,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('PUT', `/api/transactions/${transactionId}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: `${isPayable ? 'Conta a pagar' : 'Conta a receber'} atualizada`,
        description: `A ${isPayable ? 'conta a pagar' : 'conta a receber'} foi atualizada com sucesso`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/accounts-${type}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', transactionId] });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: `Erro ao atualizar ${isPayable ? 'conta a pagar' : 'conta a receber'}`,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/transactions/${transactionId}`, { 
        status: TransactionStatus.PAID 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: `${isPayable ? 'Conta marcada como paga' : 'Conta marcada como recebida'}`,
        description: `A ${isPayable ? 'conta a pagar' : 'conta a receber'} foi marcada como ${isPayable ? 'paga' : 'recebida'}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/accounts-${type}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', transactionId] });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: `Erro ao marcar como ${isPayable ? 'pago' : 'recebido'}`,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEdit) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const isLoading = isLoadingTransaction || createMutation.isPending || updateMutation.isPending || markAsPaidMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 
              `Editar ${isPayable ? 'Conta a Pagar' : 'Conta a Receber'}` : 
              `Nova ${isPayable ? 'Conta a Pagar' : 'Conta a Receber'}`
            }
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? `Atualize os dados da ${isPayable ? 'conta a pagar' : 'conta a receber'} conforme necessário.`
              : `Preencha os dados para registrar uma nova ${isPayable ? 'conta a pagar' : 'conta a receber'}.`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionStatus.PENDING}>
                        Pendente
                      </SelectItem>
                      <SelectItem value={TransactionStatus.PAID}>
                        {isPayable ? 'Pago' : 'Recebido'}
                      </SelectItem>
                      <SelectItem value={TransactionStatus.OVERDUE}>
                        Vencido
                      </SelectItem>
                      <SelectItem value={TransactionStatus.CANCELLED}>
                        Cancelado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder={`Digite a descrição da ${isPayable ? 'despesa' : 'receita'}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
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
                    <Select
                      disabled={isLoading}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data e Data de Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            disabled={isLoading}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            disabled={isLoading}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cliente e Ordem de Serviço */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPayable ? 'Fornecedor' : 'Cliente'} (opcional)
                    </FormLabel>
                    <Select
                      disabled={isLoading}
                      value={field.value?.toString() || "0"}
                      onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione um ${isPayable ? 'fornecedor' : 'cliente'}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">
                          Sem {isPayable ? 'fornecedor' : 'cliente'} específico
                        </SelectItem>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Serviço (opcional)</FormLabel>
                    <Select
                      disabled={isLoading}
                      value={field.value?.toString() || "0"}
                      onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma ordem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Sem ordem específica</SelectItem>
                        {workOrders?.map((order) => (
                          <SelectItem key={order.id} value={order.id.toString()}>
                            #{order.orderNumber} - {order.description.substring(0, 30)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Referência do Documento */}
            <FormField
              control={form.control}
              name="documentRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência do Documento (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Ex: NF-001, Boleto-123, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder={`Observações adicionais sobre a ${isPayable ? 'conta a pagar' : 'conta a receber'}`}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              
              {isEdit && transaction?.status !== TransactionStatus.PAID && (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => markAsPaidMutation.mutate()}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {markAsPaidMutation.isPending 
                    ? "Processando..." 
                    : `Marcar como ${isPayable ? 'Pago' : 'Recebido'}`
                  }
                </Button>
              )}
              
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (isEdit ? "Atualizando..." : "Criando...") 
                  : (isEdit ? "Atualizar" : "Criar")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PayableReceivableForm;