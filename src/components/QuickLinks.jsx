import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calculator,
    TrendingDown,
    Shield,
    Gauge,
    IndianRupee,
    BookOpen,
    ExternalLink,
    ArrowRight,
} from 'lucide-react';

const QUICK_LINKS = [
    {
        title: 'Emissions Calculator',
        description: 'Calculate your daily commute carbon footprint and discover how many trees it takes to offset it.',
        icon: Calculator,
        to: '/#calculator',
        type: 'internal-hash',
        gradient: 'from-emerald-400 to-green-500',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
        title: 'Savings Data',
        description: 'Compare 5-year ownership costs between EV, hybrid, and ICE vehicles with real-world data.',
        icon: TrendingDown,
        to: '/#savings',
        type: 'internal-hash',
        gradient: 'from-blue-400 to-cyan-500',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-500 dark:text-cyan-400',
    },
    {
        title: 'EPA Data',
        description: 'Environmental Protection Agency — official vehicle emissions ratings and fuel economy data for US markets.',
        icon: Shield,
        to: 'https://www.epa.gov/greenvehicles',
        type: 'external',
        gradient: 'from-violet-400 to-purple-500',
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-500 dark:text-violet-400',
    },
    {
        title: 'WLTP Standards',
        description: 'Worldwide Harmonised Light Vehicles Test Procedure — the global standard for measuring vehicle emissions and fuel economy.',
        icon: Gauge,
        to: 'https://wltpfacts.eu/',
        type: 'external',
        gradient: 'from-amber-400 to-orange-500',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
        title: 'Car Pricing',
        description: 'Live ex-showroom and on-road prices for popular EVs, hybrids, and petrol cars across Indian cities.',
        icon: IndianRupee,
        to: '/pricing',
        type: 'internal',
        gradient: 'from-pink-400 to-rose-500',
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-500 dark:text-rose-400',
    },
    {
        title: 'Methodology',
        description: 'Deep dive into our emission formulas, data sources, and calculation methodology.',
        icon: BookOpen,
        to: '/methodology',
        type: 'internal',
        gradient: 'from-teal-400 to-emerald-500',
        iconBg: 'bg-teal-500/10',
        iconColor: 'text-teal-500 dark:text-teal-400',
    },
];

const QuickLinkCard = ({ link, index }) => {
    const Icon = link.icon;
    const isExternal = link.type === 'external';
    const isHashLink = link.type === 'internal-hash';

    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="h-full glass-card rounded-3xl p-6 relative overflow-hidden group cursor-pointer"
        >
            {/* Top gradient stripe */}
            <div className={`h-1 w-full bg-gradient-to-r ${link.gradient} absolute top-0 left-0 right-0`} />

            {/* Hover glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />

            <div className="relative z-10">
                {/* Icon */}
                <div className={`w-12 h-12 ${link.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${link.iconColor}`} />
                </div>

                {/* Title + arrow */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight">
                        {link.title}
                    </h3>
                    {isExternal ? (
                        <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
                    ) : (
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all flex-shrink-0" />
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {link.description}
                </p>

                {/* External badge */}
                {isExternal && (
                    <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5">
                        <ExternalLink className="w-3 h-3" /> Opens externally
                    </span>
                )}
            </div>
        </motion.div>
    );

    if (isExternal) {
        return (
            <a href={link.to} target="_blank" rel="noopener noreferrer" className="block h-full">
                {inner}
            </a>
        );
    }

    if (isHashLink) {
        return (
            <Link to={link.to} className="block h-full">
                {inner}
            </Link>
        );
    }

    return (
        <Link to={link.to} className="block h-full">
            {inner}
        </Link>
    );
};

const QuickLinks = () => {
    return (
        <section className="py-16 min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Background */}
            <div className="absolute inset-0 noise-overlay" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/3 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400 mb-2">
                        Resources & Tools
                    </p>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white font-display leading-none tracking-tight">
                        Quick{' '}
                        <span className="text-gradient-green">Links</span>
                    </h1>
                    <p className="text-slate-500 mt-3 text-lg max-w-lg">
                        Jump to calculators, data sources, and everything you need to make an informed green driving decision.
                    </p>
                </motion.div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {QUICK_LINKS.map((link, idx) => (
                        <QuickLinkCard key={link.title} link={link} index={idx} />
                    ))}
                </div>

                {/* Bottom note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-xs text-slate-400 dark:text-slate-600 mt-12 font-medium"
                >
                    External links open in a new tab. DriveNeutral is not affiliated with EPA or WLTP — we use their data for reference.
                </motion.p>
            </div>
        </section>
    );
};

export default QuickLinks;
