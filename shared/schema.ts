import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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
});

// Schema for inserting notes
export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
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
