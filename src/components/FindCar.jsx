import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, Zap, Droplet, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { formatINR } from '../services/pricingService';
import { propagateModelImages } from '../services/chatflowService';

const FindCar = () => {
    const [vehiclesData, setVehiclesData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const searchRef = useRef(null);

    useEffect(() => {
        const fetchVehiclesData = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('Cardetailtable')
                    .select('*');

                if (error) throw error;

                if (data) {
                    const mappedData = data.map(car => {
                        const co2Val = car.avg_emissions_gmi || 0;
                        let ecoScore = 'A+';
                        let ecoColor = 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400';

                        if (co2Val > 0 && co2Val <= 150) {
                            ecoScore = 'B';
                            ecoColor = 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 dark:text-yellow-400';
                        } else if (co2Val > 150) {
                            ecoScore = 'C';
                            ecoColor = 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
                        }

                        const isEV = (car.category || '').toLowerCase().includes('electric');
                        if (isEV) {
                            ecoScore = 'A+';
                            ecoColor = 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400';
                        }

                        return {
                            ...car,
                            ui_name: `${car.manufacturer} ${car.name} (${car.year})`,
                            type: (car.category || 'ice').toLowerCase(),
                            eco_color: ecoColor,
                            eco_score: ecoScore,
                            range: isEV ? 'Varies' : `${car.avg_fuel_economy || 'N/A'} MPG`,
                            ex_showroom_price: car.ex_showroom_price || null,
                        };
                    });
                    setVehiclesData(propagateModelImages(mappedData));
                }
            } catch (err) {
                console.error("Error fetching lookup data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehiclesData();

        // Handle clicking outside the search wrapper
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredVehicles = vehiclesData.filter(v =>
        v.ui_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 8); // Display top 8 results in dropdown

    const handleSelectVehicle = (v) => {
        setSelectedVehicle(v);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    return (
        <section id="find-car" className="py-24 bg-white dark:bg-slate-900/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Vehicle Lookup
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Search for any model to instantly view its carbon footprint and eco-rating.
                    </p>
                </div>

                {/* Auto-complete Search Bar */}
                <div className="relative z-50 mb-12" ref={searchRef}>
                    <div className="relative">
                        <Search className={`w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 ${loading ? 'text-primary-400 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            placeholder={loading ? "Working on it ......." : "Search for a make or model (e.g. Tesla Model 3)..."}
                            value={searchQuery}
                            disabled={loading}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => {
                                if (searchQuery.length > 0) setIsDropdownOpen(true);
                            }}
                            className="w-full pl-16 pr-6 py-5 text-lg bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-slate-100 transition-all shadow-sm disabled:opacity-50"
                        />
                    </div>

                    <AnimatePresence>
                        {isDropdownOpen && searchQuery.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                            >
                                {filteredVehicles.length === 0 ? (
                                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                                        No vehicles found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
                                        {filteredVehicles.map((v) => (
                                            <div
                                                key={v.id}
                                                onClick={() => handleSelectVehicle(v)}
                                                className="p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center justify-between transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center p-1">
                                                        {v.image ? <img src={v.image} alt={v.name} className="object-contain" /> : <Car className="w-6 h-6 text-slate-400" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{v.ui_name}</div>
                                                        <div className="text-sm text-slate-500 capitalize">{v.category} &bull; {v.year}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Selected Vehicle Display Card */}
                {selectedVehicle && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />

                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-full md:w-1/2 flex justify-center">
                                {selectedVehicle.image ? (
                                    <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-full max-w-sm object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                                        <Car className="w-20 h-20 text-slate-300 dark:text-slate-700" />
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:w-1/2 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{selectedVehicle.ui_name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold capitalize">
                                        {selectedVehicle.type === 'electric' ? <Zap className="w-5 h-5" /> : <Droplet className="w-5 h-5" />}
                                        {selectedVehicle.category}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fuel Economy</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedVehicle.range}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Emissions</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{Math.round(selectedVehicle.avg_emissions_gmi || 0)} g/mi</p>
                                    </div>
                                    {selectedVehicle.ex_showroom_price && (
                                        <div className="col-span-2 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Ex-Showroom Price</p>
                                            <p className="text-2xl font-black text-primary-600 dark:text-primary-400">{formatINR(selectedVehicle.ex_showroom_price)}</p>
                                        </div>
                                    )}
                                    <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Eco Score (Derived)</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Based on lifetime tailpipe efficiency.</p>
                                        </div>
                                        <span className={`px-4 py-2 text-xl font-black rounded-lg border ${selectedVehicle.eco_color}`}>
                                            {selectedVehicle.eco_score}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Link to="/compare" onClick={() => window.scrollTo(0, 0)} className="inline-flex w-full items-center justify-center px-6 py-4 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-2xl transition-all shadow-lg hover:shadow-primary-500/25">
                                        View inside Comparison Dashboard
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FindCar;
