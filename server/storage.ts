import {
  type Customer,
  type InsertCustomer,
  type Technician,
  type InsertTechnician,
  type WorkOrder,
  type InsertWorkOrder,
  type Note,
  type InsertNote,
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type Account,
  type InsertAccount,
  type Budget,
  type InsertBudget,
  type TransactionEntry,
  type InsertTransactionEntry,
  type CatalogItem,
  type InsertCatalogItem,
  type WorkOrderItem,
  type InsertWorkOrderItem,
  OrderStatus,
  UserRole,
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  ItemType,
  UnitType,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

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
  
  // Financial Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByType(type: string): Promise<Transaction[]>;
  getTransactionsByStatus(status: string): Promise<Transaction[]>;
  getTransactionsByCategory(category: string): Promise<Transaction[]>;
  getTransactionsByCustomer(customerId: number): Promise<Transaction[]>;
  getTransactionsByWorkOrder(workOrderId: number): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getAccountsPayable(): Promise<Transaction[]>;
  getAccountsReceivable(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getTransactionEntries(transactionId: number): Promise<TransactionEntry[]>;
  
  // Financial Account methods
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  updateAccountBalance(id: number, amount: number): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Budget methods
  getBudgets(): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  getBudgetsByCategory(category: string): Promise<Budget[]>;
  getBudgetsByDateRange(startDate: Date, endDate: Date): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Financial Reports
  getCashFlow(startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    dailyCashFlow: Array<{ date: Date; income: number; expense: number; net: number; }>;
  }>;
  getAccountBalances(): Promise<{ totalBalance: number; accounts: Account[] }>;
  getBudgetVsActual(startDate: Date, endDate: Date): Promise<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[]>;
  getProfitAndLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    revenueByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  }>;
  
  // Catalog Items (Products and Services)
  getCatalogItems(): Promise<CatalogItem[]>;
  getCatalogItem(id: number): Promise<CatalogItem | undefined>;
  getCatalogItemsByType(type: string): Promise<CatalogItem[]>;
  getCatalogItemsByTags(tags: string[]): Promise<CatalogItem[]>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;
  updateCatalogItem(id: number, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined>;
  deleteCatalogItem(id: number): Promise<boolean>;
  
  // Work Order Items
  getWorkOrderItems(workOrderId: number): Promise<WorkOrderItem[]>;
  createWorkOrderItem(item: InsertWorkOrderItem): Promise<WorkOrderItem>;
  updateWorkOrderItem(id: number, item: Partial<InsertWorkOrderItem>): Promise<WorkOrderItem | undefined>;
  deleteWorkOrderItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private technicians: Map<number, Technician>;
  private workOrders: Map<number, WorkOrder>;
  private notes: Map<number, Note>;
  private transactions: Map<number, Transaction>;
  private accounts: Map<number, Account>;
  private budgets: Map<number, Budget>;
  private transactionEntries: Map<number, TransactionEntry>;
  private catalogItems: Map<number, CatalogItem>;
  private workOrderItems: Map<number, WorkOrderItem>;
  
  private userId: number;
  private customerId: number;
  private technicianId: number;
  private workOrderId: number;
  private noteId: number;
  private transactionId: number;
  private accountId: number;
  private budgetId: number;
  private transactionEntryId: number;
  private catalogItemId: number;
  private workOrderItemId: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.technicians = new Map();
    this.workOrders = new Map();
    this.notes = new Map();
    this.transactions = new Map();
    this.accounts = new Map();
    this.budgets = new Map();
    this.transactionEntries = new Map();
    this.catalogItems = new Map();
    this.workOrderItems = new Map();
    
    this.userId = 1;
    this.customerId = 1;
    this.technicianId = 1;
    this.workOrderId = 1;
    this.noteId = 1;
    this.transactionId = 1;
    this.accountId = 1;
    this.budgetId = 1;
    this.transactionEntryId = 1;
    this.catalogItemId = 1;
    this.workOrderItemId = 1;
    
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
      { 
        name: "Maria Santos", 
        email: "maria@example.com", 
        phone: "+5511912345678", 
        address: "Av. Paulista, 1000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        company: "Santos Consultoria"
      },
      { 
        name: "João Pereira", 
        email: "joao@example.com", 
        phone: "+5511923456789", 
        address: "Rua Augusta, 500",
        city: "São Paulo",
        state: "SP",
        zipCode: "01305-000",
        company: undefined
      },
      { 
        name: "Ana Costa", 
        email: "contato@abc.com", 
        phone: "+5511934567890", 
        address: "Av. Brigadeiro Faria Lima, 2000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01451-000",
        company: "ABC Ltda."
      },
      { 
        name: "Carlos Mendes", 
        email: "ana@example.com", 
        phone: "+5511945678901", 
        address: "Rua Oscar Freire, 300",
        city: "São Paulo",
        state: "SP",
        zipCode: "01426-000",
        company: undefined
      },
      { 
        name: "Roberto Silva", 
        email: "carlos@example.com", 
        phone: "+5511956789012", 
        address: "Alameda Santos, 700",
        city: "São Paulo",
        state: "SP",
        zipCode: "01418-000",
        company: "Silva & Associados"
      }
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
    
    // Add sample catalog items - Products
    const catalogProducts = [
      {
        name: "Disco SSD 240GB",
        description: "Disco de estado sólido para upgrade de computadores",
        type: ItemType.PRODUCT,
        unit: UnitType.UNIT,
        price: "299.99",
        cost: "180.00",
        sku: "SSD-240",
        tags: ["hardware", "armazenamento", "ssd"],
        isActive: true,
      },
      {
        name: "Memória RAM 8GB DDR4",
        description: "Módulo de memória para computadores desktop",
        type: ItemType.PRODUCT,
        unit: UnitType.UNIT,
        price: "249.90",
        cost: "150.00",
        sku: "RAM-8GB",
        tags: ["hardware", "memória", "ram"],
        isActive: true,
      },
      {
        name: "Fonte de Alimentação 500W",
        description: "Fonte ATX para computadores desktop",
        type: ItemType.PRODUCT,
        unit: UnitType.UNIT,
        price: "189.90",
        cost: "110.00",
        sku: "PSU-500", 
        tags: ["hardware", "fonte", "energia"],
        isActive: true,
      },
      {
        name: "Cabo HDMI 2.0 2m",
        description: "Cabo HDMI de alta velocidade",
        type: ItemType.PRODUCT,
        unit: UnitType.UNIT,
        price: "39.90",
        cost: "15.00",
        sku: "HDMI-2M",
        tags: ["cabos", "conectividade"],
        isActive: true,
      },
      {
        name: "Bateria Notebook",
        description: "Bateria compatível com diversos modelos de notebooks",
        type: ItemType.PRODUCT,
        unit: UnitType.UNIT,
        price: "269.90",
        cost: "160.00",
        sku: "BAT-NOTE",
        tags: ["bateria", "notebook", "energia"],
        isActive: true,
      }
    ];
    
    catalogProducts.forEach(product => this.createCatalogItem(product));
    
    // Add sample catalog items - Services
    const catalogServices = [
      {
        name: "Formatação de Computador",
        description: "Formatação completa com instalação de sistema operacional e programas básicos",
        type: ItemType.SERVICE,
        unit: UnitType.UNIT,
        price: "150.00",
        cost: "50.00",
        sku: "SRV-FORMAT",
        tags: ["formatação", "sistema", "instalação"],
        isActive: true,
      },
      {
        name: "Montagem de PC",
        description: "Montagem completa de computador com testes",
        type: ItemType.SERVICE,
        unit: UnitType.UNIT,
        price: "200.00",
        cost: "70.00",
        sku: "SRV-MOUNT",
        tags: ["montagem", "hardware"],
        isActive: true,
      },
      {
        name: "Reparo de Notebook",
        description: "Diagnóstico e reparo de problemas em notebooks",
        type: ItemType.SERVICE,
        unit: UnitType.HOUR,
        price: "90.00",
        cost: "30.00",
        sku: "SRV-REPAIR",
        tags: ["reparo", "notebook"],
        isActive: true,
      },
      {
        name: "Instalação de Redes",
        description: "Configuração e instalação de redes para empresas e residências",
        type: ItemType.SERVICE,
        unit: UnitType.HOUR,
        price: "120.00",
        cost: "40.00",
        sku: "SRV-NET",
        tags: ["rede", "instalação", "configuração"],
        isActive: true,
      },
      {
        name: "Diagnóstico Avançado",
        description: "Diagnóstico completo de problemas de hardware e software",
        type: ItemType.SERVICE,
        unit: UnitType.UNIT,
        price: "80.00",
        cost: "20.00",
        sku: "SRV-DIAG",
        tags: ["diagnóstico", "análise", "problema"],
        isActive: true,
      }
    ];
    
    catalogServices.forEach(service => this.createCatalogItem(service));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    const user: User = {
      ...insertUser,
      id,
      createdAt: now
    };
    
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
  
  // Catalog methods
  async getCatalogItems(): Promise<CatalogItem[]> {
    return Array.from(this.catalogItems.values());
  }
  
  async getCatalogItem(id: number): Promise<CatalogItem | undefined> {
    return this.catalogItems.get(id);
  }
  
  async getCatalogItemsByType(type: string): Promise<CatalogItem[]> {
    return Array.from(this.catalogItems.values()).filter(
      (item) => item.type === type
    );
  }
  
  async getCatalogItemsByTags(tags: string[]): Promise<CatalogItem[]> {
    return Array.from(this.catalogItems.values()).filter((item) => {
      if (!item.tags) return false;
      return tags.some(tag => item.tags?.includes(tag));
    });
  }
  
  async createCatalogItem(insertItem: InsertCatalogItem): Promise<CatalogItem> {
    const id = this.catalogItemId++;
    const now = new Date();
    
    const catalogItem: CatalogItem = {
      ...insertItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.catalogItems.set(id, catalogItem);
    return catalogItem;
  }
  
  async updateCatalogItem(id: number, itemUpdate: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined> {
    const item = this.catalogItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = {
      ...item,
      ...itemUpdate,
      updatedAt: new Date(),
    };
    
    this.catalogItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteCatalogItem(id: number): Promise<boolean> {
    return this.catalogItems.delete(id);
  }
  
  // Work Order Items methods
  async getWorkOrderItems(workOrderId: number): Promise<WorkOrderItem[]> {
    return Array.from(this.workOrderItems.values()).filter(
      (item) => item.workOrderId === workOrderId
    );
  }
  
  async createWorkOrderItem(insertItem: InsertWorkOrderItem): Promise<WorkOrderItem> {
    const id = this.workOrderItemId++;
    const now = new Date();
    
    const workOrderItem: WorkOrderItem = {
      ...insertItem,
      id,
      createdAt: now,
    };
    
    this.workOrderItems.set(id, workOrderItem);
    return workOrderItem;
  }
  
  async updateWorkOrderItem(id: number, itemUpdate: Partial<InsertWorkOrderItem>): Promise<WorkOrderItem | undefined> {
    const item = this.workOrderItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = {
      ...item,
      ...itemUpdate,
    };
    
    this.workOrderItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteWorkOrderItem(id: number): Promise<boolean> {
    return this.workOrderItems.delete(id);
  }
  
  // Financial Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByType(type: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.type === type
    );
  }
  
  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.status === status
    );
  }
  
  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.category === category
    );
  }
  
  async getTransactionsByCustomer(customerId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.customerId === customerId
    );
  }
  
  async getTransactionsByWorkOrder(workOrderId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.workOrderId === workOrderId
    );
  }
  
  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      }
    );
  }
  
  async getAccountsPayable(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => 
        transaction.type === TransactionType.EXPENSE && 
        (transaction.status === TransactionStatus.PENDING || transaction.status === TransactionStatus.OVERDUE)
    );
  }
  
  async getAccountsReceivable(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => 
        transaction.type === TransactionType.INCOME && 
        (transaction.status === TransactionStatus.PENDING || transaction.status === TransactionStatus.OVERDUE)
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const now = new Date();
    
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = {
      ...transaction,
      ...transactionUpdate,
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }
  
  async getTransactionEntries(transactionId: number): Promise<TransactionEntry[]> {
    return Array.from(this.transactionEntries.values()).filter(
      (entry) => entry.transactionId === transactionId
    );
  }
  
  // Financial Account methods
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const now = new Date();
    
    const account: Account = {
      ...insertAccount,
      id,
      balance: "0",
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    
    this.accounts.set(id, account);
    return account;
  }
  
  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = {
      ...account,
      ...accountUpdate,
      updatedAt: new Date(),
    };
    
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async updateAccountBalance(id: number, amount: number): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const currentBalance = parseFloat(account.balance.toString());
    const newBalance = currentBalance + amount;
    
    const updatedAccount = {
      ...account,
      balance: newBalance.toString(),
      updatedAt: new Date(),
    };
    
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  // Budget methods
  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }
  
  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }
  
  async getBudgetsByCategory(category: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.category === category
    );
  }
  
  async getBudgetsByDateRange(startDate: Date, endDate: Date): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => {
        const budgetStart = new Date(budget.periodStart);
        const budgetEnd = new Date(budget.periodEnd);
        
        return (
          (budgetStart >= startDate && budgetStart <= endDate) ||
          (budgetEnd >= startDate && budgetEnd <= endDate) ||
          (budgetStart <= startDate && budgetEnd >= endDate)
        );
      }
    );
  }
  
  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.budgetId++;
    const now = new Date();
    
    const budget: Budget = {
      ...insertBudget,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.budgets.set(id, budget);
    return budget;
  }
  
  async updateBudget(id: number, budgetUpdate: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = {
      ...budget,
      ...budgetUpdate,
      updatedAt: new Date(),
    };
    
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }
  
  // Financial Reports
  async getCashFlow(startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    dailyCashFlow: Array<{ date: Date; income: number; expense: number; net: number; }>;
  }> {
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    const incomes = transactions.filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.PAID);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.PAID);
    
    const totalIncome = incomes.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const netCashFlow = totalIncome - totalExpense;
    
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    
    // Group incomes by category
    incomes.forEach(income => {
      const category = income.category;
      const amount = parseFloat(income.amount.toString());
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
    });
    
    // Group expenses by category
    expenses.forEach(expense => {
      const category = expense.category;
      const amount = parseFloat(expense.amount.toString());
      expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
    });
    
    // Generate daily cash flow data
    const dailyCashFlow: Array<{ date: Date; income: number; expense: number; net: number; }> = [];
    
    // Create a map of dates with income and expense values
    const dailyMap = new Map<string, { date: Date; income: number; expense: number; }>();
    
    // Initialize the map with all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateString, { date: new Date(currentDate), income: 0, expense: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add income data
    incomes.forEach(income => {
      const dateString = new Date(income.date).toISOString().split('T')[0];
      const entry = dailyMap.get(dateString) || { date: new Date(income.date), income: 0, expense: 0 };
      entry.income += parseFloat(income.amount.toString());
      dailyMap.set(dateString, entry);
    });
    
    // Add expense data
    expenses.forEach(expense => {
      const dateString = new Date(expense.date).toISOString().split('T')[0];
      const entry = dailyMap.get(dateString) || { date: new Date(expense.date), income: 0, expense: 0 };
      entry.expense += parseFloat(expense.amount.toString());
      dailyMap.set(dateString, entry);
    });
    
    // Convert map to array and calculate net value
    dailyMap.forEach((value) => {
      dailyCashFlow.push({
        ...value,
        net: value.income - value.expense
      });
    });
    
    // Sort by date
    dailyCashFlow.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return {
      totalIncome,
      totalExpense,
      netCashFlow,
      incomeByCategory,
      expenseByCategory,
      dailyCashFlow,
    };
  }
  
  async getAccountBalances(): Promise<{ totalBalance: number; accounts: Account[] }> {
    const accounts = await this.getAccounts();
    let totalBalance = 0;
    
    accounts.forEach(account => {
      totalBalance += parseFloat(account.balance.toString());
    });
    
    return {
      totalBalance,
      accounts,
    };
  }
  
  async getBudgetVsActual(startDate: Date, endDate: Date): Promise<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[]> {
    const budgets = await this.getBudgetsByDateRange(startDate, endDate);
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    const result: {
      category: string;
      budgeted: number;
      actual: number;
      variance: number;
    }[] = [];
    
    // Process each budget
    for (const budget of budgets) {
      const category = budget.category;
      const budgeted = parseFloat(budget.amount.toString());
      
      // Find transactions in this category
      const categoryTransactions = transactions.filter(t => 
        t.category === category && 
        t.status === TransactionStatus.PAID
      );
      
      const actual = categoryTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount.toString()), 
        0
      );
      
      const variance = budgeted - actual;
      
      result.push({
        category,
        budgeted,
        actual,
        variance,
      });
    }
    
    return result;
  }
  
  async getProfitAndLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    revenueByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  }> {
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    const revenues = transactions.filter(t => 
      t.type === TransactionType.INCOME && 
      t.status === TransactionStatus.PAID
    );
    
    const expenses = transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      t.status === TransactionStatus.PAID
    );
    
    const revenue = revenues.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()), 
      0
    );
    
    const expensesTotal = expenses.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()), 
      0
    );
    
    const profit = revenue - expensesTotal;
    
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    
    // Group revenues by category
    revenues.forEach(r => {
      const category = r.category;
      const amount = parseFloat(r.amount.toString());
      revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
    });
    
    // Group expenses by category
    expenses.forEach(e => {
      const category = e.category;
      const amount = parseFloat(e.amount.toString());
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });
    
    return {
      revenue,
      expenses: expensesTotal,
      profit,
      revenueByCategory,
      expensesByCategory,
    };
  }
}

export const storage = new MemStorage();
