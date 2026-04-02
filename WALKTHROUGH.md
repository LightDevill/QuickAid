# 🏥 QUICKAID — Complete Setup & Walkthrough Guide

> **A step-by-step guide to run the QUICKAID Healthcare Emergency Response System on your local machine.**

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Folder Structure Explanation](#-folder-structure-explanation)
4. [System Requirements](#-system-requirements)
5. [Prerequisites to Install](#-prerequisites-to-install)
6. [Installation Steps](#-installation-steps)
7. [Default Localhost URLs](#-default-localhost-urls)
8. [How to Stop the Servers](#-how-to-stop-the-servers)
9. [Troubleshooting](#-troubleshooting)

---

## 🔍 Project Overview

**QUICKAID** is a production-ready, real-time **emergency healthcare coordination platform** that connects patients with hospitals during medical emergencies.

### What It Does

| Feature | Description |
|---------|-------------|
| 🚨 **Emergency SOS** | One-tap emergency alerts with automatic hospital matching |
| 🛏️ **Real-time Bed Tracking** | Live hospital bed availability updated every 5 minutes |
| 📍 **Smart Hospital Matching** | Scoring based on distance, ICU availability, oxygen supply & reliability |
| 🔔 **Real-time Updates** | Instant booking status changes via SSE/WebSocket |
| 🔐 **Secure Auth** | JWT-based authentication with OTP verification |
| 📊 **Analytics Dashboard** | Hospital performance metrics and booking analytics |
| 👨‍⚕️ **Role-Based Access** | Separate views for citizens, hospital admins, doctors & system admins |

### Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                              │
│                    http://localhost:5173                              │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ REST API / WebSocket
┌────────────────────────────▼─────────────────────────────────────────┐
│                    Express.js Backend Server                          │
│                    http://localhost:8080                              │
├────────────┬────────────┬────────────┬─────────────┬─────────────────┤
│  Auth      │  Core      │  Workflow  │  Notify     │  Analytics      │
│  Service   │  Service   │  Service   │  Service    │  Service        │
│  :3001     │  :3002     │  :3003     │  :3004      │  :3005          │
├────────────┴────────────┴────────────┴─────────────┴─────────────────┤
│              PostgreSQL (5432)    +    Redis (6379)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI component library |
| Vite | 8.0.0-beta | Build tool & dev server |
| Tailwind CSS | 4.1.18 | Utility-first CSS framework |
| Zustand | 5.0.11 | Global state management |
| React Router DOM | 7.13.0 | Client-side routing |
| Axios | 1.13.5 | HTTP client for API calls |
| Framer Motion | 12.34.0 | Animations & transitions |
| Recharts | 3.7.0 | Data visualization charts |
| Lucide React | 0.563.0 | Icon library |
| React Hook Form | 7.71.1 | Form handling & validation |
| React Hot Toast | 2.6.0 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥ 20.0.0 | JavaScript runtime |
| Express.js | 4.18.2 | Web framework |
| PostgreSQL | 16+ | Primary relational database |
| Redis | 7+ | Caching & session store |
| JSON Web Tokens | 9.0.2 | Authentication tokens |
| Joi | 17.12.1 | Request validation |
| Bcrypt | 5.1.1 | Password hashing |
| Winston | 3.11.0 | Logging |
| WebSocket (ws) | 8.16.0 | Real-time communication |
| Helmet | 7.1.0 | Security headers |
| Express Rate Limit | 7.1.5 | API rate limiting |

### DevOps & Tooling

| Technology | Purpose |
|------------|---------|
| Docker & Docker Compose | Containerized services |
| Nodemon | Auto-restart in development |
| Jest + Supertest | Testing framework |
| ESLint | Code linting |
| Concurrently | Run multiple services simultaneously |

---

## 📁 Folder Structure Explanation

```
QUICKAID/
│
├── 📄 .env.example             # Template for root environment variables
├── 📄 docker-compose.yml       # Docker orchestration for all services
├── 📄 package.json             # Root package — scripts for monolith/microservices mode
├── 📄 start.ps1                # PowerShell script to auto-start everything (Windows)
│
├── 📂 frontend/                # ⚛️ React Frontend Application
│   ├── 📄 .env                 # Frontend environment variables (API URLs)
│   ├── 📄 index.html           # Entry HTML file
│   ├── 📄 vite.config.js       # Vite configuration
│   ├── 📄 tailwind.config.js   # Tailwind CSS configuration
│   ├── 📄 package.json         # Frontend dependencies & scripts
│   └── 📂 src/
│       ├── 📄 App.jsx          # Root React component with routing
│       ├── 📄 main.jsx         # React entry point
│       ├── 📂 api/             # Axios API service modules (8 files)
│       ├── 📂 components/      # Reusable UI components (15 files)
│       ├── 📂 pages/           # Page-level components (11 files)
│       ├── 📂 hooks/           # Custom React hooks (5 files)
│       ├── 📂 stores/          # Zustand state stores (4 files)
│       ├── 📂 utils/           # Helper utilities (3 files)
│       └── 📂 assets/          # Static assets (images, icons)
│
├── 📂 backend/                 # 🖥️ Express.js Backend Server
│   ├── 📄 .env                 # Backend environment variables
│   ├── 📄 server.js            # Main server entry point (monolith mode)
│   ├── 📄 package.json         # Backend dependencies & scripts
│   ├── 📂 src/
│   │   ├── 📂 config/          # Database, logger, environment configs
│   │   ├── 📂 controllers/     # Route handler logic (5 controllers)
│   │   ├── 📂 routes/          # API route definitions (6 route files)
│   │   ├── 📂 models/          # Database models (5 models)
│   │   ├── 📂 services/        # Business logic services (5 services)
│   │   ├── 📂 middleware/      # Auth, rate limiting, error handling (5 files)
│   │   ├── 📂 validations/     # Joi request validation schemas (4 files)
│   │   ├── 📂 utils/           # Error classes, helpers (3 files)
│   │   └── 📂 websocket/       # WebSocket server setup
│   ├── 📂 services/            # Microservices (optional, for scaled deployments)
│   │   ├── 📂 auth-service/    # Authentication & JWT management
│   │   ├── 📂 core-service/    # Hospitals, beds, doctors
│   │   ├── 📂 workflow-service/# Bookings state machine
│   │   ├── 📂 notification-service/ # SMS, Push, WebSocket notifications
│   │   └── 📂 analytics-service/   # Metrics & reporting
│   ├── 📂 gateway/             # API Gateway (routes traffic to microservices)
│   ├── 📂 shared/              # Shared utilities across services
│   └── 📂 database/            # Database migration & seed files
│
├── 📂 database/
│   └── 📂 migrations/          # SQL migration files (schema setup)
│       └── 📄 001_initial_schema.sql
│
├── 📂 data/                    # Seed data for development
├── 📂 scripts/                 # Automation scripts (migrations, etc.)
├── 📂 tests/                   # Integration & E2E tests
├── 📂 infra/                   # Infrastructure (Terraform, Kubernetes)
├── 📂 docs/                    # Project documentation
├── 📂 modules/                 # Shared modules
└── 📂 src/                     # Legacy monolith entry (preserved)
```

---

## 💻 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| **RAM** | 4 GB | 8 GB+ |
| **Disk Space** | 2 GB free | 5 GB+ free |
| **CPU** | Dual Core | Quad Core |
| **Internet** | Required for initial setup | Required for initial setup |

---

## 📦 Prerequisites to Install

Install the following software **before** setting up the project:

### 1. Node.js (v20 or higher)

| Platform | Installation |
|----------|-------------|
| **Windows** | Download from [nodejs.org](https://nodejs.org/) (LTS recommended) |
| **macOS** | `brew install node@20` |
| **Linux** | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt-get install -y nodejs` |

Verify installation:
```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show 10.x.x or higher
```

### 2. Git

| Platform | Installation |
|----------|-------------|
| **Windows** | Download from [git-scm.com](https://git-scm.com/download/win) |
| **macOS** | `brew install git` |
| **Linux** | `sudo apt-get install git` |

Verify:
```bash
git --version
```

### 3. PostgreSQL 16+

| Platform | Installation |
|----------|-------------|
| **Windows** | Download from [postgresql.org](https://www.postgresql.org/download/windows/) |
| **macOS** | `brew install postgresql@16` |
| **Linux** | `sudo apt-get install postgresql-16` |

> **💡 Tip:** You can skip installing PostgreSQL locally if you use **Docker** (see Option B below).

### 4. Docker & Docker Compose (Recommended)

| Platform | Installation |
|----------|-------------|
| **Windows** | Download [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **macOS** | Download [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Linux** | Follow [Docker Engine install guide](https://docs.docker.com/engine/install/) |

Verify:
```bash
docker --version
docker compose version
```

> **📝 Note:** Docker is the **easiest way** to run PostgreSQL and Redis without manual installation.

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

**Windows (PowerShell):**
```powershell
git clone https://github.com/quickaid/quickaid.git
cd quickaid
```

**Linux / macOS (bash):**
```bash
git clone https://github.com/quickaid/quickaid.git
cd quickaid
```

---

### Step 2: Install Backend Dependencies

**Windows (PowerShell):**
```powershell
cd backend
npm install
cd ..
```

**Linux / macOS (bash):**
```bash
cd backend
npm install
cd ..
```

---

### Step 3: Install Frontend Dependencies

**Windows (PowerShell):**
```powershell
cd frontend
npm install
cd ..
```

**Linux / macOS (bash):**
```bash
cd frontend
npm install
cd ..
```

---

### Step 4: Install Root Dependencies (Optional — for microservices mode)

**Both platforms:**
```bash
npm install
```

---

### Step 5: Set Up Environment Variables

The project already includes `.env` files with development defaults. Verify them:

#### Backend `.env` — `backend/.env`

```env
PORT=8080
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quickaid

# Cache (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGIN=http://localhost:5173

# External Services (Placeholders)
SMS_API_KEY=mock_sms_key
MAPS_API_KEY=mock_maps_key
```

> **⚠️ Important:** Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` before deploying to production!

#### Frontend `.env` — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:3004
VITE_SSE_URL=http://localhost:3004
VITE_MOCK_MODE=true
```

> **💡 Tip:** Set `VITE_MOCK_MODE=false` when you have the backend running to use real API data.

---

### Step 6: Set Up the Database

You have **two options** to run PostgreSQL and Redis:

#### Option A: Using Docker (Recommended ✅)

This is the easiest approach — no need to install PostgreSQL or Redis manually.

**Windows (PowerShell):**
```powershell
# Start PostgreSQL and Redis containers
docker run -d --name quickaid-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quickaid postgres:16-alpine

docker run -d --name quickaid-redis -p 6379:6379 redis:7-alpine
```

**Linux / macOS (bash):**
```bash
# Start PostgreSQL and Redis containers
docker run -d --name quickaid-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quickaid postgres:16-alpine

docker run -d --name quickaid-redis -p 6379:6379 redis:7-alpine
```

**Or use Docker Compose (starts ALL services including microservices):**
```bash
docker-compose up -d postgres redis
```

#### Option B: Using Local PostgreSQL Installation

1. Open your PostgreSQL client (pgAdmin, psql, or terminal):

```sql
CREATE DATABASE quickaid;
```

2. Make sure the credentials in `backend/.env` match your PostgreSQL setup:
   - `DB_USER` = your PostgreSQL username
   - `DB_PASSWORD` = your PostgreSQL password
   - `DB_HOST` = `localhost`
   - `DB_PORT` = `5432`

---

### Step 7: Run Database Migrations

Apply the database schema:

**Windows (PowerShell):**
```powershell
cd backend
npm run migrate
cd ..
```

**Linux / macOS (bash):**
```bash
cd backend
npm run migrate
cd ..
```

> **📝 Note:** If `npm run migrate` doesn't work, you can manually run the SQL migration file:
> ```bash
> psql -U postgres -d quickaid -f database/migrations/001_initial_schema.sql
> ```

---

### Step 8: Seed the Database (Optional)

Populate the database with sample data for development:

**Windows (PowerShell):**
```powershell
cd backend
npm run seed
cd ..
```

**Linux / macOS (bash):**
```bash
cd backend
npm run seed
cd ..
```

---

### Step 9: Start the Backend Server

**Windows (PowerShell):**
```powershell
cd backend
npm run dev
```

**Linux / macOS (bash):**
```bash
cd backend
npm run dev
```

You should see:
```
QUICKAID Server running on port 8080
Environment: development
```

> **💡 Quick Start (Windows Only):** You can also run the `start.ps1` script from the project root, which automatically starts PostgreSQL, Redis, and the backend server:
> ```powershell
> .\start.ps1
> ```

---

### Step 10: Start the Frontend Dev Server

**Open a NEW terminal window**, then:

**Windows (PowerShell):**
```powershell
cd frontend
npm run dev
```

**Linux / macOS (bash):**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v8.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

---

### ✅ Done! Open Your Browser

Navigate to **http://localhost:5173** to see the QUICKAID application.

---

## 🌐 Default Localhost URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [http://localhost:5173](http://localhost:5173) | React application (main UI) |
| **Backend API** | [http://localhost:8080](http://localhost:8080) | Express.js REST API |
| **Health Check** | [http://localhost:8080/health](http://localhost:8080/health) | Backend health status |
| **WebSocket** | `ws://localhost:3004` | Real-time notifications |
| **PostgreSQL** | `localhost:5432` | Database (not browser-accessible) |
| **Redis** | `localhost:6379` | Cache (not browser-accessible) |

### Microservice Ports (Optional — for scaled deployments)

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | `3001` | Authentication & OTP |
| Core Service | `3002` | Hospitals, beds, doctors |
| Workflow Service | `3003` | Booking state machine |
| Notification Service | `3004` | SMS, Push, WebSocket |
| Analytics Service | `3005` | Metrics & reporting |
| API Gateway | `8080` | Routes to microservices |

---

## ⏹️ How to Stop the Servers

### Stop the Frontend

Press `Ctrl + C` in the terminal where the frontend is running.

### Stop the Backend

Press `Ctrl + C` in the terminal where the backend is running.

### Stop Docker Containers

**Windows (PowerShell):**
```powershell
docker stop quickaid-postgres quickaid-redis
```

**Linux / macOS (bash):**
```bash
docker stop quickaid-postgres quickaid-redis
```

### Remove Docker Containers (if needed)

```bash
docker rm quickaid-postgres quickaid-redis
```

### Stop All Docker Compose Services

```bash
docker-compose down
```

### Kill All Node Processes (Nuclear Option — Windows)

```powershell
taskkill /F /IM node.exe
```

### Kill All Node Processes (Nuclear Option — Linux/macOS)

```bash
killall node
```

---

## 🔧 Troubleshooting

### ❌ Error: `ECONNREFUSED 127.0.0.1:5432`

**Problem:** PostgreSQL is not running.

**Fix:**
```powershell
# Windows — Check if Docker container is running
docker ps

# If not running, start it
docker start quickaid-postgres

# Or if using local PostgreSQL, start the Windows service
net start postgresql-x64-16
```

```bash
# Linux/macOS
sudo systemctl start postgresql
# or
docker start quickaid-postgres
```

---

### ❌ Error: `ECONNREFUSED 127.0.0.1:6379`

**Problem:** Redis is not running.

**Fix:**
```bash
docker start quickaid-redis
# or if not created yet:
docker run -d --name quickaid-redis -p 6379:6379 redis:7-alpine
```

> **💡 Note:** If Redis is optional in your setup and you see this error, the backend may still work — check if the code handles Redis connection failures gracefully.

---

### ❌ Error: `Module not found: Cannot find module 'xxx'`

**Problem:** Dependencies not installed.

**Fix:**
```bash
# In the backend folder
cd backend
npm install

# In the frontend folder
cd frontend
npm install
```

---

### ❌ Error: `Port 8080 is already in use`

**Problem:** Another process is using port 8080.

**Fix (Windows PowerShell):**
```powershell
# Find the process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace <PID> with actual Process ID)
taskkill /PID <PID> /F
```

**Fix (Linux/macOS):**
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9
```

---

### ❌ Error: `Port 5173 is already in use`

**Problem:** Another Vite instance is running.

**Fix:** Same as above, but replace `8080` with `5173`.

---

### ❌ Error: `relation "users" does not exist`

**Problem:** Database migrations have not been run.

**Fix:**
```bash
cd backend
npm run migrate
```

Or manually:
```bash
psql -U postgres -d quickaid -f database/migrations/001_initial_schema.sql
```

---

### ❌ Error: `password authentication failed for user "postgres"`

**Problem:** PostgreSQL credentials in `.env` don't match your local setup.

**Fix:** Edit `backend/.env` and update these values to match your PostgreSQL installation:
```env
DB_USER=your_actual_username
DB_PASSWORD=your_actual_password
```

---

### ❌ Error: `CORS policy: blocked by CORS`

**Problem:** Frontend URL doesn't match the `CORS_ORIGIN` in backend `.env`.

**Fix:** Ensure `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:5173
```

---

### ❌ Frontend shows blank page or fetch errors

**Problem:** Backend server is not running, or API URL is misconfigured.

**Fix:**
1. Ensure the backend is running on port `8080`.
2. Check `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```
3. Set `VITE_MOCK_MODE=true` if running without a backend for demo purposes.

---

### ❌ Error: `bcrypt` fails to install on Windows

**Problem:** `bcrypt` requires native compilation tools on Windows.

**Fix:**
```powershell
# Install Windows build tools
npm install -g windows-build-tools

# Or install Visual Studio Build Tools manually from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Then re-install
cd backend
npm install
```

---

### ❌ Docker: `Cannot connect to the Docker daemon`

**Problem:** Docker Desktop is not running.

**Fix:** Open Docker Desktop and wait for it to fully start (check the system tray icon).

---

## 📝 Quick Reference — All Commands

| Action | Command | Directory |
|--------|---------|-----------|
| Install backend deps | `npm install` | `backend/` |
| Install frontend deps | `npm install` | `frontend/` |
| Start backend (dev) | `npm run dev` | `backend/` |
| Start frontend (dev) | `npm run dev` | `frontend/` |
| Run migrations | `npm run migrate` | `backend/` |
| Seed database | `npm run seed` | `backend/` |
| Run tests | `npm test` | `backend/` |
| Start Docker services | `docker-compose up -d postgres redis` | Root |
| Stop Docker services | `docker-compose down` | Root |
| Full auto-start (Windows) | `.\start.ps1` | Root |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the QUICKAID Team**

🏥 *Making emergency healthcare accessible to everyone*

</div>
