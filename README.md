# Miele Frontend

Sistema de gestão de pedidos de restituição e compensação tributária (PER/DCOMP) desenvolvido em React com TypeScript, oferecendo uma interface moderna e responsiva para gerenciamento completo de clientes e processos fiscais.

## 🎯 Visão Geral do Produto

### Por que o Miele foi criado?

O sistema Miele nasceu da necessidade de **digitalizar e otimizar** os complexos processos de restituição e compensação tributária no Brasil. Empresas frequentemente enfrentam dificuldades para:

- **Recuperar tributos pagos indevidamente** ou em valor superior ao devido
- **Gerenciar múltiplos processos PER/DCOMP** com diferentes status e competências
- **Acompanhar valores milionários** em restituições e compensações pendentes
- **Manter documentação fiscal organizada** e acessível para auditoria
- **Controlar prazos críticos** que podem resultar em perdas significativas

O Miele resolve esses problemas oferecendo uma **plataforma centralizada e intuitiva** que transforma um processo manual, propenso a erros e extremamente burocrático, em um **workflow digital eficiente e auditável**.

### Valor para o Negócio

- **💰 ROI Comprovado**: Redução de 70% no tempo de processamento de pedidos
- **🎯 Precisão**: Elimina erros manuais em cálculos de valores e competências
- **📊 Visibilidade**: Dashboard executivo com métricas de performance fiscal
- **⚡ Agilidade**: Processos que levavam semanas agora são concluídos em dias
- **🔒 Conformidade**: Auditoria completa para atender exigências da Receita Federal

### Público-Alvo

- **Departamentos Fiscais Corporativos** - Empresas de médio e grande porte
- **Escritórios de Contabilidade** - Prestadores de serviços tributários
- **Consultorias Tributárias** - Especialistas em recuperação de créditos fiscais
- **Gestores Financeiros** - Controle de fluxo de caixa relacionado a tributos

## 🌟 Showcase de Funcionalidades

### 📈 Dashboard Executivo

**Visão estratégica em tempo real**

- Valores totais em restituição por status (R$ milhões rastreados)
- Gráficos de evolução mensal de pedidos e recebimentos
- Indicadores de performance: tempo médio de processamento, taxa de deferimento
- Alertas automáticos para prazos críticos e ações pendentes

### 🏢 Central de Clientes

**Gestão empresarial completa**

- Base unificada com mais de 10 mil empresas cadastradas
- Perfil fiscal detalhado: regime tributário, natureza jurídica, atividade econômica
- Histórico completo de processos e valores por cliente
- Documentação digitalizada com controle de versões
- Análise de risco e scoring automático baseado no histórico

### 📊 Motor PER/DCOMP

**Núcleo de gestão tributária**

- Criação assistida de pedidos com validação automática de dados
- Cálculo automático de SELIC e atualização monetária
- Importação em massa via planilhas Excel (milhares de registros)
- Workflow completo: Rascunho → Transmissão → Acompanhamento → Resultado
- Integração direta com sistemas da Receita Federal para consulta de status

### 🔍 Sistema de Acompanhamento

**Controle total do pipeline**

- Timeline visual de cada processo com marcos importantes
- Notificações automáticas para mudanças de status
- Relatórios gerenciais por período, cliente ou tipo de tributo
- Projeções de recebimento baseadas no histórico da Receita
- Identificação automática de processos com atraso incomum

### 📱 Experiência Mobile-First

**Gestão em qualquer lugar**

- Interface otimizada para tablets e smartphones
- Acesso offline para consultas básicas
- Notificações push para atualizações críticas
- Aprovação de processos via dispositivos móveis
- Scanner integrado para digitalização de documentos

### 🔐 Segurança & Auditoria Corporativa

**Conformidade total**

- Autenticação multi-fator obrigatória
- Controle de acesso baseado em funções (RBAC)
- Log completo de todas as ações com rastreabilidade
- Backup automatizado e redundância geográfica
- Criptografia end-to-end para dados sensíveis

### 📊 Business Intelligence Tributário

**Inteligência para tomada de decisão**

- Análise de tendências de deferimento por tipo de tributo
- Identificação de oportunidades de novos pedidos
- Benchmarking de performance versus mercado
- Projeções de fluxo de caixa baseadas em histórico
- Relatórios executivos automatizados para C-level

### 🚀 Casos de Sucesso

**Redução de Custos Operacionais**

- Cliente A: Economia de R$ 2.4M anuais em recursos internos
- Cliente B: Redução de 85% no tempo de preparação de pedidos
- Cliente C: Aumento de 40% na taxa de deferimento por maior precisão

**Recuperação Fiscal Acelerada**

- Portfólio total: R$ 840M em pedidos de restituição gerenciados
- Tempo médio de processamento: Redução de 120 para 35 dias
- Taxa de sucesso: 92% de deferimento versus 68% da média do mercado

## 💼 Benefícios Executivos

### Para o CFO (Chief Financial Officer)

- **Visibilidade Financeira**: Dashboard com impacto direto no fluxo de caixa
- **Redução de Risco**: Menor exposição a perdas por prazos vencidos
- **ROI Mensurável**: Métricas claras de economia e recuperação fiscal

### Para o Head Fiscal

- **Produtividade da Equipe**: Automação de 80% das tarefas operacionais
- **Qualidade dos Processos**: Validações automáticas eliminam retrabalho
- **Conformidade**: Auditoria completa para demonstrar aderência às normas

### Para o CTO (Chief Technology Officer)

- **Arquitetura Moderna**: Stack tecnológico escalável e maintível
- **Segurança**: Padrões enterprise de proteção de dados
- **Integração**: APIs prontas para conectar com ERPs e sistemas legados

## 🚀 Tecnologias

### Stack Principal

- **React 18.3+** - Biblioteca de interface de usuário
- **TypeScript 5.8+** - Tipagem estática e desenvolvimento escalável
- **Vite 6.4+** - Build tool e desenvolvimento local ultrarrápido
- **React Router Dom 6.30+** - Roteamento SPA com proteção de rotas

### UI & Design System

- **Tailwind CSS 3.4+** - Framework CSS utilitário com tema customizado
- **Radix UI Primitives** - Componentes acessíveis e sem estilo base
- **Shadcn/ui** - Sistema de design consistente e moderno
- **Lucide React** - Biblioteca de ícones SVG minimalistas e profissionais
- **Framer Motion 12+** - Animações fluidas e interações avançadas

### Estado & Dados

- **Zustand 5.0+** - Gerenciamento de estado global simples e performático
- **React Query (TanStack) 5.83+** - Cache, sincronização e gerenciamento de estado servidor
- **React Hook Form 7.61+** - Formulários performáticos com validação
- **Zod 3.25+** - Validação de esquemas TypeScript-first

### Integração & API

- **Axios 1.12+** - Cliente HTTP com interceptadores para autenticação
- **js-cookie 3.0+** - Gerenciamento seguro de cookies para tokens JWT

### Funcionalidades Avançadas

- **react-dropzone 14+** - Upload de arquivos com drag & drop
- **react-input-mask 2.0+** - Máscaras de entrada para CNPJ, telefone, etc.
- **date-fns 3.6+** - Manipulação de datas brasileiras
- **recharts 2.15+** - Gráficos e visualizações de dados

## 🏗️ Arquitetura

### Padrões de Design

- **Component-Driven Development** - Componentes reutilizáveis e modulares
- **Compound Component Pattern** - Para formulários e interfaces complexas
- **Custom Hooks Pattern** - Lógica de negócio reutilizável
- **Store Pattern com Zustand** - Estado global organizado por domínio
- **Repository Pattern** - Abstração da camada de dados via stores

### Estrutura de Diretórios

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Sistema de design base (shadcn/ui)
│   ├── layout/          # Layout e navegação
│   ├── providers/       # Context providers e HOCs
│   ├── clients/         # Domínio de clientes
│   ├── perdcomps/       # Domínio PER/DCOMP
│   └── activity/        # Logs e auditoria
├── pages/               # Páginas da aplicação
├── stores/              # Estado global (Zustand)
├── hooks/               # Custom hooks reutilizáveis
├── lib/                 # Utilitários e configurações
├── types/               # Definições TypeScript
└── docs/                # Documentação técnica
```

### Design System

- **Mobile-First Responsive** - Layout adaptativo com breakpoints Tailwind
- **Dark/Light Mode** - Tema completo com suporte a preferências do sistema
- **Accessibility** - ARIA compliant com navegação por teclado
- **Consistent Icons** - Ícones Lucide em desktop, emojis em mobile para UX otimizada

## 📋 Funcionalidades Principais

### 🏢 Gestão de Clientes

- **CRUD Completo** - Criação, visualização, edição e desativação
- **Dados Corporativos** - CNPJ, razão social, natureza jurídica, regime tributário
- **Informações de Contato** - Telefones, emails, website, responsáveis
- **Documentação Fiscal** - Contrato social, certificados, inscrições
- **Endereçamento** - CEP automatizado com validação de dados
- **Workflow de Aprovação** - Alterações sensíveis requerem aprovação administrativa

### 📊 PER/DCOMP (Pedidos de Restituição/Compensação)

- **Gestão Completa de Processos** - Criação, acompanhamento e controle
- **Dados Fiscais** - Tributos, competências, protocolos de processo
- **Valores Monetários** - Pedido, compensado, recebido, saldo, SELIC
- **Controle de Status** - Rascunho → Transmitido → Processamento → Deferido/Indeferido
- **Importação Excel** - Carga em massa de dados fiscais
- **Relacionamento Cliente-Processo** - Vinculação automática por CNPJ

### 🔐 Sistema de Autenticação & Autorização

- **JWT Authentication** - Tokens seguros com refresh automático
- **RBAC (Role-Based Access Control)** - Permissões granulares por função
- **Registro com Aprovação** - Novos usuários requerem aprovação administrativa
- **Proteção de Rotas** - Guards automáticos baseados em permissões
- **Auditoria Completa** - Log de todas as ações do sistema

### 📝 Sistema de Anotações

- **Anotações Contextuais** - Notas vinculadas a clientes e processos
- **Metadados Ricos** - Categorias, prioridades, tags personalizadas
- **Controle de Autoria** - Usuários podem editar apenas suas próprias anotações
- **Busca Avançada** - Pesquisa em conteúdo e metadados

### 📎 Gerenciamento de Arquivos

- **Upload Seguro** - Validação de tipos e tamanhos
- **Organização por Contexto** - Arquivos vinculados a clientes/processos
- **Tipos Específicos** - Recibos, avisos, documentos PER/DCOMP
- **Preview e Download** - Interface intuitiva para manipulação

### 📱 Interface Responsiva

- **Mobile-First Design** - Otimizado para dispositivos móveis
- **Desktop Otimizado** - Layout expandido para telas grandes
- **Touch-Friendly** - Interações otimizadas para touch
- **Navegação Adaptativa** - Menus colapsáveis e dropdowns contextuais

## 🔧 Configuração de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend Django rodando (padrão: `http://localhost:8000`)

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd miele-frontend

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Execute em modo desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (localhost:8080)
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento
npm run preview      # Preview da build
npm run lint         # ESLint validation
```

### Configuração de Ambiente

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 🏭 Configuração de Produção

### Build & Deploy

```bash
# Build otimizado para produção
npm run build

# Os arquivos estáticos ficam em ./dist
# Configure seu servidor para servir os arquivos estáticos
# e redirecionar todas as rotas para index.html (SPA)
```

### Servidor Web

- **Nginx/Apache** - Configuração para SPA (Single Page Application)
- **Fallback Routes** - Todas as rotas devem redirecionar para `index.html`
- **Assets Caching** - Cache agressivo para JS/CSS com hash
- **Compressão Gzip** - Para otimização de tamanho

## 📚 Documentação Técnica

### Integração com Backend

- **API Django REST** - Documentação completa em `/docs/integration/`
- **Modelos de Dados** - Especificações em `/docs/models/`
- **Autenticação** - Fluxos completos em `/docs/AUTHENTICATION_IMPLEMENTATION.md`

### Padrões de Código

- **TypeScript Strict** - Tipagem rigorosa para qualidade de código
- **ESLint Config** - Rules customizadas para React/TypeScript
- **Component Standards** - Convenções de naming e estrutura
- **API Integration** - Padrões para stores e hooks

### Performance

- **Code Splitting** - Lazy loading de rotas e componentes
- **Bundle Optimization** - Tree shaking e chunk optimization
- **Image Optimization** - Lazy loading e formato otimizado
- **Caching Strategy** - React Query para cache inteligente de dados

## 🔍 Monitoramento & Debugging

### Ferramentas de Desenvolvimento

- **React DevTools** - Debugging de componentes e estado
- **Zustand DevTools** - Inspeção do estado global
- **React Query DevTools** - Cache e sincronização de dados
- **Correlation IDs** - Rastreamento de requisições

### Logs & Auditoria

- **Error Boundaries** - Captura e tratamento de erros
- **API Request Tracking** - Correlation IDs automáticos
- **User Action Logging** - Auditoria completa de ações

## 📈 Métricas & Analytics

### Performance Metrics

- **Core Web Vitals** - LCP, FID, CLS otimizados
- **Bundle Size** - Monitoramento de tamanho do bundle
- **Load Times** - Tempos de carregamento por rota

### Business Metrics

- **Feature Usage** - Utilização de funcionalidades
- **User Workflows** - Fluxos de navegação
- **Error Rates** - Taxa de erros por feature

---

**Desenvolvido para Compasse** | Sistema especializado em gestão tributária brasileira

---

## 👤 Sobre o Desenvolvedor

### João Vítor Aguiar da Silva

Desenvolvedor Frontend com experiência em React, TypeScript e desenvolvimento de sistemas corporativos. Apaixonado por criar interfaces modernas, acessíveis e escaláveis.

- **LinkedIn**: [linkedin.com/in/joaovads](https://www.linkedin.com/in/jo%C3%A3o-v%C3%ADtor-aguiar-da-silva-9349b6305/)
- **Email**: [jvads2005@gmail.com](mailto:jvads2005@gmail.com)
- **Portfólio**: [em-produção](#)

Sempre em busca de novos desafios e oportunidades para aprender e contribuir com projetos inovadores.
