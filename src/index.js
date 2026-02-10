/* QUICKAID minimal execution server (modular-monolith skeleton)
   Pure Node.js HTTP to avoid external dependencies. Provides core endpoints:
   - Identity OTP (stub)
   - Hospitals search with matching engine
   - Booking with atomic in-memory locks and 90s approval window
   - Booking status and admin approval/reject
   - Ambulance alert accept (validates basic schema)
   - SSE realtime for booking events
   This is a bootstrap execution of the blueprint. Replace in-memory stores with PostgreSQL in production.
*/

const http = require('http');
const crypto = require('crypto');
const url = require('url');

// In-memory stores (replace with PostgreSQL + Redis)
const { hospitals, bedCategoriesByHospital, doctorsOnDuty, updateInventoryFreshness } = require('../data/seed');
const { matchHospitals } = require('../modules/matching');

const bookings = new Map();
const idempotencyKeys = new Map();
const sseClients = new Map();
const emergencyCases = new Map();
const doctorRequests = new Map();
const sessions = new Map();
const auditLogs = [];
const rateCounters = new Map();
const ALERT_SECRET = process.env.ALERT_SECRET || 'QUICKAID_TEST_SECRET';

// Utilities
function sendJSON(res, status, obj) {
  const data = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Cache-Control': 'no-store' });
  res.end(data);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
  });
}

function getQuery(reqUrl) {
  return url.parse(reqUrl, true).query;
}

function nowUTC() {
  return new Date().toISOString();
}

function genId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function freshnessState(lastUpdateISO) {
  const last = new Date(lastUpdateISO).getTime();
  const diffMin = (Date.now() - last) / 60000;
  if (diffMin <= 5) return 'verified';
  if (diffMin <= 10) return 'unverified';
  return 'disabled';
}

function sseBroadcast(bookingId, event) {
  const clients = sseClients.get(bookingId);
  if (!clients) return;
  const payload = `event: update\ndata: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

function getToken(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function requireAuth(req, res, allowedRoles) {
  const token = getToken(req);
  const sess = token ? sessions.get(token) : null;
  const hdrRole = req.headers['x-role'];
  const role = sess?.role || (hdrRole ? String(hdrRole).toLowerCase() : null);
  if (!role || !allowedRoles.map(r => r.toLowerCase()).includes(role)) {
    sendJSON(res, 401, { error: 'E_AUTH_REQUIRED' });
    return null;
  }
  return { token, role, user_id: sess?.user_id || null };
}

function rateLimit(key, limit, windowMs) {
  const nowMs = Date.now();
  const entry = rateCounters.get(key);
  if (!entry || nowMs - entry.windowStart > windowMs) {
    rateCounters.set(key, { windowStart: nowMs, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

function audit(actorRole, action, entityType, entityId, before, after, traceId) {
  auditLogs.push({
    id: genId('AUD'),
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_hash: before ? crypto.createHash('sha256').update(JSON.stringify(before)).digest('hex') : null,
    after_hash: after ? crypto.createHash('sha256').update(JSON.stringify(after)).digest('hex') : null,
    trace_id: traceId || genId('TRC'),
    timestamp_utc: nowUTC()
  });
}

// Booking timer to auto-expire locks
function scheduleExpiry(booking) {
  const ms = Math.max(0, new Date(booking.lock_expires_at).getTime() - Date.now());
  setTimeout(() => {
    const current = bookings.get(booking.booking_id);
    if (!current) return;
    if (current.status === 'pending') {
      // Unlock bed
      const cat = bedCategoriesByHospital.get(current.hospital_id)?.get(current.bed_category);
      if (cat) {
        cat.locked = Math.max(0, cat.locked - 1);
        cat.available = Math.min(cat.total, cat.available + 1);
        cat.updated_at = nowUTC();
      }
      current.status = 'expired';
      current.updated_at = nowUTC();
      sseBroadcast(current.booking_id, { type: 'expired', booking_id: current.booking_id });
    }
  }, ms + 50);
}

// Router
const server = http.createServer(async (req, res) => {
  const { method, url: reqUrl, headers } = req;
  const pathname = url.parse(reqUrl).pathname;

  // CORS + preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Idempotency-Key'
    });
    return res.end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Health
    if (method === 'GET' && pathname === '/health') {
      return sendJSON(res, 200, { status: 'ok', time: nowUTC() });
    }

    // Identity: OTP send (stub)
    if (method === 'POST' && pathname === '/v1/identity/otp/send') {
      const body = await parseBody(req);
      const request_id = genId('OTP');
      return sendJSON(res, 200, { request_id, ttl_sec: 180 });
    }

    // Identity: OTP verify (stub)
    if (method === 'POST' && pathname === '/v1/identity/otp/verify') {
      const body = await parseBody(req);
      const token = genId('TKN');
      const aadhaar_required = !!body.aadhaar_number === false; // purely illustrative
      const user_id = genId('USR');
      const aadhaar = body.aadhaar_number ? String(body.aadhaar_number) : null;
      const aadhaar_last4 = aadhaar ? aadhaar.slice(-4) : null;
      const aadhaar_hash = aadhaar ? crypto.createHash('sha256').update(aadhaar).digest('hex') : null;
      sessions.set(token, { role: 'citizen', user_id, aadhaar_last4, aadhaar_hash });
      return sendJSON(res, 200, { token, aadhaar_required });
    }

    // Mock admin login for testing RBAC
    if (method === 'POST' && pathname === '/v1/admin/mockLogin') {
      const body = await parseBody(req);
      const role = String(body.role || '').toLowerCase();
      const allowed = ['hospital_admin', 'doctor', 'ambulance_partner', 'quickaid_admin'];
      if (!allowed.includes(role)) return sendJSON(res, 400, { error: 'E_INVALID_ROLE' });
      const token = genId('ADM');
      const user_id = genId('USR');
      sessions.set(token, { role, user_id });
      return sendJSON(res, 200, { token, role });
    }

    // Hospitals search with matching
    if (method === 'GET' && pathname === '/v1/hospitals/search') {
      const q = getQuery(reqUrl);
      const lat = parseFloat(q.lat);
      const lng = parseFloat(q.lng);
      const bedType = (q.bed_type || 'general').toLowerCase();
      const radiusKm = parseFloat(q.radius_km || '50');
      if (Number.isNaN(lat) || Number.isNaN(lng)) return sendJSON(res, 400, { error: 'E_INVALID_LOCATION' });

      updateInventoryFreshness();
      const matched = matchHospitals({ lat, lng, bedType, radiusKm, hospitals, bedCategoriesByHospital, distanceKm, freshnessState });
      return sendJSON(res, 200, matched);
    }

    // Hospital update beds (admin)
    if (method === 'POST' && pathname === '/v1/hospital/updateBeds') {
      const auth = requireAuth(req, res, ['hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const body = await parseBody(req);
      const { hospital_id, updates } = body || {};
      if (!hospital_id || !Array.isArray(updates)) return sendJSON(res, 400, { error: 'E_INVALID_REQUEST' });
      const hospital = hospitals.find(h => h.id === hospital_id);
      if (!hospital) return sendJSON(res, 404, { error: 'E_HOSPITAL_NOT_FOUND' });
      const cats = bedCategoriesByHospital.get(hospital_id);
      if (!cats) return sendJSON(res, 404, { error: 'E_NO_INVENTORY' });

      for (const u of updates) {
        const category = String(u.category || '').toLowerCase();
        if (!cats.has(category)) continue;
        const cat = cats.get(category);
        const before = { ...cat };
        if (typeof u.total === 'number') cat.total = Math.max(0, u.total);
        if (typeof u.available === 'number') cat.available = Math.max(0, Math.min(cat.total, u.available));
        if (typeof u.reserved === 'number') cat.reserved = Math.max(0, Math.min(cat.total, u.reserved));
        if (typeof u.locked === 'number') cat.locked = Math.max(0, Math.min(cat.total, u.locked));
        cat.updated_at = nowUTC();
        audit(auth.role, 'updateBeds', 'bed_category', `${hospital_id}:${category}`, before, cat);
      }
      hospital.last_inventory_update_at = nowUTC();
      return sendJSON(res, 200, { status: 'ok', freshness: freshnessState(hospital.last_inventory_update_at) });
    }

    // Emergency SOS
    if (method === 'POST' && pathname === '/v1/emergency/sos') {
      const auth = requireAuth(req, res, ['citizen', 'hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const rlKey = `sos:${auth.token || req.socket.remoteAddress}`;
      if (!rateLimit(rlKey, 5, 60_000)) return sendJSON(res, 429, { error: 'E_RATE_LIMIT' });
      const body = await parseBody(req);
      const { severity, symptoms, location } = body || {};
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return sendJSON(res, 400, { error: 'E_INVALID_LOCATION' });
      const emergency_case_id = genId('EMR');
      const record = {
        emergency_case_id,
        severity: String(severity || 'high').toLowerCase(),
        symptoms: symptoms || null,
        location,
        created_at: nowUTC()
      };
      emergencyCases.set(emergency_case_id, record);
      audit(auth.role, 'sos', 'emergency_case', emergency_case_id, null, record);
      updateInventoryFreshness();
      const candidates = matchHospitals({
        lat: location.lat,
        lng: location.lng,
        bedType: 'general',
        radiusKm: 50,
        hospitals,
        bedCategoriesByHospital,
        distanceKm,
        freshnessState
      });
      return sendJSON(res, 200, { emergency_case_id, candidates, websocket_url: `/v1/realtime/booking/${emergency_case_id}/events` });
    }

    // Doctor request
    if (method === 'POST' && pathname === '/v1/doctor/request') {
      const auth = requireAuth(req, res, ['citizen', 'hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const body = await parseBody(req);
      const { emergency_case_id, context, preferred_specialty } = body || {};
      if (!emergency_case_id) return sendJSON(res, 400, { error: 'E_INVALID_REQUEST' });
      const request_id = genId('DOC');
      const available = doctorsOnDuty.find(d => !preferred_specialty || d.specialty.toLowerCase().includes(String(preferred_specialty).toLowerCase()));
      if (!available) return sendJSON(res, 409, { error: 'E_POOL_EMPTY' });
      const record = { request_id, emergency_case_id, doctor: available, created_at: nowUTC(), status: 'assigned' };
      doctorRequests.set(request_id, record);
      return sendJSON(res, 200, { request_id, assigned_doctor: { name: available.name, specialty: available.specialty, contact: available.contact }, eta_sec: 60 });
    }

    // Booking create (idempotent)
    if (method === 'POST' && pathname === '/v1/bookings') {
      const auth = requireAuth(req, res, ['citizen', 'hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const idempKey = headers['idempotency-key'];
      if (!idempKey) return sendJSON(res, 400, { error: 'E_IDEMPOTENCY_REQUIRED' });
      const existing = idempotencyKeys.get(idempKey);
      if (existing) {
        const record = bookings.get(existing);
        return sendJSON(res, 200, { booking_id: existing, status: record.status, lock_expires_at: record.lock_expires_at, qr_token: record.qr_token, websocket_url: `/v1/realtime/booking/${existing}/events` });
      }

      const body = await parseBody(req);
      const { hospital_id, bed_type } = body || {};
      if (!hospital_id || !bed_type) return sendJSON(res, 400, { error: 'E_INVALID_REQUEST' });
      const hospital = hospitals.find(h => h.id === hospital_id);
      if (!hospital) return sendJSON(res, 404, { error: 'E_HOSPITAL_NOT_FOUND' });
      const fresh = freshnessState(hospital.last_inventory_update_at);
      if (fresh === 'disabled') return sendJSON(res, 409, { error: 'E_FRESHNESS_STALE' });

      const cats = bedCategoriesByHospital.get(hospital_id);
      if (!cats) return sendJSON(res, 404, { error: 'E_NO_INVENTORY' });
      const cat = cats.get(bed_type.toLowerCase());
      if (!cat || cat.available <= 0) return sendJSON(res, 409, { error: 'E_NO_BEDS' });

      // Atomic in-memory lock
      cat.available -= 1;
      cat.locked += 1;
      cat.updated_at = nowUTC();

      const booking_id = genId('QK');
      const lock_expires_at = new Date(Date.now() + 90_000).toISOString();
      const qr_token = crypto.createHash('sha256').update(`${booking_id}|${hospital_id}|${lock_expires_at}`).digest('hex');
      const record = {
        booking_id,
        citizen_id: null,
        hospital_id,
        bed_category: bed_type.toLowerCase(),
        status: 'pending',
        lock_expires_at,
        qr_token,
        created_at: nowUTC(),
        updated_at: nowUTC()
      };
      bookings.set(booking_id, record);
      idempotencyKeys.set(idempKey, booking_id);

      scheduleExpiry(record);
      sseBroadcast(booking_id, { type: 'created', booking_id });
      return sendJSON(res, 201, { booking_id, status: 'pending', lock_expires_at, qr_token, websocket_url: `/v1/realtime/booking/${booking_id}/events` });
    }

    // Booking status
    const bookingStatusMatch = pathname.match(/^\/v1\/bookings\/([A-Z0-9\-]+)$/i);
    if (method === 'GET' && bookingStatusMatch) {
      const auth = requireAuth(req, res, ['citizen', 'hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const id = bookingStatusMatch[1];
      const record = bookings.get(id);
      if (!record) return sendJSON(res, 404, { error: 'E_BOOKING_NOT_FOUND' });
      return sendJSON(res, 200, record);
    }

    // Booking approve/reject (admin)
    const bookingActionMatch = pathname.match(/^\/v1\/bookings\/([A-Z0-9\-]+)\/(approve|reject)$/i);
    if (method === 'POST' && bookingActionMatch) {
      const auth = requireAuth(req, res, ['hospital_admin', 'quickaid_admin']);
      if (!auth) return;
      const [_, id, action] = bookingActionMatch;
      const record = bookings.get(id);
      if (!record) return sendJSON(res, 404, { error: 'E_BOOKING_NOT_FOUND' });
      if (record.status !== 'pending') return sendJSON(res, 409, { error: 'E_INVALID_STATE' });

      const cat = bedCategoriesByHospital.get(record.hospital_id)?.get(record.bed_category);
      if (!cat) return sendJSON(res, 500, { error: 'E_INVENTORY_MISSING' });
      if (action === 'approve') {
        record.status = 'approved';
        record.updated_at = nowUTC();
        // Move from locked to reserved
        cat.locked = Math.max(0, cat.locked - 1);
        cat.reserved = Math.min(cat.total, (cat.reserved || 0) + 1);
        cat.updated_at = nowUTC();
        audit(auth.role, 'approveBooking', 'booking', id, null, record);
        sseBroadcast(id, { type: 'approved', booking_id: id });
        return sendJSON(res, 200, { status: 'approved' });
      } else {
        // reject: unlock
        record.status = 'rejected';
        record.updated_at = nowUTC();
        cat.locked = Math.max(0, cat.locked - 1);
        cat.available = Math.min(cat.total, cat.available + 1);
        cat.updated_at = nowUTC();
        audit(auth.role, 'rejectBooking', 'booking', id, null, record);
        sseBroadcast(id, { type: 'rejected', booking_id: id });
        return sendJSON(res, 200, { status: 'rejected' });
      }
    }

    // Alerts: ambulance
    if (method === 'POST' && pathname === '/v1/alerts/ambulance') {
      const auth = requireAuth(req, res, ['hospital_admin', 'ambulance_partner', 'quickaid_admin']);
      if (!auth) return;
      const body = await parseBody(req);
      const required = ['alert_id', 'timestamp_utc', 'priority', 'severity', 'trace_id', 'booking_id', 'patient', 'location', 'destination_hospital', 'bed_type', 'ambulance_request', 'ack_required_within_sec', 'routing_targets', 'signature'];
      for (const k of required) {
        if (!(k in body)) return sendJSON(res, 400, { error: 'E_INVALID_ALERT_FORMAT', missing: k });
      }
      const providedSig = (req.headers['x-signature'] || '').trim() || String(body.signature || '').replace(/^HMAC-SHA256:/i, '').trim();
      const clone = { ...body };
      delete clone.signature;
      const payload = JSON.stringify(clone);
      const expectedSig = crypto.createHmac('sha256', ALERT_SECRET).update(payload).digest('base64');
      if (!providedSig || providedSig !== expectedSig) return sendJSON(res, 401, { error: 'E_SIGNATURE_INVALID' });
      audit(auth.role, 'ambulanceAlert', 'alert', body.alert_id, null, { booking_id: body.booking_id, severity: body.severity, routing_targets: body.routing_targets });
      return sendJSON(res, 200, { alert_id: body.alert_id, status: 'sent' });
    }

    // SSE realtime for booking events
    const sseMatch = pathname.match(/^\/v1\/realtime\/booking\/([A-Z0-9\-]+)\/events$/i);
    if (method === 'GET' && sseMatch) {
      const bookingId = sseMatch[1];
      const record = bookings.get(bookingId) || emergencyCases.get(bookingId);
      if (!record) return sendJSON(res, 404, { error: 'E_BOOKING_NOT_FOUND' });
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`event: init\ndata: ${JSON.stringify({ booking_id: bookingId, status: record.status || 'open' })}\n\n`);
      let set = sseClients.get(bookingId);
      if (!set) { set = new Set(); sseClients.set(bookingId, set); }
      set.add(res);
      req.on('close', () => {
        set.delete(res);
        if (set.size === 0) sseClients.delete(bookingId);
      });
      return;
    }

    // Not found
    sendJSON(res, 404, { error: 'E_NOT_FOUND' });
  } catch (err) {
    sendJSON(res, 500, { error: 'E_INTERNAL', message: String(err && err.message || err) });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`QUICKAID server listening on http://localhost:${PORT}`);
});

