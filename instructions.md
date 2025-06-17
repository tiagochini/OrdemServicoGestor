# Instruções de Implementação - Sistema de Gestão de Ordens de Serviço

## Análise do Estado Atual

O projeto é um sistema completo de gestão de ordens de serviço que inclui:

### ✅ **Implementado Atualmente**

#### Backend
- ✅ Estrutura do servidor Express com TypeScript
- ✅ Sistema de autenticação com Passport.js e sessões
- ✅ Schema completo do banco de dados (Drizzle ORM)
- ✅ Storage em memória com dados de exemplo
- ✅ Rotas CRUD para:
  - Clientes (customers)
  - Técnicos (technicians) 
  - Ordens de serviço (work orders)
  - Notas (notes)
  - Transações financeiras (transactions)
  - Contas bancárias (accounts)
  - Orçamentos (budgets)
  - Itens do catálogo (catalog items)
  - Itens de ordem de serviço (work order items)
- ✅ Sistema de relatórios financeiros
- ✅ Middleware de autorização por perfis (admin, técnico, cliente)

#### Frontend
- ✅ Estrutura React com TypeScript e Vite
- ✅ Roteamento com Wouter
- ✅ Sistema de autenticação completo
- ✅ Dashboard principal com estatísticas
- ✅ Gerenciamento de ordens de serviço (listagem, criação, edição)
- ✅ Layout responsivo com sidebar e navegação móvel
- ✅ Componentes UI base (shadcn/ui)
- ✅ Formulários com validação (React Hook Form + Zod)
- ✅ Sistema de estado com TanStack Query
- ✅ Página de finanças (overview)

---

## 🚧 **Pendente de Implementação**

### 1. **PÁGINAS FRONTEND INCOMPLETAS**

#### 1.1 Clientes (ALTA PRIORIDADE)
**Localização**: `client/src/pages/customers/`
- ❌ Página de listagem de clientes (`index.tsx`)
- ❌ Formulário de criação/edição de clientes
- ❌ Página de detalhes do cliente
- ❌ Componentes específicos de clientes

**Funcionalidades necessárias:**
- Listagem com filtros e paginação
- Formulário CRUD com validação
- Visualização de histórico de ordens por cliente
- Informações de contato e endereço

#### 1.2 Técnicos (ALTA PRIORIDADE)
**Localização**: `client/src/pages/technicians/`
- ❌ Página de listagem de técnicos (`index.tsx`)
- ❌ Formulário de criação/edição de técnicos
- ❌ Página de detalhes do técnico
- ❌ Componentes específicos de técnicos

**Funcionalidades necessárias:**
- Listagem com filtros por especialização
- Formulário CRUD com campos de especialização
- Dashboard do técnico com ordens atribuídas
- Calendário de disponibilidade

#### 1.3 Catálogo de Produtos/Serviços (MÉDIA PRIORIDADE)
**Localização**: `client/src/pages/catalog/`
- ✅ Página principal (`index.tsx`) - CRIADA MAS VAZIA
- ❌ Página de detalhes (`[id].tsx`) - CRIADA MAS VAZIA
- ❌ Página de criação (`new.tsx`) - CRIADA MAS VAZIA
- ❌ Página de edição (`edit/[id].tsx`) - CRIADA MAS VAZIA
- ❌ Componentes de catálogo

**Funcionalidades necessárias:**
- Listagem de produtos e serviços
- Formulários de criação/edição
- Sistema de tags e categorias
- Controle de preços e custos
- Integração com ordens de serviço

#### 1.4 Módulo Financeiro (MÉDIA PRIORIDADE)
**Localização**: `client/src/pages/finance/`
- ✅ Overview financeiro (`index.tsx`) - IMPLEMENTADO
- ❌ Transações (`transactions.tsx`) - CRIADA MAS VAZIA
- ❌ Contas a pagar (`accounts-payable.tsx`) - CRIADA MAS VAZIA
- ❌ Contas a receber (`accounts-receivable.tsx`) - CRIADA MAS VAZIA
- ❌ Contas bancárias (`accounts.tsx`) - CRIADA MAS VAZIA
- ❌ Orçamentos (`budgets.tsx`) - CRIADA MAS VAZIA
- ❌ Relatórios (`reports.tsx`) - CRIADA MAS VAZIA

**Funcionalidades necessárias:**
- Interface de transações com filtros avançados
- Gestão de contas a pagar/receber
- Controle de contas bancárias
- Sistema de orçamentos
- Relatórios financeiros com gráficos

#### 1.5 Configurações (BAIXA PRIORIDADE)
**Localização**: `client/src/pages/settings/`
- ❌ Página de configurações (`index.tsx`) - CRIADA MAS VAZIA

**Funcionalidades necessárias:**
- Configurações do sistema
- Perfil do usuário
- Configurações de notificações
- Backup e exportação de dados

### 2. **COMPONENTES FRONTEND PENDENTES**

#### 2.1 Componentes de Clientes
**Localização**: `client/src/components/customers/`
- ❌ `customer-card.tsx` - Card de cliente
- ❌ `customer-form.tsx` - Formulário de cliente
- ❌ `customer-filter.tsx` - Filtros de listagem
- ❌ `customer-details.tsx` - Detalhes do cliente

#### 2.2 Componentes de Técnicos
**Localização**: `client/src/components/technicians/`
- ❌ `technician-card.tsx` - Card de técnico
- ❌ `technician-form.tsx` - Formulário de técnico
- ❌ `technician-filter.tsx` - Filtros de listagem
- ❌ `technician-calendar.tsx` - Calendário do técnico

#### 2.3 Componentes de Catálogo
**Localização**: `client/src/components/catalog/`
- ❌ `catalog-item-card.tsx` - Card de item
- ❌ `catalog-item-form.tsx` - Formulário de item
- ❌ `catalog-filter.tsx` - Filtros e busca
- ❌ `price-calculator.tsx` - Calculadora de preços

#### 2.4 Componentes Financeiros
**Localização**: `client/src/components/finance/`
- ❌ `transaction-form.tsx` - Formulário de transação
- ❌ `transaction-table.tsx` - Tabela de transações
- ❌ `account-form.tsx` - Formulário de conta
- ❌ `budget-form.tsx` - Formulário de orçamento
- ❌ `financial-charts.tsx` - Gráficos financeiros

### 3. **FUNCIONALIDADES BACKEND PENDENTES**

#### 3.1 Sistema de Notificações
- ❌ WebSocket para notificações em tempo real
- ❌ Sistema de emails automáticos
- ❌ Notificações push

#### 3.2 Sistema de Arquivos
- ❌ Upload de anexos para ordens de serviço
- ❌ Fotos de produtos no catálogo
- ❌ Documentos financeiros

#### 3.3 Relatórios Avançados
- ❌ Geração de PDFs
- ❌ Exportação para Excel
- ❌ Relatórios personalizados

### 4. **MELHORIAS E OTIMIZAÇÕES**

#### 4.1 Interface do Usuário
- ❌ Modo escuro
- ❌ Personalização de tema
- ❌ Acessibilidade (ARIA)
- ❌ Internacionalização (i18n)

#### 4.2 Performance
- ❌ Lazy loading de páginas
- ❌ Otimização de imagens
- ❌ Cache avançado
- ❌ Service Workers

#### 4.3 Segurança
- ❌ Rate limiting
- ❌ Validação avançada de entrada
- ❌ Logs de auditoria
- ❌ Backup automático

---

## 📋 **Roteiro de Implementação Recomendado**

### **FASE 1: Fundações (Semana 1-2)**
**Prioridade: CRÍTICA**

#### Sprint 1.1: Gestão de Clientes
1. **Página de listagem de clientes** (`/customers`)
   - Listagem com paginação
   - Filtros básicos (nome, email, cidade)
   - Busca em tempo real
2. **Formulário de cliente** (criar/editar)
   - Validação completa com Zod
   - Campos: nome, email, telefone, endereço, empresa
3. **Página de detalhes do cliente**
   - Informações completas
   - Histórico de ordens de serviço
   - Botões de ação (editar, nova ordem)

#### Sprint 1.2: Gestão de Técnicos
1. **Página de listagem de técnicos** (`/technicians`)
   - Listagem com especialização
   - Status (disponível, ocupado, ausente)
   - Filtros por especialização
2. **Formulário de técnico** (criar/editar)
   - Dados pessoais e especializações
   - Horários de trabalho
3. **Dashboard do técnico**
   - Ordens atribuídas
   - Calendário semanal

### **FASE 2: Catálogo e Operações (Semana 3-4)**
**Prioridade: ALTA**

#### Sprint 2.1: Catálogo de Produtos/Serviços
1. **Página principal do catálogo** (`/catalog`)
   - Grid de produtos/serviços
   - Filtros por tipo, categoria, preço
   - Busca avançada
2. **Formulários CRUD do catálogo**
   - Criação/edição de itens
   - Upload de imagens (futuro)
   - Sistema de tags
3. **Integração com ordens de serviço**
   - Seleção de itens ao criar ordem
   - Cálculo automático de preços

#### Sprint 2.2: Melhorias nas Ordens de Serviço
1. **Página de detalhes expandida**
   - Timeline de status
   - Anexos e fotos
   - Itens utilizados
2. **Sistema de aprovação**
   - Workflow de aprovação
   - Notificações por email

### **FASE 3: Módulo Financeiro (Semana 5-6)**
**Prioridade: MÉDIA-ALTA**

#### Sprint 3.1: Transações e Contas
1. **Página de transações** (`/finance/transactions`)
   - Listagem completa com filtros
   - Formulário de criação/edição
   - Categorização automática
2. **Contas bancárias** (`/finance/accounts`)
   - Gestão de contas
   - Saldos em tempo real
   - Conciliação bancária

#### Sprint 3.2: Contas a Pagar/Receber
1. **Interface de contas a pagar** (`/finance/accounts-payable`)
   - Lista de pendências
   - Agendamento de pagamentos
   - Status de pagamento
2. **Interface de contas a receber** (`/finance/accounts-receivable`)
   - Faturas em aberto
   - Controle de vencimentos
   - Histórico de recebimentos

### **FASE 4: Relatórios e Analytics (Semana 7-8)**
**Prioridade: MÉDIA**

#### Sprint 4.1: Dashboards Avançados
1. **Gráficos financeiros**
   - Recharts para visualizações
   - Fluxo de caixa visual
   - Gráficos de performance
2. **Relatórios operacionais**
   - Performance de técnicos
   - Análise de ordens de serviço
   - Indicadores de qualidade

#### Sprint 4.2: Sistema de Orçamentos
1. **Gestão de orçamentos** (`/finance/budgets`)
   - Criação de orçamentos por categoria
   - Acompanhamento vs realizado
   - Alertas de limite
2. **Relatórios gerenciais** (`/finance/reports`)
   - Demonstrativo de resultados
   - Balanço patrimonial
   - Exportação em PDF

### **FASE 5: Funcionalidades Avançadas (Semana 9-10)**
**Prioridade: BAIXA-MÉDIA**

#### Sprint 5.1: Sistema de Notificações
1. **WebSocket para tempo real**
   - Notificações instantâneas
   - Updates de status em tempo real
2. **Sistema de emails**
   - Templates personalizados
   - Agendamento de envios

#### Sprint 5.2: Configurações e Personalizações
1. **Página de configurações** (`/settings`)
   - Configurações do sistema
   - Perfil do usuário
   - Preferências de notificação
2. **Temas e acessibilidade**
   - Modo escuro/claro
   - Tamanhos de fonte
   - Contraste alto

---

## 🛠 **Instruções Técnicas Específicas**

### **Padrões de Desenvolvimento**

#### Frontend (React/TypeScript)
```typescript
// Estrutura padrão de página
const PageName = () => {
  // Hooks de estado
  const [loading, setLoading] = useState(false);
  
  // Queries com TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ['/api/endpoint'],
  });
  
  // Mutations para alterações
  const mutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/endpoint', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    }
  });
  
  return (
    <div className="container mx-auto py-6">
      {/* Conteúdo da página */}
    </div>
  );
};
```

#### Formulários
```typescript
// Padrão para formulários
const FormComponent = ({ onClose, itemId }: FormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { /* valores iniciais */ }
  });
  
  const mutation = useMutation({
    mutationFn: async (values) => {
      const method = itemId ? 'PUT' : 'POST';
      const url = itemId ? `/api/endpoint/${itemId}` : '/api/endpoint';
      return apiRequest(method, url, values);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
      onClose();
    }
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(mutation.mutate)}>
        {/* Campos do formulário */}
      </form>
    </Form>
  );
};
```

### **Estrutura de Arquivos**
```
client/src/
├── pages/
│   ├── customers/
│   │   ├── index.tsx (listagem)
│   │   ├── [id].tsx (detalhes)
│   │   └── new.tsx (criação)
│   ├── technicians/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   └── catalog/
│       ├── index.tsx
│       ├── [id].tsx
│       ├── new.tsx
│       └── edit/[id].tsx
├── components/
│   ├── customers/
│   ├── technicians/
│   ├── catalog/
│   └── finance/
└── hooks/
    ├── use-customers.ts
    ├── use-technicians.ts
    └── use-catalog.ts
```

### **Convenções de Nomenclatura**

- **Arquivos**: kebab-case (`customer-form.tsx`)
- **Componentes**: PascalCase (`CustomerForm`)
- **Variáveis**: camelCase (`customerData`)
- **APIs**: RESTful (`GET /api/customers`, `POST /api/customers`)

### **Tratamento de Erros**
```typescript
// Padrão para tratamento de erros
const { data, error, isLoading } = useQuery({
  queryKey: ['/api/endpoint'],
  onError: (error) => {
    toast({
      title: "Erro ao carregar dados",
      description: error.message,
      variant: "destructive"
    });
  }
});
```

---

## 📊 **Critérios de Aceitação**

### **Qualidade do Código**
- ✅ TypeScript sem erros
- ✅ Validação com Zod em todos os formulários
- ✅ Tratamento de erro consistente
- ✅ Loading states em todas as operações
- ✅ Responsividade mobile-first

### **Funcionalidade**
- ✅ CRUD completo para todas as entidades
- ✅ Validação client-side e server-side
- ✅ Feedback visual para usuário
- ✅ Navegação intuitiva
- ✅ Performance adequada

### **Testes (Futuro)**
- ❌ Testes unitários (Jest/Vitest)
- ❌ Testes de integração
- ❌ Testes E2E (Playwright)

---

## 🎯 **Próximos Passos Imediatos**

1. **Implementar página de clientes** - começar com listagem básica
2. **Criar formulário de cliente** - incluir validação completa
3. **Implementar página de técnicos** - similar aos clientes
4. **Desenvolver componentes reutilizáveis** - cards, filtros, tabelas

**Tempo estimado total**: 8-10 semanas para implementação completa

**Recursos necessários**: 1-2 desenvolvedores full-stack com experiência em React/TypeScript

---

*Documento criado em: 17 de junho de 2025*
*Última atualização: 17 de junho de 2025*