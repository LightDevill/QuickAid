import apiClient from './axios';
import { mockHospitals } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const estimateEtaMinutes = (distanceKm) => Math.max(4, Math.round(distanceKm * 3.5 + 2));

const toNumber = (value, fallback = undefined) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeScore = (value) => {
    const num = toNumber(value, 0);
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
};

const normalizeReliability = (value) => {
    const num = toNumber(value);
    if (num === undefined) return undefined;
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
};

const normalizeBed = (bed, fallbackType = null) => {
    const bedType = bed?.bed_type || bed?.category || fallbackType;
    if (!bedType) return null;

    return {
        ...bed,
        bed_type: bedType,
        available: toNumber(bed?.available, 0),
        total: toNumber(bed?.total, 0),
        reserved: toNumber(bed?.reserved, 0),
        locked: toNumber(bed?.locked, 0),
        price: toNumber(bed?.price ?? bed?.price_per_day, 0),
        updated_at: bed?.updated_at || bed?.last_updated || bed?.last_inventory_update_at || null,
    };
};

const normalizeDoctor = (doctor) => ({
    ...doctor,
    doctor_id: doctor?.doctor_id || doctor?.id,
    on_duty: doctor?.on_duty ?? doctor?.is_on_duty ?? false,
});

const normalizeHospital = (hospital, { bedType, userLat, userLng } = {}) => {
    if (!hospital) return null;

    const hospitalId = hospital.hospital_id || hospital.id;
    const lat = toNumber(hospital.lat ?? hospital.latitude);
    const lng = toNumber(hospital.lng ?? hospital.longitude);
    const rawBeds = Array.isArray(hospital.beds)
        ? hospital.beds
        : Array.isArray(hospital.bed_categories)
            ? hospital.bed_categories
            : [];

    let beds = rawBeds.map((bed) => normalizeBed(bed)).filter(Boolean);

    if (!beds.length && (hospital.bed_available !== undefined || hospital.bed_total !== undefined)) {
        const fallbackBed = normalizeBed(
            {
                available: hospital.bed_available,
                total: hospital.bed_total,
                price: hospital.price_per_day,
            },
            bedType || hospital.bed_type || hospital.category || 'general'
        );

        if (fallbackBed) {
            beds = [fallbackBed];
        }
    }

    const normalizedUpdatedAt =
        hospital.updated_at ||
        hospital.last_updated ||
        hospital.last_inventory_update_at ||
        null;

    const selectedBed = beds.find((bed) => bed.bed_type === bedType)
        || beds[0]
        || null;

    const resolvedDistance = hospital.distance_km !== undefined
        ? toNumber(hospital.distance_km)
        : (lat !== undefined && lng !== undefined && userLat !== undefined && userLng !== undefined
            ? calculateDistanceKm(userLat, userLng, lat, lng)
            : undefined);

    const reliabilityScore = normalizeReliability(hospital.reliability_score);
    const availabilityRatio = selectedBed?.total
        ? selectedBed.available / Math.max(selectedBed.total, 1)
        : 0;
    const dynamicScore = resolvedDistance !== undefined
        ? Math.round(
            (Math.max(0, 100 - resolvedDistance * 5) * 0.45)
            + (availabilityRatio * 100 * 0.35)
            + ((reliabilityScore || 0) * 0.20)
        )
        : normalizeScore(hospital.match_score ?? hospital.score);

    return {
        ...hospital,
        id: hospitalId,
        hospital_id: hospitalId,
        name: hospital.name || hospital.hospital_name || `Hospital ${hospitalId || ''}`.trim(),
        address: hospital.address || hospital.location || hospital.city || 'Address unavailable',
        lat,
        lng,
        phone: hospital.phone || hospital.hospital_phone || '',
        rating: toNumber(hospital.rating ?? hospital.emergency_rating),
        reliability_score: reliabilityScore,
        distance_km: resolvedDistance !== undefined ? Number(resolvedDistance.toFixed(2)) : undefined,
        eta_minutes: toNumber(hospital.eta_minutes, resolvedDistance !== undefined ? estimateEtaMinutes(resolvedDistance) : undefined),
        score: dynamicScore,
        match_score: dynamicScore,
        updated_at: normalizedUpdatedAt,
        last_updated: normalizedUpdatedAt,
        selected_bed_type: selectedBed?.bed_type || bedType || null,
        selected_bed_available: selectedBed?.available ?? toNumber(hospital.bed_available),
        selected_bed_total: selectedBed?.total ?? toNumber(hospital.bed_total),
        beds,
        doctors: (hospital.doctors || hospital.doctors_on_duty || []).map(normalizeDoctor),
    };
};

export const hospitalApi = {
    // Search hospitals with filters
    searchHospitals: async (lat, lng, bedType = 'general', radiusKm = 10) => {
        if (MOCK_MODE) {
            console.log('[MOCK] searchHospitals:', { lat, lng, bedType, radiusKm });
            await delay(600);
            const hospitals = mockHospitals
                .map((hospital) => normalizeHospital(hospital, { bedType, userLat: lat, userLng: lng }))
                .filter((hospital) => hospital.distance_km === undefined || hospital.distance_km <= radiusKm)
                .sort((a, b) => {
                    if ((b.match_score || 0) !== (a.match_score || 0)) {
                        return (b.match_score || 0) - (a.match_score || 0);
                    }
                    return (a.distance_km || 0) - (b.distance_km || 0);
                });
            return {
                hospitals,
                total: hospitals.length,
            };
        }

        const response = await apiClient.get('/v1/hospitals/search', {
            params: {
                lat,
                lng,
                bed_type: bedType,
                radius_km: radiusKm,
            },
        });

        console.log('[API] searchHospitals raw:', response.data);

        const result = response.data?.data || response.data;
        const hospitals = Array.isArray(result)
            ? result
            : Array.isArray(result?.hospitals)
                ? result.hospitals
                : [];

        return {
            hospitals: hospitals
                .map((hospital) => normalizeHospital(hospital, { bedType, userLat: lat, userLng: lng }))
                .filter(Boolean),
            total: result?.total ?? hospitals.length,
        };
    },

    // Get hospital details by ID
    getHospital: async (hospitalId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getHospital:', hospitalId);
            await delay(300);
            const hospital = mockHospitals.find(h => h.hospital_id === hospitalId || h.id === hospitalId);
            if (!hospital) throw { response: { status: 404, data: { error: 'Hospital not found' } } };
            return { hospital: normalizeHospital(hospital) };
        }

        const response = await apiClient.get(`/v1/hospitals/${hospitalId}`);
        console.log('[API] getHospital raw:', response.data);

        const result = response.data?.data || response.data;
        const hospital = result?.hospital || result;

        if (!hospital) {
            throw { response: { status: 404, data: { error: 'Hospital not found' } } };
        }

        return {
            hospital: normalizeHospital(hospital),
        };
    },

    // Update bed inventory (admin only)
    updateBeds: async (hospitalId, bedType, available, total) => {
        if (MOCK_MODE) {
            console.log('[MOCK] updateBeds:', { hospitalId, bedType, available, total });
            await delay(400);
            return { message: 'Beds updated successfully' };
        }

        const response = await apiClient.post('/v1/hospital/updateBeds', {
            hospital_id: hospitalId,
            bed_type: bedType,
            available,
            total,
        });

        const result = response.data?.data || response.data;
        return result;
    },

    // Get available doctors
    getAvailableDoctors: async (hospitalId = null, specialty = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getAvailableDoctors:', { hospitalId, specialty });
            await delay(400);
            let doctors = [];
            mockHospitals.forEach(h => {
                if (!hospitalId || h.hospital_id === hospitalId || h.id === hospitalId) {
                    if (h.doctors) {
                        h.doctors.forEach(d => {
                            if (!specialty || d.specialty === specialty) {
                                doctors.push({ ...d, hospital_name: h.name });
                            }
                        });
                    }
                }
            });
            return { doctors };
        }

        const params = {};
        if (hospitalId) params.hospital_id = hospitalId;
        if (specialty) params.specialty = specialty;

        const response = await apiClient.get('/v1/doctors/available', { params });
        console.log('[API] getAvailableDoctors raw:', response.data);

        const result = response.data?.data || response.data;
        return result;
    },

    // Get doctor details
    getDoctor: async (doctorId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getDoctor:', doctorId);
            await delay(200);
            for (const h of mockHospitals) {
                if (h.doctors) {
                    const doc = h.doctors.find(d => d.id === doctorId);
                    if (doc) return { doctor: { ...doc, hospital_name: h.name } };
                }
            }
            throw { response: { status: 404, data: { error: 'Doctor not found' } } };
        }

        const response = await apiClient.get(`/v1/doctors/${doctorId}`);
        console.log('[API] getDoctor raw:', response.data);

        const result = response.data?.data || response.data;
        return result;
    },
};

export default hospitalApi;
