import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Phone, Mail, Briefcase, User, Edit, Trash } from "lucide-react";

const TechniciansList = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any | null>(null);
  
  // Fetch technicians
  const { data: technicians = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Schema for technician form
  const technicianSchema = z.object({
    name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
    email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    specialization: z.string().optional().or(z.literal("")),
  });
  
  // Form setup
  const form = useForm<z.infer<typeof technicianSchema>>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
    },
  });
  
  // Reset form when selected technician changes
  const resetForm = () => {
    if (selectedTechnician) {
      form.reset({
        name: selectedTechnician.name,
        email: selectedTechnician.email || "",
        phone: selectedTechnician.phone || "",
        specialization: selectedTechnician.specialization || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        specialization: "",
      });
    }
  };
  
  // Open dialog for creating or editing
  const openDialog = (technician: any = null) => {
    setSelectedTechnician(technician);
    setIsDialogOpen(true);
  };
  
  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedTechnician(null);
  };
  
  // Create technician mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof technicianSchema>) => {
      const response = await apiRequest('POST', '/api/technicians', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Técnico criado",
        description: "O técnico foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível criar o técnico: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update technician mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof technicianSchema> }) => {
      const response = await apiRequest('PUT', `/api/technicians/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Técnico atualizado",
        description: "O técnico foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o técnico: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete technician mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/technicians/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Técnico excluído",
        description: "O técnico foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o técnico: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Submit handler
  const onSubmit = (data: z.infer<typeof technicianSchema>) => {
    if (selectedTechnician) {
      updateMutation.mutate({ id: selectedTechnician.id, data });
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
              Técnicos
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => openDialog()}>
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Técnico
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Carregando técnicos...</div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-6">
            <p className="text-gray-500">Nenhum técnico cadastrado.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {technicians.map((technician) => (
              <Card key={technician.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {technician.name}
                  </CardTitle>
                  {technician.specialization && (
                    <CardDescription className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {technician.specialization}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {technician.email && (
                    <div className="flex items-center mb-2">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{technician.email}</span>
                    </div>
                  )}
                  {technician.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{technician.phone}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openDialog(technician)}>
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
                        <AlertDialogTitle>Excluir Técnico</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o técnico {technician.name}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(technician.id)}
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

      {/* Create/Edit Technician Dialog */}
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
            <DialogTitle>{selectedTechnician ? "Editar Técnico" : "Novo Técnico"}</DialogTitle>
            <DialogDescription>
              {selectedTechnician 
                ? "Atualize as informações do técnico conforme necessário."
                : "Preencha as informações para cadastrar um novo técnico."}
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
                      <Input placeholder="Nome completo" {...field} />
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
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Hardware, Redes, Software" {...field} />
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
                  {selectedTechnician ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechniciansList;
