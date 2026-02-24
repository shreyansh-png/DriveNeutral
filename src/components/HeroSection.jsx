import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section id="home" className="relative min-h-[100vh] flex items-center overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Full-bleed background image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=2000"
                    alt="Modern electric vehicle on dark road"
                    className="w-full h-full object-cover object-center"
                />
                {/* Light overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/40 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-white/30 dark:from-slate-950 dark:via-transparent dark:to-slate-950/30" />
            </div>

            {/* Subtle green ambient glow */}
            <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-primary-500/8 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-8"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary-400 pulse-glow" />
                            <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary-600 dark:text-primary-400">
                                Sustainability Starts Here
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight font-display">
                            Drive smarter.{' '}
                            <br className="hidden md:block" />
                            Save money.{' '}
                            <br />
                            <span className="text-gradient-green">
                                Reduce carbon.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                            Making the switch to an eco-friendly vehicle has never been easier.
                            Discover the true cost and environmental impact of your next car.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Link
                                to="/compare"
                                className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white dark:text-slate-950 bg-primary-600 dark:bg-primary-400 hover:bg-primary-500 dark:hover:bg-primary-300 rounded-full shadow-lg shadow-primary-500/20 hover:shadow-primary-400/40 transition-all duration-300"
                            >
                                Compare Vehicles
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#calculator"
                                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 dark:text-white glass hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all duration-300"
                            >
                                Calculate Impact
                            </a>
                        </div>
                    </motion.div>

                    {/* Right: Floating glassmorphic badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="relative hidden lg:block h-[500px]"
                    >
                        {/* Badge 1: Zero Emissions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="float-anim absolute top-12 right-8 glass-card px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                                <Leaf className="w-6 h-6 text-primary-500 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">Zero Emissions</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">100% electric driving</p>
                            </div>
                        </motion.div>

                        {/* Badge 2: Save Money */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="float-anim-delay absolute top-48 right-32 glass-card px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">Save ₹2L+ / Year</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lower running costs</p>
                            </div>
                        </motion.div>

                        {/* Badge 3: Eco Certified */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="float-anim absolute bottom-20 right-12 glass-card px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl"
                            style={{ animationDelay: '2s' }}
                        >
                            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">EPA Verified Data</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trusted sources</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom fade to next section */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none" />
        </section>
    );
};

export default HeroSection;
