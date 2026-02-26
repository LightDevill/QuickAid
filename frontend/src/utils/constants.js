// Bed types
export const BED_TYPES = {
    GENERAL: 'general',
    ICU: 'icu',
    OXYGEN: 'oxygen',
    VENTILATOR: 'ventilator',
    PEDIATRIC: 'pediatric',
    MATERNITY: 'maternity',
};

export const BED_TYPE_LABELS = {
    general: 'General',
    icu: 'ICU',
    oxygen: 'Oxygen',
    ventilator: 'Ventilator',
    pediatric: 'Pediatric',
    maternity: 'Maternity',
};

export const BED_TYPE_ICONS = {
    general: '🛏️',
    icu: '🏥',
    oxygen: '💨',
    ventilator: '🫁',
    pediatric: '👶',
    maternity: '🤰',
};

// Severity levels
export const SEVERITY_LEVELS = {
    CRITICAL: 'critical',
    SERIOUS: 'serious',
    MODERATE: 'moderate',
};

export const SEVERITY_COLORS = {
    critical: 'bg-red-500',
    serious: 'bg-orange-500',
    moderate: 'bg-yellow-500',
};

export const SEVERITY_LABELS = {
    critical: 'Critical',
    serious: 'Serious',
    moderate: 'Moderate',
};

// Booking statuses
export const BOOKING_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CHECKED_IN: 'checked_in',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const STATUS_COLORS = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    expired: 'bg-gray-500',
    checked_in: 'bg-blue-500',
    completed: 'bg-teal-500',
    cancelled: 'bg-gray-400',
};

export const STATUS_TEXT_COLORS = {
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    rejected: 'text-red-600',
    expired: 'text-gray-600',
    checked_in: 'text-blue-600',
    completed: 'text-teal-600',
    cancelled: 'text-gray-500',
};

export const STATUS_BG_LIGHT = {
    pending: 'bg-yellow-100',
    approved: 'bg-green-100',
    rejected: 'bg-red-100',
    expired: 'bg-gray-100',
    checked_in: 'bg-blue-100',
    completed: 'bg-teal-100',
    cancelled: 'bg-gray-100',
};

export const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
    checked_in: 'Checked In',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

// Booking progress steps
export const BOOKING_STEPS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'checked_in', label: 'Checked In' },
    { key: 'completed', label: 'Completed' },
];

// User roles
export const USER_ROLES = {
    CITIZEN: 'citizen',
    HOSPITAL_ADMIN: 'hospital_admin',
    DOCTOR: 'doctor',
    AMBULANCE_PARTNER: 'ambulance_partner',
    QUICKAID_ADMIN: 'quickaid_admin',
};

export const ROLE_LABELS = {
    citizen: 'Citizen',
    hospital_admin: 'Hospital Admin',
    doctor: 'Doctor',
    ambulance_partner: 'Ambulance Partner',
    quickaid_admin: 'QuickAid Admin',
};

// Freshness states
export const FRESHNESS_STATES = {
    VERIFIED: 'verified',
    UNVERIFIED: 'unverified',
    STALE: 'stale',
};

export const FRESHNESS_COLORS = {
    verified: 'text-green-500',
    unverified: 'text-yellow-500',
    stale: 'text-red-500',
};

export const FRESHNESS_BG_COLORS = {
    verified: 'bg-green-100',
    unverified: 'bg-yellow-100',
    stale: 'bg-red-100',
};

export const FRESHNESS_LABELS = {
    verified: 'Verified',
    unverified: 'Unverified',
    stale: 'Stale',
};

export const FRESHNESS_ICONS = {
    verified: '🟢',
    unverified: '🟡',
    stale: '🔴',
};

// Freshness thresholds (milliseconds)
export const FRESHNESS_THRESHOLDS = {
    VERIFIED: 5 * 60 * 1000,     // < 5 minutes
    UNVERIFIED: 10 * 60 * 1000,  // 5-10 minutes
    // > 10 minutes = stale
};

// Common symptoms
export const COMMON_SYMPTOMS = [
    'Chest Pain',
    'Breathing Difficulty',
    'Accident',
    'Burns',
    'Poisoning',
    'Severe Bleeding',
    'Unconscious',
    'Stroke Symptoms',
    'Heart Attack',
    'Seizure',
    'Allergic Reaction',
    'Other',
];

// ============================================
// TIMING CONSTANTS
// ============================================

// Lock window duration (seconds) - THE FIX
export const LOCK_WINDOW_DURATION = 90;
export const BOOKING_LOCK_WINDOW = 90;  // ← THIS WAS MISSING

// OTP settings
export const OTP_LENGTH = 6;
export const OTP_RESEND_TIMEOUT = 30;

// SSE heartbeat interval
export const SSE_HEARTBEAT_INTERVAL = 30000;

// Cache TTL
export const CACHE_TTL = 30000; // 30 seconds

// ============================================
// SEARCH DEFAULTS
// ============================================
export const DEFAULT_SEARCH_RADIUS = 10; // km
export const MIN_SEARCH_RADIUS = 1;
export const MAX_SEARCH_RADIUS = 50;
export const DEFAULT_RESULTS_LIMIT = 20;

// ============================================
// MATCH SCORE THRESHOLDS
// ============================================
export const MATCH_SCORE = {
    EXCELLENT: 80,  // green
    GOOD: 50,       // yellow
    LOW: 0,         // red
};

export const MATCH_SCORE_COLORS = {
    excellent: 'text-green-500',
    good: 'text-yellow-500',
    low: 'text-red-500',
};

// ============================================
// API CONFIGURATION
// ============================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3004';
export const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL || 'http://localhost:3004';

// ============================================
// PAGINATION
// ============================================
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
