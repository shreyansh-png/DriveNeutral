import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ThumbsUp, ThumbsDown, Send, AlertTriangle, CheckCircle, Clock, Eye, Plus, X } from 'lucide-react';
import { getReports, submitReport, voteOnReport } from '../services/greenwashingService';

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

const STATUS_CONFIG = {
    pending: { icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Pending Review' },
    confirmed: { icon: CheckCircle, bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Confirmed Greenwashing' },
    dismissed: { icon: Eye, bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Dismissed' },
};

/* ══════════════════════════════════════════════════════════════ */
const CommunityReports = () => {
    const [reports, setReports] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [voted, setVoted] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dn_gw_voted') || '{}'); } catch { return {}; }
    });
    const [form, setForm] = useState({ manufacturer: '', claimText: '', reason: '', reportedBy: '' });

    useEffect(() => { setReports(getReports()); }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.manufacturer.trim() || !form.claimText.trim() || !form.reason.trim()) return;
        submitReport(form);
        setReports(getReports());
        setForm({ manufacturer: '', claimText: '', reason: '', reportedBy: '' });
        setShowForm(false);
    };

    const handleVote = (id, direction) => {
        if (voted[id]) return;
        voteOnReport(id, direction);
        setReports(getReports());
        const newVoted = { ...voted, [id]: direction };
        setVoted(newVoted);
        localStorage.setItem('dn_gw_voted', JSON.stringify(newVoted));
    };

    const formatDate = (ts) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-primary-500/3" />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                Community <span className="text-gradient-green">Reports</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-base ml-14 max-w-xl leading-relaxed">
                            Report suspicious green claims and help validate environmental marketing in the auto industry.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowForm(!showForm)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Cancel' : 'Report'}
                    </motion.button>
                </motion.div>

                {/* ── Report Form ────────────────────────────────── */}
                <AnimatePresence>
                    {showForm && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit}
                            className="glass-card rounded-2xl p-6 mb-8 overflow-hidden"
                        >
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-5">
                                Submit a Report
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Manufacturer *</label>
                                    <input
                                        type="text"
                                        value={form.manufacturer}
                                        onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                                        placeholder="e.g. Toyota, Hyundai..."
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-primary-500/30 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Your Name (optional)</label>
                                    <input
                                        type="text"
                                        value={form.reportedBy}
                                        onChange={e => setForm({ ...form, reportedBy: e.target.value })}
                                        placeholder="Anonymous"
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-primary-500/30 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Suspicious Claim *</label>
                                <textarea
                                    rows={3}
                                    value={form.claimText}
                                    onChange={e => setForm({ ...form, claimText: e.target.value })}
                                    placeholder="Paste the marketing claim you find suspicious..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 resize-none outline-none focus:border-primary-500/30 transition-all"
                                    required
                                />
                            </div>
                            <div className="mb-5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Why is this suspicious? *</label>
                                <textarea
                                    rows={2}
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Explain why you think this claim is misleading..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 resize-none outline-none focus:border-primary-500/30 transition-all"
                                    required
                                />
                            </div>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20"
                            >
                                <Send className="w-4 h-4" /> Submit Report
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* ── Stats bar ──────────────────────────────────── */}
                <motion.div {...fadeUp(1)} className="flex gap-3 mb-6 flex-wrap">
                    {[
                        { label: 'Total Reports', value: reports.length, color: 'text-slate-500' },
                        { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'text-amber-500' },
                        { label: 'Confirmed', value: reports.filter(r => r.status === 'confirmed').length, color: 'text-red-500' },
                    ].map(s => (
                        <div key={s.label} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{s.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* ── Reports Feed ───────────────────────────────── */}
                <div className="space-y-4">
                    {reports.map((r, i) => {
                        const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                        const StIcon = st.icon;
                        return (
                            <motion.div key={r.id} {...fadeUp(i * 0.1 + 2)} className="glass-card rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    {/* Vote */}
                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => handleVote(r.id, 'up')}
                                            disabled={!!voted[r.id]}
                                            className={`p-1.5 rounded-lg transition-all ${voted[r.id] === 'up'
                                                    ? 'bg-emerald-500/15 text-emerald-500'
                                                    : 'hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500'
                                                } ${voted[r.id] ? 'cursor-default' : ''}`}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{r.upvotes - r.downvotes}</span>
                                        <button
                                            onClick={() => handleVote(r.id, 'down')}
                                            disabled={!!voted[r.id]}
                                            className={`p-1.5 rounded-lg transition-all ${voted[r.id] === 'down'
                                                    ? 'bg-red-500/15 text-red-500'
                                                    : 'hover:bg-red-500/10 text-slate-400 hover:text-red-500'
                                                } ${voted[r.id] ? 'cursor-default' : ''}`}
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{r.manufacturer}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${st.bg} ${st.text} text-[10px] font-bold uppercase`}>
                                                <StIcon className="w-3 h-3" /> {st.label}
                                            </span>
                                        </div>
                                        <blockquote className="text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-primary-500/30 pl-3 mb-2 leading-relaxed">
                                            "{r.claimText}"
                                        </blockquote>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                                            <AlertTriangle className="inline w-3 h-3 mr-1 text-amber-500 -mt-0.5" />
                                            {r.reason}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                            <span>by {r.reportedBy}</span>
                                            <span>·</span>
                                            <span>{formatDate(r.timestamp)}</span>
                                            <span>·</span>
                                            <span>{r.upvotes} upvotes</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {reports.length === 0 && (
                    <div className="glass-card rounded-2xl p-12 text-center">
                        <Users className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reports Yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Be the first to report a suspicious environmental claim.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CommunityReports;
