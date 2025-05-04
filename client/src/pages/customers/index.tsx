import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Phone, Mail, MapPin, Building2, Edit, Trash } from "lucide-react";

const CustomersList = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  // Schema for customer form
  const customerSchema = z.object({
    name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
    email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
  });
  
  // Form setup
  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });
  
  // Reset form when selected customer changes
  const resetForm = () => {
    if (selectedCustomer) {
      form.reset({
        name: selectedCustomer.name,
        email: selectedCustomer.email || "",
        phone: selectedCustomer.phone || "",
        address: selectedCustomer.address || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  };
  
  // Open dialog for creating or editing
  const openDialog = (customer: any = null) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };
  
  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };
  
  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerSchema>) => {
      const response = await apiRequest('POST', '/api/customers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado",
        description: "O cliente foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível criar o cliente: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof customerSchema> }) => {
      const response = await apiRequest('PUT', `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o cliente: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/customers/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o cliente: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Submit handler
  const onSubmit = (data: z.infer<typeof customerSchema>) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Clientes
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => openDialog()}>
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Cliente
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Carregando clientes...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-6">
            <p className="text-gray-500">Nenhum cliente cadastrado.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    {customer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.email && (
                    <div className="flex items-center mb-2">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center mb-2">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{customer.address}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openDialog(customer)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cliente {customer.name}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(customer.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Customer Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (open) {
            resetForm();
          } else {
            closeDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {selectedCustomer 
                ? "Atualize as informações do cliente conforme necessário."
                : "Preencha as informações para cadastrar um novo cliente."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente ou empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {selectedCustomer ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersList;
