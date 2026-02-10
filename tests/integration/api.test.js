// Integration Tests for QUICKAID API
// Run: npm run test:integration

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

// Test suites
async function runTests() {
    let passed = 0;
    let failed = 0;
    let token = null;

    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ ${testName}`);
            passed++;
        } else {
            console.log(`❌ ${testName}`);
            failed++;
        }
    }

    console.log('\n🧪 QUICKAID Integration Tests\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // 1. Health Check
    console.log('--- Health Check ---');
    try {
        const health = await request('GET', '/health');
        assert(health.status === 200, 'Health endpoint returns 200');
        assert(health.data.status !== undefined, 'Health response has status field');
    } catch (e) {
        console.log(`❌ Health check failed: ${e.message}`);
        failed++;
    }

    // 2. OTP Flow
    console.log('\n--- OTP Authentication ---');
    try {
        const otpSend = await request('POST', '/v1/identity/otp/send', {
            phone: '+919876543210'
        });
        assert(otpSend.status === 200, 'OTP send returns 200');
        assert(otpSend.data.request_id, 'OTP response has request_id');

        // Verify OTP (using dev-only OTP)
        if (otpSend.data.otp_dev_only) {
            const otpVerify = await request('POST', '/v1/identity/otp/verify', {
                request_id: otpSend.data.request_id,
                otp: otpSend.data.otp_dev_only
            });
            assert(otpVerify.status === 200, 'OTP verify returns 200');
            assert(otpVerify.data.access_token, 'Verify response has access_token');
            token = otpVerify.data.access_token;
        }
    } catch (e) {
        console.log(`❌ OTP flow failed: ${e.message}`);
        failed++;
    }

    // 3. Hospital Search
    console.log('\n--- Hospital Search ---');
    try {
        const search = await request('GET', '/v1/hospitals/search?lat=19.0760&lng=72.8777&bed_type=general');
        assert(search.status === 200, 'Hospital search returns 200');
        assert(Array.isArray(search.data), 'Search returns array');
        if (search.data.length > 0) {
            assert(search.data[0].hospital_id, 'Results have hospital_id');
            assert(typeof search.data[0].score === 'number', 'Results have score');
        }
    } catch (e) {
        console.log(`❌ Hospital search failed: ${e.message}`);
        failed++;
    }

    // 4. Booking Flow (if authenticated)
    if (token) {
        console.log('\n--- Booking Flow ---');
        try {
            const idempKey = `TEST-${Date.now()}`;
            const booking = await request('POST', '/v1/bookings', {
                hospital_id: 'HSP-COOPER',
                bed_type: 'general'
            }, {
                'Authorization': `Bearer ${token}`,
                'Idempotency-Key': idempKey
            });

            assert(booking.status === 201 || booking.status === 200, 'Booking create returns 201/200');

            if (booking.data.booking_id) {
                assert(booking.data.status === 'pending', 'Booking status is pending');
                assert(booking.data.qr_token, 'Booking has QR token');

                // Get booking status
                const status = await request('GET', `/v1/bookings/${booking.data.booking_id}`, null, {
                    'Authorization': `Bearer ${token}`
                });
                assert(status.status === 200, 'Get booking status returns 200');

                // Test idempotency
                const duplicate = await request('POST', '/v1/bookings', {
                    hospital_id: 'HSP-COOPER',
                    bed_type: 'general'
                }, {
                    'Authorization': `Bearer ${token}`,
                    'Idempotency-Key': idempKey
                });
                assert(duplicate.data.booking_id === booking.data.booking_id, 'Idempotency returns same booking');
            }
        } catch (e) {
            console.log(`❌ Booking flow failed: ${e.message}`);
            failed++;
        }

        // 5. Emergency SOS
        console.log('\n--- Emergency SOS ---');
        try {
            const sos = await request('POST', '/v1/emergency/sos', {
                severity: 'high',
                symptoms: ['chest pain'],
                location: { lat: 19.0760, lng: 72.8777 }
            }, {
                'Authorization': `Bearer ${token}`
            });

            assert(sos.status === 200, 'SOS returns 200');
            assert(sos.data.emergency_case_id, 'SOS has emergency_case_id');
            assert(Array.isArray(sos.data.candidates), 'SOS has candidates array');
        } catch (e) {
            console.log(`❌ Emergency SOS failed: ${e.message}`);
            failed++;
        }
    }

    // 6. Analytics Dashboard
    console.log('\n--- Analytics ---');
    try {
        const dashboard = await request('GET', '/v1/analytics/dashboard');
        assert(dashboard.status === 200, 'Dashboard returns 200');
        assert(dashboard.data.hospitals !== undefined, 'Dashboard has hospitals data');
        assert(dashboard.data.beds !== undefined, 'Dashboard has beds data');
    } catch (e) {
        console.log(`❌ Analytics failed: ${e.message}`);
        failed++;
    }

    // Summary
    console.log('\n========================================');
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
