import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { Link } from "wouter";
import { WorkOrder, Customer, Technician, OrderStatus } from "@shared/schema";
import { format } from "date-fns";

interface OrderCardProps {
  order: WorkOrder;
  customer: Customer;
  technician?: Technician;
}

const OrderCard = ({ order, customer, technician }: OrderCardProps) => {
  // Helper to format date string
  const formatDate = (dateString: Date) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Data inválida";
    }
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

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-gray-900">#{order.orderNumber}</div>
          <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(order.status)}`}>
            {getStatusDisplay(order.status)}
          </Badge>
        </div>
        <div className="mt-2">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Cliente:</span> {customer.name}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Criado em:</span> {formatDate(order.createdAt)}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Técnico:</span> {technician?.name || "Não atribuído"}
          </div>
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-medium">Descrição:</span> {order.description}
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <Link href={`/orders/${order.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Link href={`/orders/${order.id}`}>
            <Button size="sm" className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
