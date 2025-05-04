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

// Schema for inserting notes
export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
