import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import OrderCard from "@/components/orders/order-card";
import OrderFilter from "@/components/orders/order-filter";
import OrderForm from "@/components/orders/order-form";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

const OrdersList = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 9;
  
  // Parse search query from URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = searchParams.get('search') || '';
  
  // Fetch work orders
  const { data: allWorkOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders', { status: statusFilter, technicianId: technicianFilter }],
  });
  
  // Filter orders by search query
  const workOrders = searchQuery 
    ? allWorkOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allWorkOrders;
  
  // Calculate pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = workOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(workOrders.length / ordersPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, technicianFilter, searchQuery]);
  
  // Show toast if search is active
  useEffect(() => {
    if (searchQuery) {
      toast({
        title: `Pesquisando por "${searchQuery}"`,
        description: `${workOrders.length} resultados encontrados`,
      });
    }
  }, [searchQuery, workOrders.length]);
  
  // Fetch customers and technicians for the order cards
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });
  
  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Find customer and technician by ID
  const findCustomer = (customerId: number) => {
    return customers.find(customer => customer.id === customerId) || { name: "Cliente Desconhecido" };
  };
  
  const findTechnician = (technicianId: number | null) => {
    if (!technicianId) return undefined;
    return technicians.find(technician => technician.id === technicianId);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Ordens de Serviço
              {searchQuery && <span className="text-sm font-normal ml-2">(Pesquisa: "{searchQuery}")</span>}
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Ordem
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {workOrders.length} ordem(ns) encontrada(s)
          </h3>
          <OrderFilter 
            onStatusChange={setStatusFilter}
            onTechnicianChange={setTechnicianFilter}
          />
        </div>
        
        {/* Orders List */}
        {isLoadingOrders ? (
          <div className="text-center py-10">Carregando ordens de serviço...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
            <p className="text-gray-500">Nenhuma ordem de serviço encontrada.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {currentOrders.map((order) => (
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
        {workOrders.length > ordersPerPage && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((number) => (
                <PaginationItem key={number}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(number);
                    }}
                    isActive={currentPage === number}
                  >
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
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

export default OrdersList;
