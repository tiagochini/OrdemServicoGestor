import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: number;
}

const AccountForm = ({ isOpen, onClose, accountId }: AccountFormProps) => {
  const { toast } = useToast();
  const [isEdit, setIsEdit] = useState(false);

  // Extended schema with validations
  const formSchema = insertAccountSchema.extend({
    name: z.string().min(3, {
      message: "O nome da conta deve ter pelo menos 3 caracteres",
    }),
    type: z.string().min(1, {
      message: "Por favor selecione o tipo de conta",
    }),
    description: z.string().optional(),
  });

  // Fetch account data for edit mode
  const { data: account, isLoading: isLoadingAccount } = useQuery<any>({
    queryKey: ['/api/accounts', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${accountId}`);
      if (!response.ok) throw new Error('Failed to fetch account');
      return response.json();
    },
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
    },
  });

  useEffect(() => {
    if (accountId && account) {
      setIsEdit(true);
      form.reset({
        name: account.name,
        type: account.type,
        description: account.description || "",
      });
    } else {
      setIsEdit(false);
      form.reset({
        name: "",
        type: "",
        description: "",
      });
    }
  }, [accountId, account, form]);

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/accounts', values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Conta criada",
        description: "A conta bancária foi criada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balances'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('PUT', `/api/accounts/${accountId}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Conta atualizada",
        description: "A conta bancária foi atualizada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balances'] });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar conta",
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

  const isLoading = isLoadingAccount || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Conta Bancária" : "Nova Conta Bancária"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Atualize os dados da conta bancária conforme necessário."
              : "Preencha os dados para criar uma nova conta bancária."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome da Conta */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Ex: Conta Corrente Principal, Poupança Empresa, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Conta */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select
                    disabled={isLoading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
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
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder="Descrição adicional da conta, nome do banco, agência, etc."
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

export default AccountForm;