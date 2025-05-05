import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, Trash } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { CatalogItem, ItemType, UnitType, insertCatalogItemSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';

const formSchema = insertCatalogItemSchema.extend({
  price: z.coerce.number().min(0, 'O preço deve ser maior ou igual a zero'),
  cost: z.coerce.number().min(0, 'O custo deve ser maior ou igual a zero').optional().nullable(),
  tags: z.string().transform(val => val.split(',').map(t => t.trim()).filter(Boolean))
});

type FormValues = z.infer<typeof formSchema>;

export default function CatalogFormPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: catalogItem,
    isLoading,
    error
  } = useQuery<CatalogItem>({
    queryKey: ['/api/catalog', id],
    queryFn: async () => {
      if (id === 'new') return undefined;
      const response = await fetch(`/api/catalog/${id}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do item');
      }
      return response.json();
    },
    enabled: isEditing
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'product',
      unit: 'unit',
      price: 0,
      cost: null,
      sku: '',
      tags: '',
      isActive: true
    },
    values: catalogItem ? {
      ...catalogItem,
      tags: catalogItem.tags?.join(', ') || '',
    } : undefined
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/catalog', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Item criado',
        description: 'O item foi adicionado ao catálogo com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      setLocation('/catalog');
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao criar item: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('PUT', `/api/catalog/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Item atualizado',
        description: 'O item foi atualizado com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      setLocation('/catalog');
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao atualizar item: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/catalog/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Item removido',
        description: 'O item foi removido do catálogo com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      setLocation('/catalog');
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao remover item: ${error.message}`,
        variant: 'destructive'
      });
      setIsDeleting(false);
    }
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (isDeleting) {
      deleteMutation.mutate();
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foi possível carregar os dados do item. Por favor, tente novamente.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/catalog">Voltar para o catálogo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link to="/catalog">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar Item' : 'Novo Item'}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Propriedades básicas */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome*</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do item" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Descrição detalhada do item" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(ItemType).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value === 'product' ? 'Produto' : 'Serviço'}
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
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(UnitType).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value === 'unit' ? 'Unidade' : 
                                   value === 'kg' ? 'Quilograma' : 
                                   value === 'l' ? 'Litro' : 
                                   value === 'm' ? 'Metro' : 
                                   value === 'm2' ? 'Metro quadrado' : 
                                   value === 'hour' ? 'Hora' : value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço*</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Custo</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              value={value === null ? '' : value}
                              onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Custo de aquisição ou produção
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Propriedades adicionais */}
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Código do item" {...field} />
                        </FormControl>
                        <FormDescription>
                          Código único para identificação do item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Separadas por vírgula" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ex: hardware, periféricos, rede
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Ativo
                          </FormLabel>
                          <FormDescription>
                            Itens inativos não aparecem nas pesquisas e não podem ser adicionados a novos pedidos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                {isEditing ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {isDeleting ? (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        Confirmar exclusão
                      </>
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </>
                    )}
                  </Button>
                ) : (
                  <div>{/* Placeholder para manter o alinhamento */}</div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation('/catalog')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {!isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Criar Item
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}