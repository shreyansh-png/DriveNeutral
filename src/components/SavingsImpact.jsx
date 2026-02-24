import React, { useRef, useState, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingDown, BarChart3, PieChart, SlidersHorizontal } from 'lucide-react';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const NEON_GREEN = '#10b981';
const NEON_GREEN_30 = 'rgba(16, 185, 129, 0.15)';
const SLATE_RED = '#ef4444';
const SLATE_RED_30 = 'rgba(239, 68, 68, 0.15)';

/* ── 🇮🇳 The Final Rupee Logic ────────────────────────────── */
const getDriveNeutralData = (icePrice, evPrice, annualKm = 15000) => {
    const petrolPrice = 103;   // ₹/L — avg India
    const iceMileage = 14;     // km/l

    // 1. Annual ICE Breakdown (synced to Donut)
    const iceFuel = (annualKm / iceMileage) * petrolPrice;
    const iceMaint = 12000;
    const iceInsurance = 35000;
    const iceTotalAnnual = iceFuel + iceMaint + iceInsurance;

    // 2. EV Annual Running
    const evCharging = (annualKm / 7) * 9;   // 7 km/unit @ ₹9
    const evMaint = 5000;
    const evInsurance = 40000;
    const evTotalAnnual = evCharging + evMaint + evInsurance;

    // 3. Data for Charts
    return {
        donutData: {
            Fuel: Math.round(iceFuel),
            Maintenance: Math.round(iceMaint),
            'Insurance & Tax': Math.round(iceInsurance),
        },
        donutTotal: Math.round(iceTotalAnnual),
        barData: { ICE: 4600, Hybrid: 2800, EV: 150 }, // kg CO₂
        lineData: Array.from({ length: 5 }, (_, i) => ({
            year: `Year ${i + 1}`,
            ice: Math.round(Number(icePrice) + (iceTotalAnnual * (i + 1))),
            ev: Math.round(Number(evPrice) + (evTotalAnnual * (i + 1))),
        })),
        annualSaving: Math.round(iceTotalAnnual - evTotalAnnual),
        fiveYearSaving: Math.round((iceTotalAnnual - evTotalAnnual) * 5),
    };
};

const formatLakh = (v) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${v.toLocaleString('en-IN')}`;
};

/* ── Component ────────────────────────────────────────────── */
const SavingsImpact = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // User-adjustable inputs
    const [icePrice, setIcePrice] = useState(1500000);  // ₹15L
    const [evPrice, setEvPrice] = useState(2000000);     // ₹20L
    const [annualKm, setAnnualKm] = useState(15000);

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    const tickColor = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(71,85,105,0.7)';
    const tooltipBg = 'rgba(15, 23, 42, 0.9)';

    // Compute all chart data from the Rupee engine
    const calc = useMemo(
        () => getDriveNeutralData(icePrice, evPrice, annualKm),
        [icePrice, evPrice, annualKm]
    );

    // ── 1. Line chart — 5‑year cumulative cost ───────────
    const savingsData = {
        labels: calc.lineData.map(d => d.year),
        datasets: [
            {
                label: 'Electric Vehicle',
                data: calc.lineData.map(d => d.ev),
                borderColor: NEON_GREEN,
                backgroundColor: NEON_GREEN_30,
                borderWidth: 3,
                fill: true,
                tension: 0.45,
                pointBackgroundColor: NEON_GREEN,
                pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: 'ICE Vehicle',
                data: calc.lineData.map(d => d.ice),
                borderColor: SLATE_RED,
                backgroundColor: SLATE_RED_30,
                borderWidth: 3,
                fill: true,
                tension: 0.45,
                pointBackgroundColor: SLATE_RED,
                pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: tickColor,
                    font: { family: 'Inter', size: 12, weight: 600 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: tooltipBg,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleFont: { family: 'Inter', weight: 700 },
                bodyFont: { family: 'Inter' },
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${formatLakh(ctx.raw)}`,
                },
            },
        },
        scales: {
            y: {
                grid: { color: gridColor, drawBorder: false },
                ticks: {
                    color: tickColor,
                    font: { family: 'Inter', size: 11 },
                    callback: (v) => formatLakh(v),
                },
                border: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
                border: { display: false },
            },
        },
    };

    // ── 2. Bar chart — annual CO₂ ────────────────────────
    const carbonData = {
        labels: ['ICE', 'Hybrid', 'EV'],
        datasets: [{
            label: 'Annual CO₂ (kg)',
            data: [calc.barData.ICE, calc.barData.Hybrid, calc.barData.EV],
            backgroundColor: [
                'rgba(239, 68, 68, 0.7)',
                'rgba(234, 179, 8, 0.7)',
                'rgba(16, 185, 129, 0.7)',
            ],
            borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(234, 179, 8, 1)',
                'rgba(16, 185, 129, 1)',
            ],
            borderWidth: 2,
            borderRadius: 12,
            borderSkipped: false,
        }],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: tooltipBg,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                titleFont: { family: 'Inter', weight: 700 },
                bodyFont: { family: 'Inter' },
                callbacks: {
                    label: (ctx) => ` ${ctx.raw.toLocaleString('en-IN')} kg CO₂/yr`,
                },
            },
        },
        scales: {
            y: {
                grid: { color: gridColor, drawBorder: false },
                ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
                border: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: tickColor, font: { family: 'Inter', size: 12, weight: 600 } },
                border: { display: false },
            },
        },
        animation: {
            delay: (ctx) => ctx.type === 'data' && ctx.mode === 'default' && !ctx.active ? ctx.dataIndex * 300 + 500 : 0,
        },
    };

    // ── 3. Doughnut — ICE annual cost breakdown ──────────
    const donutLabels = Object.keys(calc.donutData);
    const donutValues = Object.values(calc.donutData);

    const breakdownData = {
        labels: donutLabels,
        datasets: [{
            data: donutValues,
            backgroundColor: [
                'rgba(56, 189, 248, 0.8)',
                'rgba(244, 63, 94, 0.7)',
                'rgba(168, 85, 247, 0.7)',
            ],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
        }],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: tickColor,
                    padding: 20,
                    font: { family: 'Inter', size: 12, weight: 500 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                backgroundColor: tooltipBg,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
        cutout: '72%',
    };

    const chartCards = [
        {
            title: 'Cumulative 5-Year Cost',
            subtitle: `Purchase + Running — ₹${(annualKm / 1000).toFixed(0)}k km/yr`,
            icon: TrendingDown,
            chart: <Line data={savingsData} options={lineOptions} />,
            span: 'lg:col-span-2',
            iconColor: 'text-primary-500 dark:text-primary-400',
            iconBg: 'bg-primary-500/10',
        },
        {
            title: 'Annual Carbon Emissions',
            subtitle: `kg CO₂ per year @ ${(annualKm / 1000).toFixed(0)}k km`,
            icon: BarChart3,
            chart: <Bar data={carbonData} options={barOptions} />,
            span: '',
            iconColor: 'text-amber-500 dark:text-amber-400',
            iconBg: 'bg-amber-500/10',
        },
        {
            title: 'Annual ICE Cost Breakdown',
            subtitle: 'Where your ₹ goes every year',
            icon: PieChart,
            chart: <Doughnut data={breakdownData} options={doughnutOptions} />,
            span: '',
            iconColor: 'text-purple-500 dark:text-purple-400',
            iconBg: 'bg-purple-500/10',
            centerLabel: { label: 'Total', value: formatLakh(calc.donutTotal) },
        },
    ];

    return (
        <section id="savings" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300" ref={ref}>
            <div className="absolute inset-0 noise-overlay" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-primary-500/3 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight">
                        The True Cost of{' '}
                        <span className="text-gradient-green">Ownership</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        EVs might have a higher upfront cost, but look how much you save over five years. Let the data speak.
                    </p>
                </motion.div>

                {/* ── Interactive Controls ────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="glass-card rounded-2xl p-5 mb-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <SlidersHorizontal className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400">Customise Your Scenario</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ICE Price</label>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display tabular-nums">{formatLakh(icePrice)}</span>
                            </div>
                            <input type="range" min="500000" max="4000000" step="100000" value={icePrice} onChange={e => setIcePrice(Number(e.target.value))} />
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600">
                                <span>₹5L</span><span>₹40L</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EV Price</label>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display tabular-nums">{formatLakh(evPrice)}</span>
                            </div>
                            <input type="range" min="800000" max="5000000" step="100000" value={evPrice} onChange={e => setEvPrice(Number(e.target.value))} />
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600">
                                <span>₹8L</span><span>₹50L</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Annual Km</label>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-display tabular-nums">{(annualKm / 1000).toFixed(0)}k km</span>
                            </div>
                            <input type="range" min="5000" max="50000" step="1000" value={annualKm} onChange={e => setAnnualKm(Number(e.target.value))} />
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600">
                                <span>5k km</span><span>50k km</span>
                            </div>
                        </div>
                    </div>
                    {/* Quick insight badges */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold">
                            💰 Annual saving: {formatLakh(calc.annualSaving)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            🌱 5-year saving: {formatLakh(calc.fiveYearSaving)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            ⛽ Petrol @ ₹103/L &bull; ⚡ EV @ ₹9/unit
                        </span>
                    </div>
                </motion.div>

                {/* ── Chart Grid ──────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {chartCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                className={`glass-card rounded-3xl p-6 ${card.span} relative overflow-hidden group`}
                            >
                                {/* Subtle glow on hover */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/0 group-hover:bg-primary-500/5 rounded-full blur-3xl transition-colors duration-700" />

                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{card.title}</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{card.subtitle}</p>
                                    </div>
                                </div>

                                <div className="h-72 w-full relative z-10">
                                    {isInView && card.chart}
                                    {card.centerLabel && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '3rem' }}>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{card.centerLabel.label}</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white font-display">{card.centerLabel.value}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SavingsImpact;

