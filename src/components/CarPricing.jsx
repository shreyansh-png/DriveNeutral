import React, { useState, useRef, useCallback, useEffect } from 'react';
import { fetchCarImages } from '../services/unsplashService';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Zap, Droplet, Info, Lock, Flame, TrendingUp, Loader2, LogIn, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import {
    CITY_TAX_RATES,
    INDIAN_CITIES,
    DEFAULT_CITY,
    formatINR,
    getOnRoadPrice,
    fetchCarPrices,
    getStaticPrices,
} from '../services/pricingService';
import { detectUserCity } from '../services/locationService';

const TYPE_CONFIG = {
    electric: {
        icon: Zap,
        gradient: 'from-emerald-400 to-green-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        glow: 'shadow-emerald-500/20',
        label: 'Electric',
    },
    hybrid: {
        icon: Droplet,
        gradient: 'from-blue-400 to-cyan-500',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-600 dark:text-cyan-400',
        glow: 'shadow-blue-500/20',
        label: 'Hybrid',
    },
    petrol: {
        icon: Flame,
        gradient: 'from-orange-400 to-red-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-600 dark:text-orange-400',
        glow: 'shadow-orange-500/20',
        label: 'Petrol',
    },
};

// Interactive 3D tilt card
const TiltCard = ({ children, className }) => {
    const ref = useRef(null);
    const handleMouseMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
    }, []);
    const handleMouseLeave = useCallback(() => {
        if (ref.current) {
            ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
        }
    }, []);
    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
        >
            {children}
        </div>
    );
};

const CarPricing = () => {
    const { user, city: defaultCity, updateCity } = useAuth();
    const [selectedCity, setSelectedCity] = useState(defaultCity || DEFAULT_CITY);
    const [filterType, setFilterType] = useState('all');
    const [priceData, setPriceData] = useState(getStaticPrices());
    const [loading, setLoading] = useState(true);
    const [detectingLocation, setDetectingLocation] = useState(true);
    const [locationMethod, setLocationMethod] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [carImages, setCarImages] = useState(new Map());

    // Auto-detect user's city on mount
    useEffect(() => {
        let cancelled = false;
        setDetectingLocation(true);
        detectUserCity().then(({ city, method }) => {
            if (!cancelled) {
                setSelectedCity(city);
                setLocationMethod(method);
                setDetectingLocation(false);
            }
        }).catch(() => {
            if (!cancelled) setDetectingLocation(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Fetch live prices when city changes
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchCarPrices(selectedCity).then(data => {
            if (!cancelled) {
                setPriceData(data);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [selectedCity]);

    // Fetch car images from Unsplash
    useEffect(() => {
        const cars = priceData.cars || [];
        if (cars.length === 0) return;
        let cancelled = false;
        fetchCarImages(cars).then(images => {
            if (!cancelled) setCarImages(images);
        });
        return () => { cancelled = true; };
    }, [priceData]);

    const handleCityChange = (c) => { setSelectedCity(c); if (user) updateCity(c); setLocationMethod('manual'); };
    const carData = priceData.cars || [];
    const filtered = filterType === 'all' ? carData : carData.filter(c => c.type === filterType);
    const rates = CITY_TAX_RATES[selectedCity] || CITY_TAX_RATES[DEFAULT_CITY];

    const FILTER_TABS = [
        { key: 'all', label: 'All Vehicles', emoji: '🚗' },
        { key: 'electric', label: 'Electric', emoji: '⚡' },
        { key: 'hybrid', label: 'Hybrid', emoji: '💧' },
        { key: 'petrol', label: 'Petrol', emoji: '🔥' },
    ];

    return (
        <>
            <section className="py-16 min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                {/* Background */}
                <div className="absolute inset-0 noise-overlay" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/3 rounded-full blur-[150px] -z-10" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[120px] -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Page header */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400 mb-2">Ex-Showroom & On-Road Pricing</p>
                                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white font-display leading-none tracking-tight">
                                    Car Prices<br />
                                    <span className="text-gradient-green">In India</span>
                                </h1>
                                <p className="text-slate-500 mt-3 text-lg max-w-md">
                                    Ex-showroom prices sourced from CarWale. {user ? 'On-road prices include RTO, insurance & local taxes.' : 'Login to see on-road prices for your city.'}
                                </p>
                            </div>

                            {/* City Selector */}
                            <div className="flex-shrink-0">
                                <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">Pricing For</p>
                                <div className="relative inline-block">
                                    <div className="relative flex items-center glass-card rounded-2xl overflow-hidden">
                                        <MapPin className="ml-4 w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => handleCityChange(e.target.value)}
                                            className="pl-2.5 pr-10 py-3.5 bg-transparent text-slate-900 dark:text-white font-bold text-base focus:outline-none appearance-none cursor-pointer"
                                        >
                                            {INDIAN_CITIES.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{c}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1.5 font-medium flex items-center gap-1.5">
                                    {detectingLocation ? (
                                        <><Loader2 className="w-3 h-3 animate-spin" /> Detecting location…</>
                                    ) : (
                                        <>
                                            <Navigation className="w-3 h-3" />
                                            {rates.state}
                                            {locationMethod && locationMethod !== 'manual' && (
                                                <span className="px-1.5 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-md">
                                                    {locationMethod === 'gps' ? '📍 GPS' : locationMethod === 'ip' ? '🌐 Auto' : '📌 Default'}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Tax breakdown banner — only for logged-in users */}
                        {user && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedCity}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    className="mt-6 flex flex-wrap items-center gap-3 p-4 glass-card rounded-2xl"
                                >
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedCity} Tax Breakdown</span>
                                    </div>
                                    {[
                                        { label: 'RTO', value: `${(rates.rto * 100).toFixed(0)}%` },
                                        { label: 'Insurance', value: '~3%' },
                                        { label: 'Handling & Others', value: `${(rates.other * 100).toFixed(0)}%` },
                                        { label: 'Total Extra', value: `~${((rates.rto + 0.03 + rates.other) * 100).toFixed(0)}%` },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                            <span className="text-xs text-slate-500 font-medium">{item.label}:</span>
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{item.value}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}

                        {/* Login prompt banner for non-logged-in users */}
                        {!user && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-card rounded-2xl border border-primary-500/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Want on-road prices for your city?</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Login to see exact on-road pricing with local RTO, insurance & state taxes.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 hover:bg-primary-500 dark:hover:bg-primary-300 rounded-xl shadow-lg shadow-primary-500/15 transition-all flex-shrink-0"
                                >
                                    <LogIn className="w-4 h-4" /> Login for On-Road Prices
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-8 flex-wrap">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterType(tab.key)}
                                className={`px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 ${filterType === tab.key
                                    ? 'text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 border-primary-600 dark:border-primary-400 scale-105 shadow-lg shadow-primary-500/15'
                                    : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/8 dark:border-white/8 hover:border-primary-500/30 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className="mr-1.5">{tab.emoji}</span>{tab.label}
                            </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2 text-sm text-slate-400 font-medium">
                            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
                            <TrendingUp className="w-4 h-4" />
                            {filtered.length} vehicles
                        </div>
                    </motion.div>

                    {/* Car grid — 3D tilt cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map((car, idx) => {
                            const cfg = TYPE_CONFIG[car.type] || TYPE_CONFIG.petrol;
                            const Icon = cfg.icon;
                            const onRoad = getOnRoadPrice(car.basePrice, selectedCity);
                            const extra = onRoad - car.basePrice;
                            const extraPct = ((extra / car.basePrice) * 100).toFixed(1);
                            const carImageUrl = carImages.get(car.name);

                            return (
                                <motion.div
                                    key={car.id}
                                    initial={{ opacity: 0, y: 28 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.045, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    <TiltCard className="h-full glass-card rounded-3xl overflow-hidden cursor-default relative group">
                                        {/* Popular badge */}
                                        {car.popular && (
                                            <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                                Popular
                                            </div>
                                        )}

                                        {/* Type color top stripe */}
                                        <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} />

                                        {/* Car illustration area — real image or icon fallback */}
                                        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-200/60 to-slate-100/40 dark:from-slate-900/60 dark:to-slate-800/40">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                                            {carImageUrl ? (
                                                <img
                                                    src={carImageUrl}
                                                    alt={car.name}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="relative z-10 flex flex-col items-center gap-1">
                                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-xl ${cfg.glow} group-hover:scale-110 transition-transform duration-300`}>
                                                        <Icon className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-100/60 dark:from-slate-900/60 to-transparent" />
                                        </div>

                                        <div className="p-5">
                                            {/* Name + badge */}
                                            <div className="flex items-start justify-between gap-2 mb-4">
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight font-display">{car.name}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{car.segment} · {car.power}</p>
                                                </div>
                                                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                                    <Icon className="w-3 h-3" /> {cfg.label}
                                                </span>
                                            </div>

                                            {/* Ex-showroom price — always visible */}
                                            <div className="relative p-4 rounded-2xl mb-3 overflow-hidden bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ex-Showroom</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{formatINR(car.basePrice)}</p>
                                                {car.source === 'live' && (
                                                    <span className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">LIVE</span>
                                                )}
                                            </div>

                                            {/* On-road price — logged-in only */}
                                            {user ? (
                                                <div className="relative p-4 rounded-2xl mb-3 overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
                                                        border: '1px solid rgba(99,102,241,0.15)',
                                                    }}
                                                >
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary-400/10 to-transparent rounded-full blur-xl" />
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">On-Road · {selectedCity}</p>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{formatINR(onRoad)}</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsLoginOpen(true)}
                                                    className="w-full p-3 rounded-2xl mb-3 border border-dashed border-primary-500/25 bg-primary-500/5 hover:bg-primary-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer group/login"
                                                >
                                                    <Lock className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 group-hover/login:underline">Login for on-road price</span>
                                                </button>
                                            )}

                                            {/* Price breakdown — logged-in only */}
                                            {user && (
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    {[
                                                        { label: 'Ex-showroom', value: formatINR(car.basePrice) },
                                                        { label: 'Taxes', value: `+${formatINR(extra)}` },
                                                        { label: 'Extra', value: `+${extraPct}%` },
                                                    ].map(item => (
                                                        <div key={item.label} className="p-2 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
                                                            <p className="text-[10px] text-slate-500 mb-0.5 font-semibold">{item.label}</p>
                                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Efficiency */}
                                            <div className="mt-3 flex items-center gap-2 p-2.5 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
                                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className="w-3 h-3 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-semibold">{car.type === 'electric' ? 'Range' : 'Fuel Economy'}</p>
                                                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">{car.range}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </TiltCard>
                                </motion.div>
                            );
                        })}
                    </div>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-12 font-medium">
                        Ex-showroom prices sourced from CarWale. On-road prices are estimates including RTO, insurance & state taxes. Always confirm with your local dealership.
                    </p>
                </div>
            </section>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

export default CarPricing;
