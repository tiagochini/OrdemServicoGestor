import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OrderStatus, insertWorkOrderSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
}

const OrderForm = ({ isOpen, onClose, orderId }: OrderFormProps) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  
  // Extended schema with validations
  const formSchema = insertWorkOrderSchema.extend({
    customerId: z.number({
      required_error: "Por favor selecione um cliente",
    }),
    status: z.enum([
      OrderStatus.PENDING,
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ], {
      required_error: "Por favor selecione um status",
    }),
    description: z.string().min(5, {
      message: "A descrição deve ter pelo menos 5 caracteres",
    }),
  });
  
  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch technicians for dropdown
  const { data: technicians, isLoading: isLoadingTechnicians } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Fetch work order data for edit mode
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useQuery<any>({
    queryKey: ['/api/work-orders', orderId],
    enabled: !!orderId,
  });
  
  useEffect(() => {
    if (orderId && workOrder) {
      setIsEdit(true);
      form.reset({
        customerId: workOrder.customerId,
        technicianId: workOrder.technicianId || undefined,
        status: workOrder.status,
        description: workOrder.description,
        serviceType: workOrder.serviceType || undefined,
        notes: workOrder.notes || "",
      });
    }
  }, [orderId, workOrder]);
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: undefined,
      technicianId: undefined,
      status: OrderStatus.PENDING,
      description: "",
      serviceType: "",
      notes: "",
    },
  });
  
  // Create work order mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/work-orders', values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Ordem de serviço criada",
        description: "A ordem de serviço foi criada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
      navigate('/orders');
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar ordem de serviço",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update work order mutation
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('PUT', `/api/work-orders/${orderId}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Ordem de serviço atualizada",
        description: "A ordem de serviço foi atualizada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
      navigate('/orders');
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar ordem de serviço",
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
  
  const isLoading = isLoadingCustomers || isLoadingTechnicians || 
    (isEdit && isLoadingWorkOrder) || 
    createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Atualize os dados da ordem de serviço conforme necessário."
              : "Preencha os dados para criar uma nova ordem de serviço."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value?.toString() || "0"}
                    onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Não atribuído</SelectItem>
                      {technicians?.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id.toString()}>
                          {technician.name}
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
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manutenção de Hardware">Manutenção de Hardware</SelectItem>
                      <SelectItem value="Instalação de Software">Instalação de Software</SelectItem>
                      <SelectItem value="Manutenção de Impressora">Manutenção de Impressora</SelectItem>
                      <SelectItem value="Suporte de Rede">Suporte de Rede</SelectItem>
                      <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      <SelectItem value={OrderStatus.PENDING}>Pendente</SelectItem>
                      <SelectItem value={OrderStatus.IN_PROGRESS}>Em Progresso</SelectItem>
                      <SelectItem value={OrderStatus.COMPLETED}>Concluída</SelectItem>
                      <SelectItem value={OrderStatus.CANCELLED}>Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema ou serviço a ser realizado..."
                      rows={3}
                      disabled={isLoading}
                      {...field}
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
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      rows={2}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEdit ? "Atualizar OS" : "Criar OS"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
