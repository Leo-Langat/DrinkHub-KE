# DrinkHub Kenya 🍹🇰🇪

DrinkHub Kenya is an enterprise multi-tenant Progressive Web Application (PWA) designed for clubs, bars, lounges, and entertainment venues across Kenya. It offers QR-code table ordering, realtime kitchen dispatching (KDS), and M-Pesa STK Push payments.

---

## 🛠 Technology Stack

### Frontend (`apps/client`)
- **React 19** + **Vite**
- **React Router v6**
- **TanStack Query (React Query v5)**
- **TailwindCSS** (Dark glassmorphism theme)
- **Axios** (With automatic tenant & JWT injection)
- **Socket.IO Client**

### Backend (`apps/server`)
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** (Access + Refresh token rotation) & **bcrypt**
- **Socket.IO** (Realtime tenant rooms)
- **Winston** (Structured logging)
- **Zod** (Environment & DTO validation)
- **Swagger / OpenAPI** (`/api-docs`)

### DevOps & Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** (Reverse proxy & SSL termination)
- **ESLint**, **Prettier**, **Husky**, **Commitlint**
- **GitHub Actions CI**

---

## 📁 Repository Folder Structure

```
DrinkHub/
├── .github/workflows/ci.yml       # GitHub Actions CI
├── apps/
│   ├── server/                  # Node.js Express Backend
│   │   ├── prisma/schema.prisma  # PostgreSQL Database Schema
│   │   └── src/
│   │       ├── config/          # Env, Prisma, Winston, Swagger, Socket.IO
│   │       ├── common/          # Middlewares, Errors, Context, Base Repo
│   │       └── modules/         # Feature Modules (Tenant, Auth, Menu, Order, Payment)
│   └── client/                  # React 19 PWA Frontend
│       ├── public/              # PWA manifest.json & service worker
│       └── src/
│           ├── config/          # Axios, QueryClient
│           ├── context/         # AuthContext, TenantContext, SocketContext
│           └── components/      # UI Design System & Layout
├── packages/
│   └── shared/                  # Shared Types, DTOs & Enums
├── docker/                      # Nginx configs & Compose setups
├── docker-compose.yml           # Local dev multi-container setup
└── package.json                 # Monorepo root workspace configuration
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js >= 20.0.0
- Docker & Docker Compose (or local PostgreSQL)

### 2. Installation
```bash
# Install all dependencies across monorepo workspaces
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in both `apps/server` and `apps/client`:
```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

### 4. Run via Docker Compose
```bash
npm run docker:dev
```
- Client PWA: http://localhost:8080
- Server API Gateway: http://localhost:5000/api/v1
- Swagger API Documentation: http://localhost:5000/api-docs

---

## 📜 Development Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start both server and client in development mode |
| `npm run build` | Build shared package, server, and client for production |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run format` | Format codebase using Prettier |
| `npm run type-check` | Type-check TypeScript across the monorepo |

---

## 🔒 Security & Multi-Tenancy Architecture
- **Tenant Context Isolation**: Resolved via `X-Tenant-ID` header or subdomain, propagated through Node.js `AsyncLocalStorage`.
- **RBAC Roles**: `SUPER_ADMIN`, `TENANT_ADMIN`, `MANAGER`, `KITCHEN_STAFF`, `WAITER`.
- **Payment Verification**: Secure Safaricom Daraja STK Push callbacks with checksum verification.
