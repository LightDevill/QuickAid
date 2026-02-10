// src/api/mockData.js
// Realistic Indian healthcare data for frontend development and testing without backend.

// ============================================
// MOCK USERS
// ============================================

export const mockUser = {
    user_id: 'usr_citizen_001',
    phone: '+919876543210',
    name: 'Sufiyan Qazi',
    role: 'citizen',
    aadhaar_hash: 'sha256_dummy_hash_for_aadhaar_xxxx_xxxx_1234',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockHospitalAdmin = {
    user_id: 'usr_hosp_admin_001',
    phone: '+919876543211',
    name: 'Dr. Priya Patel',
    role: 'hospital_admin',
    hospital_id: 'hosp_lilavati_001',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockQuickAidAdmin = {
    user_id: 'usr_super_admin_001',
    phone: '+919876543212',
    name: 'Admin User',
    role: 'quickaid_admin',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

// ============================================
// MOCK HOSPITALS (Mumbai Area — 8 Hospitals)
// ============================================

export const mockHospitals = [
    {
        id: 'hosp_lilavati_001',
        hospital_id: 'hosp_lilavati_001',
        name: 'Lilavati Hospital & Research Centre',
        address: 'A-791, Bandra Reclamation, Bandra West, Mumbai 400050',
        lat: 19.0509,
        lng: 72.8283,
        phone: '+912226568000',
        email: 'info@lilavatihospital.com',
        rating: 4.5,
        reliability_score: 92,
        is_active: true,
        distance_km: 2.5,
        score: 0.92,
        match_score: 92,
        updated_at: new Date().toISOString(),
        beds: [
            { bed_type: 'general', total: 50, available: 32, reserved: 3, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 20, available: 8, reserved: 2, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 15, available: 10, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 10, available: 4, reserved: 1, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 12, available: 7, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 15, available: 9, reserved: 2, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_001', name: 'Dr. Anil Kapoor', specialty: 'Emergency Medicine', phone: '+919900110001', on_duty: true },
            { id: 'doc_002', name: 'Dr. Sneha Reddy', specialty: 'Cardiology', phone: '+919900110002', on_duty: true },
            { id: 'doc_003', name: 'Dr. Rajesh Iyer', specialty: 'Critical Care', phone: '+919900110003', on_duty: false },
        ]
    },
    {
        id: 'hosp_kokilaben_002',
        hospital_id: 'hosp_kokilaben_002',
        name: 'Kokilaben Dhirubhai Ambani Hospital',
        address: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai 400053',
        lat: 19.1310,
        lng: 72.8265,
        phone: '+912230999999',
        email: 'info@kokilabenhospital.com',
        rating: 4.7,
        reliability_score: 95,
        is_active: true,
        distance_km: 8.1,
        score: 0.88,
        match_score: 88,
        updated_at: new Date().toISOString(),
        beds: [
            { bed_type: 'general', total: 60, available: 40, reserved: 4, locked: 2, price: 5000 },
            { bed_type: 'icu', total: 25, available: 12, reserved: 3, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 20, available: 15, reserved: 2, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 15, available: 7, reserved: 1, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 10, available: 5, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 18, available: 11, reserved: 2, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_004', name: 'Dr. Meera Shah', specialty: 'Emergency Medicine', phone: '+919900220001', on_duty: true },
            { id: 'doc_005', name: 'Dr. Vikram Desai', specialty: 'Pulmonology', phone: '+919900220002', on_duty: true },
            { id: 'doc_006', name: 'Dr. Fatima Khan', specialty: 'Pediatrics', phone: '+919900220003', on_duty: true },
        ]
    },
    {
        id: 'hosp_hinduja_003',
        hospital_id: 'hosp_hinduja_003',
        name: 'P.D. Hinduja National Hospital',
        address: 'Veer Savarkar Marg, Mahim, Mumbai 400016',
        lat: 19.0380,
        lng: 72.8397,
        phone: '+912224451515',
        email: 'info@hindujahospital.com',
        rating: 4.4,
        reliability_score: 88,
        is_active: true,
        distance_km: 4.2,
        score: 0.85,
        match_score: 85,
        updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
        beds: [
            { bed_type: 'general', total: 45, available: 28, reserved: 3, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 18, available: 6, reserved: 2, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 12, available: 8, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 8, available: 3, reserved: 1, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 8, available: 4, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 12, available: 7, reserved: 2, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_007', name: 'Dr. Suresh Menon', specialty: 'Cardiology', phone: '+919900330001', on_duty: true },
            { id: 'doc_008', name: 'Dr. Priya Nair', specialty: 'Neurology', phone: '+919900330002', on_duty: false },
        ]
    },
    {
        id: 'hosp_breach_candy_004',
        hospital_id: 'hosp_breach_candy_004',
        name: 'Breach Candy Hospital',
        address: '60A, Bhulabhai Desai Rd, Breach Candy, Mumbai 400026',
        lat: 18.9716,
        lng: 72.8051,
        phone: '+912223667788',
        email: 'info@breachcandyhospital.com',
        rating: 4.3,
        reliability_score: 85,
        is_active: true,
        distance_km: 12.5,
        score: 0.75,
        match_score: 75,
        updated_at: new Date().toISOString(),
        beds: [
            { bed_type: 'general', total: 40, available: 22, reserved: 2, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 15, available: 5, reserved: 1, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 10, available: 6, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 6, available: 2, reserved: 0, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 6, available: 3, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 10, available: 5, reserved: 1, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_009', name: 'Dr. Arjun Malhotra', specialty: 'Emergency Medicine', phone: '+919900440001', on_duty: true },
            { id: 'doc_010', name: 'Dr. Kavita Rao', specialty: 'Obstetrics', phone: '+919900440002', on_duty: true },
        ]
    },
    {
        id: 'hosp_nanavati_005',
        hospital_id: 'hosp_nanavati_005',
        name: 'Nanavati Max Super Speciality Hospital',
        address: 'S.V. Road, Vile Parle West, Mumbai 400056',
        lat: 19.0896,
        lng: 72.8382,
        phone: '+912226267500',
        email: 'info@nanavatihospital.com',
        rating: 4.6,
        reliability_score: 91,
        is_active: true,
        distance_km: 5.8,
        score: 0.82,
        match_score: 82,
        updated_at: new Date().toISOString(),
        beds: [
            { bed_type: 'general', total: 55, available: 35, reserved: 3, locked: 2, price: 5000 },
            { bed_type: 'icu', total: 22, available: 10, reserved: 2, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 18, available: 12, reserved: 2, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 12, available: 5, reserved: 1, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 10, available: 6, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 14, available: 8, reserved: 2, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_011', name: 'Dr. Ramesh Gupta', specialty: 'Critical Care', phone: '+919900550001', on_duty: true },
            { id: 'doc_012', name: 'Dr. Anjali Sharma', specialty: 'Pediatrics', phone: '+919900550002', on_duty: true },
            { id: 'doc_013', name: 'Dr. Karan Singh', specialty: 'Emergency Medicine', phone: '+919900550003', on_duty: false },
        ]
    },
    {
        id: 'hosp_jaslok_006',
        hospital_id: 'hosp_jaslok_006',
        name: 'Jaslok Hospital & Research Centre',
        address: '15, Dr. Deshmukh Marg, Pedder Road, Mumbai 400026',
        lat: 18.9716,
        lng: 72.8088,
        phone: '+912226573333',
        email: 'info@jaslokhospital.com',
        rating: 4.4,
        reliability_score: 87,
        is_active: true,
        distance_km: 11.2,
        score: 0.78,
        match_score: 78,
        updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
        beds: [
            { bed_type: 'general', total: 42, available: 25, reserved: 3, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 16, available: 7, reserved: 2, locked: 0, price: 15000 },
            { bed_type: 'oxygen', total: 11, available: 7, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 7, available: 3, reserved: 1, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 7, available: 4, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 11, available: 6, reserved: 1, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_014', name: 'Dr. Deepika Joshi', specialty: 'Cardiology', phone: '+919900660001', on_duty: true },
            { id: 'doc_015', name: 'Dr. Amit Patel', specialty: 'Pulmonology', phone: '+919900660002', on_duty: true },
        ]
    },
    {
        id: 'hosp_seven_hills_007',
        hospital_id: 'hosp_seven_hills_007',
        name: 'SevenHills Hospital',
        address: 'Marol Maroshi Road, Andheri East, Mumbai 400059',
        lat: 19.1197,
        lng: 72.8762,
        phone: '+912267676767',
        email: 'info@sevenhillshospital.com',
        rating: 4.2,
        reliability_score: 83,
        is_active: true,
        distance_km: 9.5,
        score: 0.72,
        match_score: 72,
        updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
        beds: [
            { bed_type: 'general', total: 48, available: 30, reserved: 3, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 14, available: 5, reserved: 1, locked: 1, price: 15000 },
            { bed_type: 'oxygen', total: 10, available: 5, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 6, available: 2, reserved: 0, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 8, available: 5, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 10, available: 6, reserved: 1, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_016', name: 'Dr. Neha Kulkarni', specialty: 'Emergency Medicine', phone: '+919900770001', on_duty: true },
            { id: 'doc_017', name: 'Dr. Rohit Verma', specialty: 'Neurology', phone: '+919900770002', on_duty: true },
        ]
    },
    {
        id: 'hosp_holy_spirit_008',
        hospital_id: 'hosp_holy_spirit_008',
        name: 'Holy Spirit Hospital',
        address: 'Mahakali Caves Road, Andheri East, Mumbai 400093',
        lat: 19.1120,
        lng: 72.8680,
        phone: '+912228242424',
        email: 'info@holyspirithospital.com',
        rating: 4.1,
        reliability_score: 80,
        is_active: true,
        distance_km: 10.3,
        score: 0.68,
        match_score: 68,
        updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
        beds: [
            { bed_type: 'general', total: 35, available: 20, reserved: 2, locked: 1, price: 5000 },
            { bed_type: 'icu', total: 10, available: 4, reserved: 1, locked: 0, price: 15000 },
            { bed_type: 'oxygen', total: 8, available: 4, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'ventilator', total: 5, available: 2, reserved: 0, locked: 0, price: 20000 },
            { bed_type: 'pediatric', total: 5, available: 3, reserved: 1, locked: 0, price: 5000 },
            { bed_type: 'maternity', total: 8, available: 4, reserved: 1, locked: 0, price: 5000 },
        ],
        doctors: [
            { id: 'doc_018', name: 'Dr. Sarah Thomas', specialty: 'Pediatrics', phone: '+919900880001', on_duty: true },
            { id: 'doc_019', name: 'Dr. Joseph Fernandes', specialty: 'Critical Care', phone: '+919900880002', on_duty: false },
        ]
    },
];

// ============================================
// MOCK AMBULANCE PARTNERS
// ============================================

export const mockAmbulances = [
    {
        id: 'amb_001',
        name: 'QuickAid Ambulance Service',
        phone: '+919800001111',
        vehicle_number: 'MH-01-AB-1234',
        type: 'Advanced Life Support',
        is_active: true,
        lat: 19.0520,
        lng: 72.8290,
        distance_km: 1.2,
        eta_minutes: 4,
        status: 'available',
    },
    {
        id: 'amb_002',
        name: 'Mumbai Emergency Response',
        phone: '+919800002222',
        vehicle_number: 'MH-01-CD-5678',
        type: 'Basic Life Support',
        is_active: true,
        lat: 19.0650,
        lng: 72.8350,
        distance_km: 2.8,
        eta_minutes: 8,
        status: 'available',
    },
    {
        id: 'amb_003',
        name: 'LifeLine Ambulance',
        phone: '+919800003333',
        vehicle_number: 'MH-02-EF-9012',
        type: 'Advanced Life Support',
        is_active: true,
        lat: 19.1100,
        lng: 72.8500,
        distance_km: 5.1,
        eta_minutes: 12,
        status: 'en_route',
    },
    {
        id: 'amb_004',
        name: 'CarePlus Transport',
        phone: '+919800004444',
        vehicle_number: 'MH-01-GH-3456',
        type: 'Patient Transport',
        is_active: true,
        lat: 19.0400,
        lng: 72.8200,
        distance_km: 3.5,
        eta_minutes: 10,
        status: 'available',
    },
    {
        id: 'amb_005',
        name: 'City Rescue Ambulance',
        phone: '+919800005555',
        vehicle_number: 'MH-01-IJ-7890',
        type: 'Advanced Life Support',
        is_active: true,
        lat: 18.9800,
        lng: 72.8100,
        distance_km: 8.2,
        eta_minutes: 18,
        status: 'available',
    },
];

// ============================================
// MOCK BOOKINGS
// ============================================

export const mockBookings = [
    // This booking is now handled by the demo rejection logic below

    {
        booking_id: 'bk_20231024_002',
        hospital_id: 'hosp_kokilaben_002',
        hospital_name: 'Kokilaben Dhirubhai Ambani Hospital',
        user_id: 'usr_citizen_001',
        bed_type: 'general',
        status: 'approved',
        patient_name: 'Sufiyan Qazi',
        patient_age: 25,
        patient_gender: 'Male',
        emergency_contact: '+919876543210',
        symptoms: 'High fever, dehydration',
        qr_token: 'dummy_qr_token_hash_002',
        lock_expires_at: null,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
    },
    {
        booking_id: 'bk_20231020_003',
        hospital_id: 'hosp_hinduja_003',
        hospital_name: 'P.D. Hinduja National Hospital',
        user_id: 'usr_citizen_001',
        bed_type: 'oxygen',
        status: 'rejected',
        rejection_reason: 'Bed mistakenly listed, undergoing maintenance.',
        patient_name: 'Suman Sharma',
        patient_age: 55,
        patient_gender: 'Female',
        emergency_contact: '+919876543210',
        symptoms: 'Low oxygen saturation',
        qr_token: null,
        lock_expires_at: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4.9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        booking_id: 'bk_20231015_004',
        hospital_id: 'hosp_lilavati_001',
        hospital_name: 'Lilavati Hospital & Research Centre',
        user_id: 'usr_citizen_001',
        bed_type: 'maternity',
        status: 'completed',
        patient_name: 'Neha Sharma',
        patient_age: 28,
        patient_gender: 'Female',
        emergency_contact: '+919988776655',
        symptoms: 'Labor pains',
        qr_token: 'dummy_qr_token_hash_004',
        lock_expires_at: null,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        booking_id: 'bk_20231025_005',
        hospital_id: 'hosp_nanavati_005',
        hospital_name: 'Nanavati Max Super Speciality Hospital',
        user_id: 'usr_citizen_001',
        bed_type: 'ventilator',
        status: 'expired',
        patient_name: 'Unknown Male',
        patient_age: 40,
        patient_gender: 'Male',
        emergency_contact: 'N/A',
        symptoms: 'Unconscious',
        qr_token: null,
        lock_expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
        booking_id: 'bk_20231026_006',
        hospital_id: 'hosp_seven_hills_007',
        hospital_name: 'SevenHills Hospital',
        user_id: 'usr_citizen_001',
        bed_type: 'general',
        status: 'approved',
        patient_name: 'Amit Kumar',
        patient_age: 35,
        patient_gender: 'Male',
        emergency_contact: '+919876543213',
        symptoms: 'Fractured leg',
        qr_token: 'dummy_qr_token_hash_006',
        lock_expires_at: null,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    },
    {
        booking_id: 'bk_demo_auto_approve',
        hospital_id: 'hosp_nanavati_005',
        hospital_name: 'Nanavati Max Super Speciality Hospital',
        user_id: 'usr_citizen_001',
        bed_type: 'icu',
        status: 'pending',
        patient_name: 'Rahul Khanna',
        patient_age: 45,
        patient_gender: 'Male',
        emergency_contact: '+919988776655',
        symptoms: 'Fever and low oxygen',
        qr_token: 'demo_qr_001',
        lock_expires_at: new Date(Date.now() + 90000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        booking_id: 'bk_demo_auto_reject',
        hospital_id: 'hosp_lilavati_001',
        hospital_name: 'Lilavati Hospital & Research Centre',
        user_id: 'usr_citizen_001',
        bed_type: 'icu',
        status: 'pending',
        patient_name: 'Amit Sharma',
        patient_age: 58,
        patient_gender: 'Male',
        emergency_contact: '+919988776655',
        symptoms: 'Severe chest pain, difficulty breathing',
        qr_token: null,
        lock_expires_at: new Date(Date.now() + 90000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// ============================================
// MOCK EMERGENCY
// ============================================

export const mockEmergency = {
    emergency_id: 'emg_20231025_001',
    user_id: 'usr_citizen_001',
    severity: 'critical',
    symptoms: ['Chest Pain', 'Shortness of Breath'],
    lat: 19.0510,
    lng: 72.8285,
    status: 'active',
    matched_hospitals: mockHospitals.slice(0, 3).map(h => ({
        ...h,
        match_score: h.hospital_id === 'hosp_lilavati_001' ? 95 : 85
    })),
    nearby_ambulances: mockAmbulances.slice(0, 3),
    created_at: new Date().toISOString(),
};

// ============================================
// MOCK ANALYTICS (Dashboard Stats)
// ============================================

export const mockDashboardStats = {
    total_hospitals: 8,
    total_beds: 643,
    available_beds: 287,
    utilization_percentage: 55.4,
    todays_bookings: 34,
    active_emergencies: 3,
    avg_response_time: 12.5,
    ambulances_available: 4,
    total_ambulances: 5,
    bed_distribution: {
        general: 45,
        icu: 85,
        oxygen: 60,
        ventilator: 90,
        maternity: 30,
        pediatric: 40
    },
    recent_activity: [
        { id: 1, type: 'booking', message: 'New ICU booking at Lilavati Hospital', time: '2 mins ago' },
        { id: 2, type: 'emergency', message: 'Critical SOS near Bandra West', time: '5 mins ago' },
        { id: 3, type: 'ambulance', message: 'Ambulance MH-01-AB-1234 dispatched to SOS', time: '7 mins ago' },
        { id: 4, type: 'system', message: 'Bed availability updated for 8 hospitals', time: '10 mins ago' },
        { id: 5, type: 'booking', message: 'General bed booked at SevenHills Hospital', time: '15 mins ago' },
    ]
};

export const mockAnalyticsReport = {
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    bookings: [12, 19, 15, 25, 32, 28, 34],
    approvals: [10, 15, 12, 20, 28, 25, 30],
    rejections: [2, 4, 3, 5, 4, 3, 4]
};
