import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertTechnicianSchema, 
  insertWorkOrderSchema, 
  insertNoteSchema, 
  insertTransactionSchema,
  insertAccountSchema,
  insertBudgetSchema,
  insertCatalogItemSchema,
  insertWorkOrderItemSchema,
  OrderStatus,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
  ItemType,
  UnitType,
  insertUserSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { generateToken } from "./auth/jwt";
import { hashPassword, comparePasswords, generateTemporaryPassword } from "./auth/password";
import { authenticateToken, requireAdmin, requireManagerOrAdmin, AuthenticatedRequest } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  const { isAuthenticated, isAdmin, isTechnician } = setupAuth(app);
  
  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          mustChangePassword: user.mustChangePassword
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedNewPassword);
      await storage.setMustChangePassword(userId, false);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user info' });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        relatedId: user.relatedId
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(tempPassword);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        mustChangePassword: true
      });

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          mustChangePassword: user.mustChangePassword,
          createdAt: user.createdAt,
          relatedId: user.relatedId
        },
        temporaryPassword: tempPassword
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);

      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        email: updatedUser.email,
        mustChangePassword: updatedUser.mustChangePassword,
        createdAt: updatedUser.createdAt,
        relatedId: updatedUser.relatedId
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post('/api/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(tempPassword);

      const updatedUser = await storage.updateUserPassword(id, hashedPassword);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.setMustChangePassword(id, true);

      res.json({
        message: 'Password reset successfully',
        temporaryPassword: tempPassword
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

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

  app.post('/api/customers', authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/customers/:id', authenticateToken, async (req, res) => {
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

  app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
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

  app.post('/api/technicians', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const technicianData = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(technicianData);
      res.status(201).json(technician);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/technicians/:id', authenticateToken, requireAdmin, async (req, res) => {
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

  app.delete('/api/technicians/:id', authenticateToken, requireAdmin, async (req, res) => {
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

  app.post('/api/work-orders', isAuthenticated, async (req, res) => {
    try {
      const workOrderData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(workOrderData);
      
      // Buscar informações do cliente e técnico para a notificação
      const customer = await storage.getCustomer(workOrder.customerId);
      const technician = workOrder.technicianId ? await storage.getTechnician(workOrder.technicianId) : null;
      
      // Enviar notificação via WebSocket
      if ((global as any).broadcastNotification) {
        (global as any).broadcastNotification({
          type: 'work_order_created',
          title: 'Nova Ordem de Serviço',
          message: `Ordem ${workOrder.id} criada para ${customer?.name || 'Cliente desconhecido'}`,
          data: {
            workOrderId: workOrder.id,
            customerName: customer?.name,
            technicianName: technician?.name,
            status: workOrder.status,
            description: workOrder.description
          }
        });
      }
      
      res.status(201).json(workOrder);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/work-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      // Buscar informações do cliente e técnico para a notificação
      const customer = await storage.getCustomer(workOrder.customerId);
      const technician = workOrder.technicianId ? await storage.getTechnician(workOrder.technicianId) : null;
      
      // Enviar notificação via WebSocket quando o status muda
      if (workOrderData.status && (global as any).broadcastNotification) {
        const statusLabels: Record<string, string> = {
          'pending': 'Pendente',
          'in-progress': 'Em Andamento',
          'completed': 'Concluída',
          'cancelled': 'Cancelada'
        };
        
        (global as any).broadcastNotification({
          type: 'work_order_updated',
          title: 'Ordem de Serviço Atualizada',
          message: `Ordem ${workOrder.id} - Status: ${statusLabels[workOrder.status] || workOrder.status}`,
          data: {
            workOrderId: workOrder.id,
            customerName: customer?.name,
            technicianName: technician?.name,
            oldStatus: workOrderData.status,
            newStatus: workOrder.status,
            description: workOrder.description
          }
        });
      }
      
      res.json(workOrder);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/work-orders/:id', isAdmin, async (req, res) => {
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

  app.post('/api/notes', isAuthenticated, async (req, res) => {
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

  // Financial Transaction routes
  app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
      const { type, status, category, customerId, workOrderId, startDate, endDate } = req.query;
      
      let transactions;
      if (type) {
        transactions = await storage.getTransactionsByType(type as string);
      } else if (status) {
        transactions = await storage.getTransactionsByStatus(status as string);
      } else if (category) {
        transactions = await storage.getTransactionsByCategory(category as string);
      } else if (customerId) {
        transactions = await storage.getTransactionsByCustomer(parseInt(customerId as string));
      } else if (workOrderId) {
        transactions = await storage.getTransactionsByWorkOrder(parseInt(workOrderId as string));
      } else if (startDate && endDate) {
        transactions = await storage.getTransactionsByDateRange(
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else {
        transactions = await storage.getTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/transactions/accounts-payable', authenticateToken, async (_req, res) => {
    try {
      const transactions = await storage.getAccountsPayable();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch accounts payable' });
    }
  });

  app.get('/api/transactions/accounts-receivable', authenticateToken, async (_req, res) => {
    try {
      const transactions = await storage.getAccountsReceivable();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch accounts receivable' });
    }
  });

  app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transaction' });
    }
  });

  app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, transactionData);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/transactions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  });

  // Financial Account routes
  app.get('/api/accounts', authenticateToken, async (_req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  });

  app.get('/api/accounts/balances', authenticateToken, async (_req, res) => {
    try {
      const balances = await storage.getAccountBalances();
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch account balances' });
    }
  });

  app.get('/api/accounts/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch account' });
    }
  });

  app.post('/api/accounts', authenticateToken, async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/accounts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      res.json(account);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/accounts/:id/balance', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount must be a number' });
      }
      
      const account = await storage.updateAccountBalance(id, amount);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update account balance' });
    }
  });

  app.delete('/api/accounts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete account' });
    }
  });

  // Budget routes
  app.get('/api/budgets', authenticateToken, async (req, res) => {
    try {
      const { category, startDate, endDate } = req.query;
      
      let budgets;
      if (category) {
        budgets = await storage.getBudgetsByCategory(category as string);
      } else if (startDate && endDate) {
        budgets = await storage.getBudgetsByDateRange(
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else {
        budgets = await storage.getBudgets();
      }
      
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  app.get('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudget(id);
      
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budget' });
    }
  });

  app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
      const budgetData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budgetData = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, budgetData);
      
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      res.json(budget);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/budgets/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBudget(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete budget' });
    }
  });

  // Catalog routes
  app.get('/api/catalog', authenticateToken, async (req, res) => {
    try {
      const { type, tags } = req.query;
      
      let items;
      if (type) {
        items = await storage.getCatalogItemsByType(type as string);
      } else if (tags) {
        // Convert comma-separated tags to array
        const tagsArray = (tags as string).split(',').map(tag => tag.trim());
        items = await storage.getCatalogItemsByTags(tagsArray);
      } else {
        items = await storage.getCatalogItems();
      }
      
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch catalog items' });
    }
  });

  app.get('/api/catalog/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getCatalogItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Catalog item not found' });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch catalog item' });
    }
  });

  app.post('/api/catalog', authenticateToken, async (req, res) => {
    try {
      const itemData = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/catalog/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertCatalogItemSchema.partial().parse(req.body);
      const item = await storage.updateCatalogItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: 'Catalog item not found' });
      }
      
      res.json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/catalog/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCatalogItem(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Catalog item not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete catalog item' });
    }
  });

  // Work Order Items routes
  app.get('/api/work-orders/:id/items', authenticateToken, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const items = await storage.getWorkOrderItems(workOrderId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work order items' });
    }
  });

  app.post('/api/work-order-items', authenticateToken, async (req, res) => {
    try {
      const itemData = insertWorkOrderItemSchema.parse(req.body);
      const item = await storage.createWorkOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put('/api/work-order-items/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertWorkOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateWorkOrderItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: 'Work order item not found' });
      }
      
      res.json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete('/api/work-order-items/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkOrderItem(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Work order item not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete work order item' });
    }
  });

  // Financial Reports
  app.get('/api/reports/cash-flow', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const cashFlow = await storage.getCashFlow(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(cashFlow);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate cash flow report' });
    }
  });

  app.get('/api/reports/budget-vs-actual', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const budgetComparison = await storage.getBudgetVsActual(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(budgetComparison);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate budget comparison report' });
    }
  });

  app.get('/api/reports/profit-and-loss', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const profitAndLoss = await storage.getProfitAndLoss(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(profitAndLoss);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate profit and loss report' });
    }
  });

  // Rota de teste para notificações WebSocket
  app.post('/api/test-notification', isAuthenticated, async (req, res) => {
    try {
      const { type, title, message, data } = req.body;
      
      if ((global as any).broadcastNotification) {
        (global as any).broadcastNotification({
          type: type || 'test',
          title: title || 'Notificação de Teste',
          message: message || 'Esta é uma notificação de teste do sistema WebSocket',
          data: data || { test: true }
        });
        
        res.json({ success: true, message: 'Notificação enviada com sucesso' });
      } else {
        res.status(500).json({ message: 'Sistema de notificações não disponível' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erro ao enviar notificação de teste' });
    }
  });

  // Reports routes
  app.get('/api/reports/cash-flow', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const cashFlow = await storage.getCashFlow(start, end);
      res.json(cashFlow);
    } catch (error) {
      console.error('Error getting cash flow:', error);
      res.status(500).json({ message: 'Failed to get cash flow data' });
    }
  });

  app.get('/api/reports/profit-loss', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const profitLoss = await storage.getProfitAndLoss(start, end);
      res.json(profitLoss);
    } catch (error) {
      console.error('Error getting profit and loss:', error);
      res.status(500).json({ message: 'Failed to get profit and loss data' });
    }
  });

  app.get('/api/reports/budget-vs-actual', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const budgetVsActual = await storage.getBudgetVsActual(start, end);
      res.json(budgetVsActual);
    } catch (error) {
      console.error('Error getting budget vs actual:', error);
      res.status(500).json({ message: 'Failed to get budget vs actual data' });
    }
  });

  const httpServer = createServer(app);
  
  // Configure WebSocket Server seguindo as diretrizes do blueprint
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Armazenar conexões WebSocket ativas
  const connectedClients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Nova conexão WebSocket estabelecida');
    connectedClients.add(ws);
    
    // Enviar mensagem de boas-vindas
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Conectado ao sistema de notificações',
      timestamp: new Date().toISOString()
    }));
    
    // Lidar com mensagens recebidas do cliente
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensagem recebida do cliente:', data);
        
        // Eco da mensagem para teste
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    // Remover conexão quando fechada
    ws.on('close', () => {
      console.log('Conexão WebSocket fechada');
      connectedClients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('Erro na conexão WebSocket:', error);
      connectedClients.delete(ws);
    });
  });
  
  // Função utilitária para broadcast de notificações
  function broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp?: string;
  }) {
    const notificationData = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    };
    
    const message = JSON.stringify(notificationData);
    
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    console.log(`Notificação enviada para ${connectedClients.size} clientes:`, notificationData);
  }
  
  // Tornar a função de broadcast disponível globalmente no servidor
  (global as any).broadcastNotification = broadcastNotification;
  
  return httpServer;
}
