import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OrderStatus } from "@shared/schema";
import { useState } from "react";
import OrderForm from "@/components/orders/order-form";
import { format } from "date-fns";
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
import { ChevronLeft, Edit, Trash, Clock, ArrowRight, CheckCircle, XCircle, Plus, Package, ShoppingCart } from "lucide-react";

const OrderDetails = () => {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemDiscount, setItemDiscount] = useState("0");
  const [itemNotes, setItemNotes] = useState("");
  
  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery<any>({
    queryKey: ['/api/work-orders', orderId],
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da ordem de serviço.",
        variant: "destructive",
      });
      navigate("/orders");
    }
  });
  
  // Fetch customer
  const { data: customer } = useQuery<any>({
    queryKey: ['/api/customers', workOrder?.customerId],
    enabled: !!workOrder?.customerId,
  });
  
  // Fetch technician
  const { data: technician } = useQuery<any>({
    queryKey: ['/api/technicians', workOrder?.technicianId],
    enabled: !!workOrder?.technicianId,
  });
  
  // Fetch notes
  const { data: notes = [], refetch: refetchNotes } = useQuery<any[]>({
    queryKey: ['/api/work-orders', orderId, 'notes'],
  });
  
  // Fetch work order items
  const { data: workOrderItems = [], refetch: refetchItems } = useQuery<any[]>({
    queryKey: ['/api/work-orders', orderId, 'items'],
  });
  
  // Fetch catalog items for selection
  const { data: catalogItems = [] } = useQuery<any[]>({
    queryKey: ['/api/catalog'],
  });
  
  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (note: { workOrderId: number, content: string, createdBy: string }) => {
      const response = await apiRequest('POST', '/api/notes', note);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Nota adicionada",
        description: "A nota foi adicionada com sucesso.",
      });
      setNewNote("");
      refetchNotes();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a nota.",
        variant: "destructive",
      });
    }
  });
  
  // Delete work order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/work-orders/${orderId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Ordem de serviço excluída",
        description: "A ordem de serviço foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      navigate("/orders");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a ordem de serviço.",
        variant: "destructive",
      });
    }
  });

  // Add work order item mutation
  const addItemMutation = useMutation({
    mutationFn: async (itemData: { workOrderId: number, catalogItemId: number, quantity: number, unitPrice: number, discount?: number, notes?: string }) => {
      const response = await apiRequest('POST', '/api/work-order-items', itemData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado à ordem de serviço com sucesso.",
      });
      refetchItems();
      setIsAddItemDialogOpen(false);
      resetItemForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item à ordem de serviço.",
        variant: "destructive",
      });
    }
  });

  // Remove work order item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest('DELETE', `/api/work-order-items/${itemId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Item removido",
        description: "O item foi removido da ordem de serviço com sucesso.",
      });
      refetchItems();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item da ordem de serviço.",
        variant: "destructive",
      });
    }
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Data inválida";
    }
  };
  
  // Add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    createNoteMutation.mutate({
      workOrderId: orderId,
      content: newNote.trim(),
      createdBy: "Usuário atual", // In a real app, this would come from auth context
    });
  };

  // Reset item form
  const resetItemForm = () => {
    setSelectedCatalogItem(null);
    setItemQuantity("1");
    setItemDiscount("0");
    setItemNotes("");
  };

  // Handle add item to work order
  const handleAddItem = () => {
    if (!selectedCatalogItem) return;
    
    const quantity = parseFloat(itemQuantity);
    const discount = parseFloat(itemDiscount) || 0;
    
    if (quantity <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    addItemMutation.mutate({
      workOrderId: orderId,
      catalogItemId: selectedCatalogItem.id,
      quantity,
      unitPrice: selectedCatalogItem.price,
      discount: discount > 0 ? discount : undefined,
      notes: itemNotes.trim() || undefined,
    });
  };

  // Calculate subtotal for work order items
  const calculateSubtotal = () => {
    return workOrderItems.reduce((total: number, item: any) => {
      const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      return total + itemSubtotal;
    }, 0);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Get catalog item by ID
  const getCatalogItemById = (id: number) => {
    return catalogItems.find((item: any) => item.id === id);
  };
  
  // Helper to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "status-badge-pending";
      case OrderStatus.IN_PROGRESS:
        return "status-badge-in_progress";
      case OrderStatus.COMPLETED:
        return "status-badge-completed";
      case OrderStatus.CANCELLED:
        return "status-badge-cancelled";
      default:
        return "";
    }
  };
  
  // Helper to get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "Pendente";
      case OrderStatus.IN_PROGRESS:
        return "Em Progresso";
      case OrderStatus.COMPLETED:
        return "Concluída";
      case OrderStatus.CANCELLED:
        return "Cancelada";
      default:
        return status;
    }
  };
  
  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-5 w-5" />;
      case OrderStatus.IN_PROGRESS:
        return <ArrowRight className="h-5 w-5" />;
      case OrderStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">Carregando detalhes da ordem de serviço...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Link href="/orders">
            <Button variant="ghost" className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para lista
            </Button>
          </Link>
          <h2 className="ml-4 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            #{workOrder?.orderNumber}
          </h2>
          <Badge className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(workOrder?.status)}`}>
            {getStatusDisplay(workOrder?.status)}
          </Badge>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Order Details */}
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Detalhes da Ordem
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Criado em {formatDate(workOrder?.createdAt)}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditFormOpen(true)}>
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
                      <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteOrderMutation.mutate()}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer?.name || "—"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Contato</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer?.phone || customer?.email || "—"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Técnico</dt>
                  <dd className="mt-1 text-sm text-gray-900">{technician?.name || "Não atribuído"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Tipo de Serviço</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workOrder?.serviceType || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {getStatusIcon(workOrder?.status)}
                    <span className="ml-1">{getStatusDisplay(workOrder?.status)}</span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workOrder?.description}</dd>
                </div>
                {workOrder?.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Observações</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workOrder.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Work Order Items Section */}
          <div className="px-4 py-5 bg-gray-50 sm:p-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Itens da Ordem de Serviço
              </h3>
              <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Item do Catálogo</DialogTitle>
                    <DialogDescription>
                      Selecione um produto ou serviço do catálogo para adicionar à ordem de serviço.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="catalog-item">Item do Catálogo</Label>
                      <Select value={selectedCatalogItem?.id?.toString() || ""} onValueChange={(value) => {
                        const item = catalogItems.find((item: any) => item.id.toString() === value);
                        setSelectedCatalogItem(item);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems.map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                <span className="text-sm text-gray-500">
                                  {item.type === 'product' ? 'Produto' : 'Serviço'} - {formatCurrency(item.price)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="discount">Desconto (R$)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={itemDiscount}
                          onChange={(e) => setItemDiscount(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {selectedCatalogItem && (
                      <div className="grid gap-2">
                        <Label>Preço Unitário</Label>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedCatalogItem.price)}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="item-notes">Observações (opcional)</Label>
                      <Textarea
                        id="item-notes"
                        placeholder="Observações sobre este item..."
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddItem}
                      disabled={!selectedCatalogItem || addItemMutation.isPending}
                    >
                      {addItemMutation.isPending ? "Adicionando..." : "Adicionar Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {workOrderItems.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-md border-2 border-dashed border-gray-300">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Nenhum item adicionado à ordem de serviço.</p>
                <p className="text-sm text-gray-400">Adicione produtos ou serviços do catálogo.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrderItems.map((item: any) => {
                      const catalogItem = getCatalogItemById(item.catalogItemId);
                      const subtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{catalogItem?.name}</div>
                              {item.notes && (
                                <div className="text-sm text-gray-500">{item.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={catalogItem?.type === 'product' ? 'default' : 'secondary'}>
                              {catalogItem?.type === 'product' ? 'Produto' : 'Serviço'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">
                            {item.discount > 0 ? formatCurrency(item.discount) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(subtotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Total Geral:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="px-4 py-5 bg-gray-50 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Histórico de Anotações
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
              {notes.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-md">
                  <p className="text-gray-500">Nenhuma anotação registrada.</p>
                </div>
              ) : (
                notes.map((note, index) => (
                  <Card key={note.id || index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium">{note.createdBy || "Usuário"}</CardTitle>
                        <CardDescription>{formatDate(note.createdAt)}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm">{note.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div className="mt-4">
              <Label htmlFor="new-note">Nova Anotação</Label>
              <Textarea
                id="new-note"
                placeholder="Adicione uma anotação..."
                className="mt-1"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                >
                  Adicionar Anotação
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditFormOpen && (
        <OrderForm 
          isOpen={isEditFormOpen} 
          onClose={() => setIsEditFormOpen(false)} 
          orderId={orderId}
        />
      )}
    </div>
  );
};

export default OrderDetails;
