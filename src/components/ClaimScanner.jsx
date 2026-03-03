import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, CheckCircle, XCircle, Sparkles, FileText, Trash2, Database, Link2 } from 'lucide-react';
import { analyzeText, verifyClaim } from '../services/greenwashingService';
import { VEHICLE_CLAIMS } from '../services/greenwashingData';
import TransparencyBadge from './TransparencyBadge';

/* ── animation presets ─────────────────────────────────────── */
const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

const SEVERITY_CONFIG = {
    high: { bg: 'bg-red-500/10 dark:bg-red-500/15', border: 'border-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'High Risk', icon: XCircle },
    medium: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', border: 'border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', label: 'Medium Risk', icon: AlertTriangle },
    low: { bg: 'bg-blue-500/10 dark:bg-blue-500/15', border: 'border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', label: 'Low Risk', icon: CheckCircle },
};

const SAMPLE_TEXTS = [
    "Our new SUV is completely eco-friendly and carbon neutral. Made with sustainable technology, it's the greenest vehicle on the road — emission-free driving for a planet-friendly future.",
    "Introducing the all-new electric sedan with zero tailpipe emissions. Certified under BS-VI standards with 312 gCO₂/km lifecycle emissions. Range: 450km on WLTP test cycle.",
    "Drive guilt-free with our clean energy powered hybrid. Up to 40% reduced emissions compared to conventional engines. Powered by nature, built for the earth-conscious driver.",
];

/* ══════════════════════════════════════════════════════════════ */
const ClaimScanner = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [lokiResult, setLokiResult] = useState(null);
    const [selectedCarId, setSelectedCarId] = useState('');
    const [scanning, setScanning] = useState(false);
    const textareaRef = useRef(null);

    const handleScan = () => {
        if (!text.trim()) return;
        setScanning(true);
        setResult(null);
        setLokiResult(null);
        setTimeout(() => {
            const analysis = analyzeText(text);
            setResult(analysis);

            // If a vehicle is selected, run LOKI verification too
            if (selectedCarId) {
                const loki = verifyClaim(selectedCarId);
                setLokiResult(loki);
            }
            setScanning(false);
        }, 800);
    };

    const handleClear = () => {
        setText('');
        setResult(null);
        setLokiResult(null);
        setSelectedCarId('');
        textareaRef.current?.focus();
    };

    const handleSample = (sample) => {
        setText(sample);
        setResult(null);
        setLokiResult(null);
    };

    /* ── highlighted text renderer ────────────────────────────── */
    const renderHighlightedText = () => {
        if (!result || result.flags.length === 0) return <span>{text}</span>;

        const sorted = [...result.flags].sort((a, b) => a.index - b.index);
        const parts = [];
        let lastEnd = 0;

        sorted.forEach((flag, i) => {
            if (flag.index > lastEnd) {
                parts.push(<span key={`t-${i}`}>{text.substring(lastEnd, flag.index)}</span>);
            }
            const sev = SEVERITY_CONFIG[flag.severity];
            parts.push(
                <mark
                    key={`f-${i}`}
                    className={`${sev.bg} ${sev.text} px-1 py-0.5 rounded font-bold cursor-help`}
                    title={flag.explanation}
                >
                    {text.substring(flag.index, flag.index + flag.length)}
                </mark>
            );
            lastEnd = flag.index + flag.length;
        });

        if (lastEnd < text.length) {
            parts.push(<span key="end">{text.substring(lastEnd)}</span>);
        }

        return parts;
    };

    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-primary-500/3" />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0)} className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            <Search className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                AI Claim <span className="text-gradient-green">Scanner</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">LOKI Engine Powered</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base ml-14 max-w-xl leading-relaxed">
                        Paste marketing text to detect greenwashing patterns. Optionally link a vehicle for LOKI deviation analysis.
                    </p>
                </motion.div>

                {/* ── Input area ─────────────────────────────────── */}
                <motion.div {...fadeUp(1)} className="glass-card rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                            <FileText className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />Marketing Text
                        </label>
                        {text && (
                            <button onClick={handleClear} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => { setText(e.target.value); setResult(null); setLokiResult(null); }}
                        rows={6}
                        placeholder="Paste marketing copy, promotional text, or environmental claims here..."
                        className="w-full p-4 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 resize-none outline-none focus:border-primary-500/30 focus:ring-2 focus:ring-primary-500/10 transition-all"
                    />

                    {/* Vehicle link (optional) */}
                    <div className="mt-3">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" /> Link to Vehicle (Optional — enables LOKI verification)
                        </label>
                        <select
                            value={selectedCarId}
                            onChange={e => setSelectedCarId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500/30 transition-all"
                        >
                            <option value="">No vehicle linked (text analysis only)</option>
                            {VEHICLE_CLAIMS.map(v => (
                                <option key={v.car_id} value={v.car_id}>{v.vehicle_name} — {v.company_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sample texts */}
                    <div className="mt-3">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Try a sample:</p>
                        <div className="flex flex-wrap gap-2">
                            {SAMPLE_TEXTS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSample(s)}
                                    className="px-3 py-1.5 rounded-lg bg-black/3 dark:bg-white/4 border border-black/5 dark:border-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:border-primary-500/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all truncate max-w-[200px]"
                                >
                                    Sample {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scan button */}
                    <motion.button
                        onClick={handleScan}
                        disabled={!text.trim() || scanning}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {scanning ? (
                            <><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</>
                        ) : (
                            <><Search className="w-4 h-4" /> Scan for Greenwashing</>
                        )}
                    </motion.button>
                </motion.div>

                {/* ── Results ────────────────────────────────────── */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-5"
                        >
                            {/* LOKI Verification Card (if vehicle linked) */}
                            {lokiResult && (
                                <div className="glass-card rounded-2xl p-6 ring-1 ring-primary-500/10">
                                    <h3 className="text-xs font-black text-primary-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5" /> LOKI Verification Result
                                    </h3>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{lokiResult.vehicle_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{lokiResult.company_name}</p>
                                        </div>
                                        <TransparencyBadge claimStatus={lokiResult.claim_status} size="md" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {[
                                            { label: 'Risk Score', value: `${lokiResult.greenwashing_risk_score}/100` },
                                            { label: 'Deviation', value: lokiResult.deviation_percentage !== null ? `${lokiResult.deviation_percentage}%` : 'N/A' },
                                            { label: 'Data Source', value: lokiResult.data_source_used },
                                            { label: 'Confidence', value: lokiResult.confidence_level },
                                        ].map(m => (
                                            <div key={m.label} className="p-3 bg-black/3 dark:bg-white/3 rounded-xl text-center">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{m.value}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{m.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                                        {lokiResult.analysis_summary}
                                    </p>
                                </div>
                            )}

                            {/* Score overview */}
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                                    <div className="flex-1">
                                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">Text Analysis Result</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
                                    </div>
                                    <TransparencyBadge score={result.score} size="lg" />
                                </div>

                                {/* Score bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                        <span>Text Credibility Score</span>
                                        <span>{result.score}/100</span>
                                    </div>
                                    <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.score}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${result.score >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                                    result.score >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                                        'bg-gradient-to-r from-red-500 to-red-400'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Indicators */}
                                <div className="flex flex-wrap gap-3 text-[11px] font-bold">
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${result.hasNumbers ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {result.hasNumbers ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        Measurable Data
                                    </span>
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${result.hasCertMention ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {result.hasCertMention ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        Certification Referenced
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                                        <AlertTriangle className="w-3 h-3" />
                                        {result.flags.length} Flagged {result.flags.length === 1 ? 'Term' : 'Terms'}
                                    </span>
                                </div>
                            </div>

                            {/* Highlighted text */}
                            {result.flags.length > 0 && (
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">
                                        Highlighted Analysis
                                    </h3>
                                    <div className="p-4 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {renderHighlightedText()}
                                    </div>
                                </div>
                            )}

                            {/* Flag details */}
                            {result.flags.length > 0 && (
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">
                                        Flagged Terms & Explanations
                                    </h3>
                                    <div className="space-y-3">
                                        {result.flags.map((flag, i) => {
                                            const sev = SEVERITY_CONFIG[flag.severity];
                                            const SevIcon = sev.icon;
                                            return (
                                                <motion.div
                                                    key={i}
                                                    {...fadeUp(i * 0.1)}
                                                    className={`p-4 rounded-xl ${sev.bg} border ${sev.border}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <SevIcon className={`w-4 h-4 ${sev.text} mt-0.5 flex-shrink-0`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <span className={`text-sm font-bold ${sev.text}`}>"{flag.matchedText}"</span>
                                                                <span className={`px-2 py-0.5 rounded-md ${sev.bg} ${sev.text} text-[10px] font-black uppercase`}>
                                                                    {sev.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                {flag.explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* No issues */}
                            {result.flags.length === 0 && (
                                <div className="glass-card rounded-2xl p-8 text-center">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Greenwashing Detected</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">The text appears to use specific, verifiable environmental claims.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default ClaimScanner;
