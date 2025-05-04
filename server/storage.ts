import {
  type Customer,
  type InsertCustomer,
  type Technician,
  type InsertTechnician,
  type WorkOrder,
  type InsertWorkOrder,
  type Note,
  type InsertNote,
  OrderStatus,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User methods (from original template)
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Technician methods
  getTechnicians(): Promise<Technician[]>;
  getTechnician(id: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: number, technician: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: number): Promise<boolean>;

  // Work Order methods
  getWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  getWorkOrdersByStatus(status: string): Promise<WorkOrder[]>;
  getWorkOrdersByTechnician(technicianId: number): Promise<WorkOrder[]>;
  getWorkOrdersByCustomer(customerId: number): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;

  // Note methods
  getNotesByWorkOrder(workOrderId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  // Dashboard stats
  getOrderStats(): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private customers: Map<number, Customer>;
  private technicians: Map<number, Technician>;
  private workOrders: Map<number, WorkOrder>;
  private notes: Map<number, Note>;
  
  private userId: number;
  private customerId: number;
  private technicianId: number;
  private workOrderId: number;
  private noteId: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.technicians = new Map();
    this.workOrders = new Map();
    this.notes = new Map();
    
    this.userId = 1;
    this.customerId = 1;
    this.technicianId = 1;
    this.workOrderId = 1;
    this.noteId = 1;
    
    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add sample technicians
    const technicians = [
      { name: "Paulo Andrade", email: "paulo@example.com", phone: "+5511987654321", specialization: "Hardware" },
      { name: "Carla Sousa", email: "carla@example.com", phone: "+5511976543210", specialization: "Software" },
      { name: "Marcos Silva", email: "marcos@example.com", phone: "+5511965432109", specialization: "Networks" }
    ];
    
    technicians.forEach(tech => this.createTechnician(tech));
    
    // Add sample customers
    const customers = [
      { name: "Maria Santos", email: "maria@example.com", phone: "+5511912345678", address: "Av. Paulista, 1000" },
      { name: "João Pereira", email: "joao@example.com", phone: "+5511923456789", address: "Rua Augusta, 500" },
      { name: "Empresa ABC Ltda.", email: "contato@abc.com", phone: "+5511934567890", address: "Av. Brigadeiro Faria Lima, 2000" },
      { name: "Ana Costa", email: "ana@example.com", phone: "+5511945678901", address: "Rua Oscar Freire, 300" },
      { name: "Carlos Mendes", email: "carlos@example.com", phone: "+5511956789012", address: "Alameda Santos, 700" }
    ];
    
    customers.forEach(customer => this.createCustomer(customer));
    
    // Add sample work orders
    const workOrders = [
      {
        customerId: 1,
        technicianId: 1,
        status: OrderStatus.PENDING,
        description: "Manutenção em impressora HP com problema de alimentação de papel.",
        serviceType: "Manutenção de Hardware",
        notes: "",
      },
      {
        customerId: 2,
        technicianId: 2,
        status: OrderStatus.IN_PROGRESS,
        description: "Instalação de novo roteador WiFi e configuração de rede doméstica.",
        serviceType: "Suporte de Rede",
        notes: "",
      },
      {
        customerId: 3,
        technicianId: 3,
        status: OrderStatus.IN_PROGRESS,
        description: "Manutenção preventiva em sistema de ar condicionado do escritório central.",
        serviceType: "Manutenção Preventiva",
        notes: "",
      },
      {
        customerId: 4,
        technicianId: 1,
        status: OrderStatus.COMPLETED,
        description: "Reparo em tela de notebook Dell que apresentava falhas de imagem.",
        serviceType: "Manutenção de Hardware",
        notes: "",
      },
      {
        customerId: 5,
        technicianId: 2,
        status: OrderStatus.COMPLETED,
        description: "Formatação de computador e instalação de pacote de softwares padrão.",
        serviceType: "Instalação de Software",
        notes: "",
      },
      {
        customerId: 1,
        technicianId: null,
        status: OrderStatus.CANCELLED,
        description: "Substituição de bateria em smartphone Samsung S21. Cliente cancelou o pedido.",
        serviceType: "Manutenção de Hardware",
        notes: "",
      }
    ];
    
    workOrders.forEach(order => this.createWorkOrder(order));
  }

  // User methods (from original template)
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.userId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerId++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...customerUpdate };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Technician methods
  async getTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = this.technicianId++;
    const technician: Technician = { ...insertTechnician, id };
    this.technicians.set(id, technician);
    return technician;
  }

  async updateTechnician(id: number, technicianUpdate: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const technician = this.technicians.get(id);
    if (!technician) return undefined;
    
    const updatedTechnician = { ...technician, ...technicianUpdate };
    this.technicians.set(id, updatedTechnician);
    return updatedTechnician;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    return this.technicians.delete(id);
  }

  // Work Order methods
  async getWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async getWorkOrdersByStatus(status: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      (order) => order.status === status
    );
  }

  async getWorkOrdersByTechnician(technicianId: number): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      (order) => order.technicianId === technicianId
    );
  }

  async getWorkOrdersByCustomer(customerId: number): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      (order) => order.customerId === customerId
    );
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.workOrderId++;
    const orderNumber = `OS-${9819 + id}`; // Generate order number
    const now = new Date();
    
    const workOrder: WorkOrder = {
      ...insertWorkOrder,
      id,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: number, workOrderUpdate: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const updatedWorkOrder = {
      ...workOrder,
      ...workOrderUpdate,
      updatedAt: new Date(),
    };
    
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    return this.workOrders.delete(id);
  }

  // Note methods
  async getNotesByWorkOrder(workOrderId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.workOrderId === workOrderId
    );
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteId++;
    const now = new Date();
    
    const note: Note = {
      ...insertNote,
      id,
      createdAt: now,
    };
    
    this.notes.set(id, note);
    return note;
  }

  // Dashboard stats
  async getOrderStats(): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }> {
    const orders = Array.from(this.workOrders.values());
    
    const pending = orders.filter(order => order.status === OrderStatus.PENDING).length;
    const inProgress = orders.filter(order => order.status === OrderStatus.IN_PROGRESS).length;
    const completed = orders.filter(order => order.status === OrderStatus.COMPLETED).length;
    const cancelled = orders.filter(order => order.status === OrderStatus.CANCELLED).length;
    
    // Mock revenue - in a real app, this would be calculated from actual order values
    const revenue = completed * 1499;
    
    return {
      pending,
      inProgress,
      completed,
      cancelled,
      revenue,
    };
  }
}

export const storage = new MemStorage();
