import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Plus, X, Search, Info, Car, Zap, Droplet, LogIn, Lock, IndianRupee, Filter } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import {
    calculateNutritionScore,
    computeSustainabilityScore,
    propagateModelImages
} from '../services/chatflowService';
import {
    CITY_TAX_RATES,
    DEFAULT_CITY,
    formatINR,
    getOnRoadPrice,
    getStaticPrices,
} from '../services/pricingService';

/* ── helpers ───────────────────────────────────────── */

const MetricBar = ({ value, max, label, unit, color = 'bg-primary-500' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{value ?? 'N/A'}{unit && ` ${unit}`}</span>
            </div>
            <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
};

/* ── Filter definitions ────────────────────────────── */

const FUEL_FILTERS = [
    { key: 'all', label: 'All', emoji: '🚗' },
    { key: 'electric', label: 'Electric', emoji: '⚡' },
    { key: 'hybrid', label: 'Hybrid', emoji: '💧' },
    { key: 'ice', label: 'Petrol/Diesel', emoji: '🔥' },
];

const SEGMENT_FILTERS = [
    { key: 'all', label: 'All Segments' },
    { key: 'suv', label: 'SUV' },
    { key: 'compact suv', label: 'Compact SUV' },
    { key: 'sedan', label: 'Sedan' },
    { key: 'hatchback', label: 'Hatchback' },
    { key: 'mpv', label: 'MPV' },
    { key: 'coupe', label: 'Coupe' },
];

/* ── main component ────────────────────────────────── */

const ComparisonSection = () => {
    const { user, city } = useAuth();
    const [allVehicles, setAllVehicles] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [fuelFilter, setFuelFilter] = useState('all');
    const [segmentFilter, setSegmentFilter] = useState('all');
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('Cardetailtable')
                    .select('*')
                    .order('manufacturer', { ascending: true });
                if (error) throw error;
                if (data && data.length > 0) {
                    const mappedData = data.map(car => ({
                        ...car,
                        ui_name: `${car.manufacturer} ${car.name} (${car.year})`,
                        // Derive a body segment from name heuristics if not in DB
                        body_segment: guessSegment(car),
                    }));
                    setAllVehicles(propagateModelImages(mappedData));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Guess body segment from vehicle name/category heuristic
    const guessSegment = (car) => {
        const nm = `${car.manufacturer} ${car.name}`.toLowerCase();
        if (nm.includes('model s') || nm.includes('model 3') || nm.includes('city') || nm.includes('civic') || nm.includes('camry') || nm.includes('corolla') || nm.includes('verna') || nm.includes('slavia') || nm.includes('virtus') || nm.includes('elantra')) return 'sedan';
        if (nm.includes('innova') || nm.includes('ertiga') || nm.includes('carens') || nm.includes('marazzo')) return 'mpv';
        if (nm.includes('punch') || nm.includes('ignis') || nm.includes('kwid') || nm.includes('swift') || nm.includes('baleno') || nm.includes('i10') || nm.includes('i20') || nm.includes('altroz') || nm.includes('glanza') || nm.includes('polo') || nm.includes('jazz') || nm.includes('tiago') || nm.includes('leaf') || nm.includes('bolt')) return 'hatchback';
        if (nm.includes('brezza') || nm.includes('venue') || nm.includes('sonet') || nm.includes('magnite') || nm.includes('nexon') || nm.includes('fronx') || nm.includes('exter')) return 'compact suv';
        if (nm.includes('coupe') || nm.includes('mustang') || nm.includes('camaro') || nm.includes('supra')) return 'coupe';
        if (nm.includes('suv') || nm.includes('creta') || nm.includes('seltos') || nm.includes('harrier') || nm.includes('safari') || nm.includes('hector') || nm.includes('xuv') || nm.includes('scorpio') || nm.includes('fortuner') || nm.includes('endeavour') || nm.includes('vitara') || nm.includes('tucson') || nm.includes('compass') || nm.includes('atto') || nm.includes('model x') || nm.includes('model y') || nm.includes('zs')) return 'suv';
        return 'suv'; // default
    };

    const toggleVehicle = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(vId => vId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const getIconForCategory = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('electric')) return <Zap className="w-5 h-5 text-primary-400" />;
        if (cat.includes('hybrid')) return <Droplet className="w-5 h-5 text-cyan-400" />;
        return <Droplet className="w-5 h-5 text-red-400" />;
    };


    // Apply filters to search dropdown
    const filteredForDropdown = allVehicles.filter(v => {
        // Text search
        const matchesSearch = v.ui_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));
        // Fuel type filter
        const cat = (v.category || '').toLowerCase();
        const matchesFuel = fuelFilter === 'all' ||
            (fuelFilter === 'electric' && cat.includes('electric')) ||
            (fuelFilter === 'hybrid' && cat.includes('hybrid')) ||
            (fuelFilter === 'ice' && !cat.includes('electric') && !cat.includes('hybrid'));
        // Segment filter
        const matchesSegment = segmentFilter === 'all' || v.body_segment === segmentFilter;
        return matchesSearch && matchesFuel && matchesSegment;
    }).slice(0, 10);

    const selectedVehiclesData = selectedIds.map(id => allVehicles.find(v => v.id === id)).filter(Boolean);

    const handleAddClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (searchInputRef.current) setTimeout(() => searchInputRef.current.focus(), 300);
    };

    // Max values for progress bars
    const maxRange = Math.max(...selectedVehiclesData.map(c => c.range_km || 0), 600);
    const maxBattery = Math.max(...selectedVehiclesData.map(c => c.battery_capacity || 0), 100);

    const selectedCity = city || 'Delhi';

    return (
        <>
            <section id="compare" className="py-24 bg-slate-50 dark:bg-slate-950 min-h-screen relative overflow-hidden transition-colors duration-300">
                {/* Background car image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=60&w=2000"
                        alt="Luxury cars on road"
                        className="w-full h-full object-cover object-center opacity-[0.04] dark:opacity-[0.06]"
                    />
                </div>
                <div className="absolute inset-0 noise-overlay" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/3 rounded-full blur-[180px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight">
                            Compare{' '}
                            <span className="text-gradient-green">Vehicles</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                            Evaluate models side-by-side using actual manufacturer data alongside advanced eco-impact estimates.
                        </p>
                    </motion.div>

                    {/* ── Filter Tabs ────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-6 space-y-3"
                    >
                        {/* Fuel type row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" /> Type
                            </span>
                            {FUEL_FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFuelFilter(f.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${fuelFilter === f.key
                                        ? 'text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 border-primary-600 dark:border-primary-400 shadow-md shadow-primary-500/15'
                                        : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/8 dark:border-white/8 hover:border-primary-500/30 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="mr-1">{f.emoji}</span>{f.label}
                                </button>
                            ))}
                        </div>

                        {/* Segment row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5" /> Segment
                            </span>
                            {SEGMENT_FILTERS.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSegmentFilter(s.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${segmentFilter === s.key
                                        ? 'text-white dark:text-slate-950 bg-slate-700 dark:bg-slate-300 border-slate-700 dark:border-slate-300 shadow-md'
                                        : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/8 dark:border-white/8 hover:border-slate-400/30 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Search Bar */}
                    <div className="relative z-50 mb-14 max-w-3xl mx-auto" ref={searchRef}>
                        <div className="relative">
                            <Search className={`w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 ${loading ? 'text-primary-400 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={loading ? "Loading vehicles ..." : "Search for a make or model..."}
                                value={searchQuery}
                                disabled={loading}
                                onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="w-full pl-14 pr-6 py-5 text-base font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/8 dark:border-white/8 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-lg disabled:opacity-40"
                            />
                        </div>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className="absolute w-full mt-2 glass-card rounded-2xl shadow-2xl overflow-hidden"
                                >
                                    {filteredForDropdown.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                                            No vehicles found {searchQuery && `matching "${searchQuery}"`} {fuelFilter !== 'all' && `in ${fuelFilter}`} {segmentFilter !== 'all' && `(${segmentFilter})`}
                                        </div>
                                    ) : (
                                        <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
                                            {filteredForDropdown.map((v) => {
                                                const isSelected = selectedIds.includes(v.id);
                                                return (
                                                    <div
                                                        key={v.id}
                                                        onClick={() => toggleVehicle(v.id)}
                                                        className={`p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-primary-500/5' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                                                {v.image ? <img src={v.image} alt={v.name} className="object-contain w-8 h-8" /> : <Car className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{v.ui_name}</div>
                                                                <div className="text-xs text-slate-400 dark:text-slate-500 capitalize flex items-center gap-1.5">
                                                                    {v.category} &bull; {v.body_segment}
                                                                    {v.ex_showroom_price && <span className="text-primary-600 dark:text-primary-400 font-bold ml-1">{formatINR(v.ex_showroom_price)}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-primary-400 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="glass-card p-6 rounded-2xl text-center text-red-500 dark:text-red-400">
                            Failed to load vehicles: {error}
                        </div>
                    ) : selectedVehiclesData.length === 0 ? (
                        <div className="text-center py-20 glass-card rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                            <Leaf className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">No Vehicles Selected</h3>
                            <p className="text-slate-400 dark:text-slate-600 mt-2">Use the search bar above to add vehicles. Filter by type or segment first.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="overflow-x-auto pb-8 w-full hide-scrollbar">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {/* Header Row — Vehicle Cards */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950" />
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`header-${car.id}`} className="w-60 px-3 py-6 border-b border-black/5 dark:border-white/5">
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => toggleVehicle(car.id)}
                                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full z-10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title="Remove"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Vehicle image pedestal */}
                                                        <div className="glass-card rounded-2xl p-5 mb-4 text-center h-36 flex flex-col justify-center relative overflow-hidden">
                                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-primary-500/5 to-transparent" />
                                                            {car.image ? (
                                                                <img src={car.image} alt={car.name} className="max-h-20 max-w-full object-contain mx-auto mb-2 relative z-10" />
                                                            ) : (
                                                                <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                                            )}
                                                        </div>

                                                        <div className="text-center">
                                                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em] block">{car.manufacturer}</span>
                                                            <span className="font-bold text-slate-900 dark:text-white block text-sm leading-snug mt-0.5" title={car.name}>{car.name}</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">{car.year}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="w-48 px-3 py-6 border-b border-black/5 dark:border-white/5">
                                                <div onClick={handleAddClick} className="glass-card rounded-2xl hover:border-primary-500/30 hover:bg-primary-500/5 transition-all cursor-pointer py-10 text-center border border-dashed border-black/10 dark:border-white/10">
                                                    <Plus className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                                                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-600">Add Vehicle</span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Category */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-black/5 dark:border-white/5">Category</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`category-${car.id}`} className="w-60 px-3 py-3 border-b border-black/5 dark:border-white/5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {getIconForCategory(car.category)}
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">{car.category || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Body Segment */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-black/5 dark:border-white/5">Segment</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`segment-${car.id}`} className="w-60 px-3 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 text-slate-600 dark:text-slate-300 capitalize">
                                                        {car.body_segment}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Nutrition Level */}
                                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                                            <td className="w-48 sticky left-0 z-10 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-emerald-200/30 dark:border-emerald-500/10">🌿 Nutrition Level</td>
                                            {selectedVehiclesData.map((car) => {
                                                let score;
                                                if (car.nutrition_level != null && !isNaN(Number(car.nutrition_level))) {
                                                    score = Number(car.nutrition_level);
                                                } else if (car.lifecycle_gco2_km) {
                                                    score = calculateNutritionScore(car.lifecycle_gco2_km);
                                                } else if (car.avg_emissions_gmi) {
                                                    const gPerKm = car.avg_emissions_gmi / 1.60934;
                                                    score = calculateNutritionScore(gPerKm);
                                                } else if (car.est_co2_per_100km) {
                                                    score = calculateNutritionScore(car.est_co2_per_100km * 10);
                                                } else {
                                                    const cat = (car.category || '').toLowerCase();
                                                    if (cat.includes('electric')) score = 20;
                                                    else if (cat.includes('hybrid')) score = 15;
                                                    else score = 7;
                                                }

                                                const maxScore = 20;
                                                const pct = Math.min((score / maxScore) * 100, 100);
                                                const barColor = score >= 14 ? 'bg-emerald-500' : score >= 8 ? 'bg-amber-500' : 'bg-red-500';
                                                const textColor = score >= 14
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : score >= 8
                                                        ? 'text-amber-700 dark:text-amber-400'
                                                        : 'text-red-700 dark:text-red-400';
                                                return (
                                                    <td key={`nutrition-${car.id}`} className="w-60 px-3 py-3 border-b border-emerald-200/30 dark:border-emerald-500/10">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`inline-block px-3 py-1.5 text-sm font-black rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25 ${textColor}`}>
                                                                {score}/20
                                                            </span>
                                                            <div className="w-full max-w-[120px] h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                    className={`h-full rounded-full ${barColor}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="w-48" />
                                        </tr>

                                        {/* ── PRICING SECTION ──────────────────── */}
                                        <tr><td colSpan="100" className="h-2" /></tr>
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-left text-[10px] font-black uppercase tracking-[0.2em] text-primary-600/60 dark:text-primary-400/60 border-b border-black/5 dark:border-white/5">
                                                <span className="flex items-center gap-1.5"><IndianRupee className="w-3 h-3" /> Pricing</span>
                                            </td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`pricing-head-${car.id}`} className="w-60 border-b border-black/5 dark:border-white/5" />
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Ex-Showroom Price */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Ex-Showroom</td>
                                            {selectedVehiclesData.map((car) => {
                                                const bp = car.ex_showroom_price;
                                                return (
                                                    <td key={`exshow-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                        {bp ? (
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatINR(bp)}</span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 dark:text-slate-600 italic">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="w-48" />
                                        </tr>

                                        {/* On-Road Price (login-gated) */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">On-Road Price</td>
                                            {selectedVehiclesData.map((car) => {
                                                const bp = car.ex_showroom_price;
                                                if (!bp) {
                                                    return (
                                                        <td key={`onroad-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                            <span className="text-xs text-slate-400 dark:text-slate-600 italic">—</span>
                                                        </td>
                                                    );
                                                }
                                                if (!user) {
                                                    return (
                                                        <td key={`onroad-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                            <button
                                                                onClick={() => setIsLoginOpen(true)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/15 border border-primary-500/20 rounded-xl transition-all"
                                                            >
                                                                <Lock className="w-3 h-3" />
                                                                Login for city price
                                                            </button>
                                                        </td>
                                                    );
                                                }
                                                const onRoad = getOnRoadPrice(bp, selectedCity);
                                                return (
                                                    <td key={`onroad-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                        <div>
                                                            <span className="text-sm font-black text-primary-600 dark:text-primary-400">{formatINR(onRoad)}</span>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium mt-0.5">in {selectedCity}</p>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Section separator */}
                                        <tr><td colSpan="100" className="h-2" /></tr>

                                        {/* Database Records header */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-left text-[10px] font-black uppercase tracking-[0.2em] text-primary-600/60 dark:text-primary-400/60 border-b border-black/5 dark:border-white/5">Database Records</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`db-${car.id}`} className="w-60 border-b border-black/5 dark:border-white/5" />
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Battery Capacity — with progress bar */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Battery Capacity</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`battery-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5">
                                                    <MetricBar value={car.battery_capacity} max={maxBattery} label="" unit="kWh" color="bg-cyan-500" />
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Range — with progress bar */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Range (km)</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`range-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5">
                                                    <MetricBar value={car.range_km} max={maxRange} label="" unit="km" color="bg-primary-500" />
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Est. Yearly Maintenance */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Est. Yearly Maintenance</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`maintenance-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                                                    {car.est_yearly_maintenance_inr ? `₹${Number(car.est_yearly_maintenance_inr).toLocaleString()}` : 'N/A'}
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Lifecycle gCO₂/km */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Lifecycle gCO₂ / km</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`lifecycle-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-center">
                                                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 text-slate-700 dark:text-slate-300">
                                                        {car.lifecycle_gco2_km ? `${car.lifecycle_gco2_km} gCO₂/km` : 'N/A'}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Efficiency */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Efficiency (km/kWh-e)</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`efficiency-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                                                    {car.univ_efficiency_km_kwh_e ? `${car.univ_efficiency_km_kwh_e} km/kWh-e` : 'N/A'}
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Economy (MPG) */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Economy (MPG)</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`economy-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                                                    {car.avg_fuel_economy ? `${car.avg_fuel_economy} MPG` : 'N/A'}
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>

                                        {/* Emissions (g/mi) */}
                                        <tr>
                                            <td className="w-48 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">Emissions (g/mi)</td>
                                            {selectedVehiclesData.map((car) => (
                                                <td key={`emissions-${car.id}`} className="w-60 px-4 py-3 border-b border-black/5 dark:border-white/5 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                                                    {car.avg_emissions_gmi ? `${Math.round(car.avg_emissions_gmi)} g/mi` : '0 g/mi'}
                                                </td>
                                            ))}
                                            <td className="w-48" />
                                        </tr>


                                    </tbody>
                                </table>
                            </div>

                            {/* Login CTA banner for non-authenticated users */}
                            {!user && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <IndianRupee className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Want on-road prices for your city?</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Login to see pricing near you with local RTO, insurance &amp; state taxes.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsLoginOpen(true)}
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 hover:bg-primary-500 dark:hover:bg-primary-300 rounded-xl shadow-lg shadow-primary-500/15 transition-all flex-shrink-0"
                                    >
                                        <LogIn className="w-4 h-4" /> Login for Pricing
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

export default ComparisonSection;
