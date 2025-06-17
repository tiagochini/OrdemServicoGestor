import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, User, Wrench, Calendar, Clock, CheckCircle, XCircle, FileText, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TechnicianForm from "@/components/technicians/technician-form";
import type { Technician, WorkOrder } from "@shared/schema";

const TechnicianDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch technician data
  const { data: technician, isLoading: isLoadingTechnician, error: technicianError } = useQuery<Technician>({
    queryKey: ['/api/technicians', id],
    enabled: !!id,
  });

  // Fetch technician's work orders
  const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery<WorkOrder[]>({
    queryKey: ['/api/work-orders', 'technician', id],
    queryFn: async () => {
      const response = await fetch(`/api/work-orders?technicianId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Mock status for demo purposes
  const getMockStatus = (technicianId: number) => {
    const statuses = ['disponivel', 'ocupado', 'ausente'];
    return statuses[technicianId % 3];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Disponível</Badge>;
      case 'ocupado':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Ocupado</Badge>;
      case 'ausente':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ausente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getWorkOrderStatusBadge = (status: string) => {
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

  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">ID do técnico não encontrado</h1>
          <Link href="/technicians">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Técnicos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (technicianError) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erro ao carregar técnico</h1>
          <p className="text-muted-foreground mt-2">
            Não foi possível carregar as informações do técnico.
          </p>
          <Link href="/technicians">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Técnicos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingTechnician) {
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

  if (!technician) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Técnico não encontrado</h1>
          <p className="text-muted-foreground mt-2">
            O técnico com ID {id} não foi encontrado no sistema.
          </p>
          <Link href="/technicians">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Técnicos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    toast({
      title: "Técnico atualizado",
      description: "As informações do técnico foram atualizadas com sucesso.",
    });
  };

  const technicianStatus = getMockStatus(technician.id);

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/technicians">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{technician.name}</h1>
                {getStatusBadge(technicianStatus)}
              </div>
              <p className="text-muted-foreground">
                Dashboard do técnico e ordens atribuídas
              </p>
            </div>
          </div>
          
          <Button onClick={() => setIsEditModalOpen(true)} variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar Técnico
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Technician Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome do técnico */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">{technician.name}</p>
                </div>
              </div>

              {/* ID do técnico */}
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ID do Técnico</p>
                  <p className="text-sm text-muted-foreground">#{technician.id}</p>
                </div>
              </div>
              
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{technician.email || 'Não informado'}</p>
                </div>
              </div>
              
              {/* Telefone */}
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{technician.phone || 'Não informado'}</p>
                </div>
              </div>
              
              {/* Especialização */}
              <div className="flex items-start gap-3">
                <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Especialização</p>
                  <p className="text-sm text-muted-foreground">{technician.specialization || 'Não informado'}</p>
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

        {/* Work Orders Assigned */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ordens Atribuídas</span>
              <Badge variant="outline">{workOrders.length} ordens</Badge>
            </CardTitle>
            <CardDescription>
              Todas as ordens de serviço atribuídas a este técnico
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
                        {getWorkOrderStatusBadge(order.status)}
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
                <h3 className="text-lg font-medium">Nenhuma ordem atribuída</h3>
                <p className="text-muted-foreground mb-4">
                  Este técnico ainda não possui ordens de serviço atribuídas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendário Semanal
            </CardTitle>
            <CardDescription>
              Agenda e disponibilidade do técnico para a semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Calendário em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                A funcionalidade de calendário semanal será implementada em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Technician Modal */}
      <TechnicianForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        technicianId={technician.id}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default TechnicianDetailPage;