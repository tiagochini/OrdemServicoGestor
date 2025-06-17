import { pgTable, text, serial, integer, timestamp, boolean, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status enum for work orders
export const OrderStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// User role enum
export const UserRole = {
  ADMIN: "admin",
  TECHNICIAN: "technician",
  CUSTOMER: "customer",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Transaction types for financial records
export const TransactionType = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type TransactionTypeType = typeof TransactionType[keyof typeof TransactionType];

// Transaction status
export const TransactionStatus = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export type TransactionStatusType = typeof TransactionStatus[keyof typeof TransactionStatus];

// Categories for financial transactions
export const TransactionCategory = {
  SALES: "sales",
  SERVICE: "service",
  TAXES: "taxes",
  PAYROLL: "payroll",
  RENT: "rent",
  UTILITIES: "utilities",
  SUPPLIES: "supplies",
  MAINTENANCE: "maintenance",
  INSURANCE: "insurance",
  OTHER: "other",
} as const;

export type TransactionCategoryType = typeof TransactionCategory[keyof typeof TransactionCategory];

// Tipo de produto ou serviço
export const ItemType = {
  PRODUCT: "product",
  SERVICE: "service",
} as const;

export type ItemTypeType = typeof ItemType[keyof typeof ItemType];

// Unidade de medida para produtos
export const UnitType = {
  UNIT: "unit",
  KG: "kg",
  L: "l",
  M: "m",
  M2: "m2",
  HOUR: "hour",
} as const;

export type UnitTypeType = typeof UnitType[keyof typeof UnitType];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default(UserRole.CUSTOMER),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  relatedId: integer("related_id"),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  company: text("company"),
});

// Technicians table
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  specialization: text("specialization"),
});

// Work Orders table
export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  technicianId: integer("technician_id"),
  status: text("status").notNull().default(OrderStatus.PENDING),
  description: text("description").notNull(),
  serviceType: text("service_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

// Financial transactions table (for both income and expenses)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // income or expense
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(), // Transaction date
  dueDate: date("due_date"), // For future/planned transactions
  status: text("status").notNull().default(TransactionStatus.PENDING),
  customerId: integer("customer_id"), // Link to customer if relevant
  workOrderId: integer("work_order_id"), // Link to work order if relevant
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by"), // User ID who created this transaction
  notes: text("notes"),
  documentRef: text("document_ref"), // Reference to invoice or receipt number
});

// Financial accounts (cash, bank accounts, etc.)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, cash, credit
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transaction entries related to accounts
export const transactionEntries = pgTable("transaction_entries", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  accountId: integer("account_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budget categories
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Catálogo de Serviços e Produtos
export const catalogItems = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // produto ou serviço
  unit: text("unit").notNull(), // unidade, kg, hora, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  sku: text("sku"),
  tags: text("tags").array(), // tags para categorização 
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relção entre itens de catálogo e ordens de serviço
export const workOrderItems = pgTable("work_order_items", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull(),
  catalogItemId: integer("catalog_item_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for inserting customers
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

// Schema for inserting technicians
export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
});

// Schema for inserting work orders
export const insertWorkOrderSchema = createInsertSchema(workOrders)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    orderNumber: true,
  })
  .extend({
    status: z.enum([
      OrderStatus.PENDING,
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ]),
  });

// Schema for user insertion
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    role: z.enum([UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.CUSTOMER]),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Schema for inserting notes
export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Schema for transactions
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  status: z.enum([
    TransactionStatus.PENDING,
    TransactionStatus.PAID,
    TransactionStatus.OVERDUE,
    TransactionStatus.CANCELLED,
  ]),
  category: z.enum([
    TransactionCategory.SALES,
    TransactionCategory.SERVICE,
    TransactionCategory.TAXES,
    TransactionCategory.PAYROLL,
    TransactionCategory.RENT,
    TransactionCategory.UTILITIES,
    TransactionCategory.SUPPLIES,
    TransactionCategory.MAINTENANCE,
    TransactionCategory.INSURANCE,
    TransactionCategory.OTHER,
  ]),
  amount: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O valor deve ser positivo")
  ),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
});

// Schema for accounts
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  balance: true,
}).extend({
  type: z.string().min(1, "Tipo da conta é obrigatório"),
});

// Schema for budgets
export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum([
    TransactionCategory.SALES,
    TransactionCategory.SERVICE,
    TransactionCategory.TAXES,
    TransactionCategory.PAYROLL,
    TransactionCategory.RENT,
    TransactionCategory.UTILITIES,
    TransactionCategory.SUPPLIES,
    TransactionCategory.MAINTENANCE,
    TransactionCategory.INSURANCE,
    TransactionCategory.OTHER,
  ]),
  amount: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O valor deve ser positivo")
  ),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

// Schema for transaction entries
export const insertTransactionEntrySchema = createInsertSchema(transactionEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O valor deve ser positivo")
  ),
});

// Schema para catalogItems
export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
}).extend({
  type: z.enum([ItemType.PRODUCT, ItemType.SERVICE]),
  unit: z.enum([UnitType.UNIT, UnitType.KG, UnitType.L, UnitType.M, UnitType.M2, UnitType.HOUR]),
  price: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O preço deve ser positivo")
  ),
  cost: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O custo deve ser positivo")
  ).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

// Schema para workOrderItems
export const insertWorkOrderItemSchema = createInsertSchema(workOrderItems).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.string().or(z.number()).pipe(
    z.coerce.number().positive("A quantidade deve ser positiva")
  ),
  unitPrice: z.string().or(z.number()).pipe(
    z.coerce.number().positive("O preço unitário deve ser positivo")
  ),
  discount: z.string().or(z.number()).pipe(
    z.coerce.number().min(0, "O desconto não pode ser negativo")
  ).optional().default(0),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = Omit<z.infer<typeof insertUserSchema>, 'confirmPassword'>;
export type LoginUser = z.infer<typeof loginSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type TransactionEntry = typeof transactionEntries.$inferSelect;
export type InsertTransactionEntry = z.infer<typeof insertTransactionEntrySchema>;

export type CatalogItem = typeof catalogItems.$inferSelect;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;

export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type InsertWorkOrderItem = z.infer<typeof insertWorkOrderItemSchema>;

