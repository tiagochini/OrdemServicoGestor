import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Plus, Mail, Phone, MapPin, Building, Calendar, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomerForm from "@/components/customers/customer-form";
import type { Customer, WorkOrder } from "@shared/schema";

const CustomerDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useQuery<Customer>({
    queryKey: ['/api/customers', id],
    enabled: !!id,
  });

  // Fetch customer's work orders
  const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery<WorkOrder[]>({
    queryKey: ['/api/work-orders', 'customer', id],
    queryFn: async () => {
      const response = await fetch(`/api/work-orders?customerId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">ID do cliente não encontrado</h1>
          <Link href="/customers">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (customerError) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erro ao carregar cliente</h1>
          <p className="text-muted-foreground mt-2">
            Não foi possível carregar as informações do cliente.
          </p>
          <Link href="/customers">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingCustomer) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          
          {/* Content Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Cliente não encontrado</h1>
          <p className="text-muted-foreground mt-2">
            O cliente com ID {id} não foi encontrado no sistema.
          </p>
          <Link href="/customers">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    // Refresh customer data
    window.location.reload();
    toast({
      title: "Cliente atualizado",
      description: "As informações do cliente foram atualizadas com sucesso.",
    });
  };

  const handleCreateOrder = () => {
    // Navigate to create order page with customer pre-selected
    window.location.href = `/orders/new?customerId=${customer.id}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/customers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <p className="text-muted-foreground">
                Detalhes do cliente e histórico de ordens
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setIsEditModalOpen(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
            <Button onClick={handleCreateOrder}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem de Serviço
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome do cliente - sempre mostrado */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">{customer.name}</p>
                </div>
              </div>

              {/* ID do cliente - sempre mostrado */}
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ID do Cliente</p>
                  <p className="text-sm text-muted-foreground">#{customer.id}</p>
                </div>
              </div>
              
              {/* Email - só mostra se existir */}
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email || 'Não informado'}</p>
                </div>
              </div>
              
              {/* Telefone - sempre mostra */}
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone || 'Não informado'}</p>
                </div>
              </div>
              
              {/* Empresa - sempre mostra */}
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Empresa</p>
                  <p className="text-sm text-muted-foreground">{customer.company || 'Não informado'}</p>
                </div>
              </div>
              
              {/* Endereço - sempre mostra */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Endereço</p>
                  <div className="text-sm text-muted-foreground">
                    {customer.address ? (
                      <p>{customer.address}</p>
                    ) : (
                      <p>Não informado</p>
                    )}
                    {(customer.city || customer.state || customer.zipCode) ? (
                      <p>
                        {[customer.city, customer.state, customer.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    ) : (
                      <p>Cidade/Estado não informado</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{workOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Ordens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {workOrders.filter(order => order.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {workOrders.filter(order => order.status === 'in_progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {workOrders.filter(order => order.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Orders History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Histórico de Ordens de Serviço</span>
              <Button onClick={handleCreateOrder} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ordem
              </Button>
            </CardTitle>
            <CardDescription>
              Todas as ordens de serviço associadas a este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : workOrders.length > 0 ? (
              <div className="space-y-4">
                {workOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">Ordem #{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {order.serviceType && (
                      <div className="mt-2">
                        <Badge variant="outline">{order.serviceType}</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma ordem encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Este cliente ainda não possui ordens de serviço.
                </p>
                <Button onClick={handleCreateOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Ordem
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Customer Modal */}
      <CustomerForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customerId={customer.id}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default CustomerDetailPage;