import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertTechnicianSchema, type InsertTechnician, type Technician } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface TechnicianFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  technicianId?: number;
}

const TechnicianForm = ({ isOpen, onClose, onSuccess, technicianId }: TechnicianFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!technicianId;

  // Fetch technician data for editing
  const { data: technician, isLoading: isLoadingTechnician } = useQuery<Technician>({
    queryKey: ['/api/technicians', technicianId],
    enabled: isEditing,
  });

  // Form setup with validation
  const form = useForm<InsertTechnician>({
    resolver: zodResolver(insertTechnicianSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
    },
  });

  // Reset form when technician data loads or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && technician) {
        form.reset({
          name: technician.name,
          email: technician.email || "",
          phone: technician.phone || "",
          specialization: technician.specialization || "",
        });
      } else if (!isEditing) {
        form.reset({
          name: "",
          email: "",
          phone: "",
          specialization: "",
        });
      }
    }
  }, [isOpen, isEditing, technician, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertTechnician) => {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create technician');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      toast({
        title: "Técnico criado",
        description: "O técnico foi criado com sucesso.",
      });
      onSuccess?.();
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar técnico",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: InsertTechnician) => {
      const response = await fetch(`/api/technicians/${technicianId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update technician');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians', technicianId] });
      toast({
        title: "Técnico atualizado",
        description: "As informações do técnico foram atualizadas com sucesso.",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar técnico",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertTechnician) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Técnico" : "Novo Técnico"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do técnico abaixo."
              : "Adicione um novo técnico à sua equipe preenchendo as informações abaixo."
            }
          </DialogDescription>
        </DialogHeader>

        {isLoadingTechnician ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome completo do técnico"
                        {...field}
                      />
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
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
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
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialização</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as especialidades do técnico (ex: Elétrica, Hidráulica, Ar condicionado, etc.)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Atualizando..." : "Criando..."}
                    </>
                  ) : (
                    isEditing ? "Atualizar Técnico" : "Criar Técnico"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TechnicianForm;