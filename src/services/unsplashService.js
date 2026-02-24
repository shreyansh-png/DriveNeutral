/**
 * unsplashService.js — Fetch car images from Unsplash API
 *
 * Uses the Unsplash JSON API to search for car photos.
 * Requires VITE_UNSPLASH_ACCESS_KEY in .env.
 * Falls back to null (component shows icon placeholder) if no key or fetch fails.
 */

const UNSPLASH_BASE = 'https://api.unsplash.com';
const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';

// ── In-memory image cache ──────────────────────────────────
const _imageCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Search Unsplash for a car image.
 *
 * @param {string} make  - e.g. "Tata"
 * @param {string} model - e.g. "Nexon EV"
 * @returns {Promise<string|null>} image URL or null
 */
export async function fetchCarImage(make, model) {
    if (!ACCESS_KEY) return null;

    const query = `${make} ${model} car`;
    const cacheKey = query.toLowerCase();

    // Check cache
    const cached = _imageCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.url;
    }

    try {
        const url = `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
        const res = await fetch(url, {
            headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const photo = data.results?.[0];

        if (!photo) {
            _imageCache.set(cacheKey, { url: null, ts: Date.now() });
            return null;
        }

        // Use the "small" size for card thumbnails (400px wide)
        const imageUrl = photo.urls?.small || photo.urls?.regular || null;

        _imageCache.set(cacheKey, { url: imageUrl, ts: Date.now() });
        return imageUrl;
    } catch {
        return null;
    }
}

/**
 * Fetch images for an array of cars.
 * Each car should have a `name` property like "Tata Nexon EV".
 * Returns a Map<carName, imageUrl>.
 *
 * @param {Array<{name: string}>} cars
 * @returns {Promise<Map<string, string|null>>}
 */
export async function fetchCarImages(cars) {
    if (!ACCESS_KEY) return new Map();

    const batchSize = 3; // avoid rate limits
    const results = new Map();

    for (let i = 0; i < cars.length; i += batchSize) {
        const batch = cars.slice(i, i + batchSize);
        const settled = await Promise.allSettled(
            batch.map(car => {
                // Split "Tata Nexon EV" into make="Tata" model="Nexon EV"
                const parts = car.name.split(' ');
                const make = parts[0];
                const model = parts.slice(1).join(' ');
                return fetchCarImage(make, model);
            })
        );

        settled.forEach((result, idx) => {
            const carName = batch[idx].name;
            results.set(carName, result.status === 'fulfilled' ? result.value : null);
        });
    }

    return results;
}
