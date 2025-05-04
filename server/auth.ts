import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, UserRole } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends Omit<import('@shared/schema').User, 'id'> {
      id: number;
    }
  }
}

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Função para gerar hash de senha
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Função para comparar senhas
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configurar sessão
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "os-manager-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // 24 horas
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 horas por padrão
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar estratégia local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Credenciais inválidas" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serializar e deserializar usuário
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware para verificar se o usuário está autenticado
  function isAuthenticated(req: Express.Request, res: Response, next: Function) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autorizado" });
  }

  // Middleware para verificar se o usuário é administrador
  function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    if (req.isAuthenticated() && req.user.role === UserRole.ADMIN) {
      return next();
    }
    res.status(403).json({ message: "Acesso negado" });
  }

  // Middleware para verificar se o usuário é técnico
  function isTechnician(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    if (
      req.isAuthenticated() && 
      (req.user.role === UserRole.TECHNICIAN || req.user.role === UserRole.ADMIN)
    ) {
      return next();
    }
    res.status(403).json({ message: "Acesso negado" });
  }

  // Rota de registro
  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar se o nome de usuário já existe
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      // Criar novo usuário com senha hasheada
      const userData: InsertUser = {
        ...req.body,
        password: await hashPassword(req.body.password),
      };

      const user = await storage.createUser(userData);

      // Login automático após registro
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Erro ao registrar:", error);
      return res.status(500).json({ message: "Erro no servidor" });
    }
  });

  // Rota de login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Ajustar duração da sessão baseado no "manter conectado"
        if (req.body.rememberMe) {
          // Se escolheu manter conectado, aumentar para 30 dias
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        } else {
          // Caso contrário, manter o padrão de 24 horas
          req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 horas
        }
        
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Rota de logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  // Rota para obter usuário atual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    res.json(req.user);
  });

  return { isAuthenticated, isAdmin, isTechnician };
}
