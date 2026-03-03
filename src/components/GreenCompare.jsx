import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ChevronDown, Leaf, Zap, Droplet, AlertTriangle, Database, Wifi, WifiOff, TrendingDown } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { compareVehicleClaims } from '../services/greenwashingService';
import { VEHICLE_CLAIMS } from '../services/greenwashingData';
import TransparencyBadge from './TransparencyBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

/* ── Vehicle selector dropdown ─────────────────────────────── */
const VehicleSelect = ({ value, onChange, label, exclude }) => {
    const [open, setOpen] = useState(false);
    const selected = VEHICLE_CLAIMS.find(v => v.car_id === value);

    return (
        <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-black/3 dark:bg-white/3 border border-black/6 dark:border-white/6 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-primary-500/30 transition-all"
            >
                <span className="truncate">{selected ? `${selected.vehicle_name} — ${selected.company_name}` : 'Select vehicle...'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute z-30 mt-1 w-full py-1 rounded-xl bg-white dark:bg-slate-900 border border-black/8 dark:border-white/8 shadow-xl max-h-56 overflow-auto hide-scrollbar"
                    >
                        {VEHICLE_CLAIMS.filter(v => v.car_id !== exclude).map(v => (
                            <button
                                key={v.car_id}
                                onClick={() => { onChange(v.car_id); setOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-primary-500/8 transition-colors ${v.car_id === value ? 'text-primary-600 dark:text-primary-400 bg-primary-500/5' : 'text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <div className="font-bold">{v.vehicle_name}</div>
                                <div className="text-[11px] text-slate-400">{v.company_name} · {v.category}</div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Deviation bar ─────────────────────────────────────────── */
const DeviationBar = ({ label, claimed, actual, unit }) => {
    if (claimed == null || actual == null) return null;
    const dev = actual !== 0 ? Math.abs(claimed - actual) / actual * 100 : 0;
    const color = dev <= 10 ? 'emerald' : dev <= 30 ? 'amber' : 'red';
    return (
        <div className="p-3 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                <span className={`text-[10px] font-bold text-${color}-600 dark:text-${color}-400`}>
                    {dev.toFixed(1)}% deviation
                </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">Claimed: <strong className="text-slate-700 dark:text-slate-200">{claimed} {unit}</strong></span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-500">Actual: <strong className="text-slate-700 dark:text-slate-200">{actual} {unit}</strong></span>
            </div>
            <div className="mt-1.5 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dev, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-${color}-500`}
                />
            </div>
        </div>
    );
};

/* ── Source badge ───────────────────────────────────────────── */
const SourceBadge = ({ source }) => {
    const config = {
        Internal: { icon: Database, text: 'Internal DB', color: 'text-emerald-500' },
        'Internet Verified': { icon: Wifi, text: 'Internet Verified', color: 'text-blue-500' },
        None: { icon: WifiOff, text: 'No Data', color: 'text-slate-400' },
    };
    const s = config[source] || config.None;
    return (
        <span className="flex items-center gap-1 text-[10px] font-bold">
            <s.icon className={`w-3 h-3 ${s.color}`} />
            <span className="text-slate-400">{s.text}</span>
        </span>
    );
};

/* ══════════════════════════════════════════════════════════════ */
const GreenCompare = () => {
    const [idA, setIdA] = useState('');
    const [idB, setIdB] = useState('');

    const comparison = useMemo(() => {
        if (!idA || !idB) return null;
        return compareVehicleClaims(idA, idB);
    }, [idA, idB]);

    /* ── chart ───────────────────────────────────────────────── */
    const chartData = comparison ? {
        labels: ['Tailpipe CO₂ (Claimed)', 'Tailpipe CO₂ (Actual)', 'Lifecycle CO₂ (Claimed)', 'Lifecycle CO₂ (Actual)'],
        datasets: [
            {
                label: comparison.vehicleA.vehicle_name,
                data: [
                    comparison.vehicleA.companies_claim?.claimed_co2_gkm ?? 0,
                    comparison.vehicleA.verified_data?.actual_co2_gkm ?? 0,
                    comparison.vehicleA.companies_claim?.claimed_lifecycle_co2 ?? 0,
                    comparison.vehicleA.verified_data?.actual_lifecycle_co2 ?? 0,
                ],
                backgroundColor: 'rgba(16,185,129,0.3)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8,
            },
            {
                label: comparison.vehicleB.vehicle_name,
                data: [
                    comparison.vehicleB.companies_claim?.claimed_co2_gkm ?? 0,
                    comparison.vehicleB.verified_data?.actual_co2_gkm ?? 0,
                    comparison.vehicleB.companies_claim?.claimed_lifecycle_co2 ?? 0,
                    comparison.vehicleB.verified_data?.actual_lifecycle_co2 ?? 0,
                ],
                backgroundColor: 'rgba(99,102,241,0.3)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    } : null;

    const chartOpts = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' }, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.9)',
                titleFont: { weight: 'bold', size: 13 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 12,
                callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} gCO₂/km` },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: '600' } } },
            y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}g` } },
        },
    };

    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-primary-500/3" />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0)} className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                            <GitCompare className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                Green <span className="text-gradient-green">Compare</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">LOKI Deviation Analysis</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base ml-14 max-w-xl leading-relaxed">
                        Compare how manufacturer claims deviate from verified data across two vehicles.
                    </p>
                </motion.div>

                {/* ── Selectors ──────────────────────────────────── */}
                <motion.div {...fadeUp(1)} className="glass-card rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <VehicleSelect label="Vehicle A" value={idA} onChange={setIdA} exclude={idB} />
                        <VehicleSelect label="Vehicle B" value={idB} onChange={setIdB} exclude={idA} />
                    </div>
                </motion.div>

                {/* ── Comparison Results ──────────────────────────── */}
                <AnimatePresence>
                    {comparison && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Side by side cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {[comparison.vehicleA, comparison.vehicleB].map((v, idx) => (
                                    <motion.div key={v.car_id} {...fadeUp(idx + 2)} className="glass-card rounded-2xl p-5 relative overflow-hidden">
                                        <div className={`absolute top-0 ${idx === 0 ? 'left-0' : 'right-0'} w-32 h-32 rounded-full blur-3xl opacity-10 ${idx === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                        <div className="relative z-10">
                                            {/* Name, badge, and meta */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{v.vehicle_name}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.company_name} · {v.category}</p>
                                                </div>
                                                <TransparencyBadge claimStatus={v.claim_status} size="sm" />
                                            </div>

                                            {/* Meta row */}
                                            <div className="flex items-center gap-3 flex-wrap mb-4">
                                                <SourceBadge source={v.data_source_used} />
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${v.confidence_level === 'High' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                        v.confidence_level === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                            'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                    {v.confidence_level} Confidence
                                                </span>
                                                {v.deviation_percentage !== null && (
                                                    <span className={`text-[10px] font-bold ${v.deviation_percentage <= 10 ? 'text-emerald-600 dark:text-emerald-400' :
                                                            v.deviation_percentage <= 30 ? 'text-amber-600 dark:text-amber-400' :
                                                                'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {v.deviation_percentage}% max deviation
                                                    </span>
                                                )}
                                            </div>

                                            {/* Deviation bars (claimed vs actual) */}
                                            <div className="space-y-2 mb-4">
                                                <DeviationBar
                                                    label="Tailpipe CO₂"
                                                    claimed={v.companies_claim?.claimed_co2_gkm}
                                                    actual={v.verified_data?.actual_co2_gkm}
                                                    unit="g/km"
                                                />
                                                <DeviationBar
                                                    label="Lifecycle CO₂"
                                                    claimed={v.companies_claim?.claimed_lifecycle_co2}
                                                    actual={v.verified_data?.actual_lifecycle_co2}
                                                    unit="g/km"
                                                />
                                                <DeviationBar
                                                    label="Range"
                                                    claimed={v.companies_claim?.claimed_range_km}
                                                    actual={v.verified_data?.actual_range_km}
                                                    unit="km"
                                                />
                                            </div>

                                            {/* Risk score */}
                                            <div className="p-3 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    <span>Greenwashing Risk</span>
                                                    <span>{v.greenwashing_risk_score}/100</span>
                                                </div>
                                                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${v.greenwashing_risk_score}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className={`h-full rounded-full ${v.greenwashing_risk_score <= 20 ? 'bg-emerald-500' :
                                                                v.greenwashing_risk_score <= 60 ? 'bg-amber-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Flags summary */}
                                            <div className="mt-3 flex items-center gap-2 text-[11px] font-bold">
                                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {v.analysis?.flags?.length || 0} marketing {(v.analysis?.flags?.length || 0) === 1 ? 'flag' : 'flags'} detected
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Claimed vs Actual Chart */}
                            <motion.div {...fadeUp(4)} className="glass-card rounded-2xl p-6">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-5">
                                    Claimed vs Actual Emissions (gCO₂/km)
                                </h3>
                                <div className="h-64">
                                    <Bar data={chartData} options={{ ...chartOpts, maintainAspectRatio: false }} />
                                </div>
                            </motion.div>

                            {/* Verdict */}
                            <motion.div {...fadeUp(5)} className="glass-card rounded-2xl p-6 text-center">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">LOKI Verdict</h3>
                                {(() => {
                                    const a = comparison.vehicleA;
                                    const b = comparison.vehicleB;
                                    const winner = a.greenwashing_risk_score <= b.greenwashing_risk_score ? a : b;
                                    const loser = a.greenwashing_risk_score <= b.greenwashing_risk_score ? b : a;
                                    const isTie = a.greenwashing_risk_score === b.greenwashing_risk_score;
                                    return (
                                        <div className="space-y-2">
                                            {isTie ? (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Both vehicles have a risk score of <strong className="text-primary-600 dark:text-primary-400">{a.greenwashing_risk_score}/100</strong>. Neither has a clear transparency advantage.
                                                </p>
                                            ) : (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    <strong className="text-primary-600 dark:text-primary-400">{winner.vehicle_name}</strong> has a lower greenwashing risk ({winner.greenwashing_risk_score}/100) compared to {loser.vehicle_name} ({loser.greenwashing_risk_score}/100), indicating more credible environmental claims.
                                                </p>
                                            )}
                                            <div className="flex items-center justify-center gap-4 text-xs font-bold pt-2">
                                                <span>{a.vehicle_name}: <span className={a.claim_status === 'Verified Claim' ? 'text-emerald-500' : a.claim_status === 'Exaggerated Claim' ? 'text-amber-500' : 'text-red-500'}>{a.claim_status}</span></span>
                                                <span className="text-slate-300 dark:text-slate-700">vs</span>
                                                <span>{b.vehicle_name}: <span className={b.claim_status === 'Verified Claim' ? 'text-emerald-500' : b.claim_status === 'Exaggerated Claim' ? 'text-amber-500' : 'text-red-500'}>{b.claim_status}</span></span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty state */}
                {!comparison && (
                    <motion.div {...fadeUp(2)} className="glass-card rounded-2xl p-12 text-center">
                        <GitCompare className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Select Two Vehicles</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            Choose two vehicles above to compare their marketed claims against verified emission data using the LOKI deviation engine.
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default GreenCompare;
