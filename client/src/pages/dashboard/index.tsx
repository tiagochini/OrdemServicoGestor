import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Activity, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderCard from "@/components/orders/order-card";
import StatCard from "@/components/dashboard/stat-card";
import OrderFilter from "@/components/orders/order-filter";
import OrderForm from "@/components/orders/order-form";
import { format } from "date-fns";

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState<number | null>(null);
  
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['/api/stats'],
  });
  
  // Fetch work orders
  const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders', { status: statusFilter, technicianId: technicianFilter }],
  });
  
  // Fetch customers and technicians for the order cards
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  // Find customer and technician by ID
  const findCustomer = (customerId: number) => {
    return customers.find(customer => customer.id === customerId) || { name: "Cliente Desconhecido" };
  };
  
  const findTechnician = (technicianId: number | null) => {
    if (!technicianId) return undefined;
    return technicians.find(technician => technician.id === technicianId);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button 
              className="ml-3 inline-flex items-center"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Ordem
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Pendentes" 
              value={isLoadingStats ? "..." : stats?.pending || 0} 
              icon={<Clock className="h-6 w-6 text-white" />}
              iconBgColor="bg-primary"
            />
            <StatCard 
              title="Em Progresso" 
              value={isLoadingStats ? "..." : stats?.inProgress || 0} 
              icon={<Activity className="h-6 w-6 text-white" />}
              iconBgColor="bg-warning"
            />
            <StatCard 
              title="Concluídas (este mês)" 
              value={isLoadingStats ? "..." : stats?.completed || 0} 
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              iconBgColor="bg-secondary"
            />
            <StatCard 
              title="Faturamento (este mês)" 
              value={isLoadingStats ? "..." : formatCurrency(stats?.revenue || 0)} 
              icon={<DollarSign className="h-6 w-6 text-white" />}
              iconBgColor="bg-gray-500"
            />
          </div>
        </div>

        {/* Active Orders */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Ordens de Serviço Ativas
            </h3>
            <OrderFilter 
              onStatusChange={setStatusFilter}
              onTechnicianChange={setTechnicianFilter}
            />
          </div>
          
          {isLoadingOrders ? (
            <div className="text-center py-10">Carregando ordens de serviço...</div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-10 bg-white shadow rounded-lg">
              <p className="text-gray-500">Nenhuma ordem de serviço encontrada.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workOrders.slice(0, 6).map((order) => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  customer={findCustomer(order.customerId)}
                  technician={findTechnician(order.technicianId)}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {workOrders.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="outline" size="sm">Anterior</Button>
                <Button variant="outline" size="sm">Próximo</Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{Math.min(6, workOrders.length)}</span> de <span className="font-medium">{workOrders.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" aria-current="page" className="z-10 bg-primary border-primary text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      1
                    </a>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      2
                    </a>
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Próximo</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <OrderForm 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
