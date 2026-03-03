/* ══════════════════════════════════════════════════════════════
   Greenwashing Detection — Static Data Module (LOKI v2)
   ══════════════════════════════════════════════════════════════ */

import { supabase } from '../supabaseClient';

/* ── Greenwashing keyword dictionary ───────────────────────── */
export const GREENWASH_KEYWORDS = [
    { term: 'eco-friendly', severity: 'high', explanation: 'Vague and unregulated term with no measurable definition. Any product can claim to be "eco-friendly" without proof.' },
    { term: 'green', severity: 'medium', explanation: 'Overly broad descriptor that lacks specificity. Does not indicate measurable environmental benefit.' },
    { term: 'sustainable', severity: 'medium', explanation: 'Often used without quantifiable sustainability metrics or third-party verification.' },
    { term: 'carbon neutral', severity: 'high', explanation: 'Requires verified carbon offset certificates. Many claims rely on unverified or low-quality offsets.' },
    { term: 'zero emission', severity: 'high', explanation: 'Only refers to tailpipe emissions — ignores manufacturing, battery production, and electricity generation emissions.' },
    { term: 'clean energy', severity: 'medium', explanation: 'Ambiguous term. The "cleanliness" depends on the energy source, which is rarely disclosed.' },
    { term: 'net zero', severity: 'high', explanation: 'Requires transparent accounting of all emissions and verified offsets. Frequently used without supporting data.' },
    { term: 'environmentally friendly', severity: 'high', explanation: 'No legal or scientific standard defines this. Often used as marketing without substantiation.' },
    { term: 'all-natural', severity: 'low', explanation: 'Irrelevant in automotive context and used to create a false sense of environmental responsibility.' },
    { term: 'planet-friendly', severity: 'high', explanation: 'Unsubstantiated superlative claim with no measurable criteria.' },
    { term: 'guilt-free', severity: 'medium', explanation: 'Emotional appeal without factual basis. No vehicle is entirely without environmental impact.' },
    { term: 'low carbon', severity: 'medium', explanation: 'Relative term — low compared to what baseline? Requires context and data to be meaningful.' },
    { term: 'green technology', severity: 'medium', explanation: 'Generic label that does not specify which technology or its verified environmental benefit.' },
    { term: 'earth-conscious', severity: 'medium', explanation: 'Marketing language with no regulatory backing or measurable standard.' },
    { term: 'emission-free', severity: 'high', explanation: 'Misleading — no vehicle has zero lifecycle emissions when accounting for manufacturing and energy production.' },
    { term: 'climate positive', severity: 'high', explanation: 'Extraordinary claim requiring extraordinary evidence. Rarely backed by independent verification.' },
    { term: 'biodegradable', severity: 'low', explanation: 'Rarely relevant to vehicles. Used to distract from actual emissions impact.' },
    { term: 'recyclable', severity: 'low', explanation: 'Being recyclable does not mean it will be recycled; depends on infrastructure and processes.' },
    { term: 'reduces carbon footprint', severity: 'medium', explanation: 'Relative claim that needs a clear baseline comparison and verified data.' },
    { term: 'powered by nature', severity: 'high', explanation: 'Poetic but scientifically meaningless. No vehicle runs purely on nature without infrastructure.' },
    /* ── New keywords sourced from real-world regulatory rulings ─ */
    { term: 'self-charging', severity: 'high', explanation: 'ASA (UK) ruled this misleading for hybrids — energy comes from petrol, not free charging. Toyota/Lexus were cited in 2023-24.' },
    { term: 'electrified', severity: 'high', explanation: 'Toyota used "Electrified" branding to blur BEV vs hybrid distinction. Manipulated search results to steer EV shoppers toward petrol hybrids (Jan 2024 report).' },
    { term: 'clean diesel', severity: 'high', explanation: 'Post-Dieselgate term. Volkswagen paid $30B+ for falsely marketing "clean diesel" with defeat devices. No diesel is truly "clean" — all produce NOx and PM.' },
    { term: 'nature-inspired', severity: 'medium', explanation: 'Vague association with nature without any measurable environmental standard or certification.' },
    { term: 'carbon negative', severity: 'high', explanation: 'Near-impossible for any vehicle. Would require removing more CO₂ than produced across entire lifecycle — no automotive manufacturer has achieved this.' },
    { term: 'save the planet', severity: 'high', explanation: 'Hyperbolic marketing with no scientific basis. No single vehicle purchase can "save the planet." Cited in multiple greenwashing complaints.' },
    { term: 'future-proof', severity: 'medium', explanation: 'Implies permanence without evidence. Used to distract from current emissions impact with vague promises about upcoming technology.' },
    { term: 'responsible choice', severity: 'medium', explanation: 'Subjective and unmeasurable. What qualifies as "responsible" varies and is not defined by any standard. Often used to guilt consumers.' },
];

/* ── Valid certifications ──────────────────────────────────── */
export const CERTIFICATIONS = [
    { id: 'iso14001', name: 'ISO 14001', category: 'Environmental Management', description: 'International standard for environmental management systems.' },
    { id: 'iso14064', name: 'ISO 14064', category: 'GHG Accounting', description: 'Standard for quantifying, monitoring, and reporting greenhouse gas emissions.' },
    { id: 'epa_smartway', name: 'EPA SmartWay', category: 'Transport Efficiency', description: 'US EPA program recognizing vehicles meeting strict fuel-efficiency standards.' },
    { id: 'leed', name: 'LEED Certification', category: 'Green Building', description: 'Applies to manufacturing plant sustainability commitments.' },
    { id: 'carb_zlev', name: 'CARB ZEV', category: 'Zero Emission Vehicle', description: 'California Air Resources Board Zero-Emission Vehicle certification.' },
    { id: 'euro_ncap', name: 'Euro NCAP Green', category: 'Vehicle Safety & Efficiency', description: 'European rating system including environmental performance metrics.' },
    { id: 'energy_star', name: 'ENERGY STAR', category: 'Energy Efficiency', description: 'US EPA and DOE program certifying energy-efficient products.' },
    { id: 'bs_vi', name: 'BS-VI Compliance', category: 'Emission Standard', description: 'Bharat Stage VI — India\'s strictest vehicular emission standard.' },
    { id: 'wltp', name: 'WLTP Tested', category: 'Emission Testing', description: 'Worldwide Harmonised Light Vehicle Test Procedure — standardised lab-testing.' },
    { id: 'cdp', name: 'CDP Disclosure', category: 'Climate Disclosure', description: 'Carbon Disclosure Project — system for measuring environmental impacts.' },
    { id: 'sci_targets', name: 'Science Based Targets', category: 'Climate Goals', description: 'Targets aligned with the Paris Agreement to limit warming to 1.5°C.' },
    { id: 'tcfd', name: 'TCFD Reporting', category: 'Financial Risk Disclosure', description: 'Task Force on Climate-related Financial Disclosures — climate risk transparency.' },
];

/* ── Government emission standards ─────────────────────────── */
export const EMISSION_STANDARDS = [
    { id: 'bs_vi', name: 'BS-VI (India)', region: 'India', maxCO2: 113, maxPM: 0.0045, maxNOx: 0.06, description: 'Bharat Stage VI — India\'s current strictest emission norm.' },
    { id: 'euro6', name: 'Euro 6d', region: 'European Union', maxCO2: 95, maxPM: 0.0045, maxNOx: 0.06, description: 'EU standard limiting CO₂ to 95 g/km fleet average.' },
    { id: 'epa_t3', name: 'EPA Tier 3', region: 'United States', maxCO2: 125, maxPM: 0.003, maxNOx: 0.03, description: 'US federal standard for light-duty vehicles.' },
    { id: 'china6', name: 'China 6b', region: 'China', maxCO2: 117, maxPM: 0.003, maxNOx: 0.035, description: 'China\'s latest emission standard.' },
    { id: 'jp_2030', name: 'Japan 2030 Targets', region: 'Japan', maxCO2: 95, maxPM: 0.005, maxNOx: 0.05, description: 'Japan\'s projected 2030 emission targets.' },
];

/* ══════════════════════════════════════════════════════════════
   VEHICLE CLAIMS DATABASE (companies_claim + verified_data)
   ══════════════════════════════════════════════════════════════
   Each entry:
   - companies_claim: what the manufacturer markets/claims
   - verified_data: internal verified data (Source: Priority 1)
   ══════════════════════════════════════════════════════════════ */
export const VEHICLE_CLAIMS = [
    {
        car_id: 'tata_nexon_ev',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Nexon EV Max',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 45,
            claimed_range_km: 465,
            claimed_certifications: ['carbon neutral', 'zero emission'],
            marketing_text: 'Zero tailpipe emissions for a cleaner tomorrow. Powered by clean energy technology. India\'s greenest SUV with sustainable manufacturing.',
        },
        verified_data: {
            actual_co2_gkm: 0,
            actual_lifecycle_co2: 85,
            actual_range_km: 437,
            battery_capacity_kwh: 40.5,
            certifications: ['bs_vi', 'wltp'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors Sustainability Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'mg_zs_ev',
        company_name: 'MG Motor (SAIC)',
        vehicle_name: 'MG ZS EV',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 38,
            claimed_range_km: 480,
            claimed_certifications: ['eco-friendly', 'zero emission'],
            marketing_text: 'Experience guilt-free driving with zero emissions. The car that loves the planet as much as you do. Eco-friendly from factory to road.',
        },
        verified_data: {
            actual_co2_gkm: 0,
            actual_lifecycle_co2: 92,
            actual_range_km: 461,
            battery_capacity_kwh: 50.3,
            certifications: ['wltp'],
            emission_standard: 'bs_vi',
            lca_source: 'SAIC Motor ESG Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'hyundai_creta',
        company_name: 'Hyundai Motor India',
        vehicle_name: 'Hyundai Creta 1.5 Turbo',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 120,
            claimed_lifecycle_co2: 155,
            claimed_range_km: 650,
            claimed_certifications: ['eco-friendly', 'sustainable'],
            marketing_text: 'Engineered with advanced eco-friendly technology. Reduces carbon footprint with smart fuel management. Sustainable driving experience.',
        },
        verified_data: {
            actual_co2_gkm: 149,
            actual_lifecycle_co2: 198,
            actual_range_km: 600,
            fuel_efficiency_kmpl: 17.0,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Hyundai India Sustainability Disclosure 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'maruti_grand_vitara_hybrid',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Grand Vitara Strong Hybrid',
        category: 'Hybrid',
        companies_claim: {
            claimed_co2_gkm: 80,
            claimed_lifecycle_co2: 110,
            claimed_range_km: 1100,
            claimed_certifications: ['carbon neutral', 'green technology'],
            marketing_text: 'India\'s strongest hybrid with lowest-in-segment emissions. Green technology that truly delivers. Carbon neutral ambitions backed by Toyota hybrid tech.',
        },
        verified_data: {
            actual_co2_gkm: 97,
            actual_lifecycle_co2: 142,
            actual_range_km: 1000,
            fuel_efficiency_kmpl: 27.97,
            certifications: ['bs_vi', 'wltp'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki Integrated Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'toyota_innova_hycross',
        company_name: 'Toyota Kirloskar',
        vehicle_name: 'Toyota Innova Hycross Hybrid',
        category: 'Hybrid',
        companies_claim: {
            claimed_co2_gkm: 90,
            claimed_lifecycle_co2: 120,
            claimed_range_km: 1000,
            claimed_certifications: ['eco-friendly', 'low carbon'],
            marketing_text: 'Eco-friendly family mobility solution. Low carbon MPV powered by self-charging hybrid. Sustainable without compromise.',
        },
        verified_data: {
            actual_co2_gkm: 112,
            actual_lifecycle_co2: 158,
            actual_range_km: 950,
            fuel_efficiency_kmpl: 21.1,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Toyota Kirloskar Environmental Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'mahindra_xuv400_ev',
        company_name: 'Mahindra & Mahindra',
        vehicle_name: 'Mahindra XUV400 EV',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 50,
            claimed_range_km: 470,
            claimed_certifications: ['planet-friendly', 'zero emission', 'sustainable'],
            marketing_text: 'Born electric. Born sustainable. Zero emissions, maximum adventure. Planet-friendly SUV for the conscious driver.',
        },
        verified_data: {
            actual_co2_gkm: 0,
            actual_lifecycle_co2: 96,
            actual_range_km: 456,
            battery_capacity_kwh: 39.4,
            certifications: ['bs_vi', 'wltp'],
            emission_standard: 'bs_vi',
            lca_source: 'Mahindra ESG Sustainability Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'kia_seltos_diesel',
        company_name: 'Kia India',
        vehicle_name: 'Kia Seltos 1.5 CRDi',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 135,
            claimed_lifecycle_co2: 175,
            claimed_range_km: 750,
            claimed_certifications: ['clean combustion', 'emission standard leader'],
            marketing_text: 'Advanced diesel engine with clean combustion technology. Engineered for efficiency and reduced environmental impact. Meeting the highest emission standards.',
        },
        verified_data: {
            actual_co2_gkm: 162,
            actual_lifecycle_co2: 215,
            actual_range_km: 700,
            fuel_efficiency_kmpl: 20.8,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Kia India Regulatory Filing 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'byd_atto3',
        company_name: 'BYD Auto',
        vehicle_name: 'BYD Atto 3',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 42,
            claimed_range_km: 550,
            claimed_certifications: ['zero emission', 'net zero', 'sustainable'],
            marketing_text: 'True zero-emission electric vehicle. Blade battery — safest and most sustainable EV battery. Net zero lifecycle commitment by 2030.',
        },
        verified_data: {
            actual_co2_gkm: 0,
            actual_lifecycle_co2: 88,
            actual_range_km: 521,
            battery_capacity_kwh: 60.5,
            certifications: ['wltp', 'euro_ncap'],
            emission_standard: 'euro6',
            lca_source: 'BYD Auto ESG Report 2025',
            source: 'internal',
        },
    },
    /* ── New ICE/Hybrid vehicles with online-sourced greenwashing data ─ */
    {
        car_id: 'maruti_brezza_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Brezza 1.5 Petrol',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 115,
            claimed_lifecycle_co2: 145,
            claimed_range_km: 700,
            claimed_certifications: ['eco-friendly', 'green technology'],
            marketing_text: 'Smartest SUV with lowest emissions in its segment. Green technology powered by Suzuki\'s progressive smart hybrid. Eco-friendly driving for the conscious Indian family.',
        },
        verified_data: {
            actual_co2_gkm: 143,
            actual_lifecycle_co2: 192,
            actual_range_km: 640,
            fuel_efficiency_kmpl: 19.80,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki Integrated Report 2025 / CAFÉ-II FY23 compliance data',
            source: 'internal',
        },
    },
    {
        car_id: 'hyundai_venue_petrol',
        company_name: 'Hyundai Motor India',
        vehicle_name: 'Hyundai Venue 1.2 Kappa',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 118,
            claimed_lifecycle_co2: 150,
            claimed_range_km: 600,
            claimed_certifications: ['eco-friendly', 'sustainable'],
            marketing_text: 'India\'s favourite eco-friendly compact SUV. Designed for a sustainable urban lifestyle. Advanced fuel management reduces your carbon footprint.',
        },
        verified_data: {
            actual_co2_gkm: 152,
            actual_lifecycle_co2: 205,
            actual_range_km: 530,
            fuel_efficiency_kmpl: 16.9,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Hyundai India Sustainability Disclosure 2025 / Greenpeace East Asia Jan 2025 Report',
            source: 'internal',
        },
    },
    {
        car_id: 'tata_harrier_diesel',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Harrier 2.0 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 130,
            claimed_lifecycle_co2: 165,
            claimed_range_km: 800,
            claimed_certifications: ['sustainable', 'clean diesel', 'responsible choice'],
            marketing_text: 'Built with responsible engineering. Clean diesel technology that powers India\'s safest SUV. Sustainable performance, zero compromise.',
        },
        verified_data: {
            actual_co2_gkm: 168,
            actual_lifecycle_co2: 228,
            actual_range_km: 720,
            fuel_efficiency_kmpl: 16.35,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors Sustainability Report 2025 / CAFÉ-II FY23 filing',
            source: 'internal',
        },
    },
    {
        car_id: 'mahindra_scorpio_n_diesel',
        company_name: 'Mahindra & Mahindra',
        vehicle_name: 'Mahindra Scorpio-N 2.2 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 140,
            claimed_lifecycle_co2: 170,
            claimed_range_km: 750,
            claimed_certifications: ['clean combustion', 'eco-friendly'],
            marketing_text: 'The Big Daddy of clean performance. Advanced mHawk diesel with eco-friendly combustion technology. Powerful yet responsible.',
        },
        verified_data: {
            actual_co2_gkm: 178,
            actual_lifecycle_co2: 242,
            actual_range_km: 680,
            fuel_efficiency_kmpl: 15.72,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Mahindra ESG Sustainability Report 2025 / CAFÉ-II norms non-compliance FY23',
            source: 'internal',
        },
    },
    {
        car_id: 'kia_sonet_diesel',
        company_name: 'Kia India',
        vehicle_name: 'Kia Sonet 1.5 CRDi',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 125,
            claimed_lifecycle_co2: 160,
            claimed_range_km: 750,
            claimed_certifications: ['green technology', 'earth-conscious'],
            marketing_text: 'Efficient and eco-conscious compact SUV. Green workshop certified. Earth-conscious technology for the planet-aware driver.',
        },
        verified_data: {
            actual_co2_gkm: 158,
            actual_lifecycle_co2: 218,
            actual_range_km: 690,
            fuel_efficiency_kmpl: 20.6,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Kia India Green Workshop Sustainability Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'toyota_fortuner_diesel',
        company_name: 'Toyota Kirloskar',
        vehicle_name: 'Toyota Fortuner 2.8 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 160,
            claimed_lifecycle_co2: 195,
            claimed_range_km: 700,
            claimed_certifications: ['responsible choice', 'low carbon'],
            marketing_text: 'A responsible choice for the adventurous family. Low carbon diesel with Toyota\'s legendary reliability. Engineered to tread lightly.',
        },
        verified_data: {
            actual_co2_gkm: 210,
            actual_lifecycle_co2: 278,
            actual_range_km: 620,
            fuel_efficiency_kmpl: 10.1,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Toyota Kirloskar Environmental Report 2025 / Greenpeace global auto emissions tracking',
            source: 'internal',
        },
    },
    /* ══ Batch 2: 18 more Indian-market vehicles (online-sourced data) ══ */
    {
        car_id: 'maruti_swift_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Swift 1.2 Z12E',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 90,
            claimed_lifecycle_co2: 120,
            claimed_range_km: 850,
            claimed_certifications: ['eco-friendly', 'green technology', 'low carbon'],
            marketing_text: 'India\'s most fuel efficient hatchback. Lowest CO₂ in segment at 95 g/km. Green technology with Suzuki\'s next-gen Z-series engine. Eco-friendly and fun to drive.',
        },
        verified_data: {
            actual_co2_gkm: 96,
            actual_lifecycle_co2: 145,
            actual_range_km: 810,
            fuel_efficiency_kmpl: 24.80,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki official specs 2024 / ARAI certified',
            source: 'internal',
        },
    },
    {
        car_id: 'maruti_baleno_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Baleno DualJet',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 95,
            claimed_lifecycle_co2: 125,
            claimed_range_km: 830,
            claimed_certifications: ['eco-friendly', 'sustainable'],
            marketing_text: 'Premium hatchback with DualJet Smart Hybrid. Sustainable performance meets bold design. Eco-friendly technology for the modern urban commuter.',
        },
        verified_data: {
            actual_co2_gkm: 107,
            actual_lifecycle_co2: 158,
            actual_range_km: 780,
            fuel_efficiency_kmpl: 22.35,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki Nexa official specs / ARAI certified 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'maruti_wagonr_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Wagon R 1.2',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 88,
            claimed_lifecycle_co2: 115,
            claimed_range_km: 720,
            claimed_certifications: ['green technology', 'eco-friendly'],
            marketing_text: 'India\'s tallboy icon. Green technology with class-leading mileage. Made for the eco-conscious Indian family. Big on space, light on the planet.',
        },
        verified_data: {
            actual_co2_gkm: 94,
            actual_lifecycle_co2: 142,
            actual_range_km: 680,
            fuel_efficiency_kmpl: 25.4,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki official specs / ARAI certified 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'maruti_ertiga_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Ertiga 1.5 Smart Hybrid',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 100,
            claimed_lifecycle_co2: 130,
            claimed_range_km: 900,
            claimed_certifications: ['self-charging', 'green technology'],
            marketing_text: 'India\'s favourite MPV with self-charging Smart Hybrid technology. Green technology that charges itself. Efficient 7-seater for conscious families.',
        },
        verified_data: {
            actual_co2_gkm: 118,
            actual_lifecycle_co2: 168,
            actual_range_km: 810,
            fuel_efficiency_kmpl: 20.3,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki Ertiga specs / ARAI certified 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'maruti_fronx_petrol',
        company_name: 'Maruti Suzuki',
        vehicle_name: 'Maruti Suzuki Fronx 1.0 Turbo',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 105,
            claimed_lifecycle_co2: 135,
            claimed_range_km: 750,
            claimed_certifications: ['eco-friendly', 'future-proof'],
            marketing_text: 'Future-proof coupe SUV styling with eco-friendly turbo engine. Bold looks, light footprint. Nexa\'s greenest compact SUV.',
        },
        verified_data: {
            actual_co2_gkm: 128,
            actual_lifecycle_co2: 175,
            actual_range_km: 680,
            fuel_efficiency_kmpl: 21.5,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Maruti Suzuki Nexa official specs / ARAI 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'hyundai_i20_petrol',
        company_name: 'Hyundai Motor India',
        vehicle_name: 'Hyundai i20 1.2 Kappa',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 105,
            claimed_lifecycle_co2: 140,
            claimed_range_km: 650,
            claimed_certifications: ['eco-friendly', 'sustainable'],
            marketing_text: 'India\'s premium hatchback with sustainable design. Eco-friendly i20 — engineered for the environmentally aware driver. Advanced fuel management technology.',
        },
        verified_data: {
            actual_co2_gkm: 119,
            actual_lifecycle_co2: 172,
            actual_range_km: 590,
            fuel_efficiency_kmpl: 20.0,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Hyundai official specs / Euro NCAP 2024 CO₂ data (119 g/km)',
            source: 'internal',
        },
    },
    {
        car_id: 'hyundai_verna_petrol',
        company_name: 'Hyundai Motor India',
        vehicle_name: 'Hyundai Verna 1.5 Turbo',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 110,
            claimed_lifecycle_co2: 145,
            claimed_range_km: 750,
            claimed_certifications: ['sustainable', 'responsible choice'],
            marketing_text: 'India\'s most advanced sedan. Responsible choice with class-leading ADAS. Sustainable engineering meets thrilling performance.',
        },
        verified_data: {
            actual_co2_gkm: 128,
            actual_lifecycle_co2: 182,
            actual_range_km: 690,
            fuel_efficiency_kmpl: 20.6,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Hyundai India official specs / Autocar India mileage test 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'hyundai_tucson_turbo',
        company_name: 'Hyundai Motor India',
        vehicle_name: 'Hyundai Tucson 2.0 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 130,
            claimed_lifecycle_co2: 170,
            claimed_range_km: 800,
            claimed_certifications: ['green technology', 'earth-conscious'],
            marketing_text: 'Parametric design meets green technology. Earth-conscious SUV with smart HTRAC AWD. Built for the planet-aware explorer.',
        },
        verified_data: {
            actual_co2_gkm: 154,
            actual_lifecycle_co2: 218,
            actual_range_km: 720,
            fuel_efficiency_kmpl: 18.4,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'WLTP 154 g/km / Greenpeace East Asia Hyundai-Kia emissions report Jan 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'kia_carens_diesel',
        company_name: 'Kia India',
        vehicle_name: 'Kia Carens 1.5 CRDi',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 120,
            claimed_lifecycle_co2: 155,
            claimed_range_km: 880,
            claimed_certifications: ['eco-friendly', 'green technology'],
            marketing_text: 'India\'s most versatile MPV. Eco-friendly diesel with best-in-class mileage. Green workshop certified for a cleaner tomorrow.',
        },
        verified_data: {
            actual_co2_gkm: 142,
            actual_lifecycle_co2: 198,
            actual_range_km: 800,
            fuel_efficiency_kmpl: 19.54,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Kia India / AutoX Carens Clavis specs 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'tata_punch_petrol',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Punch 1.2 Revotron',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 105,
            claimed_lifecycle_co2: 135,
            claimed_range_km: 680,
            claimed_certifications: ['eco-friendly', 'sustainable'],
            marketing_text: 'Born adventurous, built sustainable. India\'s safest micro-SUV with 5-star NCAP. Eco-friendly and adventure-ready for the responsible driver.',
        },
        verified_data: {
            actual_co2_gkm: 126,
            actual_lifecycle_co2: 178,
            actual_range_km: 600,
            fuel_efficiency_kmpl: 18.97,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors official specs / ARAI certified / Global NCAP 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'tata_altroz_petrol',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Altroz 1.2 Revotron',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 100,
            claimed_lifecycle_co2: 130,
            claimed_range_km: 750,
            claimed_certifications: ['sustainable', 'safe and green'],
            marketing_text: 'Gold standard in safety and sustainability. 5-star rated premium hatchback. Sustainable design, zero compromise on performance.',
        },
        verified_data: {
            actual_co2_gkm: 118,
            actual_lifecycle_co2: 168,
            actual_range_km: 680,
            fuel_efficiency_kmpl: 22.0,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors specs / ARAI / BNCAP 5-star safety rating 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'tata_safari_diesel',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Safari 2.0 Kryotec Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 135,
            claimed_lifecycle_co2: 170,
            claimed_range_km: 800,
            claimed_certifications: ['responsible choice', 'sustainable'],
            marketing_text: 'Reclaim your life responsibly. India\'s flagship SUV with 5-star safety. Sustainable diesel technology for the conscientious adventurer.',
        },
        verified_data: {
            actual_co2_gkm: 172,
            actual_lifecycle_co2: 235,
            actual_range_km: 715,
            fuel_efficiency_kmpl: 15.3,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors specs / ARAI / 5-star NCAP rating 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'tata_nexon_petrol',
        company_name: 'Tata Motors',
        vehicle_name: 'Tata Nexon 1.2 Turbo Petrol',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 110,
            claimed_lifecycle_co2: 140,
            claimed_range_km: 700,
            claimed_certifications: ['eco-friendly', 'green technology'],
            marketing_text: 'India\'s safest compact SUV. Eco-friendly turbocharged performance. Green technology that leads the segment in safety and sustainability.',
        },
        verified_data: {
            actual_co2_gkm: 132,
            actual_lifecycle_co2: 185,
            actual_range_km: 630,
            fuel_efficiency_kmpl: 17.4,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Tata Motors official specs / ARAI certified 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'mahindra_xuv700_diesel',
        company_name: 'Mahindra & Mahindra',
        vehicle_name: 'Mahindra XUV700 2.2 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 140,
            claimed_lifecycle_co2: 175,
            claimed_range_km: 830,
            claimed_certifications: ['sustainable', 'future-proof'],
            marketing_text: 'Feel the future. XUV700 — sustainable luxury packed with AdrenoX intelligence. Future-proof engineering for the responsible driver.',
        },
        verified_data: {
            actual_co2_gkm: 168,
            actual_lifecycle_co2: 232,
            actual_range_km: 750,
            fuel_efficiency_kmpl: 16.4,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Mahindra official specs / MotorOctane ARAI data Sep 2024 / ESG Report 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'mahindra_thar_diesel',
        company_name: 'Mahindra & Mahindra',
        vehicle_name: 'Mahindra Thar 2.2 Diesel',
        category: 'ICE - Diesel',
        companies_claim: {
            claimed_co2_gkm: 145,
            claimed_lifecycle_co2: 180,
            claimed_range_km: 700,
            claimed_certifications: ['eco-friendly', 'nature-inspired'],
            marketing_text: 'Born to explore, built eco-friendly. Nature-inspired design meets adventure. The Thar — explore the earth responsibly.',
        },
        verified_data: {
            actual_co2_gkm: 174,
            actual_lifecycle_co2: 238,
            actual_range_km: 640,
            fuel_efficiency_kmpl: 15.2,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Mahindra specs / ARAI certified / Cars24 mileage data 2024',
            source: 'internal',
        },
    },
    {
        car_id: 'mg_hector_petrol',
        company_name: 'MG Motor (SAIC)',
        vehicle_name: 'MG Hector 1.5 Turbo Petrol',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 130,
            claimed_lifecycle_co2: 165,
            claimed_range_km: 700,
            claimed_certifications: ['eco-friendly', 'green technology'],
            marketing_text: 'India\'s first internet SUV — smart and eco-friendly. Green technology with E20 compliance. Engineered for the digitally conscious, environmentally responsible driver.',
        },
        verified_data: {
            actual_co2_gkm: 163,
            actual_lifecycle_co2: 225,
            actual_range_km: 620,
            fuel_efficiency_kmpl: 13.79,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'MG Motor India specs / HT Auto mileage data / E20 compliance 2025',
            source: 'internal',
        },
    },
    {
        car_id: 'honda_city_petrol',
        company_name: 'Honda Cars India',
        vehicle_name: 'Honda City 1.5 i-VTEC',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 115,
            claimed_lifecycle_co2: 150,
            claimed_range_km: 750,
            claimed_certifications: ['eco-friendly', 'clean energy'],
            marketing_text: 'Legendary sedan with advanced eco-friendly i-VTEC engine. Clean energy performance meets Honda reliability. Make the responsible choice.',
        },
        verified_data: {
            actual_co2_gkm: 160,
            actual_lifecycle_co2: 215,
            actual_range_km: 660,
            fuel_efficiency_kmpl: 17.8,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Honda India specs / Car-emissions.com (159.6 g/km avg) / CAFÉ norm data',
            source: 'internal',
        },
    },
    {
        car_id: 'honda_city_hybrid',
        company_name: 'Honda Cars India',
        vehicle_name: 'Honda City e:HEV Hybrid',
        category: 'Hybrid',
        companies_claim: {
            claimed_co2_gkm: 80,
            claimed_lifecycle_co2: 105,
            claimed_range_km: 1100,
            claimed_certifications: ['self-charging', 'eco-friendly', 'green technology'],
            marketing_text: 'India\'s most efficient self-charging hybrid sedan. Eco-friendly electric driving without the plug. Green technology that charges itself — guilt-free luxury.',
        },
        verified_data: {
            actual_co2_gkm: 98,
            actual_lifecycle_co2: 140,
            actual_range_km: 950,
            fuel_efficiency_kmpl: 27.26,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Honda India official ARAI data / Cars24 real-world test 23.5 kmpl',
            source: 'internal',
        },
    },
    {
        car_id: 'honda_amaze_petrol',
        company_name: 'Honda Cars India',
        vehicle_name: 'Honda Amaze E MT (2024)',
        category: 'ICE - Petrol',
        companies_claim: {
            claimed_co2_gkm: 108,
            claimed_lifecycle_co2: 138,
            claimed_range_km: 650,
            claimed_certifications: ['eco-friendly', 'responsible choice'],
            marketing_text: 'The all-new Amaze — engineered for the responsible Indian family. Eco-friendly i-VTEC engine with best-in-class boot space. Make the smart, sustainable choice.',
        },
        verified_data: {
            actual_co2_gkm: 128,
            actual_lifecycle_co2: 182,
            actual_range_km: 560,
            fuel_efficiency_kmpl: 18.65,
            certifications: ['bs_vi'],
            emission_standard: 'bs_vi',
            lca_source: 'Honda India official ARAI specs 2024 / Team-BHP / HT Auto real-world test 15.1 kmpl',
            source: 'internal',
        },
    },
    /* ── Vehicle with NO internal data (only internet verified) ─ */
    {
        car_id: 'volvo_xc40_recharge',
        company_name: 'Volvo Cars',
        vehicle_name: 'Volvo XC40 Recharge',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 35,
            claimed_range_km: 425,
            claimed_certifications: ['climate neutral', 'net zero by 2030'],
            marketing_text: 'Leading the charge to climate neutrality. Our most sustainable car yet with a commitment to net zero by 2030.',
        },
        verified_data: null,  // No internal data — will trigger internet fetch
    },
    /* ── Vehicle with NO data anywhere ──────────────────────── */
    {
        car_id: 'startup_ev_concept',
        company_name: 'GreenDrive Startup',
        vehicle_name: 'GreenDrive Alpha EV',
        category: 'Electric',
        companies_claim: {
            claimed_co2_gkm: 0,
            claimed_lifecycle_co2: 20,
            claimed_range_km: 600,
            claimed_certifications: ['carbon negative', 'powered by nature'],
            marketing_text: 'The world\'s first carbon-negative vehicle. Powered by nature, engineered for earth. Emission-free from cradle to grave.',
        },
        verified_data: null,  // No internal data and no internet data will be found
    },
];

/* ══════════════════════════════════════════════════════════════
   INTERNET VERIFIED DATA (Secondary Source — Priority 2)
   Simulates verified data from trusted internet sources.
   Only used when internal verified_data is null.
   ══════════════════════════════════════════════════════════════ */
export const INTERNET_VERIFIED_DATA = {
    'volvo_xc40_recharge': {
        actual_co2_gkm: 0,
        actual_lifecycle_co2: 78,
        actual_range_km: 400,
        battery_capacity_kwh: 69,
        certifications: ['wltp', 'euro_ncap', 'iso14001'],
        emission_standard: 'euro6',
        lca_source: 'Volvo Cars LCA Report 2025 (Public)',
        source: 'internet_verified',
        fetch_source_url: 'https://www.volvocars.com/sustainability/reports/',   // NOT exposed in UI
        fetch_domain: 'volvocars.com',
        verified_by: 'IVL Swedish Environmental Research Institute',
    },
    /* ── Online-sourced verified data (Greenpeace, CAFÉ-II, ESG reports) ─ */
    'maruti_brezza_petrol': {
        actual_co2_gkm: 143,
        actual_lifecycle_co2: 192,
        actual_range_km: 640,
        fuel_efficiency_kmpl: 19.80,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'CAFÉ-II FY23 compliance data (via Livemint)',
        source: 'internet_verified',
        fetch_source_url: 'https://www.livemint.com/auto-news/cafe-ii-norms-compliance',
        fetch_domain: 'livemint.com',
        verified_by: 'Ministry of Road Transport and Highways (MoRTH)',
    },
    'hyundai_venue_petrol': {
        actual_co2_gkm: 152,
        actual_lifecycle_co2: 205,
        actual_range_km: 530,
        fuel_efficiency_kmpl: 16.9,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'Greenpeace East Asia Jan 2025 — Hyundai-Kia emissions per vehicle up 9.4% in India',
        source: 'internet_verified',
        fetch_source_url: 'https://www.greenpeace.org/eastasia/press/auto-emissions-report-2025/',
        fetch_domain: 'greenpeace.org',
        verified_by: 'Greenpeace East Asia',
    },
    'tata_harrier_diesel': {
        actual_co2_gkm: 168,
        actual_lifecycle_co2: 228,
        actual_range_km: 720,
        fuel_efficiency_kmpl: 16.35,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'Tata Motors Sustainability Report 2025 (Public)',
        source: 'internet_verified',
        fetch_source_url: 'https://www.tatamotors.com/sustainability/',
        fetch_domain: 'tatamotors.com',
        verified_by: 'Tata Motors CSR / ARAI',
    },
    'mahindra_scorpio_n_diesel': {
        actual_co2_gkm: 178,
        actual_lifecycle_co2: 242,
        actual_range_km: 680,
        fuel_efficiency_kmpl: 15.72,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'Mahindra ESG Report 2025 — CAFÉ-II non-compliance noted in FY23',
        source: 'internet_verified',
        fetch_source_url: 'https://www.mahindra.com/sustainability',
        fetch_domain: 'mahindra.com',
        verified_by: 'MoRTH / ARAI',
    },
    'kia_sonet_diesel': {
        actual_co2_gkm: 158,
        actual_lifecycle_co2: 218,
        actual_range_km: 690,
        fuel_efficiency_kmpl: 20.6,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'Kia India Green Workshop Report 2025 / Greenpeace East Asia Hyundai-Kia emissions data',
        source: 'internet_verified',
        fetch_source_url: 'https://www.greenpeace.org/eastasia/press/auto-emissions-report-2025/',
        fetch_domain: 'greenpeace.org',
        verified_by: 'Greenpeace East Asia / Kia India',
    },
    'toyota_fortuner_diesel': {
        actual_co2_gkm: 210,
        actual_lifecycle_co2: 278,
        actual_range_km: 620,
        fuel_efficiency_kmpl: 10.1,
        certifications: ['bs_vi'],
        emission_standard: 'bs_vi',
        lca_source: 'Toyota Kirloskar Environmental Report 2025 / ASA (UK) hybrid marketing rulings',
        source: 'internet_verified',
        fetch_source_url: 'https://www.toyota.co.in/sustainability',
        fetch_domain: 'toyota.co.in',
        verified_by: 'ARAI / Toyota Kirloskar',
    },
    // No entry for 'startup_ev_concept' → triggers "No Verified Data Available"
};

/* ══════════════════════════════════════════════════════════════
   DOMAIN WHITELIST — Trusted sources for internet fetch
   ══════════════════════════════════════════════════════════════ */
export const DOMAIN_WHITELIST = [
    'epa.gov',
    'ec.europa.eu',
    'araiindia.com',
    'morth.nic.in',
    'volvocars.com',
    'tatamotors.com',
    'hyundai.co.in',
    'marutisuzuki.com',
    'toyota.co.in',
    'mahindra.com',
    'kia.com',
    'byd.com',
    'mgmotor.co.in',
    'cdp.net',
    'sciencebasedtargets.org',
    /* ── New trusted sources ─ */
    'greenpeace.org',
    'livemint.com',
    'outlookbusiness.com',
    'carbonwire.org',
    'edo.org.au',
];

/* ── Seed community reports ────────────────────────────────── */
export const SEED_REPORTS = [
    {
        id: 'rpt_001',
        manufacturer: 'Generic Motors',
        claimText: 'Our SUV lineup is completely carbon neutral thanks to our tree-planting initiative.',
        reason: 'No third-party verification of carbon offsets. Tree planting alone cannot offset vehicle manufacturing emissions.',
        reportedBy: 'EcoWatcher42',
        timestamp: '2026-02-15T10:30:00Z',
        status: 'confirmed',
        upvotes: 47,
        downvotes: 3,
    },
    {
        id: 'rpt_002',
        manufacturer: 'EcoAuto Corp',
        claimText: 'Our vehicles are made with 100% recycled materials and leave zero environmental footprint.',
        reason: 'Impossible claim — no vehicle manufacturing process has zero footprint. Recycled material percentage is unverified.',
        reportedBy: 'GreenVerify',
        timestamp: '2026-02-20T14:15:00Z',
        status: 'pending',
        upvotes: 32,
        downvotes: 8,
    },
    {
        id: 'rpt_003',
        manufacturer: 'DriveGreen Inc',
        claimText: 'Switch to our eco-friendly hybrid and save the planet!',
        reason: '"Save the planet" is hyperbolic. Hybrid still uses fossil fuel. No emissions data provided in marketing.',
        reportedBy: 'DataDriven',
        timestamp: '2026-02-28T09:45:00Z',
        status: 'pending',
        upvotes: 21,
        downvotes: 5,
    },
];

/* ══════════════════════════════════════════════════════════════
   BACKEND FETCH — Pull companies_claim from Supabase Cardetailtable
   ══════════════════════════════════════════════════════════════ */

let _backendClaimsCache = null;
let _backendClaimsCacheTs = 0;
const BACKEND_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch vehicles with companies_claim from the Supabase backend.
 * Maps the text claim into a LOKI-compatible record.
 *
 * Backend `companies_claim` is a text string (e.g. "Inflated fuel economy
 * claims leading to higher real-world emissions.").  We convert it to a
 * structure the LOKI engine can consume alongside the DB's verified columns.
 */
export async function fetchBackendClaims() {
    // Return cached if fresh
    if (_backendClaimsCache && (Date.now() - _backendClaimsCacheTs < BACKEND_CACHE_TTL)) {
        return _backendClaimsCache;
    }

    try {
        const { data, error } = await supabase
            .from('Cardetailtable')
            .select('id, name, manufacturer, year, category, companies_claim, avg_emissions_gmi, lifecycle_gco2_km, range_km, battery_capacity, avg_fuel_economy, ex_showroom_price, nutrition_level, est_co2_per_100km_kg, est_annual_co2_kg, univ_efficiency_km_kwh_e')
            .not('companies_claim', 'is', null)
            .order('manufacturer', { ascending: true });

        if (error) { console.warn('LOKI: Supabase fetch error:', error.message); return []; }
        if (!data || data.length === 0) return [];

        // Map backend rows → LOKI vehicle records
        const mapped = data.map(row => {
            const car_id = `backend_${row.id}`;

            // The text claim from the backend
            const claimText = (row.companies_claim || '').trim();

            // Use DB columns as *verified_data* when available
            // (the backend stores actual values, not marketing exaggerations)
            const hasVerifiedMetrics = !!(row.lifecycle_gco2_km || row.avg_emissions_gmi || row.range_km);

            // Detect if this is an EV
            const cat = (row.category || '').toLowerCase();
            const isEV = cat.includes('electric') || cat.includes('ev') || cat.includes('bev');

            return {
                car_id,
                company_name: row.manufacturer || 'Unknown',
                vehicle_name: (() => {
                    const mfr = (row.manufacturer || '').trim();
                    const nm = (row.name || '').trim();
                    const yr = row.year ? `(${row.year})` : '';
                    // Avoid "Hyundai Hyundai Creta" if name already contains manufacturer
                    const base = nm.toLowerCase().startsWith(mfr.toLowerCase())
                        ? nm : `${mfr} ${nm}`;
                    return `${base} ${yr}`.trim();
                })(),
                category: (row.category || 'Unknown'),
                _backend: true,   // marker: fetched from Supabase
                _isEV: isEV,
                _supabase_id: row.id,
                companies_claim: {
                    // Text-based claim — no numeric values from backend claim column
                    claimed_co2_gkm: null,
                    claimed_lifecycle_co2: null,
                    claimed_range_km: null,
                    claimed_certifications: [],
                    marketing_text: claimText,
                },
                verified_data: hasVerifiedMetrics ? {
                    actual_co2_gkm: row.avg_emissions_gmi ? Math.round(row.avg_emissions_gmi / 1.60934) : null,
                    actual_lifecycle_co2: row.lifecycle_gco2_km || null,
                    actual_range_km: row.range_km || null,
                    battery_capacity_kwh: row.battery_capacity || null,
                    certifications: ['bs_vi'],
                    emission_standard: 'bs_vi',
                    lca_source: 'Supabase Cardetailtable (Backend)',
                    source: 'internal',
                } : null,
            };
        });

        /* ── Step 1: Propagate companies_claim to same-model non-EV variants ──
         *  If any variant of a model (e.g. Hyundai Creta 1.5 P MT) has a
         *  companies_claim, copy it to ALL other variants of the same model
         *  (Creta 1.5 D AT, Creta 1.5 P IVT, etc.) that have null/empty claims.
         *  EVs are excluded from propagation.
         */
        function getBaseModel(vehicleName, manufacturer) {
            // Strip manufacturer prefix, then take first word as model family
            let nm = vehicleName.toLowerCase().trim();
            const mfr = (manufacturer || '').toLowerCase().trim();
            if (nm.startsWith(mfr)) nm = nm.slice(mfr.length).trim();
            // First word = base model (e.g. "creta", "venue", "seltos")
            return nm.split(/\s+/)[0] || nm;
        }

        const evVehicles = mapped.filter(v => v._isEV);
        const nonEvVehicles = mapped.filter(v => !v._isEV);

        // Build a map: manufacturer::baseModel → claim text from any variant that has one
        const claimByFamily = new Map();
        for (const v of nonEvVehicles) {
            const baseModel = getBaseModel(v.vehicle_name, v.company_name);
            const key = `${v.company_name.toLowerCase()}::${baseModel}`;
            const text = (v.companies_claim?.marketing_text || '').trim();
            if (text && !claimByFamily.has(key)) {
                claimByFamily.set(key, v.companies_claim);
            }
        }

        // Propagate: give every non-EV variant the family's claim if it lacks one
        const propagated = nonEvVehicles.map(v => {
            const text = (v.companies_claim?.marketing_text || '').trim();
            if (text) return v; // already has a claim
            const baseModel = getBaseModel(v.vehicle_name, v.company_name);
            const key = `${v.company_name.toLowerCase()}::${baseModel}`;
            const familyClaim = claimByFamily.get(key);
            if (familyClaim) {
                return {
                    ...v,
                    companies_claim: { ...familyClaim },
                    _claimPropagated: true, // marker: claim copied from sibling variant
                };
            }
            return v;
        });

        /* ── Step 2: Deduplicate variants by model family ──
         *  Group non-EVs by (manufacturer + base_model + claim_text),
         *  keep ONE representative per group, choosing the variant
         *  with the most verified data.  EVs are always kept individually.
         */
        const familyMap = new Map();
        for (const v of propagated) {
            const baseModel = getBaseModel(v.vehicle_name, v.company_name);
            const key = `${v.company_name.toLowerCase()}::${baseModel}::${v.companies_claim.marketing_text}`;

            if (!familyMap.has(key)) {
                familyMap.set(key, { representative: v, variantCount: 1 });
            } else {
                const entry = familyMap.get(key);
                entry.variantCount++;
                // Prefer variant with more verified data
                if (v.verified_data && !entry.representative.verified_data) {
                    entry.representative = v;
                }
            }
        }

        // Build deduplicated list
        const dedupedNonEv = [...familyMap.values()].map(({ representative, variantCount }) => ({
            ...representative,
            // Enrich the name to show it's a family
            vehicle_name: variantCount > 1
                ? `${representative.vehicle_name} (+${variantCount - 1} variants)`
                : representative.vehicle_name,
            _variantCount: variantCount,
        }));

        const deduped = [...evVehicles, ...dedupedNonEv];

        _backendClaimsCache = deduped;
        _backendClaimsCacheTs = Date.now();
        return deduped;
    } catch (err) {
        console.warn('LOKI: Failed to fetch backend claims:', err.message);
        return [];
    }
}

/**
 * Get ALL vehicle claims — merging static VEHICLE_CLAIMS with backend data.
 * Backend vehicles are added only if they don't overlap with static car_ids.
 */
export async function getAllClaims() {
    const staticClaims = [...VEHICLE_CLAIMS];
    const backendClaims = await fetchBackendClaims();

    // Deduplicate: skip backend vehicles whose name already exists in static data
    const staticNames = new Set(staticClaims.map(v =>
        `${v.company_name}::${v.vehicle_name}`.toLowerCase()
    ));

    const uniqueBackend = backendClaims.filter(b => {
        const key = `${b.company_name}::${b.vehicle_name}`.toLowerCase();
        return !staticNames.has(key);
    });

    return [...staticClaims, ...uniqueBackend];
}
