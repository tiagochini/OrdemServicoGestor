import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Mail, Phone, User, Wrench, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TechnicianForm from "@/components/technicians/technician-form";
import type { Technician } from "@shared/schema";

const TechniciansPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Mock status for demo purposes
  const getMockStatus = (id: number) => {
    const statuses = ['disponivel', 'ocupado', 'ausente'];
    return statuses[id % 3];
  };

  // Fetch technicians data
  const { data: technicians = [], isLoading, error } = useQuery<Technician[]>({
    queryKey: ['/api/technicians'],
  });

  // Filter technicians based on search and filters
  const filteredTechnicians = technicians.filter((technician) => {
    const matchesSearch = technician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (technician.email && technician.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialization = !specializationFilter || 
                                 (technician.specialization && technician.specialization.toLowerCase().includes(specializationFilter.toLowerCase()));
    
    // For now, we'll use a mock status since it's not in the schema yet
    const mockStatus = getMockStatus(technician.id);
    const matchesStatus = !statusFilter || statusFilter === "ALL_STATUS" || mockStatus === statusFilter;
    
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  // Get unique specializations for filter
  const specializations = Array.from(new Set(
    technicians
      .map(tech => tech.specialization)
      .filter(Boolean)
      .map(spec => spec?.toLowerCase())
  ));

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

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    toast({
      title: "Técnico criado com sucesso",
      description: "O novo técnico foi adicionado ao sistema.",
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSpecializationFilterChange = (value: string) => {
    setSpecializationFilter(value === "ALL_SPECIALIZATIONS" ? "" : value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "ALL_STATUS" ? "" : value);
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erro ao carregar técnicos</h1>
          <p className="text-muted-foreground mt-2">
            Não foi possível carregar a lista de técnicos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Técnicos</h1>
            <p className="text-muted-foreground">
              Gerencie sua equipe de técnicos e suas especializações
            </p>
          </div>
          <Button onClick={() => setIsFormModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Técnico
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Specialization Filter */}
              <Select value={specializationFilter || "ALL_SPECIALIZATIONS"} onValueChange={handleSpecializationFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por especialização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_SPECIALIZATIONS">Todas as especializações</SelectItem>
                  {specializations.map((specialization) => (
                    <SelectItem key={specialization} value={specialization || ""}>
                      {specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter || "ALL_STATUS"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_STATUS">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum técnico encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || specializationFilter || statusFilter
                  ? "Tente ajustar os filtros de busca."
                  : "Comece adicionando seu primeiro técnico."}
              </p>
              <Button onClick={() => setIsFormModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Técnico
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Technician Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTechnicians.map((technician) => {
                const status = getMockStatus(technician.id);
                return (
                  <Card key={technician.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={`/technicians/${technician.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg hover:text-primary transition-colors">{technician.name}</CardTitle>
                            {technician.specialization && (
                              <CardDescription className="flex items-center mt-1">
                                <Wrench className="h-3 w-3 mr-1" />
                                {technician.specialization}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="text-xs">
                              #{technician.id}
                            </Badge>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {technician.email && (
                            <div className="flex items-center text-muted-foreground">
                              <Mail className="h-3 w-3 mr-2" />
                              <span className="truncate">{technician.email}</span>
                            </div>
                          )}
                          
                          {technician.phone && (
                            <div className="flex items-center text-muted-foreground">
                              <Phone className="h-3 w-3 mr-2" />
                              <span>{technician.phone}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
            
            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Mostrando {filteredTechnicians.length} de {technicians.length} técnicos
                  </span>
                  <div className="flex gap-4">
                    <span>Disponíveis: {filteredTechnicians.filter(t => getMockStatus(t.id) === 'disponivel').length}</span>
                    <span>Ocupados: {filteredTechnicians.filter(t => getMockStatus(t.id) === 'ocupado').length}</span>
                    <span>Ausentes: {filteredTechnicians.filter(t => getMockStatus(t.id) === 'ausente').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Create Technician Modal */}
      <TechnicianForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default TechniciansPage;