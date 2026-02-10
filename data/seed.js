// Seed hospitals and inventory with simulated freshness updates
function nowUTC() { return new Date().toISOString(); }

const hospitals = [
  { id: 'HSP-MILLAT', name: 'Millat Hospital', address: 'Mumbai', lat: 19.0733, lng: 72.8611, emergency_rating: 4.1, reliability_score: 0.72, verified_at: nowUTC(), last_inventory_update_at: nowUTC(), surge_mode: false },
  { id: 'HSP-LIFELINE', name: 'Life Line Hospital', address: 'Mumbai', lat: 19.2012, lng: 72.8423, emergency_rating: 4.3, reliability_score: 0.75, verified_at: nowUTC(), last_inventory_update_at: nowUTC(), surge_mode: false },
  { id: 'HSP-COOPER', name: 'Cooper Hospital', address: 'Mumbai', lat: 19.1044, lng: 72.8397, emergency_rating: 4.5, reliability_score: 0.82, verified_at: nowUTC(), last_inventory_update_at: nowUTC(), surge_mode: false },
  { id: 'HSP-SABOO', name: 'Saboo Siddik Hospital', address: 'Mumbai', lat: 18.9678, lng: 72.8334, emergency_rating: 4.0, reliability_score: 0.70, verified_at: nowUTC(), last_inventory_update_at: nowUTC(), surge_mode: false }
];

const bedCategoriesByHospital = new Map();
function initHospital(h) {
  const cats = new Map();
  cats.set('general', { hospital_id: h.id, category: 'general', total: 40, available: 30, reserved: 5, locked: 0, updated_at: nowUTC() });
  cats.set('icu', { hospital_id: h.id, category: 'icu', total: 12, available: 7, reserved: 3, locked: 0, updated_at: nowUTC() });
  cats.set('oxygen', { hospital_id: h.id, category: 'oxygen', total: 20, available: 12, reserved: 6, locked: 0, updated_at: nowUTC() });
  cats.set('ventilator', { hospital_id: h.id, category: 'ventilator', total: 6, available: 3, reserved: 2, locked: 0, updated_at: nowUTC() });
  bedCategoriesByHospital.set(h.id, cats);
}
hospitals.forEach(initHospital);

const doctorsOnDuty = [
  { hospital_id: 'HSP-COOPER', name: 'Dr. A Sharma', specialty: 'ER/Trauma', shift_start: '08:00', shift_end: '20:00', contact: '+91-9XXXXXXXXX' },
  { hospital_id: 'HSP-COOPER', name: 'Dr. B Gupta', specialty: 'General Physician', shift_start: '08:00', shift_end: '20:00', contact: '+91-9XXXXXXXXX' },
  { hospital_id: 'HSP-COOPER', name: 'Dr. C Rao', specialty: 'Telemedicine/Triage', shift_start: '08:00', shift_end: '20:00', contact: '+91-9XXXXXXXXX' }
];

// Simulate inventory updates every ~15 seconds with jitter (testing only)
let lastSimUpdate = Date.now();
function updateInventoryFreshness() {
  const now = Date.now();
  if (now - lastSimUpdate >= 15000) {
    for (const h of hospitals) {
      // random small changes to availability, respecting bounds
      const cats = bedCategoriesByHospital.get(h.id);
      for (const [_, cat] of cats) {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        cat.available = Math.max(0, Math.min(cat.total, cat.available + delta));
        cat.updated_at = nowUTC();
      }
      h.last_inventory_update_at = nowUTC();
    }
    lastSimUpdate = now;
  }
}

module.exports = { hospitals, bedCategoriesByHospital, doctorsOnDuty, updateInventoryFreshness };

