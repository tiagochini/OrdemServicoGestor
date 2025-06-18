import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus } from "@shared/schema";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface OrderFilterProps {
  onStatusChange: (status: string | null) => void;
  onTechnicianChange: (technicianId: number | null) => void;
  defaultStatus?: string | null;
  defaultTechnician?: number | null;
}

const OrderFilter = ({ 
  onStatusChange, 
  onTechnicianChange, 
  defaultStatus = null, 
  defaultTechnician = null 
}: OrderFilterProps) => {
  const [status, setStatus] = useState<string | null>(defaultStatus);
  const [technicianId, setTechnicianId] = useState<number | null>(defaultTechnician);
  
  // Fetch technicians for dropdown
  const { data: technicians } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/technicians', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch technicians');
      return response.json();
    },
  });
  
  // Update local state when props change
  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);
  
  useEffect(() => {
    setTechnicianId(defaultTechnician);
  }, [defaultTechnician]);
  
  // Update parent component when filters change
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);
  
  useEffect(() => {
    onTechnicianChange(technicianId);
  }, [technicianId, onTechnicianChange]);
  
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select 
        value={status || "all"} 
        onValueChange={(value) => setStatus(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos os Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value={OrderStatus.PENDING}>Pendente</SelectItem>
            <SelectItem value={OrderStatus.IN_PROGRESS}>Em Progresso</SelectItem>
            <SelectItem value={OrderStatus.COMPLETED}>Concluída</SelectItem>
            <SelectItem value={OrderStatus.CANCELLED}>Cancelada</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <Select 
        value={technicianId?.toString() || "all"} 
        onValueChange={(value) => setTechnicianId(value === "all" ? null : parseInt(value))}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos os Técnicos" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Todos os Técnicos</SelectItem>
            {technicians?.map((technician) => (
              <SelectItem key={technician.id} value={technician.id.toString()}>
                {technician.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrderFilter;
