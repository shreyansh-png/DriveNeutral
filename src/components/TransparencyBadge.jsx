import React from 'react';
import { motion } from 'framer-motion';

/* ── Tier configuration ───────────────────────────────────── */
const TIERS = {
    verified: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-500/20',
        label: 'Verified Claim',
        emoji: '🟢',
    },
    partial: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
        ring: 'ring-amber-500/20',
        label: 'Exaggerated Claim',
        emoji: '🟡',
    },
    flagged: {
        bg: 'bg-red-500/10 dark:bg-red-500/15',
        text: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-500',
        ring: 'ring-red-500/20',
        label: 'Potential Greenwashing',
        emoji: '🔴',
    },
    nodata: {
        bg: 'bg-slate-500/10 dark:bg-slate-500/15',
        text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
        ring: 'ring-slate-500/20',
        label: 'No Verified Data',
        emoji: '⚪',
    },
};

/* ── Size variants ────────────────────────────────────────── */
const SIZES = {
    sm: { pill: 'px-2.5 py-1 text-[10px]', dot: 'w-2 h-2' },
    md: { pill: 'px-3 py-1.5 text-xs', dot: 'w-2.5 h-2.5' },
    lg: { pill: 'px-4 py-2 text-sm', dot: 'w-3 h-3' },
};

/**
 * Resolve tier from either a claimStatus string or a numeric score.
 */
function resolveTier(claimStatus, score) {
    if (claimStatus) {
        switch (claimStatus) {
            case 'Verified Claim': return 'verified';
            case 'Exaggerated Claim': return 'partial';
            case 'Potential Greenwashing': return 'flagged';
            case 'No Verified Data Available': return 'nodata';
            default: break;
        }
    }
    if (score !== undefined && score !== null) {
        if (score >= 75) return 'verified';
        if (score >= 40) return 'partial';
        return 'flagged';
    }
    return 'nodata';
}

/* ══════════════════════════════════════════════════════════════ */
const TransparencyBadge = ({
    score,
    claimStatus,
    size = 'md',
    animate = true,
    showLabel = true,
}) => {
    const tier = resolveTier(claimStatus, score);
    const style = TIERS[tier] || TIERS.nodata;
    const sz = SIZES[size] || SIZES.md;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-bold ring-1 ${style.bg} ${style.text} ${style.ring} ${sz.pill}`}
        >
            {/* Animated pulsing dot */}
            <span className="relative flex-shrink-0">
                {animate && tier !== 'nodata' && (
                    <motion.span
                        className={`absolute inset-0 rounded-full ${style.dot} opacity-40`}
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
                <span className={`block rounded-full ${style.dot} ${sz.dot}`} />
            </span>
            {showLabel && (
                <span>{style.emoji} {style.label}</span>
            )}
        </span>
    );
};

export default TransparencyBadge;
