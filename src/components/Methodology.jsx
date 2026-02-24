import React from 'react';
import { BookOpen, Calculator, Shield, AlertTriangle, TrendingDown, Gauge, Leaf, ChevronRight } from 'lucide-react';

const SectionCard = ({ icon: Icon, title, accent, children }) => (
    <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent || 'bg-primary-500/10'}`}>
                <Icon className="w-[18px] h-[18px] text-primary-500 dark:text-primary-400" />
            </div>
            <h3 className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em]">{title}</h3>
        </div>
        <div className="relative z-10">{children}</div>
    </div>
);

const CodeBlock = ({ children }) => (
    <code className="px-2.5 py-1 bg-primary-500/10 dark:bg-white/5 rounded-lg text-primary-600 dark:text-primary-400 text-xs font-bold">
        {children}
    </code>
);

const FormulaBox = ({ formula, description }) => (
    <div className="mt-2 p-3 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
        <code className="text-sm font-bold text-slate-700 dark:text-slate-300 block">{formula}</code>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
    </div>
);

const MetricItem = ({ name, description, formula, formulaDescription }) => (
    <li className="flex gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 mt-2 flex-shrink-0" />
        <div className="flex-1">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{name}</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{description}</p>
            <FormulaBox formula={formula} description={formulaDescription} />
        </div>
    </li>
);

const FallbackCard = ({ number, scenario, scenarioDetail, resolution }) => (
    <div className="p-4 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
        <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{number}</span>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{scenario}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{scenarioDetail}</p>
                <div className="flex items-start gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/30 dark:border-emerald-500/10">
                    <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">{resolution}</p>
                </div>
            </div>
        </div>
    </div>
);

const Methodology = () => {
    return (
        <section className="py-24 min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Background car image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1473042904451-00571f644898?auto=format&fit=crop&q=60&w=2400"
                    alt="Electric vehicle charging"
                    className="w-full h-full object-cover object-center opacity-[0.04] dark:opacity-[0.06]"
                />
            </div>
            <div className="absolute inset-0 noise-overlay" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Page Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">Methodology</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base mb-10 ml-[52px] max-w-xl leading-relaxed">
                    How we calculate the Nutrition Level score and environmental impact metrics used across DriveNeutral.
                </p>

                <div className="space-y-6">

                    {/* ── 1. Overview ──────────────────────────── */}
                    <SectionCard icon={Leaf} title="Overview">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            This methodology outlines the framework used to calculate a vehicle's environmental impact score, represented as a <strong className="text-slate-900 dark:text-white">scale from 1 to 20</strong>. To ensure a fair comparison across all vehicle types — <em>Electric, Hybrid, and Internal Combustion Engine (ICE)</em> — the evaluation is strictly based on <strong className="text-slate-900 dark:text-white">Total Lifecycle Emissions</strong> (<CodeBlock>lifecycle_gco2_km</CodeBlock>).
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mt-3">
                            This primary metric accounts for <strong className="text-slate-900 dark:text-white">manufacturing emissions</strong>, <strong className="text-slate-900 dark:text-white">battery or fuel refinement</strong>, and <strong className="text-slate-900 dark:text-white">direct tailpipe emissions</strong> — providing a comprehensive, cradle-to-road assessment of each vehicle.
                        </p>
                        <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/15 rounded-xl border border-amber-200/30 dark:border-amber-500/10">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                <strong className="text-amber-700 dark:text-amber-400">Note on Data Sources:</strong> For many international vehicles, emission and efficiency data was directly obtained from the <strong className="text-slate-900 dark:text-white">EPA (Environmental Protection Agency) fuel economy reports</strong>. However, for Indian market vehicles — which are not covered by EPA testing — the Nutrition Level score was <strong className="text-slate-900 dark:text-white">calculated using the methodology described below</strong>, based on available lifecycle emission data from manufacturer disclosures and regional testing standards.
                            </p>
                        </div>
                    </SectionCard>

                    {/* ── 2. Base Metric ────────────────────────── */}
                    <SectionCard icon={Gauge} title="Base Metric">
                        <div className="flex items-start gap-3 p-4 bg-primary-500/5 dark:bg-primary-500/5 rounded-xl border border-primary-500/15">
                            <ChevronRight className="w-4 h-4 text-primary-500 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    <CodeBlock>lifecycle_gco2_km</CodeBlock>
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <strong>Full form:</strong> Lifecycle Carbon Dioxide Emissions in Grams per Kilometer
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                                    Includes total CO₂ output across the vehicle's entire lifecycle — from raw material extraction and manufacturing, through fuel or electricity production, to end-of-life disposal.
                                </p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── 3. Calculated Fields ─────────────────── */}
                    <SectionCard icon={Calculator} title="Derived Metrics (Calculated Fields)">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
                            The following fields are derived from <CodeBlock>lifecycle_gco2_km</CodeBlock> for reporting and comparison purposes:
                        </p>
                        <ul className="space-y-5">
                            <MetricItem
                                name="Average Emissions in Grams per Mile"
                                description="Converts lifecycle emissions from per-kilometer to per-mile for compatibility with US/Imperial measurement systems."
                                formula="lifecycle_gco2_km × 1.60934"
                                formulaDescription="Multiplied by the km-to-mile conversion factor (1 mile = 1.60934 km)"
                            />
                            <MetricItem
                                name="Estimated CO₂ per 100 Kilometers in Kilograms"
                                description="Represents the total emissions output for every 100 km driven, converted to kilograms for readability."
                                formula="(lifecycle_gco2_km × 100) / 1000"
                                formulaDescription="Grams scaled to 100 km, then divided by 1,000 to convert to kilograms"
                            />
                            <MetricItem
                                name="Estimated Annual CO₂ in Kilograms per Year"
                                description="Projects yearly emissions assuming an average driving distance of 15,000 km/year (Indian average)."
                                formula="(lifecycle_gco2_km × 15,000) / 1000"
                                formulaDescription="Based on 15,000 km/year average driving distance, converted to kg"
                            />
                        </ul>
                    </SectionCard>

                    {/* ── 4. Scoring Methodology ────────────────── */}
                    <SectionCard icon={TrendingDown} title="Nutrition Level — Scoring Methodology">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5">
                            The <strong className="text-emerald-600 dark:text-emerald-400">1 to 20 Nutrition Level</strong> scale is derived using a <strong className="text-slate-900 dark:text-white">Linear Min-Max Normalization</strong> approach. This standardizes lifecycle emissions into a proportional score, enabling accurate comparisons between vastly different vehicle types.
                        </p>

                        {/* Score boundaries */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-black flex items-center justify-center">20</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ceiling</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Vehicles emitting <strong className="text-emerald-700 dark:text-emerald-400">≤ 100 gCO₂/km</strong> represent the highest standard of efficiency and receive the maximum score.
                                </p>
                            </div>
                            <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200/30 dark:border-red-500/10">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 text-sm font-black flex items-center justify-center">1</span>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Floor</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Vehicles emitting <strong className="text-red-700 dark:text-red-400">≥ 250 gCO₂/km</strong> have the highest environmental impact and receive the minimum score.
                                </p>
                            </div>
                        </div>

                        {/* The formula */}
                        <div className="p-5 bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-black/5 dark:border-white/5">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">Normalization Formula (Sliding Scale)</p>
                            <div className="text-center py-3">
                                <p className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                    Score = 20 − ((CO₂ − 100) / 150) × 19
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed text-center">
                                For vehicles with emissions between 100–250 gCO₂/km. The result is <strong className="text-slate-600 dark:text-slate-300">rounded to the nearest integer</strong> for clean database integration and UI display.
                            </p>
                        </div>

                        {/* Example */}
                        <div className="mt-4 p-4 bg-black/3 dark:bg-white/3 rounded-xl border border-black/5 dark:border-white/5">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Example</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                A vehicle with <strong>175 gCO₂/km</strong> lifecycle emissions:
                            </p>
                            <code className="block text-xs text-slate-500 dark:text-slate-400 bg-black/3 dark:bg-white/3 px-3 py-2 rounded-lg mt-2 font-bold">
                                Score = 20 − ((175 − 100) / 150) × 19 = 20 − 9.5 ≈ <span className="text-emerald-600 dark:text-emerald-400">11</span>
                            </code>
                        </div>
                    </SectionCard>

                    {/* ── 5. Data Fallback Mechanisms ───────────── */}
                    <SectionCard icon={AlertTriangle} title="Data Fallback Mechanisms" accent="bg-amber-500/10">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
                            Real-world datasets frequently contain missing or anomalous values. To ensure database stability and prevent UI errors, the algorithm incorporates <strong className="text-slate-900 dark:text-white">three automated fallback mechanisms</strong>:
                        </p>
                        <div className="space-y-4">
                            <FallbackCard
                                number="1"
                                scenario="Estimating Missing Lifecycle Data"
                                scenarioDetail="A manufacturer provides direct tailpipe emissions (est_co2_per_100km) but lacks total lifecycle emission data."
                                resolution="The algorithm estimates lifecycle emissions by multiplying tailpipe emissions per 100km by a factor of 10. This bridges the gap between direct emissions and indirect emissions associated with power grids and fuel refinement, based on broader dataset averages."
                            />
                            <FallbackCard
                                number="2"
                                scenario="Handling Completely Missing or Invalid Data"
                                scenarioDetail="A vehicle record contains zero emissions data, or the provided data is in an invalid format (e.g., text instead of numerical)."
                                resolution="The algorithm assigns a default score of 1 (worst case). This conservative default prevents system failure while safely assuming the highest environmental impact when data transparency is lacking."
                            />
                            <FallbackCard
                                number="3"
                                scenario="Clamping Out-of-Bounds Data"
                                scenarioDetail="A vehicle's emissions fall significantly outside the standard 100–250g range (e.g., a hyper-efficient EV emitting 50g, or a heavy-duty truck emitting 400g)."
                                resolution="The algorithm applies strict minimum and maximum caps. The score is hard-clamped so it can never fall below 1 or exceed 20, ensuring the scale remains mathematically intact."
                            />
                        </div>
                    </SectionCard>

                    {/* Data Sources footer */}
                    <div className="text-center pt-4 pb-8">
                        <p className="text-xs text-slate-400 dark:text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
                            Sources: EPA (Environmental Protection Agency), WLTP (Worldwide Harmonised Light Vehicle Test Procedure), Department of Energy Fuel Economy Guidelines. Estimates are for illustrative purposes; actual values may vary.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Methodology;
