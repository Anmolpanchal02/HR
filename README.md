# AI Engineering / HR Copilot

Production-oriented monorepo for an AI-assisted HR and engineering operations platform.

## Architecture

```text
Browser
  ↓
Next.js Frontend (:3000)
  ↓ REST + Bearer JWT
Fastify Backend (:5001)
  ↓
MongoDB (:27017)
```

Frontend and backend are fully separated. The frontend never connects to MongoDB directly.

## Multi-Tenant Auth Model

```text
Organization
    ↓
Users (scoped by organizationId)
    ↓
Roles: ADMIN | HR | ENGINEER | EMPLOYEE
```

- Every user belongs to exactly one organization.
- Email is unique **within** an organization (compound index).
- Organization slug is globally unique.
- First registered user of an organization becomes **ADMIN** automatically.

## Authentication Flow

```text
Register / Login
      ↓
Frontend (login-form / register-form)
      ↓
API Client (lib/api/auth.api.ts)
      ↓
POST /api/v1/auth/register | /login
      ↓
Auth Controller → Auth Service
      ↓
Organization Repository + User Repository
      ↓
MongoDB
      ↓
JWT issued
      ↓
Token stored in sessionStorage (tab-scoped)
      ↓
Redirect to /dashboard
```

### JWT Flow

```text
Authorization: Bearer <token>
      ↓
auth.middleware.ts
      ↓
verify JWT (userId, organizationId, role)
      ↓
request.authUser attached
      ↓
Protected route handler
```

JWT payload contains only: `userId`, `organizationId`, `role`. No passwords or sensitive PII.

### Logout Strategy (Stateless JWT)

This version uses **stateless JWT access tokens** (no Redis, no refresh tokens).

- `POST /api/v1/auth/logout` acknowledges logout on the server.
- Frontend clears the token from **sessionStorage**.
- The JWT remains technically valid until expiry — this is the trade-off of stateless auth without a token blocklist.

**Why sessionStorage (not localStorage)?** Frontend (`:3000`) and backend (`:5001`) run on different origins, so httpOnly cookies set by the backend are not practical without a same-origin BFF/proxy. sessionStorage is tab-scoped and cleared when the tab closes, reducing exposure compared to localStorage.

## Project Structure

```text
ai-hr-copilot/
├── frontend/          # Next.js + TypeScript + Tailwind
├── backend/           # Fastify + TypeScript + Mongoose
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB (local or via Docker)

## Quick Start (Local Development)

### 1. Start MongoDB

```bash
docker compose up mongodb -d
```

Or run MongoDB locally on `mongodb://localhost:27017`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5001`

> **macOS note:** Port 5000 is often taken by AirPlay Receiver. Local dev uses **5001**.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/v1/health` | No | Health check |
| POST | `/api/v1/auth/register` | No | Create org + admin user |
| POST | `/api/v1/auth/login` | No | Login |
| GET | `/api/v1/auth/me` | Yes | Current user |
| POST | `/api/v1/auth/logout` | Yes | Logout (client clears token) |

### Example: Register

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Acme Technologies",
    "name": "John Doe",
    "email": "john@acme.com",
    "password": "StrongPassword123"
  }'
```

### Example: Login

```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acme.com",
    "password": "StrongPassword123"
  }'
```

### Example: Get Current User

```bash
curl http://localhost:5001/api/v1/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ai_hr_copilot` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret (required) | Strong random string |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5001/api/v1` |

## Scripts

### Backend

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server + hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run test suite |
| `npm run seed` | Seed users, employees, projects, and tasks |
| `npm run seed:fresh` | Reset Acme org and re-seed everything |
| `npm run lint` | ESLint |

### Frontend

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |

## Testing

```bash
cd backend
npm test
```

Tests cover auth, members, employees, projects, tasks, documents, and copilot — **127 total** — using Vitest + MongoDB Memory Server.

## Member Management API

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/v1/users` | ADMIN, HR | List organization members |
| POST | `/api/v1/users` | ADMIN, HR | Create member |
| GET | `/api/v1/users/:id` | ADMIN, HR | Get single member |
| PATCH | `/api/v1/users/:id` | ADMIN, HR | Update name/role |
| PATCH | `/api/v1/users/:id/status` | ADMIN, HR | Activate/deactivate |

**Role assignment rules:**
- ADMIN → HR, ENGINEER, EMPLOYEE
- HR → ENGINEER, EMPLOYEE only
- ADMIN role cannot be created via this API
- `organizationId` is always taken from JWT, never from request body

Frontend page: http://localhost:3000/members (ADMIN/HR only)

## Employee Management API (Step 4)

**User** = authentication account · **Employee** = HR profile (linked via `User.employeeId` ↔ `Employee.userId`)

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/v1/employees` | ADMIN, HR | List with search/filter/pagination |
| POST | `/api/v1/employees` | ADMIN, HR | Create employee + linked EMPLOYEE user |
| GET | `/api/v1/employees/:id` | ADMIN, HR / own profile | View employee |
| PATCH | `/api/v1/employees/:id` | ADMIN, HR | Update profile |
| PATCH | `/api/v1/employees/:id/status` | ADMIN, HR | Soft status change (e.g. TERMINATED) |

- Employee codes auto-generated: `EMP-0001`, `EMP-0002` (atomic counter per org)
- Termination sets `Employee.status = TERMINATED` and deactivates linked User
- Compensating rollback on create failure (no orphan User/Employee records)

Frontend: http://localhost:3000/employees · http://localhost:3000/employees/[id]

## Project & Task Management API (Step 5)

Core data layer for future AI agents. All entities are organization-scoped; soft-delete only (Project → `ARCHIVED`, Task → `CANCELLED`).

### Projects

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/v1/projects` | All authenticated | List with search/filter/pagination |
| POST | `/api/v1/projects` | ADMIN, HR, ENGINEER | Create project |
| GET | `/api/v1/projects/:id` | All authenticated | Detail + task summary |
| PATCH | `/api/v1/projects/:id` | ADMIN, HR, ENGINEER | Update allowed fields |
| PATCH | `/api/v1/projects/:id/archive` | ADMIN, HR, ENGINEER | Set status to ARCHIVED |

- Project `key` is unique per organization (compound index `organizationId + key`), normalized to uppercase
- `ownerId` must reference an employee in the same organization
- `organizationId` and `createdBy` are never accepted from the client

### Tasks

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/v1/tasks` | All authenticated | List with filters/pagination |
| POST | `/api/v1/tasks` | ADMIN, HR, ENGINEER | Create task |
| GET | `/api/v1/tasks/:id` | All authenticated | Detail with project/assignee |
| PATCH | `/api/v1/tasks/:id` | ADMIN/HR/ENGINEER (full) · EMPLOYEE (own status only) | Update task |

- Status transitions validated in service layer (e.g. TODO → IN_PROGRESS → IN_REVIEW → DONE; BLOCKED ↔ IN_PROGRESS)
- EMPLOYEE can update `status` only on tasks assigned to them

**MongoDB indexes:**
- Projects: `{ organizationId, key }` unique; `{ organizationId, status/priority/ownerId }`
- Tasks: `{ organizationId, projectId/assigneeId/status/priority/dueDate }`

**AI-ready service exports:** `projectServiceApi`, `taskServiceApi` (same business logic REST uses)

Frontend: http://localhost:3000/projects · http://localhost:3000/projects/[id] · http://localhost:3000/tasks

## Document Management & RAG Foundation (Step 6)

Upload → extract → chunk → embed → tenant-scoped semantic search. No chatbot/LLM yet — retrieval context only.

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/v1/documents` | All authenticated | List metadata (search/filter/pagination) |
| POST | `/api/v1/documents` | ADMIN, HR, ENGINEER | Upload PDF/DOCX/TXT (multipart) |
| GET | `/api/v1/documents/search?q=...` | All authenticated | Semantic search (top-K chunks) |
| GET | `/api/v1/documents/:id` | All authenticated | Document metadata (no storageKey) |
| GET | `/api/v1/documents/:id/download` | All authenticated | Download original file |
| PATCH | `/api/v1/documents/:id/archive` | ADMIN, HR | Soft archive |

**Supported types:** PDF, DOCX, TXT · **Max size:** `MAX_DOCUMENT_SIZE_MB` (default 10)

**Processing pipeline:** UPLOADED → PROCESSING → extract text → chunk → embed → READY (or FAILED)

**Storage:** `FileStorageProvider` abstraction — local filesystem now (`DOCUMENT_STORAGE_PATH`), S3-compatible later.

**Embeddings:** `EmbeddingProvider` interface — `mock` (local dev/tests) or `openai` (when `EMBEDDING_API_KEY` set).

**Vector search:**
- `VECTOR_SEARCH_MODE=local` — cosine similarity over org-scoped chunks (dev/test)
- `VECTOR_SEARCH_MODE=atlas` — MongoDB Atlas `$vectorSearch` (requires vector index on `DocumentChunk.embedding` + `organizationId` filter)

**Env vars:** see `backend/.env.example` (`DOCUMENT_CHUNK_SIZE`, `DOCUMENT_CHUNK_OVERLAP`, etc.)

**AI-ready export:** `documentServiceApi.searchDocuments()` for future RAG retriever.

Frontend: http://localhost:3000/documents · http://localhost:3000/documents/[id]

## AI Copilot (Step 7 → Step 8)

The Copilot now uses a **controlled AI Agent** with explicit tool calling. RAG is one tool (`search_documents`); the agent can also search/create/update employees, projects, and tasks through existing services.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/v1/copilot/chat` | Agent chat (optional `conversationId`) — returns `message`, `citations`, `toolCalls` |
| GET | `/api/v1/copilot/conversations` | List user's conversations |
| GET | `/api/v1/copilot/conversations/:id` | Get conversation + messages |
| DELETE | `/api/v1/copilot/conversations/:id` | Delete conversation |

**Agent flow:**

```text
User message → AgentService → LLM (tool choice)
  → Tool Registry → Existing Service → MongoDB
  → tool result → LLM → final answer + citations + toolCalls
```

**Tools (11):** `search_employees`, `get_employee`, `search_projects`, `get_project`, `create_project`, `update_project`, `search_tasks`, `get_task`, `create_task`, `update_task`, `search_documents`

**Security:** LLM never touches MongoDB directly. `userId`, `organizationId`, and `role` come from JWT only — model-supplied values are stripped. Tool permissions match existing REST API rules.

**Agent loop:** bounded by `AGENT_MAX_TOOL_CALLS` (default `5`). Runs logged in `AgentRun` model (`RUNNING`, `COMPLETED`, `FAILED`, `LIMIT_REACHED`).

**LLM:** `LLM_PROVIDER=mock|openai`, default model `gpt-4o-mini`

**Env:** `AGENT_MAX_TOOL_CALLS`, `RAG_TOP_K`, `RAG_MIN_SCORE`, `COPILOT_MAX_MESSAGE_LENGTH`

Frontend: http://localhost:3000/copilot — shows concise tool activity summaries (✓ Found employee, ✓ Created task)

## Docker (Full Stack)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/v1
- MongoDB: localhost:27017

## What's Next

Recommended next step: **Human confirmation for destructive actions** — extend the tool framework so delete/terminate/role-change tools require explicit user approval before execution.

Future tasks (not yet implemented):

- Streaming agent responses
- Redis, refresh tokens, token blocklist
- Background jobs, audit logs
- GitHub / external integrations
