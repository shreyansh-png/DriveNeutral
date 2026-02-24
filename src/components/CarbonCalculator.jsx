import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TreePine, Car, GaugeCircle, Zap, Droplet, Flame } from 'lucide-react';

const CarbonCalculator = () => {
    const [distance, setDistance] = useState(30);
    const [fuelType, setFuelType] = useState('ice');
    const [cityUsage, setCityUsage] = useState(50);
    const [results, setResults] = useState({ co2: 0, trees: 0, saved: 0 });

    const emissionsPerKm = { ev: 0, hybrid: 95, ice: 160 };

    useEffect(() => {
        let factor = emissionsPerKm[fuelType];
        if (fuelType === 'hybrid' || fuelType === 'ev') {
            factor = factor * (1 - (cityUsage / 100) * 0.2);
        } else {
            factor = factor * (1 + (cityUsage / 100) * 0.3);
        }
        const dailyCo2Grams = distance * factor;
        const yearlyCo2Kg = (dailyCo2Grams * 365) / 1000;
        let baseIceFactor = emissionsPerKm.ice * (1 + (cityUsage / 100) * 0.3);
        const iceYearlyCo2Kg = (distance * baseIceFactor * 365) / 1000;
        const saved = fuelType === 'ice' ? 0 : iceYearlyCo2Kg - yearlyCo2Kg;
        const trees = yearlyCo2Kg / 21;
        setResults({ co2: Math.round(yearlyCo2Kg), trees: Math.ceil(trees), saved: Math.round(saved) });
    }, [distance, fuelType, cityUsage]);

    const fuelTypes = [
        { id: 'ev', label: 'Electric', icon: Zap, color: 'text-primary-400' },
        { id: 'hybrid', label: 'Hybrid', icon: Droplet, color: 'text-cyan-400' },
        { id: 'ice', label: 'Petrol/Diesel', icon: Flame, color: 'text-orange-400' },
    ];

    return (
        <section id="calculator" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Background texture */}
            <div className="absolute inset-0 noise-overlay" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
                        <Calculator className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400">Carbon Calculator</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight">
                        Your Carbon{' '}
                        <span className="text-gradient-green">Footprint</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        See exactly how much carbon your daily commute generates, and how many trees it takes to offset it.
                    </p>
                </motion.div>

                {/* Bento grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-4"
                >
                    {/* Left: Inputs — spans 3 cols */}
                    <div className="lg:col-span-3 glass-card rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 font-display flex items-center gap-3">
                            <Car className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                            Your Driving Habits
                        </h3>

                        <div className="space-y-8 relative z-10">
                            {/* Distance slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Daily Distance</label>
                                    <span className="text-2xl font-black text-primary-500 dark:text-primary-400 font-display tabular-nums">{distance} <span className="text-sm text-slate-400 dark:text-slate-500">km</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="200"
                                    value={distance}
                                    onChange={(e) => setDistance(e.target.value)}
                                />
                                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-600 font-medium">
                                    <span>0 km</span>
                                    <span>200 km</span>
                                </div>
                            </div>

                            {/* Fuel Type — pill segmented control */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Fuel Type</label>
                                <div className="flex bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl p-1 gap-1">
                                    {fuelTypes.map(type => {
                                        const Icon = type.icon;
                                        const isActive = fuelType === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setFuelType(type.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                                    ? 'bg-white dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? type.color : ''}`} />
                                                <span className="hidden sm:inline">{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* City/Highway slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Route Mix</label>
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                                        {100 - cityUsage}% Hwy / {cityUsage}% City
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={cityUsage}
                                    onChange={(e) => setCityUsage(e.target.value)}
                                />
                                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-600 font-medium">
                                    <span>Mostly Highway</span>
                                    <span>Mostly City</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Results — vertical bento stack, spans 2 cols */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Yearly CO2 — hero card */}
                        <div className="glass-card rounded-3xl p-6 flex-1 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500" />
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-500" />
                            <div className="flex items-center gap-2 mb-4">
                                <Car className="w-5 h-5 text-red-500 dark:text-red-400" />
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Yearly CO₂ Emissions</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-slate-900 dark:text-white font-display tabular-nums">{results.co2}</span>
                                <span className="text-lg text-slate-400 dark:text-slate-500 font-bold">kg</span>
                            </div>
                        </div>

                        {/* Bottom bento row: Trees + Saved */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Trees */}
                            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-500" />
                                <TreePine className="w-8 h-8 text-primary-500 dark:text-primary-400 mb-3" />
                                <p className="text-3xl font-black text-slate-900 dark:text-white font-display tabular-nums">{results.trees}</p>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Trees To Offset</p>
                            </div>

                            {/* Carbon Saved */}
                            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
                                <GaugeCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mb-3" />
                                <p className="text-3xl font-black text-slate-900 dark:text-white font-display tabular-nums">{results.saved}</p>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">kg Saved vs ICE</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CarbonCalculator;
