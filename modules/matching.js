// Matching engine: returns ranked hospitals in <2s based on distance, availability, ICU, oxygen, reliability
function scoreHospital({ distKm, availability, icu, oxygen, reliability }) {
  const w = { distance: 0.40, availability: 0.25, icu: 0.15, oxygen: 0.10, reliability: 0.10 };
  const distanceScore = Math.max(0, 1 - Math.min(distKm, 20) / 20); // 0..1 (closer = higher)
  return (
    w.distance * distanceScore +
    w.availability * availability +
    w.icu * (icu ? 1 : 0) +
    w.oxygen * (oxygen ? 1 : 0) +
    w.reliability * reliability
  );
}

function matchHospitals({ lat, lng, bedType, radiusKm, hospitals, bedCategoriesByHospital, distanceKm, freshnessState }) {
  const results = [];
  for (const h of hospitals) {
    const dist = distanceKm(lat, lng, h.lat, h.lng);
    if (dist > radiusKm) continue;
    const cats = bedCategoriesByHospital.get(h.id);
    const cat = cats?.get(bedType);
    if (!cat) continue;
    const fresh = freshnessState(h.last_inventory_update_at);
    const icu = !!cats.get('icu') && cats.get('icu').total > 0;
    const oxygen = !!cats.get('oxygen') && cats.get('oxygen').total > 0;
    const availability = cat.available > 0 ? Math.min(1, cat.available / Math.max(1, cat.total)) : 0;
    const reliability = h.reliability_score || 0.5;
    const surgePenalty = h.surge_mode ? 0.1 : 0.0;
    const s = scoreHospital({ distKm: dist, availability, icu, oxygen, reliability }) - surgePenalty;
    results.push({
      hospital_id: h.id,
      name: h.name,
      distance_km: Number(dist.toFixed(2)),
      bed_available: cat.available,
      freshness_state: fresh,
      icu: icu,
      oxygen: oxygen,
      reliability_score: reliability,
      surge_mode: !!h.surge_mode,
      score: Number(s.toFixed(4))
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}

module.exports = { matchHospitals };

