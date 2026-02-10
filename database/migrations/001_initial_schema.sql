-- QUICKAID Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-02-09

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- USERS & AUTHENTICATION
------------------------------------------------------------

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name TEXT,
  aadhaar_hash VARCHAR(64),        -- SHA-256 hash of full Aadhaar
  aadhaar_last4 VARCHAR(4),        -- Last 4 digits for display
  role VARCHAR(50) DEFAULT 'citizen',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE,
  role VARCHAR(50) NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_requests (
  request_id VARCHAR(50) PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp_hash VARCHAR(64) NOT NULL,     -- SHA-256 hash of OTP
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- HOSPITALS & INVENTORY
------------------------------------------------------------

CREATE TABLE hospitals (
  hospital_id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  emergency_rating DECIMAL(3, 2),
  reliability_score DECIMAL(3, 2) DEFAULT 0.50,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  last_inventory_update_at TIMESTAMPTZ DEFAULT NOW(),
  surge_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bed_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,  -- general, icu, oxygen, ventilator, pediatric, maternity
  total INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  price_per_day DECIMAL(10, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, category),
  CONSTRAINT valid_counts CHECK (
    available >= 0 AND 
    reserved >= 0 AND 
    locked >= 0 AND 
    available + reserved + locked <= total
  )
);

CREATE TABLE doctors (
  doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  name TEXT NOT NULL,
  specialty VARCHAR(100),
  qualification TEXT,
  license_number VARCHAR(50),
  shift_start TIME,
  shift_end TIME,
  contact VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  is_on_duty BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- BOOKINGS & WORKFLOW
------------------------------------------------------------

CREATE TABLE bookings (
  booking_id VARCHAR(50) PRIMARY KEY,
  citizen_id UUID REFERENCES users(user_id),
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  emergency_case_id VARCHAR(50),
  bed_category VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',  -- pending, approved, rejected, expired, checked_in, completed, cancelled
  lock_expires_at TIMESTAMPTZ,
  qr_token VARCHAR(64),
  idempotency_key VARCHAR(100) UNIQUE,
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_cases (
  emergency_case_id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  severity VARCHAR(20) NOT NULL,  -- critical, high, medium, low
  symptoms JSONB,
  location JSONB NOT NULL,        -- {lat, lng, address, landmark}
  status VARCHAR(30) DEFAULT 'open',  -- open, matched, dispatched, resolved, cancelled
  matched_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  booking_id VARCHAR(50) REFERENCES bookings(booking_id),
  resolved_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE doctor_requests (
  request_id VARCHAR(50) PRIMARY KEY,
  emergency_case_id VARCHAR(50) REFERENCES emergency_cases(emergency_case_id),
  doctor_id UUID REFERENCES doctors(doctor_id),
  status VARCHAR(30) DEFAULT 'pending',  -- pending, assigned, accepted, completed, cancelled
  preferred_specialty VARCHAR(100),
  context TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- AMBULANCE & ALERTS
------------------------------------------------------------

CREATE TABLE ambulance_partners (
  partner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number VARCHAR(50) UNIQUE,
  contact VARCHAR(20),
  vehicle_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ambulance_alerts (
  alert_id VARCHAR(50) PRIMARY KEY,
  booking_id VARCHAR(50) REFERENCES bookings(booking_id),
  emergency_case_id VARCHAR(50) REFERENCES emergency_cases(emergency_case_id),
  partner_id UUID REFERENCES ambulance_partners(partner_id),
  severity VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'sent',  -- sent, acknowledged, dispatched, arrived, completed
  pickup_location JSONB,
  destination_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  eta_seconds INTEGER,
  signature_hash VARCHAR(64),
  acknowledged_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- AUDIT & EVENTS
------------------------------------------------------------

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(user_id),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  before_hash VARCHAR(64),
  after_hash VARCHAR(64),
  metadata JSONB,
  trace_id VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  timestamp_utc TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id VARCHAR(100),
  entity_type VARCHAR(50),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  type VARCHAR(50) NOT NULL,  -- sms, push, email, websocket
  channel VARCHAR(50),
  template VARCHAR(100),
  content TEXT,
  metadata JSONB,
  status VARCHAR(30) DEFAULT 'pending',  -- pending, sent, delivered, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- ANALYTICS
------------------------------------------------------------

CREATE TABLE booking_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  total_bookings INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  expired_count INTEGER DEFAULT 0,
  avg_approval_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, hospital_id)
);

CREATE TABLE hospital_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
  date DATE NOT NULL,
  avg_response_time_seconds INTEGER,
  bed_utilization_percent DECIMAL(5, 2),
  patient_satisfaction_score DECIMAL(3, 2),
  emergency_cases_handled INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, hospital_id)
);

------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
------------------------------------------------------------

-- Users & Sessions
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_otp_phone ON otp_requests(phone);
CREATE INDEX idx_otp_expires ON otp_requests(expires_at);

-- Hospitals & Beds
CREATE INDEX idx_hospitals_location ON hospitals USING gist (
  ll_to_earth(lat::float8, lng::float8)
);
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_bed_categories_hospital ON bed_categories(hospital_id);
CREATE INDEX idx_bed_categories_available ON bed_categories(hospital_id, category) WHERE available > 0;
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_on_duty ON doctors(hospital_id) WHERE is_on_duty = TRUE;

-- Bookings
CREATE INDEX idx_bookings_hospital ON bookings(hospital_id);
CREATE INDEX idx_bookings_citizen ON bookings(citizen_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_bookings_pending ON bookings(hospital_id) WHERE status = 'pending';

-- Emergency
CREATE INDEX idx_emergency_status ON emergency_cases(status);
CREATE INDEX idx_emergency_user ON emergency_cases(user_id);
CREATE INDEX idx_emergency_created ON emergency_cases(created_at DESC);

-- Audit
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp_utc DESC);
CREATE INDEX idx_events_entity ON system_events(entity_type, entity_id);
CREATE INDEX idx_events_unprocessed ON system_events(created_at) WHERE processed = FALSE;

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_pending ON notifications(created_at) WHERE status = 'pending';

-- Analytics
CREATE INDEX idx_booking_metrics_date ON booking_metrics(date DESC);
CREATE INDEX idx_hospital_performance_date ON hospital_performance(date DESC);

------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
------------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bed_categories_updated_at
  BEFORE UPDATE ON bed_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check bed availability atomically
CREATE OR REPLACE FUNCTION lock_bed(
  p_hospital_id VARCHAR(50),
  p_category VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT available INTO v_available
  FROM bed_categories
  WHERE hospital_id = p_hospital_id AND category = p_category
  FOR UPDATE;
  
  IF v_available > 0 THEN
    UPDATE bed_categories
    SET available = available - 1, locked = locked + 1
    WHERE hospital_id = p_hospital_id AND category = p_category;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to release locked bed
CREATE OR REPLACE FUNCTION release_bed(
  p_hospital_id VARCHAR(50),
  p_category VARCHAR(50),
  p_to_reserved BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  IF p_to_reserved THEN
    UPDATE bed_categories
    SET locked = GREATEST(0, locked - 1), reserved = reserved + 1
    WHERE hospital_id = p_hospital_id AND category = p_category;
  ELSE
    UPDATE bed_categories
    SET locked = GREATEST(0, locked - 1), available = available + 1
    WHERE hospital_id = p_hospital_id AND category = p_category;
  END IF;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- INITIAL SEED DATA (Development Only)
------------------------------------------------------------

-- Insert default admin user
INSERT INTO users (user_id, phone, name, role, is_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '+911234567890',
  'System Admin',
  'quickaid_admin',
  TRUE
) ON CONFLICT (phone) DO NOTHING;

-- Seed hospitals (from existing seed.js)
INSERT INTO hospitals (hospital_id, name, address, city, lat, lng, emergency_rating, reliability_score, is_verified, verified_at)
VALUES
  ('HSP-MILLAT', 'Millat Hospital', 'Andheri East', 'Mumbai', 19.0733, 72.8611, 4.1, 0.72, TRUE, NOW()),
  ('HSP-LIFELINE', 'Life Line Hospital', 'Thane', 'Mumbai', 19.2012, 72.8423, 4.3, 0.75, TRUE, NOW()),
  ('HSP-COOPER', 'Cooper Hospital', 'Vile Parle', 'Mumbai', 19.1044, 72.8397, 4.5, 0.82, TRUE, NOW()),
  ('HSP-SABOO', 'Saboo Siddik Hospital', 'Fort', 'Mumbai', 18.9678, 72.8334, 4.0, 0.70, TRUE, NOW())
ON CONFLICT (hospital_id) DO NOTHING;

-- Seed bed categories
INSERT INTO bed_categories (hospital_id, category, total, available, reserved, locked, price_per_day)
SELECT h.hospital_id, c.category, c.total, c.available, c.reserved, 0, c.price
FROM hospitals h
CROSS JOIN (
  VALUES 
    ('general', 40, 30, 5, 500.00),
    ('icu', 12, 7, 3, 2500.00),
    ('oxygen', 20, 12, 6, 1500.00),
    ('ventilator', 6, 3, 2, 5000.00)
) AS c(category, total, available, reserved, price)
ON CONFLICT (hospital_id, category) DO NOTHING;

-- Seed doctors
INSERT INTO doctors (hospital_id, name, specialty, shift_start, shift_end, contact, is_on_duty)
VALUES
  ('HSP-COOPER', 'Dr. Amit Sharma', 'ER/Trauma', '08:00', '20:00', '+91-9876543210', TRUE),
  ('HSP-COOPER', 'Dr. Priya Gupta', 'General Physician', '08:00', '20:00', '+91-9876543211', TRUE),
  ('HSP-COOPER', 'Dr. Raj Rao', 'Telemedicine/Triage', '08:00', '20:00', '+91-9876543212', TRUE),
  ('HSP-MILLAT', 'Dr. Sarah Khan', 'Cardiology', '08:00', '20:00', '+91-9876543213', TRUE),
  ('HSP-LIFELINE', 'Dr. Vikram Singh', 'Pediatrics', '08:00', '20:00', '+91-9876543214', TRUE)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE users IS 'Stores all system users including citizens, doctors, and admins';
COMMENT ON TABLE hospitals IS 'Registered hospitals with location and verification status';
COMMENT ON TABLE bed_categories IS 'Real-time bed inventory per hospital and category';
COMMENT ON TABLE bookings IS 'Bed booking requests with lifecycle status';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all data mutations';
