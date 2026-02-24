/**
 * locationService.js — Detect user's city from browser geolocation or IP
 * 
 * Strategy:
 * 1. Try browser Geolocation API → reverse geocode via free Nominatim API
 * 2. Fallback: IP-based geolocation via ip-api.com (free, no key needed)
 * 3. Default: New Delhi
 */

// Supported cities we can calculate on-road prices for
const SUPPORTED_CITIES = [
    'New Delhi', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai',
    'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow',
];

// City name aliases → canonical name
const CITY_ALIASES = {
    'new delhi': 'New Delhi',
    'delhi': 'New Delhi',
    'nct of delhi': 'New Delhi',
    'mumbai': 'Mumbai',
    'bombay': 'Mumbai',
    'bengaluru': 'Bangalore',
    'bangalore': 'Bangalore',
    'chennai': 'Chennai',
    'madras': 'Chennai',
    'hyderabad': 'Hyderabad',
    'pune': 'Pune',
    'poona': 'Pune',
    'kolkata': 'Kolkata',
    'calcutta': 'Kolkata',
    'jaipur': 'Jaipur',
    'ahmedabad': 'Ahmedabad',
    'amdavad': 'Ahmedabad',
    'lucknow': 'Lucknow',
    // Nearby cities → nearest supported city
    'noida': 'New Delhi',
    'gurgaon': 'New Delhi',
    'gurugram': 'New Delhi',
    'ghaziabad': 'New Delhi',
    'faridabad': 'New Delhi',
    'thane': 'Mumbai',
    'navi mumbai': 'Mumbai',
    'mysuru': 'Bangalore',
    'mysore': 'Bangalore',
    'secunderabad': 'Hyderabad',
    'pimpri-chinchwad': 'Pune',
    'howrah': 'Kolkata',
};

/**
 * Map a raw city name to the nearest supported city
 */
function resolveCity(rawCity) {
    if (!rawCity) return 'New Delhi';
    const lower = rawCity.toLowerCase().trim();

    // Direct alias match
    if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];

    // Partial match against supported cities
    const match = SUPPORTED_CITIES.find(c =>
        lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower)
    );
    if (match) return match;

    // Default
    return 'New Delhi';
}

/**
 * Reverse geocode coordinates to city name using Nominatim (free, no API key)
 */
async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            {
                signal: AbortSignal.timeout(5000),
                headers: { 'User-Agent': 'DriveNeutral/1.0' }
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        // Try city, town, state_district, state
        return data.address?.city
            || data.address?.town
            || data.address?.state_district
            || data.address?.state
            || null;
    } catch {
        return null;
    }
}

/**
 * Get city from IP address using ip-api.com (free, no key, 45 req/min)
 */
async function getCityFromIP() {
    try {
        const res = await fetch('http://ip-api.com/json/?fields=city,regionName,country', {
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.city || data.regionName || null;
    } catch {
        return null;
    }
}

// Cache the detected city
let _detectedCity = null;
let _detecting = false;
let _detectPromise = null;

/**
 * Detect user's city. Returns a supported city name.
 * Uses browser geolocation first, then IP, then defaults to New Delhi.
 * Result is cached for the session.
 * 
 * @returns {Promise<{city: string, method: string}>}
 */
export async function detectUserCity() {
    // Return cached result
    if (_detectedCity) return _detectedCity;

    // Prevent concurrent calls
    if (_detecting) return _detectPromise;

    _detecting = true;
    _detectPromise = _doDetect();
    const result = await _detectPromise;
    _detectedCity = result;
    _detecting = false;
    return result;
}

async function _doDetect() {
    // Strategy 1: Browser Geolocation API
    if ('geolocation' in navigator) {
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 8000,
                    maximumAge: 300000, // 5 min cache
                    enableHighAccuracy: false,
                });
            });
            const rawCity = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            if (rawCity) {
                const city = resolveCity(rawCity);
                return { city, method: 'gps', raw: rawCity };
            }
        } catch {
            // User denied or timed out — try IP
        }
    }

    // Strategy 2: IP-based geolocation
    try {
        const rawCity = await getCityFromIP();
        if (rawCity) {
            const city = resolveCity(rawCity);
            return { city, method: 'ip', raw: rawCity };
        }
    } catch {
        // IP lookup failed
    }

    // Strategy 3: Default
    return { city: 'New Delhi', method: 'default', raw: null };
}

/**
 * Reset the cached city (e.g., if user manually changes city)
 */
export function resetDetectedCity() {
    _detectedCity = null;
}
