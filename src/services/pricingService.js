/**
 * pricingService.js — Central pricing service for DriveNeutral
 * 
 * Fetches live ex-showroom car prices from trusted Indian auto websites
 * (CarWale, CarDekho) via multiple CORS proxies.
 * Falls back to curated real-world prices if fetch fails.
 * All prices in ₹ (Indian Rupees).
 */

// ── City tax rates for on-road price calculation ────────────
export const CITY_TAX_RATES = {
    'New Delhi': { rto: 0.04, other: 0.08, label: 'New Delhi', state: 'Low Tax Zone' },
    Delhi: { rto: 0.04, other: 0.08, label: 'Delhi', state: 'Low Tax Zone' },
    Mumbai: { rto: 0.11, other: 0.05, label: 'Mumbai', state: 'Maharashtra' },
    Bangalore: { rto: 0.13, other: 0.05, label: 'Bangalore', state: 'Karnataka' },
    Chennai: { rto: 0.10, other: 0.05, label: 'Chennai', state: 'Tamil Nadu' },
    Hyderabad: { rto: 0.09, other: 0.05, label: 'Hyderabad', state: 'Telangana' },
    Pune: { rto: 0.11, other: 0.05, label: 'Pune', state: 'Maharashtra' },
    Kolkata: { rto: 0.07, other: 0.06, label: 'Kolkata', state: 'West Bengal' },
    Jaipur: { rto: 0.06, other: 0.06, label: 'Jaipur', state: 'Rajasthan' },
    Ahmedabad: { rto: 0.06, other: 0.05, label: 'Ahmedabad', state: 'Gujarat' },
    Lucknow: { rto: 0.08, other: 0.06, label: 'Lucknow', state: 'Uttar Pradesh' },
};

export const INDIAN_CITIES = Object.keys(CITY_TAX_RATES);
export const DEFAULT_CITY = 'New Delhi';

// ── Curated real-world pricing data (₹, sourced from CarWale/CarDekho Feb 2026) ──
const FALLBACK_PRICING = [
    { id: 1, name: 'Tata Nexon EV', type: 'electric', segment: 'SUV', basePrice: 1479000, range: '465 km', power: '143 PS', popular: true, source: 'carwale' },
    { id: 2, name: 'MG ZS EV', type: 'electric', segment: 'SUV', basePrice: 2188000, range: '461 km', power: '176 PS', source: 'carwale' },
    { id: 3, name: 'Hyundai Creta Electric', type: 'electric', segment: 'SUV', basePrice: 1799000, range: '473 km', power: '171 PS', popular: true, source: 'carwale' },
    { id: 4, name: 'BYD Atto 3', type: 'electric', segment: 'SUV', basePrice: 2599000, range: '521 km', power: '204 PS', source: 'carwale' },
    { id: 5, name: 'Tata Punch EV', type: 'electric', segment: 'Hatchback', basePrice: 999000, range: '421 km', power: '122 PS', source: 'carwale' },
    { id: 6, name: 'Maruti Suzuki Baleno', type: 'petrol', segment: 'Hatchback', basePrice: 699000, range: '21.01 km/l', power: '89 PS', popular: true, source: 'carwale' },
    { id: 7, name: 'Hyundai i20', type: 'petrol', segment: 'Hatchback', basePrice: 774000, range: '20.2 km/l', power: '82 PS', source: 'carwale' },
    { id: 8, name: 'Honda City', type: 'petrol', segment: 'Sedan', basePrice: 1194000, range: '18.4 km/l', power: '121 PS', source: 'carwale' },
    { id: 9, name: 'Toyota Innova HyCross', type: 'hybrid', segment: 'MPV', basePrice: 1899000, range: '21.1 km/l', power: '186 PS', source: 'carwale' },
    { id: 10, name: 'Maruti Grand Vitara Hybrid', type: 'hybrid', segment: 'SUV', basePrice: 1099000, range: '27.97 km/l', power: '115 PS', popular: true, source: 'carwale' },
    { id: 11, name: 'Hyundai Creta', type: 'petrol', segment: 'SUV', basePrice: 1099000, range: '17.4 km/l', power: '115 PS', source: 'carwale' },
    { id: 12, name: 'Kia Seltos', type: 'petrol', segment: 'SUV', basePrice: 1089000, range: '16.5 km/l', power: '115 PS', source: 'carwale' },
    { id: 13, name: 'Tata Harrier', type: 'petrol', segment: 'SUV', basePrice: 1549000, range: '14.6 km/l', power: '170 PS', source: 'carwale' },
    { id: 14, name: 'Mahindra XUV700', type: 'petrol', segment: 'SUV', basePrice: 1399000, range: '15.2 km/l', power: '200 PS', popular: true, source: 'carwale' },
    { id: 15, name: 'Maruti Suzuki Swift', type: 'petrol', segment: 'Hatchback', basePrice: 649000, range: '22.38 km/l', power: '82 PS', source: 'carwale' },
    { id: 16, name: 'Tata Curvv EV', type: 'electric', segment: 'SUV', basePrice: 1749000, range: '502 km', power: '167 PS', source: 'carwale' },
];

// ── Price helpers ────────────────────────────────────────────

export const formatINR = (val) =>
    val >= 100000
        ? `₹${(val / 100000).toFixed(2)} L`
        : `₹${val.toLocaleString('en-IN')}`;

export const getOnRoadPrice = (basePrice, city) => {
    const rates = CITY_TAX_RATES[city] || CITY_TAX_RATES[DEFAULT_CITY];
    if (!rates) return basePrice;
    return basePrice
        + Math.round(basePrice * 0.03)        // insurance
        + Math.round(basePrice * rates.rto)   // RTO
        + Math.round(basePrice * rates.other); // handling & others
};

// ── Multi-source live price fetching ────────────────────────

// CORS proxies (tried in order; if one fails, next is used)
const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Car model slugs for CarWale URLs
const CAR_SLUGS = {
    'Tata Nexon EV': { brand: 'tata-cars', model: 'nexon-ev' },
    'MG ZS EV': { brand: 'mg-cars', model: 'zs-ev' },
    'Hyundai Creta Electric': { brand: 'hyundai-cars', model: 'creta-ev' },
    'BYD Atto 3': { brand: 'byd-cars', model: 'atto-3' },
    'Tata Punch EV': { brand: 'tata-cars', model: 'punch-ev' },
    'Maruti Suzuki Baleno': { brand: 'maruti-suzuki-cars', model: 'baleno' },
    'Hyundai i20': { brand: 'hyundai-cars', model: 'elite-i20' },
    'Honda City': { brand: 'honda-cars', model: 'city' },
    'Toyota Innova HyCross': { brand: 'toyota-cars', model: 'innova-hycross' },
    'Maruti Grand Vitara Hybrid': { brand: 'maruti-suzuki-cars', model: 'grand-vitara' },
    'Hyundai Creta': { brand: 'hyundai-cars', model: 'creta' },
    'Kia Seltos': { brand: 'kia-cars', model: 'seltos' },
    'Tata Harrier': { brand: 'tata-cars', model: 'harrier' },
    'Mahindra XUV700': { brand: 'mahindra-cars', model: 'xuv700' },
    'Maruti Suzuki Swift': { brand: 'maruti-suzuki-cars', model: 'swift' },
    'Tata Curvv EV': { brand: 'tata-cars', model: 'curvv-ev' },
};

// City slugs for CarWale price URLs
const CITY_SLUGS = {
    'New Delhi': 'delhi',
    Delhi: 'delhi',
    Mumbai: 'mumbai',
    Bangalore: 'bangalore',
    Chennai: 'chennai',
    Hyderabad: 'hyderabad',
    Pune: 'pune',
    Kolkata: 'kolkata',
    Jaipur: 'jaipur',
    Ahmedabad: 'ahmedabad',
    Lucknow: 'lucknow',
};

/**
 * Try fetching a URL through multiple CORS proxies
 */
async function fetchWithProxy(url, timeout = 6000) {
    for (const makeProxy of CORS_PROXIES) {
        try {
            const proxyUrl = makeProxy(url);
            const res = await fetch(proxyUrl, {
                signal: AbortSignal.timeout(timeout),
                headers: { 'Accept': 'text/html,application/json' },
            });
            if (res.ok) {
                return await res.text();
            }
        } catch {
            // Try next proxy
            continue;
        }
    }
    return null;
}

/**
 * Extract price from CarWale HTML response
 * Looks for price patterns like "₹ XX.XX Lakh" or "Rs. XX,XX,XXX"
 */
function extractPriceFromHTML(html) {
    if (!html) return null;

    // Pattern 1: "₹ XX.XX Lakh" or "Rs XX.XX Lakh"  
    const lakhMatch = html.match(/(?:₹|Rs\.?)\s*([\d.]+)\s*Lakh/i);
    if (lakhMatch) {
        const lakhs = parseFloat(lakhMatch[1]);
        if (lakhs > 0 && lakhs < 500) return Math.round(lakhs * 100000);
    }

    // Pattern 2: JSON-LD structured data with price
    const jsonLdMatch = html.match(/"price"\s*:\s*"?(\d+)"?/);
    if (jsonLdMatch) {
        const price = parseInt(jsonLdMatch[1]);
        if (price > 100000 && price < 50000000) return price;
    }

    // Pattern 3: "data-price" or similar attributes
    const dataPriceMatch = html.match(/data-price="(\d+)"/);
    if (dataPriceMatch) {
        const price = parseInt(dataPriceMatch[1]);
        if (price > 100000 && price < 50000000) return price;
    }

    // Pattern 4: Indian number format "XX,XX,XXX"
    const inrMatch = html.match(/(?:₹|Rs\.?)\s*([\d,]+)\s*(?:<|"|\s)/);
    if (inrMatch) {
        const price = parseInt(inrMatch[1].replace(/,/g, ''));
        if (price > 100000 && price < 50000000) return price;
    }

    return null;
}

/**
 * Fetch live price for a specific car in a specific city from CarWale
 */
async function fetchLivePrice(carName, city = DEFAULT_CITY) {
    const slug = CAR_SLUGS[carName];
    const citySlug = CITY_SLUGS[city] || 'delhi';

    if (!slug) return null;

    // CarWale price page URL pattern: /brand/model/price-in-city/
    const carwaleUrl = `https://www.carwale.com/${slug.brand}/${slug.model}/price-in-${citySlug}/`;

    const html = await fetchWithProxy(carwaleUrl);
    return extractPriceFromHTML(html);
}

// ── In-memory cache (keyed by city) ─────────────────────────
const _priceCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch car prices for a specific city.
 * Tries to get live prices from CarWale, falls back to curated data.
 * Results are cached per city for 30 minutes.
 * 
 * @param {string} city - city name
 * @returns {Promise<{cars: Array, source: string, city: string}>}
 */
export async function fetchCarPrices(city = DEFAULT_CITY) {
    const cacheKey = city;
    const cached = _priceCache.get(cacheKey);

    // Return cache if fresh
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    let liveCount = 0;

    // Try to fetch live prices (batch — max 4 concurrent to avoid rate limits)
    const batchSize = 4;
    const enhanced = [...FALLBACK_PRICING];

    for (let i = 0; i < enhanced.length; i += batchSize) {
        const batch = enhanced.slice(i, i + batchSize);
        const results = await Promise.allSettled(
            batch.map(car => fetchLivePrice(car.name, city))
        );

        results.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value && result.value > 100000) {
                enhanced[i + idx] = {
                    ...enhanced[i + idx],
                    basePrice: result.value,
                    source: 'live',
                    sourceCity: city,
                };
                liveCount++;
            }
        });
    }

    const data = {
        cars: enhanced,
        source: liveCount > 0 ? 'carwale' : 'cached',
        liveCount,
        totalCount: enhanced.length,
        city,
        fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    _priceCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
}

/**
 * Synchronous fallback — returns curated data instantly (no network).
 */
export function getStaticPrices() {
    return {
        cars: [...FALLBACK_PRICING],
        source: 'cached',
        liveCount: 0,
        totalCount: FALLBACK_PRICING.length,
        city: DEFAULT_CITY,
        fetchedAt: null,
    };
}

/**
 * Lookup base price for a car name (fuzzy match).
 */
export function lookupBasePrice(carName, prices = FALLBACK_PRICING) {
    const list = Array.isArray(prices) ? prices : (prices.cars || []);
    const exact = list.find(p => p.name === carName);
    if (exact) return exact.basePrice;
    const partial = list.find(p => carName.includes(p.name) || p.name.includes(carName));
    return partial ? partial.basePrice : null;
}
