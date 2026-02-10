const { query } = require('../config/database');

class AnalyticsModel {
    // Get dashboard aggregate stats
    static async getDashboardStats() {
        // This would involve complex aggregation queries
        // For MVP, we'll do simple counts

        const totalHospitals = (await query('SELECT COUNT(*) FROM hospitals')).rows[0].count;
        const totalBedsRes = await query('SELECT SUM(total) as total, SUM(available) as available FROM bed_categories');
        const totalBeds = totalBedsRes.rows[0].total || 0;
        const availableBeds = totalBedsRes.rows[0].available || 0;

        // Calculate utilization
        const utilization = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

        const todaysBookings = (await query("SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE")).rows[0].count;

        return {
            total_hospitals: parseInt(totalHospitals),
            total_beds: parseInt(totalBeds),
            available_beds: parseInt(availableBeds),
            utilization_percentage: parseFloat(utilization.toFixed(1)),
            todays_bookings: parseInt(todaysBookings),
            active_emergencies: 0, // Placeholder
            avg_response_time: 0 // Placeholder
        };
    }

    // Get Booking Trends (Last 7 days)
    static async getBookingTrends() {
        // Mock query for last 7 days aggregation
        // In real SQL: GROUP BY date_trunc('day', created_at)
        const text = `
            SELECT 
                to_char(created_at, 'YYYY-MM-DD') as date,
                COUNT(*) as count
            FROM bookings
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        const { rows } = await query(text);
        return rows;
    }

    // Get Hospital Performance
    static async getHospitalPerformance() {
        // Top 5 hospitals by bookings
        const text = `
            SELECT h.name, COUNT(b.id) as bookings
            FROM hospitals h
            LEFT JOIN bookings b ON h.id = b.hospital_id
            GROUP BY h.id, h.name
            ORDER BY bookings DESC
            LIMIT 5
        `;
        const { rows } = await query(text);
        return rows;
    }
}

module.exports = AnalyticsModel;
