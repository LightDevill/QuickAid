# QUICKAID API Documentation

## Overview

QUICKAID is a healthcare emergency response API for managing hospital bed bookings, emergency SOS cases, and real-time updates.

**Base URL**: `https://api.quickaid.example.com` (or `http://localhost:8080` for local development)

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Roles

| Role | Description |
|------|-------------|
| `citizen` | Regular users who can book beds and create SOS |
| `hospital_admin` | Hospital staff who can approve/reject bookings |
| `doctor` | Doctors who can be assigned to emergency cases |
| `ambulance_partner` | Partners who receive ambulance alerts |
| `quickaid_admin` | Admin with full access |

---

## Endpoints

### Identity / Auth

#### Send OTP

```http
POST /v1/identity/otp/send
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response (200)**:
```json
{
  "request_id": "OTP-ABCD1234",
  "ttl_sec": 180,
  "message": "OTP sent successfully"
}
```

#### Verify OTP

```http
POST /v1/identity/otp/verify
Content-Type: application/json

{
  "request_id": "OTP-ABCD1234",
  "otp": "123456",
  "aadhaar_number": "123412341234"  // Optional
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "user_id": "USR-ABCD1234",
    "phone": "+919876543210",
    "role": "citizen"
  }
}
```

---

### Hospitals

#### Search Hospitals

```http
GET /v1/hospitals/search?lat=19.0760&lng=72.8777&bed_type=general&radius_km=50
```

**Response (200)**:
```json
[
  {
    "hospital_id": "HSP-COOPER",
    "name": "Cooper Hospital",
    "distance_km": 2.34,
    "bed_available": 15,
    "freshness_state": "verified",
    "icu": true,
    "oxygen": true,
    "score": 0.8567
  }
]
```

#### Update Bed Inventory (Admin)

```http
POST /v1/hospital/updateBeds
Authorization: Bearer <token>
Content-Type: application/json

{
  "hospital_id": "HSP-COOPER",
  "updates": [
    { "category": "general", "available": 25 },
    { "category": "icu", "available": 5 }
  ]
}
```

---

### Bookings

#### Create Booking

```http
POST /v1/bookings
Authorization: Bearer <token>
Idempotency-Key: unique-request-id
Content-Type: application/json

{
  "hospital_id": "HSP-COOPER",
  "bed_type": "general"
}
```

**Response (201)**:
```json
{
  "booking_id": "QK-ABCD1234",
  "status": "pending",
  "lock_expires_at": "2026-02-09T08:30:00Z",
  "qr_token": "abc123...",
  "websocket_url": "/v1/realtime/booking/QK-ABCD1234/events"
}
```

#### Get Booking Status

```http
GET /v1/bookings/{booking_id}
Authorization: Bearer <token>
```

#### Approve Booking (Admin)

```http
POST /v1/bookings/{booking_id}/approve
Authorization: Bearer <token>
```

#### Reject Booking (Admin)

```http
POST /v1/bookings/{booking_id}/reject
Authorization: Bearer <token>
```

---

### Emergency

#### Create SOS

```http
POST /v1/emergency/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "severity": "high",
  "symptoms": ["chest pain", "difficulty breathing"],
  "location": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}
```

**Response (200)**:
```json
{
  "emergency_case_id": "EMR-ABCD1234",
  "candidates": [
    {
      "hospital_id": "HSP-COOPER",
      "name": "Cooper Hospital",
      "distance_km": 2.34,
      "bed_available": 15,
      "score": 0.8567
    }
  ],
  "websocket_url": "/v1/realtime/booking/EMR-ABCD1234/events"
}
```

---

### Real-time Events (SSE)

```http
GET /v1/realtime/booking/{id}/events
```

**Event Stream**:
```
event: init
data: {"booking_id":"QK-ABCD1234","status":"connected"}

event: update
data: {"type":"approved","booking_id":"QK-ABCD1234"}
```

---

### Analytics

#### Dashboard

```http
GET /v1/analytics/dashboard
```

**Response (200)**:
```json
{
  "hospitals": { "total": 4 },
  "beds": {
    "total": 200,
    "available": 150,
    "utilization_percent": 25.0
  },
  "bookings_today": {
    "total": 50,
    "approved": 40,
    "pending": 5
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `E_AUTH_REQUIRED` | Authentication required |
| `E_TOKEN_INVALID` | Invalid or expired token |
| `E_FORBIDDEN` | Insufficient permissions |
| `E_RATE_LIMIT` | Rate limit exceeded |
| `E_IDEMPOTENCY_REQUIRED` | Idempotency-Key header required |
| `E_HOSPITAL_NOT_FOUND` | Hospital not found |
| `E_NO_BEDS` | No beds available |
| `E_FRESHNESS_STALE` | Hospital inventory is stale |
| `E_BOOKING_NOT_FOUND` | Booking not found |
