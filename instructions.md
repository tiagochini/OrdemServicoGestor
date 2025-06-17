# Roadmap de Implementação do Sistema de Gestão de Serviços

## 1. Visão Geral do Projeto

Este documento detalha o roteiro de implementação para o sistema de gestão de serviços, abrangendo desde funcionalidades essenciais até recursos avançados, com foco na segurança e escalabilidade.

## 2. Princípios e Padrões de Desenvolvimento

* **Tecnologias Core:** React, TypeScript, Node.js, Express, Drizzle ORM.
* **Suporte a Múltiplos Bancos de Dados:** O sistema deve ser compatível com **PostgreSQL e MySQL**. O banco de dados a ser utilizado será definido através de variáveis de ambiente no arquivo `.env`.
* **Gerenciamento de Banco de Dados:** Drizzle ORM para tipagem segura e `drizzle-kit` para gerenciamento de migrações.
* **Gerenciamento de Estado:** TanStack Query para dados assíncronos.
* **Validação de Formulários:** React Hook Form com Zod.
* **Estilização:** Tailwind CSS e Shadcn/ui (ou biblioteca de componentes similar para UI robusta).
* **Estrutura:** Frontend (client/), Backend (server/), Schemas Compartilhados (shared/).
* **Qualidade:** Código limpo, modular, testável e legível.

## 3. Estrutura de Arquivos Recomendada

```
.
├── client/
│   ├── src/
│   │   ├── api/             # Funções de interação com a API
│   │   ├── assets/          # Imagens, ícones, etc.
│   │   ├── components/      # Componentes reutilizáveis (UI, específicos de módulo)
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── ui/          # Componentes Shadcn/ui ou customizados
│   │   │   ├── auth/        # Formulários de login, etc. (NOVO/AJUSTADO)
│   │   │   ├── users/       # Formulário de usuário, tabela de usuários (NOVO)
│   │   │   ├── clients/
│   │   │   ├── technicians/
│   │   │   ├── catalog/
│   │   │   ├── orders/
│   │   │   ├── finance/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   ├── hooks/           # Hooks customizados
│   │   ├── lib/             # Funções utilitárias (ex: protected-route)
│   │   ├── pages/           # Páginas principais (rotas)
│   │   │   ├── auth/        # Login, Forgot Password (Registro via gerenciamento de usuários) (NOVO/AJUSTADO)
│   │   │   ├── users/       # Lista de usuários, detalhes, edição (NOVO)
│   │   │   ├── clients/
│   │   │   ├── technicians/
│   │   │   ├── catalog/
│   │   │   ├── orders/
│   │   │   ├── finance/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   ├── App.tsx          # Configuração de rotas principais
│   │   ├── main.tsx         # Ponto de entrada React
│   │   ├── types.ts         # Definições de tipos específicos do cliente
│   ├── public/
├── server/
│   ├── src/
│   │   ├── auth/            # Lógica de autenticação e JWT (NOVO)
│   │   ├── middleware/      # Middleware de autenticação/autorização (NOVO)
│   │   ├── routes.ts        # Definição de todas as rotas da API
│   │   ├── storage.ts       # Camada de abstração de dados (Drizzle/mock)
│   │   ├── index.ts         # Ponto de entrada do servidor (Express, WebSockets)
│   │   ├── types.ts         # Definições de tipos específicos do servidor
│   ├── .env                 # Variáveis de ambiente (incluindo DB_TYPE, DB_HOST, etc.)
├── shared/
│   ├── schema.ts            # Schemas Drizzle e Zod compartilhados
│   ├── types.ts             # Tipos TypeScript compartilhados
├── README.md
├── package.json
```

## 4. Roteiro de Implementação Sugerido (Atualizado)

Este roteiro prioriza a segurança e gestão de usuários como base para as demais funcionalidades.

---

### **FASE 0: Segurança e Gestão de Usuários (ALTA PRIORIDADE - FUNDACIONAL)**

**Objetivo:** Estabelecer a base de segurança, autenticação e autorização para todo o sistema.

* **Sprint 0.1: Autenticação (Login, Recuperação de Senha e Troca de Senha Obrigatória)**
    * **Backend:** Implementar rotas de `POST /api/auth/login` (autenticação e geração de JWT), e `POST /api/auth/forgot-password` (recuperação básica de senha).
        * **Importante:** Adicione uma flag/campo ao modelo de usuário (`User`) para indicar se a senha é provisória (ex: `mustChangePassword: boolean`).
        * Implemente um endpoint para `POST /api/auth/change-password` para que usuários com `mustChangePassword` possam definir sua senha permanente.
    * **Frontend:** Páginas de Login e Recuperação de Senha.
        * Após o login, se `mustChangePassword` for `true`, o usuário deve ser **redirecionado para uma página de troca de senha obrigatória** antes de acessar o dashboard.
        * Integração com a API de autenticação. Gerenciamento do estado de autenticação (JWT) no cliente.
* **Sprint 0.2: Gestão de Perfis de Usuário (Incluindo Registro Administrativo)**
    * **Backend:** Rotas CRUD para usuários (`/api/users`).
        * Definição de modelo de usuário (`User` com `id`, `name`, `email`, `passwordHash`, `role`, `mustChangePassword`).
        * A rota `POST /api/users` (criação de novo usuário) deve **automaticamente definir a senha como `123mudar` (hashed) e `mustChangePassword` como `true`**.
    * **Frontend:** Página de listagem de usuários (`/admin/users`), formulário para criar/editar usuários. Visualização de perfil próprio (`/profile`). O formulário de criação de usuário não terá um campo de senha, mas um campo `role`.
* **Sprint 0.3: Controle de Acesso Baseado em Papéis (RBAC)**
    * **Backend:** Implementar middleware de autorização baseado em JWT e papéis (`roles`) para proteger rotas específicas (ex: apenas 'admin' pode acessar `/api/users`). **Adapte TODAS as rotas existentes** para serem protegidas por este middleware, permitindo acesso baseado em papéis (ex: 'admin' pode tudo, 'tecnico' só suas OS, 'cliente' só suas OS e dados, 'gerente' pode financeiro).
    * **Frontend:** Ocultar/desabilitar elementos da UI com base no papel do usuário logado (ex: botão "Gerenciar Usuários" visível apenas para 'admin'). Definir papéis (ex: 'admin', 'gerente', 'técnico', 'cliente').

---

### **FASE 1: Fundações (CONCLUÍDA)**

**Objetivo:** Estabelecer os módulos básicos de clientes e técnicos.

* **Sprint 1.1: Gestão de Clientes (CONCLUÍDA)**
    * Página de listagem, formulário (criar/editar), página de detalhes.
* **Sprint 1.2: Gestão de Técnicos (CONCLUÍDA)**
    * Página de listagem, formulário (criar/editar), página de detalhes.

---

### **FASE 2: Catálogo e Operações (CONCLUÍDA)**

**Objetivo:** Gerenciar produtos/serviços e o fluxo de trabalho das ordens de serviço.

* **Sprint 2.1: Catálogo de Produtos/Serviços (CONCLUÍDA)**
    * Página principal (listagem, filtros), formulários CRUD.
* **Sprint 2.2: Melhorias nas Ordens de Serviço (CONCLUÍDA)**
    * Página de detalhes expandida (timeline, anexos, **itens do catálogo**), sistema de aprovação (básico/placeholder).

---

### **FASE 3: Módulo Financeiro (CONCLUÍDA)**

**Objetivo:** Fornecer ferramentas para gestão financeira básica.

* **Sprint 3.1: Transações e Contas (CONCLUÍDA)**
    * Página de transações (listagem, CRUD, filtros).
    * Contas bancárias (gestão, saldos).
* **Sprint 3.2: Contas a Pagar/Receber (CONCLUÍDA)**
    * Interfaces dedicadas para contas a pagar e contas a receber.

---

### **FASE 4: Dashboards e Relatórios (CONCLUÍDA)**

**Objetivo:** Oferecer insights e capacidade de exportação de dados.

* **Sprint 4.1: Dashboard Principal e Resumos (CONCLUÍDA)**
    * Dashboard principal com KPIs essenciais (receita, OS, clientes, saldo).
* **Sprint 4.2: Relatórios Detalhados e Geração de PDF (CONCLUÍDA)**
    * Página de relatórios.
    * **Impressão de Ordem de Serviço em PDF.**
    * Geração de relatórios financeiros em PDF.

---

### **FASE 5: Funcionalidades Avançadas (MÉDIA PRIORIDADE - EM PROGRESSO)**

**Objetivo:** Adicionar recursos que melhoram a experiência do usuário e a eficiência operacional.

* **Sprint 5.1: Sistema de Notificações (EM PROGRESSO)**
    * **WebSocket:** Notificações em tempo real (updates de status, novas OS).
    * Sistema de emails: Templates personalizados, agendamento de envios (próximo passo após WebSockets).
* **Sprint 5.2: Agendamento e Calendário**
    * Interface de calendário para técnicos e ordens de serviço.
    * Agendamento de serviços, visualização de disponibilidade.
* **Sprint 5.3: Otimização de Rotas e Localização**
    * Integração com APIs de mapa.
    * Otimização de rotas para técnicos (se viável).
* **Sprint 5.4: Gamificação e Reconhecimento (Opcional)**
    * Sistema de pontos/badges para técnicos (baseado em performance).

---

### **FASE 6: Integrações e Extensibilidade (BAIXA PRIORIDADE)**

**Objetivo:** Conectar o sistema a serviços externos e preparar para futuras expansões.

* **Sprint 6.1: Integração com Meios de Pagamento**
    * Integração com gateways de pagamento (Stripe, PagSeguro, etc.) para faturas.
* **Sprint 6.2: Integração com Sistemas de Comunicação**
    * SMS, WhatsApp (APIs para notificações automatizadas).
* **Sprint 6.3: API Pública (Opcional)**
    * Documentação e acesso para parceiros.

---

### **FASE 7: Escalabilidade e Melhorias de Performance (MÉDIA PRIORIDADE)**

**Objetivo:** Garantir que o sistema funcione bem sob carga e com muitos dados.

* **Sprint 7.1: Otimização de Banco de Dados**
    * Indexação, otimização de queries, monitoramento de performance.
* **Sprint 7.2: Cache e Redução de Latência**
    * Implementação de cache (Redis, Memcached) para dados frequentemente acessados.
* **Sprint 7.3: Balanceamento de Carga**
    * Preparação para ambiente de múltiplos servidores.

---

### **FASE 8: Testes e Qualidade (ALTA PRIORIDADE - CONTÍNUO)**

**Objetivo:** Garantir a estabilidade e confiabilidade do software.

* **Sprint 8.1: Testes Unitários e de Integração**
    * Implementar testes para componentes críticos do frontend e backend.
* **Sprint 8.2: Testes E2E (End-to-End)**
    * Usar ferramentas como Cypress ou Playwright para simular fluxos de usuário.
* **Sprint 8.3: Testes de Segurança**
    * Análise de vulnerabilidades, testes de penetração.

---

### **FASE 9: Implantação e Monitoramento (MÉDIA PRIORIDADE)**

**Objetivo:** Preparar o sistema para produção e garantir sua operação contínua.

* **Sprint 9.1: CI/CD (Integração e Entrega Contínua)**
    * Configuração de pipelines de build e deploy automatizados.
* **Sprint 9.2: Monitoramento e Logging**
    * Ferramentas para monitorar a saúde da aplicação, erros e logs.
* **Sprint 9.3: Backup e Recuperação de Desastres**
    * Estratégias para garantir a resiliência dos dados.