import React from 'react';
import { Leaf, Twitter, Facebook, Instagram, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 py-16 border-t border-black/5 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
            {/* Subtle glow */}
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-primary-500/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <Leaf className="h-[18px] w-[18px] text-white" />
                            </div>
                            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white font-display">
                                Drive<span className="text-primary-500 dark:text-primary-400">Neutral</span>
                            </span>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 max-w-sm mb-6 font-medium text-lg leading-relaxed">
                            "Smarter driving today for a cleaner tomorrow."
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Facebook, Instagram, Github].map((Icon, i) => (
                                <a key={i} href="#" className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-primary-500/15 hover:text-primary-500 dark:hover:text-primary-400 transition-all border border-black/5 dark:border-white/5 hover:border-primary-500/20">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-slate-900 dark:text-white text-xs font-black mb-5 uppercase tracking-[0.2em]">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><a href="#calculator" className="hover:text-primary-500 dark:hover:text-primary-400 transition text-sm font-medium">Emissions Calculator</a></li>
                            <li><a href="#savings" className="hover:text-primary-500 dark:hover:text-primary-400 transition text-sm font-medium">Savings Data</a></li>
                            <li><Link to="/methodology" className="hover:text-primary-500 dark:hover:text-primary-400 transition text-sm font-medium">Methodology</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 dark:text-white text-xs font-black mb-5 uppercase tracking-[0.2em]">Data Sources</h4>
                        <ul className="space-y-3 text-sm text-slate-400 dark:text-slate-500 font-medium">
                            <li>Environmental Protection Agency (EPA)</li>
                            <li>Worldwide Harmonised Light Vehicle Test Procedure (WLTP)</li>
                            <li>Department of Energy Fuel Economy Guidelines</li>
                        </ul>
                        <p className="mt-4 text-xs bg-black/3 dark:bg-white/3 p-3 rounded-xl border border-black/5 dark:border-white/5 text-slate-400 dark:text-slate-600">
                            Data estimates are for illustrative purposes and variations may apply.
                        </p>
                    </div>

                </div>

                <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 text-center text-sm text-slate-400 dark:text-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} Drive Neutral. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition">Privacy Policy</a>
                        <a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
