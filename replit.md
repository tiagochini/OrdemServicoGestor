# replit.md

## Overview

This is a comprehensive Service Management System built with modern web technologies. The application provides functionality for managing work orders, customers, technicians, finances, and a product/service catalog. It features a full-stack architecture with React frontend, Express backend, PostgreSQL database, and uses Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and build processes
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware for JSON parsing and CORS
- **Authentication**: Passport.js with local strategy and session management
- **Session Storage**: Memory store for development (configurable for production)
- **Password Security**: Node.js crypto module with scrypt for hashing
- **API Design**: RESTful API with consistent error handling

### Database Architecture
- **Database**: PostgreSQL (configured for production deployment)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Neon Database serverless connection for cloud deployment

## Key Components

### Authentication System
- Session-based authentication with Passport.js
- Role-based access control (Admin, Technician, Customer)
- Protected routes with authentication middleware
- Password hashing using Node.js crypto scrypt

### Work Order Management
- Complete CRUD operations for work orders
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Technician assignment and customer association
- Notes and comments system
- Item tracking for work orders

### Customer & Technician Management
- Customer profiles with contact information and addresses
- Technician profiles with specializations
- Relationship mapping between users and their roles

### Financial Management
- Transaction tracking (Income/Expense)
- Accounts Payable and Receivable
- Budget management and tracking
- Account balances and financial reporting
- Category-based transaction organization

### Catalog System
- Product and service catalog management
- Pricing and cost tracking
- Unit types and measurements
- Tagging system for organization
- Integration with work order items

## Data Flow

1. **Client Requests**: React frontend makes API calls using TanStack Query
2. **Authentication**: Express middleware validates sessions and user permissions
3. **API Processing**: Express routes handle business logic and validation
4. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON responses sent back to frontend with consistent error handling
6. **State Management**: TanStack Query caches and synchronizes server state

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, React DOM
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form, Hookform Resolvers
- **Validation**: Zod for schema validation
- **UI Components**: Radix UI primitives, Shadcn/ui components
- **Styling**: Tailwind CSS, Class Variance Authority, clsx
- **Icons**: Lucide React
- **Date Handling**: date-fns for date formatting and manipulation

### Backend Dependencies
- **Server**: Express.js
- **Database**: Drizzle ORM, Neon Database serverless
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express session with memory store
- **Validation**: Zod validation error handling
- **Security**: Node.js crypto for password hashing

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development Server**: tsx for TypeScript execution

## Deployment Strategy

### Development Environment
- Vite development server for frontend hot reloading
- tsx for running TypeScript backend with hot reload
- PostgreSQL module configured in Replit environment
- Memory session store for development simplicity

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with esbuild for Node.js deployment
- Environment variable configuration for database connections
- Session persistence configured for production scaling

### Environment Configuration
- Database URL configuration through environment variables
- Session secrets and security settings
- Deployment target set to autoscale for cloud deployment
- Port configuration for external access (port 80 mapped to 5000)

## Changelog
- June 17, 2025: Initial setup
- June 17, 2025: **SPRINT 3.2 DO MÓDULO FINANCEIRO CONCLUÍDA**
  - Implementadas interfaces completas de Contas a Pagar e Contas a Receber
  - Componente de formulário reutilizável PayableReceivableForm criado
  - Funcionalidades de CRUD completas para ambas as funcionalidades
  - Sistema de filtros avançados (status, período, cliente)
  - Botões de ação rápida (marcar como pago/recebido)
  - Cartões de resumo estatístico para cada módulo
  - Indicadores visuais para contas vencidas
  - Integração completa com APIs do backend
  - Validação de formulários com React Hook Form + Zod
  - Interface responsiva e profissional
- June 17, 2025: **SPRINT 4.2 - RELATÓRIOS DETALHADOS E GERAÇÃO DE PDF CONCLUÍDA**
  - Implementado sistema completo de geração de PDF para Ordens de Serviço
  - Bibliotecas jsPDF e html2canvas instaladas e configuradas
  - Botão "Imprimir PDF" adicionado na página de detalhes da ordem de serviço
  - PDF gerado inclui: dados completos do cliente, técnico, itens utilizados, anotações
  - Formatação profissional com cabeçalho, tabelas e seções de assinatura
  - Página de Relatórios Detalhados (/reports) criada com análises de performance
  - Relatórios de Performance de Técnicos com métricas de produtividade
  - Relatórios de Lucratividade com análise financeira por período e categoria
  - Sistema de filtros por período (mês, trimestre, ano) e técnico específico
  - Rota /reports configurada no sistema de navegação
  - **GERAÇÃO DE PDF PARA RELATÓRIOS FINANCEIROS IMPLEMENTADA**
  - Quatro tipos de relatórios PDF funcionais: Performance, Financeiro, Clientes, Produtividade
  - Botões anteriormente desabilitados agora totalmente funcionais
  - Estados de carregamento durante geração de PDF ("Gerando PDF...")
  - Formatação profissional com cores diferenciadas por tipo de relatório
  - PDFs incluem cabeçalhos, dados filtrados por período, métricas detalhadas
  - Download automático com nomes únicos baseados na data
  - **BOTÃO "EXPORTAR RELATÓRIO" DA PÁGINA FINANCE/REPORTS CORRIGIDO**
  - Implementada geração de PDF específica para relatórios financeiros detalhados
  - Suporte para 4 tipos: Fluxo de Caixa, DRE, Orçamento vs Real, Saldos das Contas
  - Cores específicas por tipo de relatório para identificação visual
  - Conteúdo dinâmico baseado nos dados carregados de cada relatório
  - Estados de carregamento "Gerando PDF..." durante processamento
- June 17, 2025: **PHASE 0 - COMPREHENSIVE SECURITY FOUNDATION COMPLETED**
  - **JWT Authentication System**: Complete JWT-based authentication with token generation, verification, and refresh
  - **Password Security Infrastructure**: bcryptjs integration with salt rounds, password hashing, and validation
  - **Multi-Database Architecture**: Support for both PostgreSQL and MySQL with environment-based configuration
  - **User Management System**: Complete CRUD operations for users with role-based access control
  - **Authentication Middleware**: Role-based route protection (Admin, Manager, Technician, Customer)
  - **Forced Password Changes**: Security requirement for new users to change default passwords
  - **Secure Storage Layer**: Updated storage interface with authentication methods and password management
  - **Frontend Authentication Flow**: Login page, password change page, and authentication context provider
  - **Protected Routes**: Authentication guards for all application routes with automatic redirects
  - **Default Admin User**: System initialized with admin/admin123 credentials for initial access
  - **API Security Endpoints**: Complete authentication API with login, password change, user management
  - **Environment Configuration**: Secure environment variable setup with JWT secrets and database URLs
- June 18, 2025: **COMPLETE JWT MIGRATION FINISHED**
  - **Systematic Route Conversion**: All backend API routes successfully migrated from session-based to JWT authentication
  - **Authentication Middleware Upgrade**: Implemented `authenticateToken` and `requireAdmin` middleware across all endpoints
  - **User Management Interface**: Fully functional admin-only user management with comprehensive CRUD operations
  - **Security Headers**: JWT tokens properly included in all frontend requests via Authorization header
  - **Logout Functionality**: Fixed logout mutation error in Header component ensuring proper token cleanup
  - **Route Protection**: Complete protection of work-orders, customers, technicians, transactions, accounts, budgets, catalog, and work-order-items APIs
  - **Role-Based Access Control**: Admin-only operations enforced on delete endpoints and user management
  - **Authentication Context**: Frontend authentication state management working seamlessly with JWT backend
  - **Change Password Flow Fixed**: Password change page now displays outside main layout like login page
  - **Missing API Endpoints**: Added `/api/reports/cash-flow`, `/api/reports/profit-loss`, and `/api/reports/budget-vs-actual` with JWT authentication
  - **Authentication Headers**: Updated finance reports page to include proper authorization headers for all API requests
  - **Redirect Logic**: After password change, users are properly redirected to dashboard with updated authentication state
  - **Work Order Authentication Fixed**: Resolved final 401 errors on work order PUT requests by migrating all work order routes to JWT
  - **Complete Frontend API Integration**: All frontend queries now properly include JWT tokens in Authorization headers
  - **Work Order Detail Page Fixed**: GET /api/work-orders/:id endpoint now returns 200 status with proper JWT authentication
  - **Customer/Technician Queries Fixed**: Individual customer and technician detail queries now include JWT headers
  - **Authentication System Fully Operational**: All endpoints tested and confirmed working with JWT authentication - no more 401 errors
  - **Work Order Filters Fixed**: Status and technician filters now properly send query parameters to backend API
  - **Filter API Integration**: Frontend queries correctly include status and technicianId parameters in URL query strings
  - **Filter Testing Confirmed**: All filter combinations tested and working (status=completed, in_progress, technicianId=1, etc.)
  - **OrderFilter Component Fixed**: Resolved state synchronization between parent and child components
  - **Filter Props Integration**: OrderFilter now receives and responds to defaultStatus and defaultTechnician props
  - **Complete Filter Functionality**: Frontend properly sends query parameters when filters are selected by users

## User Preferences

Preferred communication style: Simple, everyday language.