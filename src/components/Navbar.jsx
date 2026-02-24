import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Leaf, Menu, X, LogIn, LogOut, MapPin, IndianRupee, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const Navbar = ({ darkMode, setDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const location = useLocation();
    const { user, city, logout } = useAuth();

    const links = [
        { name: 'Home', path: '/' },
        { name: 'Compare', path: '/compare' },
        { name: 'Calculator', path: location.pathname === '/' ? '#calculator' : '/#calculator' },
        { name: 'Savings', path: location.pathname === '/' ? '#savings' : '/#savings' },
        { name: 'Quick Links', path: '/quick-links' },
        ...(user ? [{ name: 'Car Pricing', path: '/pricing', highlight: true }] : []),
    ];

    const openChatbot = () => {
        window.dispatchEvent(new CustomEvent('open-driveneutral-ai'));
    };

    const getInitials = () => {
        if (!user) return '';
        return (user.email || '').slice(0, 2).toUpperCase();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="fixed w-full z-50 transition-all duration-300">
                <div className="mx-3 mt-3 rounded-2xl bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border border-black/6 dark:border-white/6 shadow-lg dark:shadow-2xl shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="flex justify-between h-14 items-center gap-4">

                            {/* Logo */}
                            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
                                <div className="relative w-8 h-8">
                                    <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                                    <div className="relative w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                                        <Leaf className="h-[18px] w-[18px] text-white" />
                                    </div>
                                </div>
                                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white font-display">
                                    Drive<span className="text-primary-500 dark:text-primary-400">Neutral</span>
                                </span>
                            </Link>

                            {/* Desktop nav links */}
                            <div className="hidden md:flex items-center gap-1">
                                {links.map((link) => {
                                    const active = isActive(link.path);
                                    const isHash = link.path.startsWith('#') || link.path.includes('#');
                                    const cls = `relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${link.highlight
                                        ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/15'
                                        : active
                                            ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                        }`;
                                    return isHash ? (
                                        <a key={link.name} href={link.path} className={cls}>
                                            {link.highlight && <IndianRupee className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                                            {link.name}
                                        </a>
                                    ) : (
                                        <Link key={link.name} to={link.path} className={cls}>
                                            {link.highlight && <IndianRupee className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Right side controls */}
                            <div className="hidden md:flex items-center gap-2">
                                {/* AI Assistant */}
                                <button
                                    onClick={openChatbot}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/15 rounded-xl transition-all"
                                >
                                    <Sparkles className="w-4 h-4" /> AI Assistant
                                </button>
                                {/* Dark mode toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
                                    aria-label="Toggle Dark Mode"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={darkMode ? 'sun' : 'moon'}
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {darkMode ? <Sun className="h-[18px] w-[18px] text-amber-400" /> : <Moon className="h-[18px] w-[18px] text-slate-500" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>

                                {/* Auth section */}
                                {user ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/6 dark:border-white/6">
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                                                <span className="text-white text-[10px] font-black">{getInitials()}</span>
                                            </div>
                                            {city && (
                                                <>
                                                    <MapPin className="w-3 h-3 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-300">{city}</span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <LogOut className="h-3.5 w-3.5" /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <motion.button
                                        onClick={() => setIsLoginOpen(true)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 hover:bg-primary-500 dark:hover:bg-primary-300 rounded-xl shadow-lg shadow-primary-500/15 transition-colors"
                                    >
                                        <LogIn className="h-4 w-4" /> Login
                                    </motion.button>
                                )}
                            </div>

                            {/* Mobile right controls */}
                            <div className="md:hidden flex items-center gap-2">
                                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
                                </button>
                                {user ? (
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-white text-[10px] font-black">{getInitials()}</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsLoginOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 rounded-xl shadow-md shadow-primary-500/15"
                                    >
                                        <LogIn className="h-3.5 w-3.5" /> Login
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={isOpen ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.12 }}>
                                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="md:hidden mx-3 mt-1.5 rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border border-black/6 dark:border-white/6 shadow-xl dark:shadow-2xl overflow-hidden transition-colors"
                        >
                            <div className="px-3 py-3 space-y-1">
                                {links.map((link) => {
                                    const isHash = link.path.startsWith('#') || link.path.includes('#');
                                    const cls = `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${link.highlight
                                        ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                        }`;
                                    return isHash ? (
                                        <a key={link.name} href={link.path} onClick={() => setIsOpen(false)} className={cls}>
                                            {link.highlight && <IndianRupee className="w-4 h-4" />} {link.name}
                                        </a>
                                    ) : (
                                        <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className={cls}>
                                            {link.highlight && <IndianRupee className="w-4 h-4" />} {link.name}
                                        </Link>
                                    );
                                })}
                                {user && (
                                    <>
                                        {city && (
                                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                                                <MapPin className="w-3.5 h-3.5" /> {city}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { logout(); setIsOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" /> Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

export default Navbar;
