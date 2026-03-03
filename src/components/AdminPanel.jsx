import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Shield, Database, Users, CheckCircle, XCircle,
    Plus, Trash2, Edit3, Save, AlertTriangle, Lock, FileText, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getReports, moderateReport, deleteReport,
    getCertifications, addCertification, updateCertification, deleteCertification,
    verifyClaim, setOverride, clearOverride, getAllOverrides,
    getAuditLog, clearAuditLog,
} from '../services/greenwashingService';
import { VEHICLE_CLAIMS } from '../services/greenwashingData';
import TransparencyBadge from './TransparencyBadge';

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

const TABS = [
    { key: 'moderation', label: 'Moderation', icon: Users },
    { key: 'certifications', label: 'Certifications', icon: Database },
    { key: 'overrides', label: 'Manual Override', icon: Shield },
    { key: 'audit', label: 'Audit Log', icon: FileText },
];

/* ══════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('moderation');

    /* ── Moderation ──────────────────────────────────────────── */
    const [reports, setReports] = useState([]);
    useEffect(() => { setReports(getReports()); }, []);

    const handleModerate = (id, status) => {
        moderateReport(id, status);
        setReports(getReports());
    };
    const handleDeleteReport = (id) => {
        deleteReport(id);
        setReports(getReports());
    };

    /* ── Certifications ─────────────────────────────────────── */
    const [certs, setCerts] = useState([]);
    const [showCertForm, setShowCertForm] = useState(false);
    const [editCert, setEditCert] = useState(null);
    const [certForm, setCertForm] = useState({ name: '', category: '', description: '' });

    useEffect(() => { setCerts(getCertifications()); }, []);

    const handleSaveCert = (e) => {
        e.preventDefault();
        if (!certForm.name.trim()) return;
        if (editCert) {
            updateCertification(editCert, certForm);
        } else {
            addCertification(certForm);
        }
        setCerts(getCertifications());
        setCertForm({ name: '', category: '', description: '' });
        setEditCert(null);
        setShowCertForm(false);
    };

    const handleEditCert = (cert) => {
        setCertForm({ name: cert.name, category: cert.category, description: cert.description });
        setEditCert(cert.id);
        setShowCertForm(true);
    };

    const handleDeleteCert = (id) => {
        deleteCertification(id);
        setCerts(getCertifications());
    };

    /* ── Overrides ──────────────────────────────────────────── */
    const [overrides, setOverrides] = useState({});
    const [overrideScores, setOverrideScores] = useState({});

    useEffect(() => {
        const ov = getAllOverrides();
        setOverrides(ov);
        const scores = {};
        VEHICLE_CLAIMS.forEach(v => {
            const result = verifyClaim(v.car_id);
            scores[v.car_id] = ov[v.car_id] ?? result.greenwashing_risk_score;
        });
        setOverrideScores(scores);
    }, []);

    const handleSetOverride = (vehicleId) => {
        const score = overrideScores[vehicleId];
        if (score === undefined) return;
        setOverride(vehicleId, score);
        setOverrides(getAllOverrides());
    };

    const handleClearOverride = (vehicleId) => {
        clearOverride(vehicleId);
        setOverrides(getAllOverrides());
        const result = verifyClaim(vehicleId);
        setOverrideScores(prev => ({ ...prev, [vehicleId]: result.greenwashing_risk_score }));
    };

    /* ── Audit Log ──────────────────────────────────────────── */
    const [auditLog, setAuditLog] = useState([]);
    useEffect(() => { if (activeTab === 'audit') setAuditLog(getAuditLog()); }, [activeTab]);

    const handleClearAudit = () => {
        clearAuditLog();
        setAuditLog([]);
    };

    /* ── Auth gate ───────────────────────────────────────────── */
    if (!user) {
        return (
            <section className="py-24 min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="glass-card rounded-2xl p-12 text-center max-w-sm mx-auto">
                    <Lock className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Please log in to access the admin panel.</p>
                </div>
            </section>
        );
    }

    const STATUS_COLORS = {
        pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        confirmed: 'bg-red-500/10 text-red-600 dark:text-red-400',
        dismissed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };

    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/3 via-transparent to-primary-500/3" />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0)} className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-slate-500/10 rounded-2xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                Admin <span className="text-gradient-green">Panel</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">LOKI Engine Management</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base ml-14 max-w-xl leading-relaxed">
                        Moderate reports, manage certifications, override scores, and review audit logs.
                    </p>
                </motion.div>

                {/* ── Stats ──────────────────────────────────────── */}
                <motion.div {...fadeUp(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: 'Total Reports', value: reports.length, color: 'text-slate-500' },
                        { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'text-amber-500' },
                        { label: 'Confirmed', value: reports.filter(r => r.status === 'confirmed').length, color: 'text-red-500' },
                        { label: 'Certifications', value: certs.length, color: 'text-primary-500' },
                    ].map(s => (
                        <div key={s.label} className="glass-card rounded-xl px-4 py-3 text-center">
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* ── Tabs ───────────────────────────────────────── */}
                <motion.div {...fadeUp(2)} className="flex gap-1.5 mb-6 bg-black/3 dark:bg-white/3 rounded-xl p-1.5 overflow-x-auto hide-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.key
                                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* ── Tab Content ────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {/* MODERATION TAB */}
                    {activeTab === 'moderation' && (
                        <motion.div key="mod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            {reports.length === 0 && (
                                <div className="glass-card rounded-2xl p-10 text-center">
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">No reports to moderate</p>
                                </div>
                            )}
                            {reports.map((r) => (
                                <div key={r.id} className="glass-card rounded-2xl p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{r.manufacturer}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                                                    {r.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-1">"{r.claimText}"</p>
                                            <p className="text-xs text-slate-400">Reason: {r.reason}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">By {r.reportedBy} · {r.upvotes} upvotes · {r.downvotes} downvotes</p>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <button onClick={() => handleModerate(r.id, 'confirmed')} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Confirm greenwashing">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleModerate(r.id, 'dismissed')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Dismiss report">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteReport(r.id)} className="p-2 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Delete report">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* CERTIFICATIONS TAB */}
                    {activeTab === 'certifications' && (
                        <motion.div key="cert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => { setShowCertForm(!showCertForm); setEditCert(null); setCertForm({ name: '', category: '', description: '' }); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20"
                                >
                                    {showCertForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showCertForm ? 'Cancel' : 'Add Certification'}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showCertForm && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onSubmit={handleSaveCert}
                                        className="glass-card rounded-2xl p-5 mb-5 overflow-hidden"
                                    >
                                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">
                                            {editCert ? 'Edit Certification' : 'Add New Certification'}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <input type="text" value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} placeholder="Certification name" required
                                                className="px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500/30 transition-all" />
                                            <input type="text" value={certForm.category} onChange={e => setCertForm({ ...certForm, category: e.target.value })} placeholder="Category"
                                                className="px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500/30 transition-all" />
                                        </div>
                                        <textarea rows={2} value={certForm.description} onChange={e => setCertForm({ ...certForm, description: e.target.value })} placeholder="Description"
                                            className="w-full px-4 py-2.5 rounded-xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 resize-none outline-none focus:border-primary-500/30 transition-all mb-3" />
                                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold">
                                            <Save className="w-3.5 h-3.5" /> {editCert ? 'Update' : 'Add'}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                {certs.map(c => (
                                    <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                                            <Database className="w-4 h-4 text-primary-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.category} — {c.description}</p>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <button onClick={() => handleEditCert(c)} className="p-2 rounded-lg hover:bg-primary-500/10 text-slate-400 hover:text-primary-500 transition-colors">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteCert(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* OVERRIDES TAB */}
                    {activeTab === 'overrides' && (
                        <motion.div key="over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            <div className="glass-card rounded-xl p-4 mb-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    <AlertTriangle className="inline w-3 h-3 text-amber-500 mr-1 -mt-0.5" />
                                    Manual overrides bypass the LOKI scoring engine. Use only when you have verified data that contradicts the algorithm's output.
                                </p>
                            </div>
                            {VEHICLE_CLAIMS.map(v => {
                                const hasOverride = overrides[v.car_id] !== undefined;
                                const currentScore = overrideScores[v.car_id] ?? 40;
                                const result = verifyClaim(v.car_id);
                                return (
                                    <div key={v.car_id} className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{v.vehicle_name}</h4>
                                                {hasOverride && (
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">Override Active</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {v.company_name} · LOKI: {result.claim_status}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <TransparencyBadge claimStatus={result.claim_status} size="sm" animate={false} />
                                            <input
                                                type="number" min="0" max="100"
                                                value={currentScore}
                                                onChange={e => setOverrideScores(prev => ({ ...prev, [v.car_id]: Number(e.target.value) }))}
                                                className="w-16 px-2 py-1.5 rounded-lg bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm font-bold text-slate-700 dark:text-slate-300 text-center outline-none focus:border-primary-500/30 transition-all"
                                            />
                                            <button onClick={() => handleSetOverride(v.car_id)} className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-500/20 transition-colors">
                                                Set
                                            </button>
                                            {hasOverride && (
                                                <button onClick={() => handleClearOverride(v.car_id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors">
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* AUDIT LOG TAB */}
                    {activeTab === 'audit' && (
                        <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-xs text-slate-400">
                                    {auditLog.length} entries · Source URLs logged internally for transparency
                                </p>
                                {auditLog.length > 0 && (
                                    <button onClick={handleClearAudit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors">
                                        <Trash2 className="w-3 h-3" /> Clear Log
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {auditLog.length === 0 && (
                                    <div className="glass-card rounded-2xl p-10 text-center">
                                        <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">No audit entries</p>
                                        <p className="text-xs text-slate-400 mt-1">Verification activities will be logged here.</p>
                                    </div>
                                )}
                                {auditLog.slice(0, 50).map((entry, i) => (
                                    <div key={i} className="glass-card rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${entry.action === 'VERIFICATION_COMPLETE' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' :
                                                            entry.action === 'INTERNET_FETCH' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                                entry.action === 'DOMAIN_REJECTED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                                                    'bg-slate-500/10 text-slate-500'
                                                        }`}>{entry.action}</span>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{entry.car_id}</span>
                                                </div>
                                                {entry.company_name && <p className="text-[11px] text-slate-500">{entry.company_name}</p>}
                                                {entry.claim_status && <p className="text-[11px] text-slate-400">Status: {entry.claim_status} · Risk: {entry.greenwashing_risk_score}/100</p>}
                                                {entry.domain && <p className="text-[11px] text-slate-400">Domain: {entry.domain}</p>}
                                                {entry.verified_by && <p className="text-[11px] text-slate-400">Verified by: {entry.verified_by}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {new Date(entry.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default AdminPanel;
