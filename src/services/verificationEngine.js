/* ══════════════════════════════════════════════════════════════
   GreenClaimVerificationEngine (LOKI)
   ──────────────────────────────────────────────────────────────
   Detect, classify, and score potential greenwashing by
   comparing companies_claim against verified datasets.
   ══════════════════════════════════════════════════════════════ */

import {
    VEHICLE_CLAIMS,
    INTERNET_VERIFIED_DATA,
    DOMAIN_WHITELIST,
    CERTIFICATIONS,
    EMISSION_STANDARDS,
    getAllClaims,
} from './greenwashingData';

/* ── LocalStorage keys ─────────────────────────────────────── */
const LS_INET_CACHE = 'dn_loki_inet_cache';
const LS_AUDIT_LOG = 'dn_loki_audit_log';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;   // 24 hours

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */
function now() { return Date.now(); }

function readCache() {
    try { return JSON.parse(localStorage.getItem(LS_INET_CACHE) || '{}'); }
    catch { return {}; }
}
function writeCache(cache) {
    localStorage.setItem(LS_INET_CACHE, JSON.stringify(cache));
}

function readAuditLog() {
    try { return JSON.parse(localStorage.getItem(LS_AUDIT_LOG) || '[]'); }
    catch { return []; }
}
function appendAudit(entry) {
    const log = readAuditLog();
    log.push({ ...entry, timestamp: new Date().toISOString() });
    // keep last 500 entries
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem(LS_AUDIT_LOG, JSON.stringify(log));
}

/* ──────────────────────────────────────────────────────────────
   1. DATA RETRIEVAL — tiered fetch
   ────────────────────────────────────────────────────────────── */

/**
 * Retrieve the vehicle record by car_id.
 */
export function getVehicleRecord(car_id) {
    return VEHICLE_CLAIMS.find(v => v.car_id === car_id) || null;
}

/**
 * Fetch verified data from internal DB (Priority 1).
 */
function fetchInternalVerified(vehicle) {
    if (vehicle && vehicle.verified_data && vehicle.verified_data.source === 'internal') {
        return vehicle.verified_data;
    }
    return null;
}

/**
 * Simulated internet verified fetch (Priority 2).
 * Rate-limited, cached 24h, domain-whitelisted.
 * Source URLs are logged for audit but NEVER exposed in frontend.
 */
function fetchInternetVerified(car_id) {
    // Check cache first
    const cache = readCache();
    const cached = cache[car_id];
    if (cached && (now() - cached._cachedAt) < CACHE_TTL_MS) {
        return { ...cached, _fromCache: true };
    }

    // Look up in internet verified dataset
    const inetData = INTERNET_VERIFIED_DATA[car_id];
    if (!inetData) return null;

    // Domain whitelist validation
    if (inetData.fetch_domain && !DOMAIN_WHITELIST.includes(inetData.fetch_domain)) {
        appendAudit({
            action: 'DOMAIN_REJECTED',
            car_id,
            domain: inetData.fetch_domain,
            reason: 'Domain not in whitelist',
        });
        return null;
    }

    // Log source URL for audit (NOT exposed in UI)
    appendAudit({
        action: 'INTERNET_FETCH',
        car_id,
        domain: inetData.fetch_domain || 'unknown',
        verified_by: inetData.verified_by || 'N/A',
        // Source URL logged internally only
        _sourceUrl: inetData.fetch_source_url || 'N/A',
    });

    // Cache the result (strip internal audit fields for cache)
    const cacheEntry = {
        actual_co2_gkm: inetData.actual_co2_gkm,
        actual_lifecycle_co2: inetData.actual_lifecycle_co2,
        actual_range_km: inetData.actual_range_km,
        battery_capacity_kwh: inetData.battery_capacity_kwh,
        certifications: inetData.certifications,
        emission_standard: inetData.emission_standard,
        lca_source: inetData.lca_source,
        source: 'internet_verified',
        _cachedAt: now(),
    };
    cache[car_id] = cacheEntry;
    writeCache(cache);

    return cacheEntry;
}

/**
 * Main data retrieval logic:
 *   IF internal_verified_data_exists → use internal data
 *   ELSE → attempt internet_verified_fetch()
 *   IF internet_data_verified → use fetched data
 *   ELSE → mark as "No Verified Data Available"
 */
export function retrieveVerificationData(car_id) {
    const vehicle = getVehicleRecord(car_id);
    if (!vehicle) return { data: null, source: 'none', vehicle: null };

    // Priority 1: Internal DB
    const internal = fetchInternalVerified(vehicle);
    if (internal) {
        return { data: internal, source: 'Internal', vehicle };
    }

    // Priority 2: Internet Verified
    const internet = fetchInternetVerified(car_id);
    if (internet) {
        return { data: internet, source: 'Internet Verified', vehicle };
    }

    // No data anywhere
    return { data: null, source: 'None', vehicle };
}

/* ──────────────────────────────────────────────────────────────
   2. LOKI ANALYSIS ENGINE
   ────────────────────────────────────────────────────────────── */

/**
 * Normalize a claim value (handle edge cases, ensure numeric).
 */
function normalizeValue(val) {
    const n = Number(val);
    if (isNaN(n) || n < 0) return null;
    return n;
}

/**
 * Compute deviation between claimed and actual values.
 * deviation = abs(claimed - actual) / actual * 100
 * Returns null if actual is 0 (can't compute percentage deviation on zero).
 */
function computeDeviation(claimed, actual) {
    const c = normalizeValue(claimed);
    const a = normalizeValue(actual);
    if (c === null || a === null) return null;
    if (a === 0) {
        // Special case: if both are zero, no deviation
        if (c === 0) return 0;
        // Claimed non-zero but actual is zero — treat as data inconsistency
        return null;
    }
    return Math.abs(c - a) / a * 100;
}

/**
 * Core LOKI analysis.
 * Takes a companies_claim and verified data, computes classification.
 */
function lokiAnalyze(claim, verifiedData) {
    if (!verifiedData) {
        // Case 2: No Data Found
        return {
            claim_status: 'No Verified Data Available',
            greenwashing_risk_score: 40,
            deviation_percentage: null,
            confidence_level: 'Low',
            analysis_summary: 'No reliable verification data found. Company may or may not have made fake or exaggerated environmental claims.',
            deviations: {},
        };
    }

    // Compute deviations across multiple metrics
    const deviations = {};

    const co2Dev = computeDeviation(claim.claimed_co2_gkm, verifiedData.actual_co2_gkm);
    if (co2Dev !== null) deviations.tailpipe_co2 = co2Dev;

    const lcDev = computeDeviation(claim.claimed_lifecycle_co2, verifiedData.actual_lifecycle_co2);
    if (lcDev !== null) deviations.lifecycle_co2 = lcDev;

    const rangeDev = computeDeviation(claim.claimed_range_km, verifiedData.actual_range_km);
    if (rangeDev !== null) deviations.range = rangeDev;

    // Use the maximum deviation (worst-case) for primary classification
    const devValues = Object.values(deviations);
    const maxDeviation = devValues.length > 0 ? Math.max(...devValues) : null;

    if (maxDeviation === null) {
        return {
            claim_status: 'No Verified Data Available',
            greenwashing_risk_score: 40,
            deviation_percentage: null,
            confidence_level: 'Low',
            analysis_summary: 'Insufficient comparable metrics between claimed and actual data for deviation analysis.',
            deviations,
        };
    }

    // Classification rules
    let claim_status, greenwashing_risk_score, confidence_level, analysis_summary;

    if (maxDeviation <= 10) {
        claim_status = 'Verified Claim';
        greenwashing_risk_score = Math.round(maxDeviation * 2);  // 0–20
        confidence_level = 'High';
        analysis_summary = `Claims are within ${maxDeviation.toFixed(1)}% of verified data. Environmental marketing appears substantiated and credible.`;
    } else if (maxDeviation <= 30) {
        claim_status = 'Exaggerated Claim';
        greenwashing_risk_score = Math.round(40 + (maxDeviation - 10) * 1);  // 40–60
        confidence_level = 'Medium';
        analysis_summary = `Claims deviate by ${maxDeviation.toFixed(1)}% from verified data. Marketing contains exaggerations that overstate environmental performance.`;
    } else {
        claim_status = 'Potential Greenwashing';
        greenwashing_risk_score = Math.round(Math.min(100, 70 + (maxDeviation - 30) * 0.43)); // 70–100
        confidence_level = 'High';
        analysis_summary = `Claims deviate by ${maxDeviation.toFixed(1)}% from verified data. Significant discrepancy indicates potential greenwashing.`;
    }

    // Check certification consistency
    const claimedCerts = claim.claimed_certifications || [];
    const actualCerts = verifiedData.certifications || [];
    const validCertIds = CERTIFICATIONS.map(c => c.id);

    const unverifiedCerts = claimedCerts.filter(cc => {
        const lower = cc.toLowerCase();
        // Check if claimed cert matches any known valid cert
        return !actualCerts.some(ac => validCertIds.includes(ac));
    });

    if (unverifiedCerts.length > 0 && claim_status === 'Verified Claim') {
        // Bump up score slightly for unverified cert claims
        greenwashing_risk_score = Math.min(100, greenwashing_risk_score + 5);
        analysis_summary += ` Note: Some claimed certifications could not be verified.`;
    }

    return {
        claim_status,
        greenwashing_risk_score: Math.max(0, Math.min(100, greenwashing_risk_score)),
        deviation_percentage: Math.round(maxDeviation * 10) / 10,
        confidence_level,
        analysis_summary,
        deviations,
    };
}

/* ──────────────────────────────────────────────────────────────
   3. MAIN API — verifyClaim(car_id)
   ────────────────────────────────────────────────────────────── */

/**
 * Main entry point for the GreenClaimVerificationEngine.
 * Returns the structured API response as defined in the spec.
 */
export function verifyClaim(car_id) {
    const { data: verifiedData, source: dataSource, vehicle } = retrieveVerificationData(car_id);

    if (!vehicle) {
        return {
            car_id,
            company_name: 'Unknown',
            vehicle_name: 'Unknown Vehicle',
            claim_status: 'No Verified Data Available',
            greenwashing_risk_score: 40,
            deviation_percentage: null,
            data_source_used: 'None',
            confidence_level: 'Low',
            analysis_summary: 'Vehicle not found in database.',
            deviations: {},
        };
    }

    // Run LOKI analysis
    const result = lokiAnalyze(vehicle.companies_claim, verifiedData);

    // Audit log
    appendAudit({
        action: 'VERIFICATION_COMPLETE',
        car_id,
        company_name: vehicle.company_name,
        claim_status: result.claim_status,
        greenwashing_risk_score: result.greenwashing_risk_score,
        data_source_used: dataSource,
    });

    return {
        car_id: vehicle.car_id,
        company_name: vehicle.company_name,
        vehicle_name: vehicle.vehicle_name,
        category: vehicle.category,
        claim_status: result.claim_status,
        greenwashing_risk_score: result.greenwashing_risk_score,
        deviation_percentage: result.deviation_percentage,
        data_source_used: dataSource,
        confidence_level: result.confidence_level,
        analysis_summary: result.analysis_summary,
        deviations: result.deviations,
        // Include claim+actual for UI display (NOT source URLs)
        companies_claim: vehicle.companies_claim,
        verified_data: verifiedData ? {
            actual_co2_gkm: verifiedData.actual_co2_gkm,
            actual_lifecycle_co2: verifiedData.actual_lifecycle_co2,
            actual_range_km: verifiedData.actual_range_km,
            certifications: verifiedData.certifications,
            emission_standard: verifiedData.emission_standard,
            // NO source URLs exposed
        } : null,
    };
}

/* ──────────────────────────────────────────────────────────────
   4. BATCH VERIFICATION — verifyAll()
   ────────────────────────────────────────────────────────────── */

/**
 * Run verification on all vehicles in the static database.
 * Returns an array of API responses.
 */
export function verifyAll() {
    return VEHICLE_CLAIMS.map(v => verifyClaim(v.car_id));
}

/* ──────────────────────────────────────────────────────────────
   4b. ASYNC VERIFICATION — includes backend claims from Supabase
   ────────────────────────────────────────────────────────────── */

/** In-memory store for merged claims (async loaded) */
let _mergedClaims = null;

/**
 * Load all claims (static + backend) and cache in memory.
 */
export async function loadAllClaims() {
    if (_mergedClaims) return _mergedClaims;
    _mergedClaims = await getAllClaims();
    return _mergedClaims;
}

/** Invalidate cache so next call re-fetches */
export function invalidateClaimsCache() {
    _mergedClaims = null;
}

/**
 * Verify a claim given a car_id or a full vehicle record (for backend vehicles).
 * Async version that checks merged pool.
 */
export function verifyClaimFromRecord(vehicleRecord) {
    if (!vehicleRecord) {
        return {
            car_id: 'unknown',
            company_name: 'Unknown',
            vehicle_name: 'Unknown Vehicle',
            claim_status: 'No Verified Data Available',
            greenwashing_risk_score: 40,
            deviation_percentage: null,
            data_source_used: 'None',
            confidence_level: 'Low',
            analysis_summary: 'Vehicle not found in database.',
            deviations: {},
        };
    }

    const vehicle = vehicleRecord;
    const verifiedData = vehicle.verified_data && vehicle.verified_data.source === 'internal'
        ? vehicle.verified_data
        : fetchInternetVerified(vehicle.car_id) || (vehicle.verified_data || null);

    const dataSource = verifiedData
        ? (verifiedData.source === 'internet_verified' ? 'Internet Verified' : 'Internal')
        : 'None';

    const result = lokiAnalyze(vehicle.companies_claim, verifiedData);

    appendAudit({
        action: 'VERIFICATION_COMPLETE',
        car_id: vehicle.car_id,
        company_name: vehicle.company_name,
        claim_status: result.claim_status,
        greenwashing_risk_score: result.greenwashing_risk_score,
        data_source_used: dataSource,
    });

    return {
        car_id: vehicle.car_id,
        company_name: vehicle.company_name,
        vehicle_name: vehicle.vehicle_name,
        category: vehicle.category,
        claim_status: result.claim_status,
        greenwashing_risk_score: result.greenwashing_risk_score,
        deviation_percentage: result.deviation_percentage,
        data_source_used: dataSource,
        confidence_level: result.confidence_level,
        analysis_summary: result.analysis_summary,
        deviations: result.deviations,
        companies_claim: vehicle.companies_claim,
        verified_data: verifiedData ? {
            actual_co2_gkm: verifiedData.actual_co2_gkm,
            actual_lifecycle_co2: verifiedData.actual_lifecycle_co2,
            actual_range_km: verifiedData.actual_range_km,
            certifications: verifiedData.certifications,
            emission_standard: verifiedData.emission_standard,
        } : null,
        _backend: vehicle._backend || false,
    };
}

/**
 * Async: verify all vehicles (static + backend from Supabase).
 */
export async function verifyAllAsync() {
    const allClaims = await loadAllClaims();
    return allClaims.map(v => verifyClaimFromRecord(v));
}

/* ──────────────────────────────────────────────────────────────
   5. COMPARISON — compareClaims(car_id_a, car_id_b)
   ────────────────────────────────────────────────────────────── */

export function compareClaims(car_id_a, car_id_b) {
    const a = verifyClaim(car_id_a);
    const b = verifyClaim(car_id_b);
    return { vehicleA: a, vehicleB: b };
}

/* ──────────────────────────────────────────────────────────────
   6. DASHBOARD STATS (sync — static only)
   ────────────────────────────────────────────────────────────── */

export function getLokiDashboardStats() {
    const results = verifyAll();
    return buildStats(results);
}

/**
 * ASYNC Dashboard stats — includes backend claims from Supabase.
 */
export async function getLokiDashboardStatsAsync() {
    const results = await verifyAllAsync();
    return buildStats(results);
}

function buildStats(results) {
    const totalAnalyzed = results.length;
    const avgScore = totalAnalyzed > 0
        ? Math.round(results.reduce((s, r) => s + (100 - r.greenwashing_risk_score), 0) / totalAnalyzed)
        : 0;

    const verified = results.filter(r => r.claim_status === 'Verified Claim').length;
    const exaggerated = results.filter(r => r.claim_status === 'Exaggerated Claim').length;
    const greenwashing = results.filter(r => r.claim_status === 'Potential Greenwashing').length;
    const noData = results.filter(r => r.claim_status === 'No Verified Data Available').length;

    const bySource = {
        internal: results.filter(r => r.data_source_used === 'Internal').length,
        internet: results.filter(r => r.data_source_used === 'Internet Verified').length,
        none: results.filter(r => r.data_source_used === 'None').length,
    };

    return {
        totalAnalyzed,
        avgScore,
        verified,
        exaggerated,
        greenwashing,
        noData,
        bySource,
        results,
    };
}

/* ──────────────────────────────────────────────────────────────
   7. AUDIT LOG (admin only)
   ────────────────────────────────────────────────────────────── */

export function getAuditLog() {
    return readAuditLog().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function clearAuditLog() {
    localStorage.setItem(LS_AUDIT_LOG, JSON.stringify([]));
}

/* ── Re-export for convenience ─────────────────────────────── */
export { VEHICLE_CLAIMS };
