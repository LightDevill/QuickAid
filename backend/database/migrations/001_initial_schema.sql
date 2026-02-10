-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    aadhaar_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('citizen', 'hospital_admin', 'doctor', 'ambulance_partner', 'quickaid_admin')),
    hospital_id VARCHAR(50), -- For hospital admins/doctors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SESSIONS TABLE
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. OTP REQUESTS TABLE
CREATE TABLE otp_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    request_id VARCHAR(100) NOT NULL UNIQUE,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HOSPITALS TABLE
CREATE TABLE hospitals (
    id VARCHAR(50) PRIMARY KEY, -- Using string IDs like 'hosp_lilavati_001' for easier reference in seed/mocks
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    rating DECIMAL(2, 1) DEFAULT 0,
    reliability_score INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BED CATEGORIES TABLE
CREATE TABLE bed_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_type VARCHAR(50) NOT NULL CHECK (bed_type IN ('general', 'icu', 'oxygen', 'ventilator', 'pediatric', 'maternity')),
    total INT DEFAULT 0,
    available INT DEFAULT 0,
    reserved INT DEFAULT 0,
    locked INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, bed_type)
);

-- 6. DOCTORS TABLE
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    phone VARCHAR(20),
    on_duty BOOLEAN DEFAULT FALSE,
    shift_start TIME,
    shift_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'checked_in', 'completed', 'cancelled')),
    patient_name VARCHAR(100) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(20),
    emergency_contact VARCHAR(20),
    symptoms TEXT,
    qr_token VARCHAR(255),
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    idempotency_key UUID UNIQUE, -- To prevent double booking
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. EMERGENCY CASES TABLE
CREATE TABLE emergency_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'serious', 'moderate')),
    symptoms TEXT[],
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'active', -- active, resolved
    matched_hospitals JSONB, -- Array of hospital IDs and match info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. DOCTOR REQUESTS TABLE
CREATE TABLE doctor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID REFERENCES emergency_cases(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AMBULANCE PARTNERS TABLE
CREATE TABLE ambulance_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AMBULANCE ALERTS TABLE
CREATE TABLE ambulance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES ambulance_partners(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'alerted', -- alerted, dispatched, arrived, completed
    hmac_signature VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100), -- Can be UUID or String ID
    user_id UUID,
    details_hash VARCHAR(255), -- Integrity check
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- booking_update, emergency_alert, system
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. BOOKING METRICS TABLE (Aggregated)
CREATE TABLE booking_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_date DATE NOT NULL UNIQUE,
    total_bookings INT DEFAULT 0,
    approved INT DEFAULT 0,
    rejected INT DEFAULT 0,
    expired INT DEFAULT 0,
    avg_response_time DECIMAL(10, 2) DEFAULT 0, -- Seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. HOSPITAL PERFORMANCE TABLE (Aggregated)
CREATE TABLE hospital_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    approval_rate DECIMAL(5, 2) DEFAULT 0,
    bed_utilization DECIMAL(5, 2) DEFAULT 0,
    avg_response_time DECIMAL(10, 2) DEFAULT 0,
    UNIQUE(hospital_id, report_date)
);

-- INDEXES
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_hospitals_location ON hospitals(lat, lng);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_hospital ON bookings(hospital_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bed_categories_hospital ON bed_categories(hospital_id);
