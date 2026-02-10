const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'quickaid',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function seed() {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting QUICKAID seed...');
        console.log(`📦 Database: ${process.env.DB_NAME || 'quickaid'}`);
        await client.query('BEGIN');

        // =============================================
        // 1. SEED HOSPITALS
        // =============================================
        console.log('\n🏥 Creating hospitals...');
        const hospitals = [
            {
                id: 'hosp_lilavati_001',
                name: 'Lilavati Hospital & Research Centre',
                address: 'A-791, Bandra Reclamation, Bandra West, Mumbai 400050',
                lat: 19.0509, lng: 72.8283,
                phone: '+912226568000', email: 'info@lilavatihospital.com',
                rating: 4.5, reliability_score: 92
            },
            {
                id: 'hosp_kokilaben_002',
                name: 'Kokilaben Dhirubhai Ambani Hospital',
                address: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai 400053',
                lat: 19.1310, lng: 72.8265,
                phone: '+912230999999', email: 'info@kokilabenhospital.com',
                rating: 4.7, reliability_score: 95
            },
            {
                id: 'hosp_hinduja_003',
                name: 'P.D. Hinduja National Hospital',
                address: 'Veer Savarkar Marg, Mahim, Mumbai 400016',
                lat: 19.0380, lng: 72.8397,
                phone: '+912224451515', email: 'info@hindujahospital.com',
                rating: 4.4, reliability_score: 88
            },
            {
                id: 'hosp_breach_candy_004',
                name: 'Breach Candy Hospital',
                address: '60A, Bhulabhai Desai Rd, Breach Candy, Mumbai 400026',
                lat: 18.9716, lng: 72.8051,
                phone: '+912223667788', email: 'info@breachcandyhospital.com',
                rating: 4.3, reliability_score: 85
            },
            {
                id: 'hosp_nanavati_005',
                name: 'Nanavati Max Super Speciality Hospital',
                address: 'S.V. Road, Vile Parle West, Mumbai 400056',
                lat: 19.0896, lng: 72.8382,
                phone: '+912226267500', email: 'info@nanavatihospital.com',
                rating: 4.6, reliability_score: 91
            },
            {
                id: 'hosp_jaslok_006',
                name: 'Jaslok Hospital & Research Centre',
                address: '15, Dr. Deshmukh Marg, Pedder Road, Mumbai 400026',
                lat: 18.9716, lng: 72.8088,
                phone: '+912226573333', email: 'info@jaslokhospital.com',
                rating: 4.4, reliability_score: 87
            },
            {
                id: 'hosp_seven_hills_007',
                name: 'SevenHills Hospital',
                address: 'Marol Maroshi Road, Andheri East, Mumbai 400059',
                lat: 19.1197, lng: 72.8762,
                phone: '+912267676767', email: 'info@sevenhillshospital.com',
                rating: 4.2, reliability_score: 83
            },
            {
                id: 'hosp_holy_spirit_008',
                name: 'Holy Spirit Hospital',
                address: 'Mahakali Caves Road, Andheri East, Mumbai 400093',
                lat: 19.1120, lng: 72.8680,
                phone: '+912228242424', email: 'info@holyspirithospital.com',
                rating: 4.1, reliability_score: 80
            },
        ];

        for (const h of hospitals) {
            await client.query(`
                INSERT INTO hospitals (id, name, address, lat, lng, phone, email, rating, reliability_score, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
                ON CONFLICT (id) DO UPDATE SET
                    name = $2, address = $3, lat = $4, lng = $5,
                    phone = $6, email = $7, rating = $8, reliability_score = $9;
            `, [h.id, h.name, h.address, h.lat, h.lng, h.phone, h.email, h.rating, h.reliability_score]);
            console.log(`   ✓ ${h.name}`);
        }

        // =============================================
        // 2. SEED BED CATEGORIES
        // =============================================
        console.log('\n🛏️ Creating bed categories...');
        const bedTypes = ['general', 'icu', 'oxygen', 'ventilator', 'pediatric', 'maternity'];

        const bedData = {
            'hosp_lilavati_001': { general: [50, 32], icu: [20, 8], oxygen: [15, 10], ventilator: [10, 4], pediatric: [12, 7], maternity: [15, 9] },
            'hosp_kokilaben_002': { general: [60, 40], icu: [25, 12], oxygen: [20, 15], ventilator: [15, 7], pediatric: [10, 5], maternity: [18, 11] },
            'hosp_hinduja_003': { general: [45, 28], icu: [18, 6], oxygen: [12, 8], ventilator: [8, 3], pediatric: [8, 4], maternity: [12, 7] },
            'hosp_breach_candy_004': { general: [40, 22], icu: [15, 5], oxygen: [10, 6], ventilator: [6, 2], pediatric: [6, 3], maternity: [10, 5] },
            'hosp_nanavati_005': { general: [55, 35], icu: [22, 10], oxygen: [18, 12], ventilator: [12, 5], pediatric: [10, 6], maternity: [14, 8] },
            'hosp_jaslok_006': { general: [42, 25], icu: [16, 7], oxygen: [11, 7], ventilator: [7, 3], pediatric: [7, 4], maternity: [11, 6] },
            'hosp_seven_hills_007': { general: [48, 30], icu: [14, 5], oxygen: [10, 5], ventilator: [6, 2], pediatric: [8, 5], maternity: [10, 6] },
            'hosp_holy_spirit_008': { general: [35, 20], icu: [10, 4], oxygen: [8, 4], ventilator: [5, 2], pediatric: [5, 3], maternity: [8, 4] },
        };

        for (const [hospitalId, beds] of Object.entries(bedData)) {
            for (const [bedType, [total, available]] of Object.entries(beds)) {
                await client.query(`
                    INSERT INTO bed_categories (hospital_id, bed_type, total, available, reserved, locked, price, last_updated)
                    VALUES ($1, $2, $3, $4, 0, 0, $5, NOW())
                    ON CONFLICT (hospital_id, bed_type) DO UPDATE SET
                        total = $3, available = $4, last_updated = NOW();
                `, [hospitalId, bedType, total, available, bedType === 'icu' ? 15000 : bedType === 'ventilator' ? 20000 : 5000]);
            }
            console.log(`   ✓ Beds for ${hospitalId}`);
        }

        // =============================================
        // 3. SEED DOCTORS
        // =============================================
        console.log('\n👨‍⚕️ Creating doctors...');
        const doctors = [
            { hospital: 'hosp_lilavati_001', name: 'Dr. Anil Kapoor', specialty: 'Emergency Medicine', phone: '+919900110001', on_duty: true },
            { hospital: 'hosp_lilavati_001', name: 'Dr. Sneha Reddy', specialty: 'Cardiology', phone: '+919900110002', on_duty: true },
            { hospital: 'hosp_lilavati_001', name: 'Dr. Rajesh Iyer', specialty: 'Critical Care', phone: '+919900110003', on_duty: false },
            { hospital: 'hosp_kokilaben_002', name: 'Dr. Meera Shah', specialty: 'Emergency Medicine', phone: '+919900220001', on_duty: true },
            { hospital: 'hosp_kokilaben_002', name: 'Dr. Vikram Desai', specialty: 'Pulmonology', phone: '+919900220002', on_duty: true },
            { hospital: 'hosp_kokilaben_002', name: 'Dr. Fatima Khan', specialty: 'Pediatrics', phone: '+919900220003', on_duty: true },
            { hospital: 'hosp_hinduja_003', name: 'Dr. Suresh Menon', specialty: 'Cardiology', phone: '+919900330001', on_duty: true },
            { hospital: 'hosp_hinduja_003', name: 'Dr. Priya Nair', specialty: 'Neurology', phone: '+919900330002', on_duty: false },
            { hospital: 'hosp_breach_candy_004', name: 'Dr. Arjun Malhotra', specialty: 'Emergency Medicine', phone: '+919900440001', on_duty: true },
            { hospital: 'hosp_breach_candy_004', name: 'Dr. Kavita Rao', specialty: 'Obstetrics', phone: '+919900440002', on_duty: true },
            { hospital: 'hosp_nanavati_005', name: 'Dr. Ramesh Gupta', specialty: 'Critical Care', phone: '+919900550001', on_duty: true },
            { hospital: 'hosp_nanavati_005', name: 'Dr. Anjali Sharma', specialty: 'Pediatrics', phone: '+919900550002', on_duty: true },
            { hospital: 'hosp_nanavati_005', name: 'Dr. Karan Singh', specialty: 'Emergency Medicine', phone: '+919900550003', on_duty: false },
            { hospital: 'hosp_jaslok_006', name: 'Dr. Deepika Joshi', specialty: 'Cardiology', phone: '+919900660001', on_duty: true },
            { hospital: 'hosp_jaslok_006', name: 'Dr. Amit Patel', specialty: 'Pulmonology', phone: '+919900660002', on_duty: true },
            { hospital: 'hosp_seven_hills_007', name: 'Dr. Neha Kulkarni', specialty: 'Emergency Medicine', phone: '+919900770001', on_duty: true },
            { hospital: 'hosp_seven_hills_007', name: 'Dr. Rohit Verma', specialty: 'Neurology', phone: '+919900770002', on_duty: true },
            { hospital: 'hosp_holy_spirit_008', name: 'Dr. Sarah Thomas', specialty: 'Pediatrics', phone: '+919900880001', on_duty: true },
            { hospital: 'hosp_holy_spirit_008', name: 'Dr. Joseph Fernandes', specialty: 'Critical Care', phone: '+919900880002', on_duty: false },
        ];

        for (const d of doctors) {
            await client.query(`
                INSERT INTO doctors (hospital_id, name, specialty, phone, on_duty, shift_start, shift_end)
                VALUES ($1, $2, $3, $4, $5, '08:00', '20:00')
            `, [d.hospital, d.name, d.specialty, d.phone, d.on_duty]);
            console.log(`   ✓ ${d.name} (${d.specialty})`);
        }

        // =============================================
        // 4. SEED USERS
        // =============================================
        console.log('\n👤 Creating users...');
        const users = [
            { phone: '+919876543210', name: 'Rahul Sharma', role: 'citizen', hospital_id: null },
            { phone: '+919876543211', name: 'Dr. Priya Patel', role: 'hospital_admin', hospital_id: 'hosp_lilavati_001' },
            { phone: '+919876543212', name: 'Admin User', role: 'quickaid_admin', hospital_id: null },
            { phone: '+919876543213', name: 'Amit Kumar', role: 'citizen', hospital_id: null },
            { phone: '+919876543214', name: 'Dr. Sanjay Mehta', role: 'hospital_admin', hospital_id: 'hosp_kokilaben_002' },
        ];

        for (const u of users) {
            await client.query(`
                INSERT INTO users (phone, name, role, hospital_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (phone) DO UPDATE SET name = $2, role = $3, hospital_id = $4;
            `, [u.phone, u.name, u.role, u.hospital_id]);
            console.log(`   ✓ ${u.name} (${u.role})`);
        }

        // =============================================
        // 5. SEED AMBULANCE PARTNERS
        // =============================================
        console.log('\n🚑 Creating ambulance partners...');
        const ambulances = [
            { name: 'QuickAid Ambulance Service', phone: '+919800001111', vehicle: 'MH-01-AB-1234' },
            { name: 'Mumbai Emergency Response', phone: '+919800002222', vehicle: 'MH-01-CD-5678' },
            { name: 'LifeLine Ambulance', phone: '+919800003333', vehicle: 'MH-02-EF-9012' },
            { name: 'CarePlus Transport', phone: '+919800004444', vehicle: 'MH-01-GH-3456' },
        ];

        for (const a of ambulances) {
            await client.query(`
                INSERT INTO ambulance_partners (name, phone, vehicle_number, is_active)
                VALUES ($1, $2, $3, true)
            `, [a.name, a.phone, a.vehicle]);
            console.log(`   ✓ ${a.name} (${a.vehicle})`);
        }

        await client.query('COMMIT');

        console.log('\n========================================');
        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('========================================');
        console.log(`   🏥 Hospitals: ${hospitals.length}`);
        console.log(`   🛏️  Bed Types: ${hospitals.length * bedTypes.length}`);
        console.log(`   👨‍⚕️ Doctors: ${doctors.length}`);
        console.log(`   👤 Users: ${users.length}`);
        console.log(`   🚑 Ambulances: ${ambulances.length}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Seed failed:', error.message);
        console.error('Detail:', error.detail || 'No detail');
        console.error('Table:', error.table || 'Unknown');
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();