/**
 * chatflowService.js — AI Chatflow data engine for DriveNeutral
 *
 * Provides vehicle comparison, eco-friendly ranking, cost calculation,
 * and EV recommendation logic. All computations are local (no external AI API).
 */

import { supabase } from '../supabaseClient';
import { formatINR, lookupBasePrice, getOnRoadPrice } from './pricingService';

// ── Constants ────────────────────────────────────────────────
const AVG_PETROL_PRICE = 104;       // ₹/litre (India avg)
const AVG_DIESEL_PRICE = 90;        // ₹/litre
const AVG_ELECTRICITY_COST = 8;     // ₹/kWh
const AVG_PETROL_MILEAGE = 15;      // km/l (average ICE)
const AVG_EV_EFFICIENCY = 7;        // km/kWh (average EV)
const DAYS_PER_YEAR = 365;
const YEARS_PROJECTION = 5;

// ── Image propagation helper ─────────────────────────────────
// If *any* variant of a model has an image (e.g. Creta 1.5 D MT),
// share it with every other variant of the same model (Creta 1.5 P MT, etc.)
function getModelKey(car) {
    const mfr = (car.manufacturer || '').toLowerCase().trim();
    const nm = (car.name || '').toLowerCase().trim();
    // Strip manufacturer prefix if repeated in name
    const rest = nm.startsWith(mfr) ? nm.slice(mfr.length).trim() : nm;
    // First word = base model (e.g. "creta", "nexon", "scorpio-n")
    const model = rest.split(/\s+/)[0] || rest;
    return `${mfr}::${model}`;
}

export function propagateModelImages(cars) {
    // Gather one image per model family
    const familyImg = {};
    cars.forEach(c => {
        if (!c.image) return;
        const key = getModelKey(c);
        if (!familyImg[key]) familyImg[key] = c.image;
    });
    // Copy image to siblings that don't have one
    return cars.map(c => {
        if (c.image) return c;
        const img = familyImg[getModelKey(c)];
        return img ? { ...c, image: img } : c;
    });
}

// ── Vehicle Data Cache ───────────────────────────────────────
let _vehicleCache = null;
let _cacheTs = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

export async function getAllVehicles() {
    if (_vehicleCache && Date.now() - _cacheTs < CACHE_TTL) return _vehicleCache;
    const { data, error } = await supabase
        .from('Cardetailtable')
        .select('*')
        .order('manufacturer', { ascending: true });
    if (error) throw error;
    const mapped = (data || []).map(car => ({
        ...car,
        ui_name: `${car.manufacturer} ${car.name} (${car.year})`,
        fuel_type: guessFuelType(car),
        body_type: guessBodyType(car),
        base_price: car.ex_showroom_price || lookupBasePrice(car.name) || null,
    }));
    _vehicleCache = propagateModelImages(mapped);
    _cacheTs = Date.now();
    return _vehicleCache;
}

function guessFuelType(car) {
    const cat = (car.category || '').toLowerCase();
    if (cat.includes('electric')) return 'electric';
    if (cat.includes('hybrid')) return 'hybrid';
    if (cat.includes('diesel')) return 'diesel';
    return 'petrol';
}

function guessBodyType(car) {
    const nm = `${car.manufacturer} ${car.name}`.toLowerCase();
    if (/innova|ertiga|carens|marazzo/.test(nm)) return 'mpv';
    if (/punch|ignis|kwid|swift|baleno|i10|i20|altroz|glanza|polo|jazz|tiago|leaf|bolt/.test(nm)) return 'hatchback';
    if (/model s|model 3|city|civic|camry|corolla|verna|slavia|virtus|elantra/.test(nm)) return 'sedan';
    if (/brezza|venue|sonet|magnite|nexon|fronx|exter/.test(nm)) return 'compact suv';
    if (/coupe|mustang|camaro|supra/.test(nm)) return 'coupe';
    return 'suv';
}

// ── 1. Compare Vehicles ──────────────────────────────────────
export async function compareVehicles(name1, name2) {
    const vehicles = await getAllVehicles();
    const find = (q) => {
        const ql = q.toLowerCase().trim();
        return vehicles.find(v =>
            v.ui_name.toLowerCase().includes(ql) ||
            v.name.toLowerCase().includes(ql) ||
            `${v.manufacturer} ${v.name}`.toLowerCase().includes(ql)
        );
    };
    const v1 = find(name1);
    const v2 = find(name2);
    if (!v1 || !v2) {
        return { error: true, missing: !v1 ? name1 : name2, found: v1 || v2 };
    }

    const buildProfile = (v) => {
        const bp = v.base_price;
        const fuelCostYearly = estimateYearlyFuelCost(v, 30);
        const co2Yearly = estimateYearlyCO2(v, 30);
        const maintenanceYearly = v.est_yearly_maintenance_inr || 15000;
        const ownershipCost5y = (bp || 0) + fuelCostYearly * 5 + maintenanceYearly * 5;
        const sustainabilityScore = computeSustainabilityScore(v);
        return {
            name: v.ui_name,
            image: v.image || null,
            manufacturer: v.manufacturer,
            category: v.category,
            fuel_type: v.fuel_type,
            base_price: bp,
            base_price_fmt: bp ? formatINR(bp) : 'N/A',
            fuel_cost_yearly: Math.round(fuelCostYearly),
            fuel_cost_yearly_fmt: formatINR(Math.round(fuelCostYearly)),
            co2_yearly_kg: Math.round(co2Yearly),
            ownership_5y: Math.round(ownershipCost5y),
            ownership_5y_fmt: formatINR(Math.round(ownershipCost5y)),
            sustainability_score: sustainabilityScore,
            range_km: v.range_km || null,
            battery_capacity: v.battery_capacity || null,
            efficiency: v.univ_efficiency_km_kwh_e || null,
            fuel_economy: v.avg_fuel_economy || null,
        };
    };

    const p1 = buildProfile(v1);
    const p2 = buildProfile(v2);

    // Recommendation
    let recommendation = '';
    if (p1.sustainability_score > p2.sustainability_score) {
        recommendation = `🌱 ${p1.name} is the greener choice with a nutrition score of ${p1.sustainability_score}/20.`;
    } else if (p2.sustainability_score > p1.sustainability_score) {
        recommendation = `🌱 ${p2.name} is the greener choice with a nutrition score of ${p2.sustainability_score}/20.`;
    } else {
        recommendation = `🌱 Both vehicles have similar sustainability scores!`;
    }

    return { error: false, vehicle1: p1, vehicle2: p2, recommendation };
}

// ── 2. Find Eco-Friendly Option ──────────────────────────────
export async function findEcoFriendly({ budgetMin = 0, budgetMax = Infinity, bodyType = 'all', fuelType = 'all' }) {
    const vehicles = await getAllVehicles();
    let filtered = vehicles.filter(v => {
        const bp = v.base_price || 0;
        if (bp < budgetMin || bp > budgetMax) return false;
        if (bodyType !== 'all' && v.body_type !== bodyType) return false;
        if (fuelType !== 'all' && v.fuel_type !== fuelType) return false;
        return true;
    });

    // Sort by lowest lifecycle emissions
    filtered.sort((a, b) => {
        const ea = a.lifecycle_gco2_km || (a.fuel_type === 'electric' ? 0 : 999);
        const eb = b.lifecycle_gco2_km || (b.fuel_type === 'electric' ? 0 : 999);
        return ea - eb;
    });

    const best = filtered[0];
    if (!best) return { error: true, message: 'No vehicles found matching your criteria. Try widening your filters!' };

    const co2Saved = estimateYearlyCO2Savings(best, 30);
    const costSaved = estimateYearlyCostSavings(best, 30);

    return {
        error: false,
        best: {
            name: best.ui_name,
            image: best.image || null,
            category: best.category,
            fuel_type: best.fuel_type,
            base_price_fmt: best.base_price ? formatINR(best.base_price) : 'N/A',
            sustainability_score: computeSustainabilityScore(best),
        },
        co2_saved_yearly_kg: Math.round(co2Saved),
        cost_saved_yearly: Math.round(costSaved),
        cost_saved_yearly_fmt: formatINR(Math.round(costSaved)),
        alternatives: filtered.slice(1, 4).map(v => ({
            name: v.ui_name,
            fuel_type: v.fuel_type,
            base_price_fmt: v.base_price ? formatINR(v.base_price) : 'N/A',
        })),
    };
}

// ── 3. Cost Calculator ───────────────────────────────────────
export function calculateCosts({ dailyKm = 30, fuelPrice = AVG_PETROL_PRICE, electricityCost = AVG_ELECTRICITY_COST, fuelMileage = AVG_PETROL_MILEAGE }) {
    // Petrol/Diesel cost
    const dailyFuelLitres = dailyKm / fuelMileage;
    const dailyFuelCost = dailyFuelLitres * fuelPrice;
    const monthlyFuelCost = dailyFuelCost * 30;
    const yearlyFuelCost = dailyFuelCost * DAYS_PER_YEAR;

    // EV cost
    const dailyKwh = dailyKm / AVG_EV_EFFICIENCY;
    const dailyEvCost = dailyKwh * electricityCost;
    const monthlyEvCost = dailyEvCost * 30;
    const yearlyEvCost = dailyEvCost * DAYS_PER_YEAR;

    // Savings
    const yearlySaving = yearlyFuelCost - yearlyEvCost;
    const fiveYearSaving = yearlySaving * YEARS_PROJECTION;

    // Break-even (assuming EV premium of ~5 lakh)
    const evPremium = 500000;
    const breakEvenYears = yearlySaving > 0 ? (evPremium / yearlySaving) : Infinity;

    return {
        monthly_fuel_cost: Math.round(monthlyFuelCost),
        monthly_fuel_cost_fmt: formatINR(Math.round(monthlyFuelCost)),
        monthly_ev_cost: Math.round(monthlyEvCost),
        monthly_ev_cost_fmt: formatINR(Math.round(monthlyEvCost)),
        yearly_fuel_cost: Math.round(yearlyFuelCost),
        yearly_ev_cost: Math.round(yearlyEvCost),
        five_year_saving: Math.round(fiveYearSaving),
        five_year_saving_fmt: formatINR(Math.round(fiveYearSaving)),
        break_even_years: Math.round(breakEvenYears * 10) / 10,
        monthly_saving: Math.round(monthlyFuelCost - monthlyEvCost),
        monthly_saving_fmt: formatINR(Math.round(monthlyFuelCost - monthlyEvCost)),
    };
}

// ── 4. Best EV Under Budget ──────────────────────────────────
export async function bestEVUnderBudget({ budget = 2000000, usage = 'city' }) {
    const vehicles = await getAllVehicles();
    let evs = vehicles.filter(v => {
        if (v.fuel_type !== 'electric') return false;
        if (v.base_price && v.base_price > budget) return false;
        return true;
    });

    // Sort by range (highway) or by efficiency (city)
    if (usage === 'highway') {
        evs.sort((a, b) => (b.range_km || 0) - (a.range_km || 0));
    } else {
        evs.sort((a, b) => (b.univ_efficiency_km_kwh_e || 0) - (a.univ_efficiency_km_kwh_e || 0));
    }

    if (evs.length === 0) {
        return { error: true, message: 'No EVs found under your budget. Try increasing it!' };
    }

    return {
        error: false,
        results: evs.slice(0, 4).map(ev => {
            const runCost = estimateYearlyFuelCost(ev, 30);
            const co2Reduction = estimateYearlyCO2Savings(ev, 30);
            return {
                name: ev.ui_name,
                image: ev.image || null,
                base_price_fmt: ev.base_price ? formatINR(ev.base_price) : 'N/A',
                range_km: ev.range_km || 'N/A',
                battery_capacity: ev.battery_capacity || 'N/A',
                charging_time: ev.battery_capacity ? `~${Math.round(ev.battery_capacity / 7.2)} hrs (home)` : 'N/A',
                running_cost_yearly_fmt: formatINR(Math.round(runCost)),
                co2_reduction_kg: Math.round(co2Reduction),
            };
        }),
    };
}

// ── 5. Generate Insight Strings (USP Layer) ──────────────────
export function generateInsights(vehicleName, dailyKm = 30) {
    const co2Saved5y = (estimateICECO2(dailyKm) * 5) / 1000; // in tons
    const costSaved5y = (estimateICEFuelCost(dailyKm) - estimateEVFuelCost(dailyKm)) * 5;
    const breakEven = costSaved5y > 0 ? (500000 / (costSaved5y / 5)) : null;

    return [
        `💡 Switching to an EV can reduce ${co2Saved5y.toFixed(1)} tons of CO₂ in 5 years.`,
        `💡 You could save ${formatINR(Math.round(costSaved5y))} over 5 years.`,
        breakEven && breakEven < 10
            ? `💡 Break-even in ${breakEven.toFixed(1)} years — then it's pure savings!`
            : `💡 EVs keep getting more affordable every year 🚀`,
    ];
}

// ── Smart Hinglish responses ─────────────────────────────────
const HINGLISH_TIPS = [
    "Petrol mehenga padta hai long term 😅 EV zyada sasta hai!",
    "Ek baar EV liya toh fuel bill bhool jaoge! ⚡",
    "Green drive = smart drive. Paisa bhi bachao, planet bhi 🌍",
    "EV mein maintenance bhi kam hota hai boss! 🔧",
    "CO₂ kam, savings zyada — what a deal! 🤑",
];

export function getRandomHinglishTip() {
    return HINGLISH_TIPS[Math.floor(Math.random() * HINGLISH_TIPS.length)];
}

// ── Helper functions ─────────────────────────────────────────
function estimateYearlyFuelCost(vehicle, dailyKm) {
    if (vehicle.fuel_type === 'electric') {
        const kwh = dailyKm / (vehicle.univ_efficiency_km_kwh_e || AVG_EV_EFFICIENCY);
        return kwh * AVG_ELECTRICITY_COST * DAYS_PER_YEAR;
    }
    const mileage = vehicle.avg_fuel_economy
        ? vehicle.avg_fuel_economy * 0.425144 // MPG to km/l
        : AVG_PETROL_MILEAGE;
    const litres = dailyKm / mileage;
    const price = vehicle.fuel_type === 'diesel' ? AVG_DIESEL_PRICE : AVG_PETROL_PRICE;
    return litres * price * DAYS_PER_YEAR;
}

function estimateYearlyCO2(vehicle, dailyKm) {
    if (vehicle.fuel_type === 'electric') return 0;
    const emissionsGKm = vehicle.lifecycle_gco2_km || 160;
    return (dailyKm * emissionsGKm * DAYS_PER_YEAR) / 1000;
}

function estimateYearlyCO2Savings(vehicle, dailyKm) {
    const iceCO2 = (dailyKm * 160 * DAYS_PER_YEAR) / 1000;
    const thisCO2 = estimateYearlyCO2(vehicle, dailyKm);
    return Math.max(0, iceCO2 - thisCO2);
}

function estimateYearlyCostSavings(vehicle, dailyKm) {
    const iceCost = (dailyKm / AVG_PETROL_MILEAGE) * AVG_PETROL_PRICE * DAYS_PER_YEAR;
    const thisCost = estimateYearlyFuelCost(vehicle, dailyKm);
    return Math.max(0, iceCost - thisCost);
}

function estimateICECO2(dailyKm) {
    return (dailyKm * 160 * DAYS_PER_YEAR) / 1000;
}

function estimateICEFuelCost(dailyKm) {
    return (dailyKm / AVG_PETROL_MILEAGE) * AVG_PETROL_PRICE * DAYS_PER_YEAR;
}

function estimateEVFuelCost(dailyKm) {
    return (dailyKm / AVG_EV_EFFICIENCY) * AVG_ELECTRICITY_COST * DAYS_PER_YEAR;
}

/**
 * calculateNutritionScore — Clean, reusable Nutrition Level scorer.
 *
 * Rules:
 *   Range   : integer 1–20
 *   Ceiling : emissions ≤ 100 gCO₂/km → 20
 *   Floor   : emissions ≥ 250 gCO₂/km → 1
 *   Sliding : Score = 20 − ((CO₂ − 100) / 150) × 19
 *
 * @param {number} co2  Lifecycle emissions in gCO₂/km
 * @returns {number}     Integer score 1–20
 */
export function calculateNutritionScore(co2) {
    if (co2 == null || isNaN(co2) || co2 <= 0) return 1;   // invalid → worst-case
    if (co2 <= 100) return 20;
    if (co2 >= 250) return 1;
    const raw = 20 - ((co2 - 100) / 150) * 19;
    return Math.round(Math.max(1, Math.min(20, raw)));
}

function computeSustainabilityScore(vehicle) {
    const emissions = vehicle.lifecycle_gco2_km
        || (vehicle.fuel_type === 'electric' ? 0 : vehicle.fuel_type === 'hybrid' ? 120 : 200);
    return calculateNutritionScore(emissions);
}

export { formatINR, computeSustainabilityScore };
