/* ══════════════════════════════════════════════════════════════
   Greenwashing Detection — Service Layer (LOKI v2)
   ──────────────────────────────────────────────────────────────
   Combines legacy text-analysis utilities with the new
   GreenClaimVerificationEngine for UI components.
   ══════════════════════════════════════════════════════════════ */

import {
    GREENWASH_KEYWORDS,
    CERTIFICATIONS,
    EMISSION_STANDARDS,
    VEHICLE_CLAIMS,
    SEED_REPORTS,
} from './greenwashingData';

import {
    verifyClaim,
    verifyAll,
    verifyAllAsync,
    compareClaims as lokiCompare,
    getLokiDashboardStats,
    getLokiDashboardStatsAsync,
    getAuditLog,
    clearAuditLog,
} from './verificationEngine';

/* ── LocalStorage keys ─────────────────────────────────────── */
const LS_REPORTS = 'dn_gw_reports';
const LS_CERTS = 'dn_gw_certs';
const LS_OVERRIDES = 'dn_gw_overrides';

/* ── Helpers ───────────────────────────────────────────────── */
const normalize = (s) => s.toLowerCase().trim();

/* ══════════════════════════════════════════════════════════════
   1.  TEXT ANALYSIS — analyzeText(text)
   ══════════════════════════════════════════════════════════════ */
export function analyzeText(text) {
    if (!text || typeof text !== 'string') return { flags: [], score: 100, summary: 'No text provided.' };

    const lower = normalize(text);
    const flags = [];

    GREENWASH_KEYWORDS.forEach(({ term, severity, explanation }) => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
            flags.push({
                term, severity, explanation,
                index: match.index,
                length: match[0].length,
                matchedText: match[0],
            });
        }
    });

    // Superlative check
    const superlatives = /\b(most sustainable|greenest|cleanest|best for the environment|world's first green)\b/gi;
    let sMatch;
    while ((sMatch = superlatives.exec(text)) !== null) {
        flags.push({
            term: sMatch[0], severity: 'high',
            explanation: 'Superlative environmental claim without supporting comparative data or third-party ranking.',
            index: sMatch.index, length: sMatch[0].length, matchedText: sMatch[0],
        });
    }

    // Vague percentage check
    const vaguePct = /\b(up to \d+%|as much as \d+%)\s*(reduc|less|lower|fewer|sav)/gi;
    let pMatch;
    while ((pMatch = vaguePct.exec(text)) !== null) {
        flags.push({
            term: pMatch[0], severity: 'medium',
            explanation: '"Up to X%" claims cite best-case scenarios, not typical performance.',
            index: pMatch.index, length: pMatch[0].length, matchedText: pMatch[0],
        });
    }

    const hasNumbers = /\d+\s*(g\/?km|gCO2|kg\s*CO2|mpg|km\/l|kwh)/i.test(text);
    const hasCertMention = CERTIFICATIONS.some(c => lower.includes(normalize(c.name)));

    let score = 100;
    flags.forEach(f => {
        if (f.severity === 'high') score -= 15;
        if (f.severity === 'medium') score -= 8;
        if (f.severity === 'low') score -= 3;
    });
    if (!hasNumbers) score -= 10;
    if (!hasCertMention) score -= 5;
    score = Math.max(0, Math.min(100, score));

    let summary;
    if (score >= 75) summary = 'Text appears largely substantiated with minor concerns.';
    else if (score >= 40) summary = 'Text contains multiple unverified or vague environmental claims.';
    else summary = 'Text is heavily laden with unsubstantiated greenwashing language.';

    return { flags, score, summary, hasNumbers, hasCertMention };
}

/* ══════════════════════════════════════════════════════════════
   2.  BADGE STATUS — getBadgeStatus(score)
       Now supports LOKI claim_status values
   ══════════════════════════════════════════════════════════════ */
export function getBadgeStatus(score, claimStatus) {
    // If a LOKI claim_status is provided, map directly
    if (claimStatus) {
        switch (claimStatus) {
            case 'Verified Claim':
                return { label: 'Verified Claim', emoji: '🟢', color: 'emerald', tier: 'verified' };
            case 'Exaggerated Claim':
                return { label: 'Exaggerated Claim', emoji: '🟡', color: 'amber', tier: 'partial' };
            case 'Potential Greenwashing':
                return { label: 'Potential Greenwashing', emoji: '🔴', color: 'red', tier: 'flagged' };
            case 'No Verified Data Available':
                return { label: 'No Verified Data', emoji: '⚪', color: 'slate', tier: 'nodata' };
            default:
                break;
        }
    }
    // Fallback to score-based
    if (score >= 75) return { label: 'Verified Green', emoji: '🟢', color: 'emerald', tier: 'verified' };
    if (score >= 40) return { label: 'Partially Verified', emoji: '🟡', color: 'amber', tier: 'partial' };
    return { label: 'Potential Greenwashing', emoji: '🔴', color: 'red', tier: 'flagged' };
}

/* ══════════════════════════════════════════════════════════════
   3.  VEHICLE COMPARISON — compareVehicleClaims(idA, idB)
       Uses LOKI engine under the hood
   ══════════════════════════════════════════════════════════════ */
export function compareVehicleClaims(idA, idB) {
    const comparison = lokiCompare(idA, idB);
    if (!comparison) return null;

    const { vehicleA, vehicleB } = comparison;

    // Enrich with text analysis for marketing claim highlighting
    const vA_claims = vehicleA.companies_claim?.marketing_text || '';
    const vB_claims = vehicleB.companies_claim?.marketing_text || '';

    return {
        vehicleA: { ...vehicleA, analysis: analyzeText(vA_claims), badge: getBadgeStatus(null, vehicleA.claim_status) },
        vehicleB: { ...vehicleB, analysis: analyzeText(vB_claims), badge: getBadgeStatus(null, vehicleB.claim_status) },
    };
}

/* ══════════════════════════════════════════════════════════════
   4.  DASHBOARD AGGREGATES — getDashboardStats()
       Wraps LOKI dashboard stats with community reports
   ══════════════════════════════════════════════════════════════ */
export function getDashboardStats() {
    const loki = getLokiDashboardStats();
    const reports = getReports();

    return {
        ...loki,
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
    };
}

/**
 * ASYNC version: includes backend claims from Supabase Cardetailtable.
 */
export async function getDashboardStatsAsync() {
    const loki = await getLokiDashboardStatsAsync();
    const reports = getReports();

    return {
        ...loki,
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
    };
}

/* ══════════════════════════════════════════════════════════════
   5.  COMMUNITY REPORTS (localStorage)
   ══════════════════════════════════════════════════════════════ */
function loadReports() {
    try {
        const raw = localStorage.getItem(LS_REPORTS);
        return raw ? JSON.parse(raw) : [...SEED_REPORTS];
    } catch { return [...SEED_REPORTS]; }
}
function saveReports(reports) {
    localStorage.setItem(LS_REPORTS, JSON.stringify(reports));
}

export function getReports() {
    return loadReports().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function submitReport({ manufacturer, claimText, reason, reportedBy }) {
    const reports = loadReports();
    const report = {
        id: `rpt_${Date.now()}`,
        manufacturer, claimText, reason,
        reportedBy: reportedBy || 'Anonymous',
        timestamp: new Date().toISOString(),
        status: 'pending',
        upvotes: 0, downvotes: 0,
    };
    reports.unshift(report);
    saveReports(reports);
    return report;
}

export function voteOnReport(reportId, direction) {
    const reports = loadReports();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) return null;
    if (direction === 'up') reports[idx].upvotes += 1;
    if (direction === 'down') reports[idx].downvotes += 1;
    saveReports(reports);
    return reports[idx];
}

export function moderateReport(reportId, newStatus) {
    const reports = loadReports();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) return null;
    reports[idx].status = newStatus;
    saveReports(reports);
    return reports[idx];
}

export function deleteReport(reportId) {
    const reports = loadReports().filter(r => r.id !== reportId);
    saveReports(reports);
}

/* ══════════════════════════════════════════════════════════════
   6.  CERTIFICATION MANAGEMENT (localStorage)
   ══════════════════════════════════════════════════════════════ */
function loadCerts() {
    try {
        const raw = localStorage.getItem(LS_CERTS);
        return raw ? JSON.parse(raw) : [...CERTIFICATIONS];
    } catch { return [...CERTIFICATIONS]; }
}
function saveCerts(certs) {
    localStorage.setItem(LS_CERTS, JSON.stringify(certs));
}

export function getCertifications() { return loadCerts(); }

export function addCertification(cert) {
    const certs = loadCerts();
    const newCert = { ...cert, id: cert.id || `cert_${Date.now()}` };
    certs.push(newCert);
    saveCerts(certs);
    return newCert;
}

export function updateCertification(id, updates) {
    const certs = loadCerts();
    const idx = certs.findIndex(c => c.id === id);
    if (idx === -1) return null;
    certs[idx] = { ...certs[idx], ...updates };
    saveCerts(certs);
    return certs[idx];
}

export function deleteCertification(id) {
    const certs = loadCerts().filter(c => c.id !== id);
    saveCerts(certs);
}

/* ══════════════════════════════════════════════════════════════
   7.  ADMIN OVERRIDES (localStorage)
   ══════════════════════════════════════════════════════════════ */
function getOverrides() {
    try {
        const raw = localStorage.getItem(LS_OVERRIDES);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

export function setOverride(vehicleId, score) {
    const ov = getOverrides();
    ov[vehicleId] = Math.max(0, Math.min(100, score));
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(ov));
}

export function clearOverride(vehicleId) {
    const ov = getOverrides();
    delete ov[vehicleId];
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(ov));
}

export function getAllOverrides() { return getOverrides(); }

/* ══════════════════════════════════════════════════════════════
   RE-EXPORTS
   ══════════════════════════════════════════════════════════════ */
export {
    VEHICLE_CLAIMS,
    CERTIFICATIONS,
    EMISSION_STANDARDS,
    verifyClaim,
    verifyAll,
    verifyAllAsync,
    getAuditLog,
    clearAuditLog,
};
