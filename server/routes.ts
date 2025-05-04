import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertTechnicianSchema, 
  insertWorkOrderSchema, 
  insertNoteSchema, 
  OrderStatus 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Customer routes
  app.get('/api/customers', async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete customer' });
    }
  });

  // Technician routes
  app.get('/api/technicians', async (_req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch technicians' });
    }
  });

  app.get('/api/technicians/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technician = await storage.getTechnician(id);
      
      if (!technician) {
        return res.status(404).json({ message: 'Technician not found' });
      }
      
      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch technician' });
    }
  });

  app.post('/api/technicians', async (req, res) => {
    try {
      const technicianData = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(technicianData);
      res.status(201).json(technician);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/technicians/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technicianData = insertTechnicianSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, technicianData);
      
      if (!technician) {
        return res.status(404).json({ message: 'Technician not found' });
      }
      
      res.json(technician);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/technicians/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTechnician(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Technician not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete technician' });
    }
  });

  // Work Order routes
  app.get('/api/work-orders', async (req, res) => {
    try {
      const { status, technicianId, customerId } = req.query;
      
      let orders;
      if (status) {
        orders = await storage.getWorkOrdersByStatus(status as string);
      } else if (technicianId) {
        orders = await storage.getWorkOrdersByTechnician(parseInt(technicianId as string));
      } else if (customerId) {
        orders = await storage.getWorkOrdersByCustomer(parseInt(customerId as string));
      } else {
        orders = await storage.getWorkOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work orders' });
    }
  });

  app.get('/api/work-orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrder = await storage.getWorkOrder(id);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work order' });
    }
  });

  app.post('/api/work-orders', async (req, res) => {
    try {
      const workOrderData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(workOrderData);
      res.status(201).json(workOrder);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/work-orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(workOrder);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/work-orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete work order' });
    }
  });

  // Note routes
  app.get('/api/work-orders/:id/notes', async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const notes = await storage.getNotesByWorkOrder(workOrderId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });

  app.post('/api/notes', async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Dashboard stats
  app.get('/api/stats', async (_req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
