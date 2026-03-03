import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Shield, Search, GitCompare, Users, Settings, TrendingUp,
    Eye, AlertTriangle, Database, Wifi, WifiOff,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { getDashboardStatsAsync, getBadgeStatus } from '../services/greenwashingService';
import TransparencyBadge from './TransparencyBadge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/* ── animation presets ─────────────────────────────────────── */
const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

/* ── stat card ─────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent, idx }) => (
    <motion.div {...fadeUp(idx)} className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-10 ${accent}`} />
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{label}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    </motion.div>
);

/* ── quick-action card ─────────────────────────────────────── */
const ActionCard = ({ icon: Icon, title, desc, to, color, idx }) => (
    <motion.div {...fadeUp(idx)}>
        <Link to={to} className="glass-card rounded-2xl p-5 flex items-start gap-4 group hover:ring-1 hover:ring-primary-500/20 transition-all block">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{desc}</p>
            </div>
        </Link>
    </motion.div>
);

/* ── Confidence pill ───────────────────────────────────────── */
const ConfidencePill = ({ level }) => {
    const config = {
        High: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        Low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${config[level] || config.Low}`}>
            {level}
        </span>
    );
};

/* ── Data source indicator ─────────────────────────────────── */
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
const GreenwashingDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await getDashboardStatsAsync();
                if (!cancelled) setStats(data);
            } catch (err) {
                console.warn('LOKI Dashboard: fetch error', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <section className="py-24 min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading LOKI verification data...</p>
                    <p className="text-xs text-slate-500 mt-1">Fetching companies_claim from backend</p>
                </div>
            </section>
        );
    }

    if (!stats) return null;

    /* ── Chart: Claim Status Distribution ───────────────────── */
    const statusChartData = {
        labels: ['Verified', 'Exaggerated', 'Greenwashing', 'No Data'],
        datasets: [{
            data: [stats.verified, stats.exaggerated, stats.greenwashing, stats.noData],
            backgroundColor: [
                'rgba(16,185,129,0.7)',
                'rgba(245,158,11,0.7)',
                'rgba(239,68,68,0.7)',
                'rgba(148,163,184,0.5)',
            ],
            borderColor: [
                '#10b981', '#f59e0b', '#ef4444', '#94a3b8',
            ],
            borderWidth: 2,
            hoverBorderWidth: 3,
        }],
    };

    const statusChartOpts = {
        responsive: true,
        cutout: '65%',
        plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' }, usePointStyle: true, pointStyle: 'circle', padding: 16 } },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.9)',
                titleFont: { weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / stats.totalAnalyzed * 100)}%)` },
            },
        },
    };

    /* ── Chart: Deviation by Vehicle ────────────────────────── */
    const vehiclesWithDeviation = stats.results.filter(r => r.deviation_percentage !== null);
    const deviationChartData = {
        labels: vehiclesWithDeviation.map(r => r.vehicle_name.split(' ').slice(0, 2).join(' ')),
        datasets: [{
            label: 'Deviation from Verified Data (%)',
            data: vehiclesWithDeviation.map(r => r.deviation_percentage),
            backgroundColor: vehiclesWithDeviation.map(r =>
                r.deviation_percentage <= 10 ? 'rgba(16,185,129,0.3)' :
                    r.deviation_percentage <= 30 ? 'rgba(245,158,11,0.3)' :
                        'rgba(239,68,68,0.3)'
            ),
            borderColor: vehiclesWithDeviation.map(r =>
                r.deviation_percentage <= 10 ? '#10b981' :
                    r.deviation_percentage <= 30 ? '#f59e0b' :
                        '#ef4444'
            ),
            borderWidth: 2,
            borderRadius: 8,
        }],
    };

    const deviationChartOpts = {
        responsive: true,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.9)',
                titleFont: { weight: 'bold', size: 13 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 12,
                callbacks: { label: (ctx) => `Deviation: ${ctx.raw}%` },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(148,163,184,0.08)' },
                ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}%` },
                title: { display: true, text: 'Deviation %', color: '#94a3b8', font: { size: 11, weight: 'bold' } },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 10, weight: '600' } },
            },
        },
    };

    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/3 via-transparent to-emerald-500/3" />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0)} className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary-500 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                Greenwashing <span className="text-gradient-green">Detection</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">LOKI Verification Engine</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base ml-16 max-w-xl leading-relaxed">
                        Comparing manufacturer claims against verified data. Deviation-based classification with multi-source verification.
                    </p>
                </motion.div>

                {/* ── Stats Grid ─────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                    <StatCard icon={Eye} label="Analyzed" value={stats.totalAnalyzed} accent="bg-slate-500" idx={1} />
                    <StatCard icon={TrendingUp} label="Avg Score" value={`${stats.avgScore}/100`} accent="bg-primary-500" idx={2} />
                    <StatCard icon={Shield} label="Verified" value={stats.verified} accent="bg-emerald-500" idx={3} />
                    <StatCard icon={AlertTriangle} label="Exaggerated" value={stats.exaggerated} accent="bg-amber-500" idx={4} />
                    <StatCard icon={AlertTriangle} label="Greenwashing" value={stats.greenwashing} accent="bg-red-500" idx={5} />
                </div>

                {/* ── Charts Row ─────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                    {/* Doughnut: Claim Status Distribution */}
                    <motion.div {...fadeUp(6)} className="glass-card rounded-2xl p-6">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-5">
                            Claim Status Distribution
                        </h3>
                        <div className="relative max-w-[280px] mx-auto">
                            <Doughnut data={statusChartData} options={statusChartOpts} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalAnalyzed}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicles</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bar: Deviation by Vehicle */}
                    <motion.div {...fadeUp(7)} className="glass-card rounded-2xl p-6">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-5">
                            Claim Deviation from Verified Data
                        </h3>
                        <div className="h-64">
                            <Bar data={deviationChartData} options={{ ...deviationChartOpts, maintainAspectRatio: false }} />
                        </div>
                    </motion.div>
                </div>

                {/* ── Quick Actions ──────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                    <ActionCard icon={Search} title="Claim Scanner" desc="Paste marketing text for AI analysis" to="/claim-scanner" color="bg-blue-500" idx={8} />
                    <ActionCard icon={GitCompare} title="Compare Claims" desc="Side-by-side vehicle claim vs actual comparison" to="/green-compare" color="bg-purple-500" idx={9} />
                    <ActionCard icon={Users} title="Community Reports" desc="Report and vote on suspicious claims" to="/community-reports" color="bg-amber-500" idx={10} />
                    <ActionCard icon={Settings} title="Admin Panel" desc="Moderate reports and manage certifications" to="/admin" color="bg-slate-600" idx={11} />
                </div>

                {/* ── Vehicle Assessments ────────────────────────── */}
                <motion.div {...fadeUp(12)}>
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">
                        Vehicle Verification Results
                    </h2>
                    <div className="space-y-3">
                        {stats.results.map((v, i) => (
                            <motion.div
                                key={v.car_id}
                                {...fadeUp(i * 0.08 + 13)}
                                className="glass-card rounded-2xl p-5 hover:ring-1 hover:ring-primary-500/15 transition-all"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {/* Vehicle info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{v.vehicle_name}</h3>
                                            <span className="px-2 py-0.5 rounded-md bg-black/4 dark:bg-white/4 text-[10px] font-bold text-slate-500 uppercase">
                                                {v.category}
                                            </span>
                                            {v._backend && (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                                    Backend
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{v.company_name}</p>

                                        {/* Metrics row */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <SourceBadge source={v.data_source_used} />
                                            <ConfidencePill level={v.confidence_level} />
                                            {v.deviation_percentage !== null && (
                                                <span className={`text-[10px] font-bold ${v.deviation_percentage <= 10 ? 'text-emerald-600 dark:text-emerald-400' :
                                                    v.deviation_percentage <= 30 ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {v.deviation_percentage}% deviation
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Risk: {v.greenwashing_risk_score}/100
                                            </span>
                                        </div>
                                    </div>

                                    {/* Badge */}
                                    <TransparencyBadge claimStatus={v.claim_status} size="sm" />
                                </div>

                                {/* Analysis summary */}
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                                    {v.analysis_summary}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default GreenwashingDashboard;
