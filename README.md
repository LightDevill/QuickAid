# QUICKAID / AntiGravity

> **Production-Ready Healthcare Emergency Response System**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 🏥 Overview

QUICKAID is a real-time emergency healthcare coordination platform that matches patients with hospitals based on bed availability, distance, and medical capabilities.

### Key Features

- 🚨 **Emergency SOS** - One-tap emergency alerts with automatic hospital matching
- 🛏️ **Real-time Bed Tracking** - Live hospital bed availability with 5-minute freshness
- 📍 **Smart Matching** - Distance, ICU, oxygen, and reliability-based scoring
- 🔔 **Real-time Updates** - SSE/WebSocket for instant status changes
- 🔐 **Secure Authentication** - JWT-based auth with OTP verification
- 📊 **Analytics Dashboard** - Hospital performance and booking metrics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Auth    │ │  Core    │ │ Workflow │ │  Notify  │ │Analytics│ │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │            │            │            │           │      │
├───────┴────────────┴────────────┴────────────┴───────────┴──────┤
│                   PostgreSQL + Redis                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)

### Local Development

```bash
# Clone and install
git clone https://github.com/quickaid/quickaid.git
cd quickaid

# Start infrastructure
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Start development server (monolith mode)
npm run dev

# Or start microservices
npm run dev:services
```

### Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

## 📁 Project Structure

```
/QUICKAID
├── /backend
│   ├── /services           # Microservices
│   │   ├── auth-service    # Authentication & JWT
│   │   ├── core-service    # Hospitals, beds, doctors
│   │   ├── workflow-service # Bookings state machine
│   │   ├── notification-service # SMS, Push, WebSocket
│   │   └── analytics-service # Metrics & reporting
│   ├── /shared             # Common libraries
│   ├── /gateway            # API Gateway
│   └── /config             # Environment configs
├── /frontend
│   ├── /web                # Next.js web app
│   └── /mobile             # React Native app
├── /database
│   └── /migrations         # SQL migrations
├── /infra
│   ├── /terraform          # Cloud IaC
│   ├── /kubernetes         # K8s manifests
│   └── /monitoring         # Prometheus, Grafana
├── /scripts                # Automation scripts
├── /tests                  # Integration tests
├── /src                    # Legacy monolith (preserved)
└── /docs                   # Documentation
```

## 🔌 API Endpoints

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Auth | `/v1/identity/otp/send` | POST | Send OTP |
| Auth | `/v1/identity/otp/verify` | POST | Verify OTP, get JWT |
| Core | `/v1/hospitals/search` | GET | Search hospitals |
| Core | `/v1/hospital/updateBeds` | POST | Update inventory |
| Workflow | `/v1/bookings` | POST | Create booking |
| Workflow | `/v1/bookings/{id}` | GET | Get booking status |
| Workflow | `/v1/emergency/sos` | POST | Emergency SOS |
| Realtime | `/v1/realtime/booking/{id}/events` | SSE | Live updates |

## 🔐 Security

- **Authentication**: JWT (RS256) with 15min access / 7d refresh tokens
- **Authorization**: RBAC (citizen, hospital_admin, doctor, ambulance_partner, quickaid_admin)
- **Rate Limiting**: 5 OTP/min, 100 API/min per IP
- **Audit Logging**: All mutations logged with SHA-256 hashes
- **HMAC Signatures**: Ambulance alerts require cryptographic verification

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📦 Deployment

```bash
# Build Docker images
docker-compose build

# Deploy to Kubernetes
kubectl apply -f infra/kubernetes/

# Run database migrations
npm run db:migrate:prod
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.
