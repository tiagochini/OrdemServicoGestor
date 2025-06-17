import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertCatalogItemSchema, type InsertCatalogItem, type CatalogItem } from "@shared/schema";
import { z } from "zod";

interface CatalogItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  catalogItemId?: number;
}

// Extended validation schema with UI-specific rules
const catalogItemFormSchema = insertCatalogItemSchema.extend({
  price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  cost: z.number().min(0, "Custo deve ser maior ou igual a zero").optional(),
  tags: z.array(z.string()).default([]),
});

type CatalogItemFormData = z.infer<typeof catalogItemFormSchema>;

const CatalogItemForm = ({ isOpen, onClose, onSuccess, catalogItemId }: CatalogItemFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const isEditing = !!catalogItemId;

  // Fetch catalog item data for editing
  const { data: catalogItem, isLoading: isLoadingItem } = useQuery<CatalogItem>({
    queryKey: ['/api/catalog', catalogItemId],
    queryFn: async () => {
      const response = await fetch(`/api/catalog/${catalogItemId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch catalog item');
      }
      return response.json();
    },
    enabled: isEditing,
  });

  // Form setup with validation
  const form = useForm<CatalogItemFormData>({
    resolver: zodResolver(catalogItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "product",
      unit: "unit",
      price: 0,
      cost: 0,
      sku: "",
      tags: [],
      isActive: true,
    },
  });

  // Reset form when catalog item data loads or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && catalogItem) {
        const tags = Array.isArray(catalogItem.tags) ? catalogItem.tags : [];
        form.reset({
          name: catalogItem.name,
          description: catalogItem.description || "",
          type: catalogItem.type as "product" | "service",
          unit: catalogItem.unit as "unit" | "kg" | "l" | "m" | "m2" | "hour",
          price: typeof catalogItem.price === 'string' ? parseFloat(catalogItem.price) : catalogItem.price,
          cost: catalogItem.cost ? (typeof catalogItem.cost === 'string' ? parseFloat(catalogItem.cost) : catalogItem.cost) : 0,
          sku: catalogItem.sku || "",
          tags: tags,
          isActive: catalogItem.isActive,
        });
      } else if (!isEditing) {
        form.reset({
          name: "",
          description: "",
          type: "product",
          unit: "unit",
          price: 0,
          cost: 0,
          sku: "",
          tags: [],
          isActive: true,
        });
      }
    }
  }, [isOpen, isEditing, catalogItem, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CatalogItemFormData) => {
      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create catalog item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      toast({
        title: "Item criado",
        description: "O item do catálogo foi criado com sucesso.",
      });
      onSuccess?.();
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar item",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CatalogItemFormData) => {
      const response = await fetch(`/api/catalog/${catalogItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update catalog item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/catalog', catalogItemId] });
      toast({
        title: "Item atualizado",
        description: "As informações do item foram atualizadas com sucesso.",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CatalogItemFormData) => {
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
      setTagInput("");
      onClose();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.getValues('tags').includes(trimmedTag)) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Item do Catálogo" : "Novo Item do Catálogo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do item do catálogo abaixo."
              : "Adicione um novo produto ou serviço ao catálogo preenchendo as informações abaixo."
            }
          </DialogDescription>
        </DialogHeader>

        {isLoadingItem ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do produto/serviço"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Produto</SelectItem>
                          <SelectItem value="service">Serviço</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Descrição detalhada do produto/serviço"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unit">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="l">Litro</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="m2">Metro Quadrado</SelectItem>
                          <SelectItem value="hour">Hora</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU/Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Código único do produto"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Tags/Categorias</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma tag e pressione Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('tags').map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

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
                    isEditing ? "Atualizar Item" : "Criar Item"
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

export default CatalogItemForm;