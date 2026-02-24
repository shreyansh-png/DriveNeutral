import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, MapPin, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INDIAN_CITIES = [
    'Ahmedabad', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad',
    'Jaipur', 'Kolkata', 'Lucknow', 'Mumbai', 'Pune',
];

const FloatingInput = ({ icon: Icon, label, type, value, onChange, placeholder, disabled }) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
            {label}
        </label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full pl-11 pr-4 py-3.5 bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-primary-500/40 focus:bg-black/8 dark:focus:bg-white/8 focus:shadow-lg focus:shadow-primary-500/5 transition-all duration-200 disabled:opacity-40 text-sm font-medium"
            />
        </div>
    </div>
);

const LoginModal = ({ isOpen, onClose }) => {
    const { login, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const resetForm = () => {
        setEmail(''); setPassword(''); setCity('');
        setError(''); setSuccess(''); setLoading(false);
    };

    const handleClose = () => { resetForm(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!city) { setError('Please select your city to continue.'); return; }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            if (isSignUp) {
                await signUp(email, password, city);
                setSuccess('Account created! Check your email to confirm, then log in.');
                setIsSignUp(false);
            } else {
                await login(email, password, city);
                handleClose();
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-black/40 dark:bg-slate-950/80 backdrop-blur-2xl" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glass card */}
                        <div className="glass-card rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">

                            {/* Subtle top accent */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />

                            {/* Decorative glow */}
                            <div className="absolute top-0 right-0 w-60 h-60 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="p-8 relative">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-primary-400 pulse-glow" />
                                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400">Drive Neutral</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                                            {isSignUp ? 'Get Started' : 'Welcome Back'}
                                        </h2>
                                        <p className="text-slate-500 text-sm mt-1 font-medium">
                                            {isSignUp
                                                ? 'Create your account to access city pricing'
                                                : 'Sign in to check on-road prices near you'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 rounded-xl text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <FloatingInput
                                        icon={Mail} label="Email Address" type="email"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com" disabled={loading}
                                    />
                                    <FloatingInput
                                        icon={Lock} label="Password" type="password"
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder={isSignUp ? 'Minimum 6 characters' : '••••••••'}
                                        disabled={loading}
                                    />

                                    {/* City Selector */}
                                    <div className="flex flex-col gap-1.5 group">
                                        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
                                            Your City <span className="text-primary-500 dark:text-primary-400 normal-case tracking-normal">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 pointer-events-none transition-colors" />
                                            <select
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                disabled={loading}
                                                className="w-full pl-11 pr-10 py-3.5 bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/40 focus:bg-black/8 dark:focus:bg-white/8 focus:shadow-lg focus:shadow-primary-500/5 transition-all duration-200 disabled:opacity-40 text-sm font-medium appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Select your city...</option>
                                                {INDIAN_CITIES.map(c => (
                                                    <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{c}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-600 pl-1 font-medium">
                                            Used to calculate on-road prices with local RTO & taxes
                                        </p>
                                    </div>

                                    {/* Error / Success */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium"
                                            >
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                        {success && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-3.5 bg-primary-500/10 border border-primary-500/20 rounded-xl text-primary-600 dark:text-primary-400 text-sm font-medium"
                                            >
                                                ✓ {success}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="mt-2 relative flex items-center justify-center gap-2.5 w-full py-4 font-black text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 hover:bg-primary-500 dark:hover:bg-primary-300 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : isSignUp ? (
                                            <><UserPlus className="w-4 h-4" /><span className="tracking-wide">Create Account</span></>
                                        ) : (
                                            <><LogIn className="w-4 h-4" /><span className="tracking-wide">Sign In</span></>
                                        )}
                                    </motion.button>

                                    {/* Toggle */}
                                    <p className="text-center text-sm text-slate-500 font-medium">
                                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                        <button
                                            type="button"
                                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline underline-offset-2"
                                        >
                                            {isSignUp ? 'Log In' : 'Sign Up Free'}
                                        </button>
                                    </p>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoginModal;
