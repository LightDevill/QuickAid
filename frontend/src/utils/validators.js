// Validate phone number (Indian format)
export const validatePhone = (phone) => {
    if (!phone) return false;

    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid 10-digit Indian number
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }

    // Check if it's a valid 12-digit number with country code
    if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }

    return false;
};

// Validate OTP
export const validateOTP = (otp) => {
    if (!otp) return false;

    // Check if it's a 4-digit number
    return /^\d{4}$/.test(otp);
};

// Validate booking data
export const validateBookingData = (data) => {
    const errors = {};

    if (!data.patient_name || data.patient_name.trim().length < 2) {
        errors.patient_name = 'Patient name must be at least 2 characters';
    }

    if (!data.age || data.age < 0 || data.age > 150) {
        errors.age = 'Please enter a valid age';
    }

    if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
        errors.gender = 'Please select a gender';
    }

    if (!data.emergency_contact || !validatePhone(data.emergency_contact)) {
        errors.emergency_contact = 'Please enter a valid phone number';
    }

    if (!data.bed_type) {
        errors.bed_type = 'Please select a bed type';
    }

    if (!data.hospital_id) {
        errors.hospital_id = 'Hospital is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

// Validate location coordinates
export const validateLocation = (lat, lng) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
        return false;
    }

    // Check if coordinates are within valid ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }

    return true;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
    if (!input) return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
