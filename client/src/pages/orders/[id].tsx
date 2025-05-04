import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ChevronLeft, Edit, Trash, Clock, ArrowRight, CheckCircle, XCircle } from "lucide-react";

const OrderDetails = () => {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  
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
