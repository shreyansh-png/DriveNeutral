import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, ArrowRight, Leaf, Zap, Calculator, Car, ChevronDown } from 'lucide-react';
import {
    compareVehicles,
    findEcoFriendly,
    calculateCosts,
    bestEVUnderBudget,
    generateInsights,
    getRandomHinglishTip,
    formatINR,
} from '../services/chatflowService';

// ── Flow States ──────────────────────────────────────────────
const FLOW = {
    WELCOME: 'welcome',
    COMPARE_INPUT: 'compare_input',
    COMPARE_RESULT: 'compare_result',
    ECO_INPUT: 'eco_input',
    ECO_RESULT: 'eco_result',
    COST_INPUT: 'cost_input',
    COST_RESULT: 'cost_result',
    EV_BUDGET_INPUT: 'ev_budget_input',
    EV_RESULT: 'ev_result',
    FOLLOWUP: 'followup',
};

const WELCOME_OPTIONS = [
    { id: 'compare', label: '🔍 Compare Vehicles', icon: Car },
    { id: 'eco', label: '🌱 Eco-Friendly Option', icon: Leaf },
    { id: 'cost', label: '🧮 Cost Calculator', icon: Calculator },
];

const BUDGET_RANGES = [
    { label: 'Under ₹10L', min: 0, max: 1000000 },
    { label: '₹10L – ₹15L', min: 1000000, max: 1500000 },
    { label: '₹15L – ₹20L', min: 1500000, max: 2000000 },
    { label: '₹20L – ₹30L', min: 2000000, max: 3000000 },
    { label: '₹30L+', min: 3000000, max: Infinity },
];

const BODY_TYPES = ['all', 'suv', 'compact suv', 'sedan', 'hatchback', 'mpv'];
const FUEL_TYPES = ['all', 'electric', 'hybrid', 'petrol'];

// ── Chat Message Component ───────────────────────────────────
const ChatMessage = ({ msg }) => {
    const isBot = msg.sender === 'bot';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}
        >
            <div className={`flex gap-2 max-w-[88%] ${isBot ? '' : 'flex-row-reverse'}`}>
                {isBot && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary-500/20">
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                )}
                <div className={`chatflow-msg ${isBot ? 'chatflow-msg-bot' : 'chatflow-msg-user'}`}>
                    {msg.type === 'card' ? msg.content : (
                        <div dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }} />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

function formatBotText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}

// ── Result Cards ─────────────────────────────────────────────
const ComparisonCard = ({ data }) => (
    <div className="space-y-3">
        <div className="text-xs font-black uppercase tracking-wider text-primary-500 mb-2">⚔️ Comparison</div>
        <div className="grid grid-cols-2 gap-2">
            {[data.vehicle1, data.vehicle2].map((v, i) => (
                <div key={i} className="bg-black/5 dark:bg-white/5 rounded-xl p-3 space-y-1.5">
                    {v.image && (
                        <img src={v.image} alt={v.name} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                    )}
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{v.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{v.fuel_type}</div>
                    <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Price</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.base_price_fmt}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Fuel/yr</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.fuel_cost_yearly_fmt}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">CO₂/yr</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.co2_yearly_kg} kg</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">5yr Cost</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.ownership_5y_fmt}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Eco Score</span>
                            <span className="font-bold text-primary-600 dark:text-primary-400">{v.sustainability_score}/20</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-500/10 rounded-lg px-3 py-2 mt-2">
            {data.recommendation}
        </div>
    </div>
);

const EcoCard = ({ data }) => (
    <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-primary-500 mb-1">🏆 Best Eco Choice</div>
        <div className="bg-primary-500/10 rounded-xl p-3">
            {data.best.image && (
                <img src={data.best.image} alt={data.best.name} className="w-full h-20 object-cover rounded-lg mb-2" />
            )}
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.best.name}</div>
            <div className="text-[10px] text-slate-500 capitalize">{data.best.fuel_type} • {data.best.base_price_fmt}</div>
            <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1">
                Sustainability: {data.best.sustainability_score}/20
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2 text-center">
                <div className="text-sm font-black text-primary-600 dark:text-primary-400">{data.co2_saved_yearly_kg} kg</div>
                <div className="text-[9px] text-slate-400 uppercase">CO₂ saved/yr</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2 text-center">
                <div className="text-sm font-black text-primary-600 dark:text-primary-400">{data.cost_saved_yearly_fmt}</div>
                <div className="text-[9px] text-slate-400 uppercase">Saved/yr vs petrol</div>
            </div>
        </div>
        {data.alternatives.length > 0 && (
            <div className="text-[10px] text-slate-400 mt-1">
                Also consider: {data.alternatives.map(a => a.name).join(', ')}
            </div>
        )}
    </div>
);

const CostCard = ({ data }) => (
    <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-primary-500 mb-1">💰 Cost Breakdown</div>
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-500/10 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">⛽ Petrol/month</div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">{data.monthly_fuel_cost_fmt}</div>
            </div>
            <div className="bg-primary-500/10 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase">⚡ EV/month</div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">{data.monthly_ev_cost_fmt}</div>
            </div>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{data.five_year_saving_fmt}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">5-year savings with EV</div>
        </div>
        <div className="flex justify-between bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2 text-xs">
            <span className="text-slate-400">Monthly saving</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">{data.monthly_saving_fmt}</span>
        </div>
        <div className="flex justify-between bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2 text-xs">
            <span className="text-slate-400">Break-even</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">{data.break_even_years} years</span>
        </div>
    </div>
);

const EVCard = ({ data }) => (
    <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-primary-500 mb-1">⚡ Top EV Picks</div>
        {data.results.map((ev, i) => (
            <div key={i} className="bg-black/5 dark:bg-white/5 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                    {ev.image && (
                        <img src={ev.image} alt={ev.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] mt-1">
                    <div className="flex justify-between">
                        <span className="text-slate-400">⭐ Range</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{ev.range_km} km</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">⚡ Charge</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{ev.charging_time}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">💰 Cost/yr</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{ev.running_cost_yearly_fmt}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">🌱 CO₂ cut</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{ev.co2_reduction_kg} kg</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Price: {ev.base_price_fmt}</div>
            </div>
        ))}
    </div>
);

// ── Main AIChatflow Component ────────────────────────────────
const AIChatflow = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [flow, setFlow] = useState(FLOW.WELCOME);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionHistory, setSessionHistory] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Eco-flow local state
    const [ecoFilters, setEcoFilters] = useState({ budgetIdx: null, bodyType: 'all', fuelType: 'all' });
    // Cost-flow local state
    const [costInputs, setCostInputs] = useState({ dailyKm: '', fuelPrice: '', electricityCost: '' });
    // EV-flow local state
    const [evBudget, setEvBudget] = useState('');
    const [evUsage, setEvUsage] = useState('city');

    const scrollToBottom = useCallback(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }, []);

    // Listen for global open event (from Navbar AI button)
    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('open-driveneutral-ai', handler);
        return () => window.removeEventListener('open-driveneutral-ai', handler);
    }, []);

    // Initialize welcome when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            sendBotMessage("Hi 👋 I'm **DriveNeutral AI**.\nI can help you make smarter, greener vehicle choices!\n\n👇 What would you like to do?");
        }
    }, [isOpen]);

    useEffect(scrollToBottom, [messages, isTyping]);

    const sendBotMessage = (text, type = 'text', content = null) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text, type, content }]);
            setIsTyping(false);
        }, 500 + Math.random() * 400);
    };

    const sendUserMessage = (text) => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, type: 'text' }]);
    };

    const sendCardMessage = (cardContent) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', type: 'card', content: cardContent }]);
            setIsTyping(false);
        }, 800);
    };

    const addInsights = (dailyKm = 30) => {
        const insights = generateInsights('EV', dailyKm);
        setTimeout(() => {
            sendBotMessage(insights.join('\n'));
        }, 1500);
        setTimeout(() => {
            sendBotMessage(getRandomHinglishTip());
        }, 2800);
    };

    const showFollowups = () => {
        setTimeout(() => {
            setFlow(FLOW.FOLLOWUP);
            sendBotMessage("👉 Would you like to:\n• Compare another pair of vehicles?\n• Find the most eco-friendly option?\n• Calculate fuel costs?\n• Find the best EV for your budget?");
        }, 3500);
    };

    // ── Option Handlers ──────────────────────────────────────
    const handleWelcomeOption = (optionId) => {
        sendUserMessage(WELCOME_OPTIONS.find(o => o.id === optionId).label);
        switch (optionId) {
            case 'compare':
                setFlow(FLOW.COMPARE_INPUT);
                sendBotMessage("Great! Which vehicles do you want to compare? 🚗\n\nType two vehicle names separated by **vs** or **and**.\n(Example: *Nexon EV vs Punch*)");
                break;
            case 'eco':
                setFlow(FLOW.ECO_INPUT);
                setEcoFilters({ budgetIdx: null, bodyType: 'all', fuelType: 'all' });
                sendBotMessage("I'll help you find the lowest carbon footprint vehicle! 🌿\n\nPlease select your **budget range** below:");
                break;
            case 'cost':
                setFlow(FLOW.COST_INPUT);
                setCostInputs({ dailyKm: '', fuelPrice: '', electricityCost: '' });
                sendBotMessage("Let's calculate your real driving cost! 🧮\n\nPlease enter your details below:");
                break;
            case 'ev':
                setFlow(FLOW.EV_BUDGET_INPUT);
                setEvBudget('');
                setEvUsage('city');
                sendBotMessage("Great! Let's find the best EV for you ⚡\n\nWhat is your **budget** (in ₹ lakhs)?");
                break;
        }
    };

    // ── Compare Flow Handler ─────────────────────────────────
    const handleCompareSubmit = async () => {
        const val = inputValue.trim();
        if (!val) return;
        sendUserMessage(val);
        setInputValue('');

        const separator = /\s+vs\.?\s+|\s+and\s+|\s+v\/s\s+/i;
        const parts = val.split(separator);
        if (parts.length < 2) {
            sendBotMessage("Please enter two vehicles separated by **vs** or **and**.\nExample: *Nexon EV vs Creta*");
            return;
        }

        setIsTyping(true);
        try {
            const result = await compareVehicles(parts[0], parts[1]);
            setIsTyping(false);
            if (result.error) {
                sendBotMessage(`Sorry, I couldn't find **"${result.missing}"** in our database. 😕\nTry a different spelling or another model.`);
                return;
            }
            setFlow(FLOW.COMPARE_RESULT);
            sendCardMessage(<ComparisonCard data={result} />);
            setSessionHistory(prev => [...prev, { type: 'compare', query: val }]);
            addInsights();
            showFollowups();
        } catch (err) {
            setIsTyping(false);
            sendBotMessage("Oops! Something went wrong fetching data. Please try again. 🔄");
        }
    };

    // ── Eco Flow Handler ─────────────────────────────────────
    const handleEcoSubmit = async () => {
        if (ecoFilters.budgetIdx === null) {
            sendBotMessage("Please select a budget range first! 👆");
            return;
        }
        const budget = BUDGET_RANGES[ecoFilters.budgetIdx];
        sendUserMessage(`Budget: ${budget.label}, Body: ${ecoFilters.bodyType}, Fuel: ${ecoFilters.fuelType}`);

        setIsTyping(true);
        try {
            const result = await findEcoFriendly({
                budgetMin: budget.min,
                budgetMax: budget.max,
                bodyType: ecoFilters.bodyType,
                fuelType: ecoFilters.fuelType,
            });
            setIsTyping(false);
            if (result.error) {
                sendBotMessage(result.message);
                return;
            }
            setFlow(FLOW.ECO_RESULT);
            sendCardMessage(<EcoCard data={result} />);
            setSessionHistory(prev => [...prev, { type: 'eco', filters: ecoFilters }]);
            addInsights();
            showFollowups();
        } catch (err) {
            setIsTyping(false);
            sendBotMessage("Oops! Something went wrong. Please try again. 🔄");
        }
    };

    // ── Cost Flow Handler ────────────────────────────────────
    const handleCostSubmit = () => {
        const dk = parseFloat(costInputs.dailyKm) || 30;
        const fp = parseFloat(costInputs.fuelPrice) || 104;
        const ec = parseFloat(costInputs.electricityCost) || 8;

        sendUserMessage(`Daily: ${dk} km, Fuel: ₹${fp}/L, Electricity: ₹${ec}/kWh`);
        const result = calculateCosts({ dailyKm: dk, fuelPrice: fp, electricityCost: ec });
        setFlow(FLOW.COST_RESULT);
        sendCardMessage(<CostCard data={result} />);
        setSessionHistory(prev => [...prev, { type: 'cost', inputs: { dk, fp, ec } }]);
        addInsights(dk);
        showFollowups();
    };

    // ── EV Budget Flow Handler ───────────────────────────────
    const handleEVSubmit = async () => {
        const budgetLakhs = parseFloat(evBudget) || 20;
        const budgetRs = budgetLakhs * 100000;
        sendUserMessage(`Budget: ₹${budgetLakhs}L, Usage: ${evUsage}`);

        setIsTyping(true);
        try {
            const result = await bestEVUnderBudget({ budget: budgetRs, usage: evUsage });
            setIsTyping(false);
            if (result.error) {
                sendBotMessage(result.message);
                return;
            }
            setFlow(FLOW.EV_RESULT);
            sendCardMessage(<EVCard data={result} />);
            setSessionHistory(prev => [...prev, { type: 'ev', budget: budgetLakhs }]);
            addInsights();
            showFollowups();
        } catch (err) {
            setIsTyping(false);
            sendBotMessage("Oops! Something went wrong. Please try again. 🔄");
        }
    };

    // ── Text Input Submit ────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (flow === FLOW.COMPARE_INPUT) handleCompareSubmit();
        else if (flow === FLOW.EV_BUDGET_INPUT) handleEVSubmit();
        else if (flow === FLOW.FOLLOWUP || flow === FLOW.WELCOME) {
            // Natural language intent detection for follow-up
            const val = inputValue.toLowerCase().trim();
            if (!val) return;
            sendUserMessage(inputValue);
            setInputValue('');
            if (/compare|vs|versus/.test(val)) handleWelcomeOption('compare');
            else if (/eco|green|environment|carbon|sustainable/.test(val)) handleWelcomeOption('eco');
            else if (/cost|fuel|price|calculate|expense|savings/.test(val)) handleWelcomeOption('cost');
            else if (/ev|electric|budget/.test(val)) handleWelcomeOption('ev');
            else sendBotMessage("I'm not sure what you mean! Try picking one of the options below 👇 or type something like **compare**, **eco**, **cost**, or **EV**.");
        }
    };

    const resetChat = () => {
        setMessages([]);
        setFlow(FLOW.WELCOME);
        setInputValue('');
        setEcoFilters({ budgetIdx: null, bodyType: 'all', fuelType: 'all' });
        setCostInputs({ dailyKm: '', fuelPrice: '', electricityCost: '' });
        setEvBudget('');
    };

    // ── Render Input Area Based on Flow ──────────────────────
    const renderInputArea = () => {
        // Welcome / Follow-up options
        if (flow === FLOW.WELCOME || flow === FLOW.FOLLOWUP) {
            return (
                <div className="p-3 border-t border-black/5 dark:border-white/5">
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {WELCOME_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleWelcomeOption(opt.id)}
                                className="chatflow-chip"
                            >
                                <span className="text-[11px]">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Or type your question..."
                            className="chatflow-input"
                        />
                        <button type="submit" className="chatflow-send-btn">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            );
        }

        // Compare input
        if (flow === FLOW.COMPARE_INPUT) {
            return (
                <div className="p-3 border-t border-black/5 dark:border-white/5">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="e.g. Nexon EV vs Creta"
                            className="chatflow-input"
                        />
                        <button type="submit" className="chatflow-send-btn">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            );
        }

        // Eco-friendly filters
        if (flow === FLOW.ECO_INPUT) {
            return (
                <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2 max-h-[200px] overflow-y-auto hide-scrollbar">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Budget</div>
                    <div className="flex flex-wrap gap-1">
                        {BUDGET_RANGES.map((b, i) => (
                            <button key={i} onClick={() => setEcoFilters(prev => ({ ...prev, budgetIdx: i }))}
                                className={`chatflow-chip ${ecoFilters.budgetIdx === i ? 'chatflow-chip-active' : ''}`}>
                                <span className="text-[10px]">{b.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Body Type</div>
                    <div className="flex flex-wrap gap-1">
                        {BODY_TYPES.map(bt => (
                            <button key={bt} onClick={() => setEcoFilters(prev => ({ ...prev, bodyType: bt }))}
                                className={`chatflow-chip ${ecoFilters.bodyType === bt ? 'chatflow-chip-active' : ''}`}>
                                <span className="text-[10px] capitalize">{bt}</span>
                            </button>
                        ))}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fuel Type</div>
                    <div className="flex flex-wrap gap-1">
                        {FUEL_TYPES.map(ft => (
                            <button key={ft} onClick={() => setEcoFilters(prev => ({ ...prev, fuelType: ft }))}
                                className={`chatflow-chip ${ecoFilters.fuelType === ft ? 'chatflow-chip-active' : ''}`}>
                                <span className="text-[10px] capitalize">{ft}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={handleEcoSubmit} className="w-full chatflow-send-btn !rounded-xl !py-2.5 flex items-center justify-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> Find Best Option
                    </button>
                </div>
            );
        }

        // Cost calculator inputs
        if (flow === FLOW.COST_INPUT) {
            return (
                <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">🚗 Daily km</label>
                            <input type="number" value={costInputs.dailyKm} onChange={e => setCostInputs(prev => ({ ...prev, dailyKm: e.target.value }))}
                                placeholder="30" className="chatflow-input !text-xs !py-2" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">⛽ Fuel ₹/L</label>
                            <input type="number" value={costInputs.fuelPrice} onChange={e => setCostInputs(prev => ({ ...prev, fuelPrice: e.target.value }))}
                                placeholder="104" className="chatflow-input !text-xs !py-2" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">⚡ ₹/kWh</label>
                            <input type="number" value={costInputs.electricityCost} onChange={e => setCostInputs(prev => ({ ...prev, electricityCost: e.target.value }))}
                                placeholder="8" className="chatflow-input !text-xs !py-2" />
                        </div>
                    </div>
                    <button onClick={handleCostSubmit} className="w-full chatflow-send-btn !rounded-xl !py-2.5 flex items-center justify-center gap-2">
                        <Calculator className="w-3.5 h-3.5" /> Calculate
                    </button>
                </div>
            );
        }

        // EV budget input
        if (flow === FLOW.EV_BUDGET_INPUT) {
            return (
                <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Budget (₹ Lakhs)</label>
                            <input type="number" value={evBudget} onChange={e => setEvBudget(e.target.value)}
                                placeholder="20" className="chatflow-input !text-xs !py-2" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Usage</label>
                            <div className="flex gap-1">
                                <button onClick={() => setEvUsage('city')}
                                    className={`chatflow-chip flex-1 ${evUsage === 'city' ? 'chatflow-chip-active' : ''}`}>
                                    <span className="text-[10px]">🏙️ City</span>
                                </button>
                                <button onClick={() => setEvUsage('highway')}
                                    className={`chatflow-chip flex-1 ${evUsage === 'highway' ? 'chatflow-chip-active' : ''}`}>
                                    <span className="text-[10px]">🛣️ Highway</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleEVSubmit} className="w-full chatflow-send-btn !rounded-xl !py-2.5 flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5" /> Find EVs
                    </button>
                </div>
            );
        }

        // Result flows — show a minimal follow-up text input
        return (
            <div className="p-3 border-t border-black/5 dark:border-white/5">
                <div className="text-[10px] text-center text-slate-400 mb-2 animate-pulse">Loading follow-up options...</div>
            </div>
        );
    };

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="chatflow-bubble"
                        aria-label="Open AI Assistant"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">AI</span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.92 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="chatflow-panel"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-600 rounded-t-2xl">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Leaf className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white tracking-tight">DriveNeutral AI</div>
                                    <div className="text-[10px] text-white/70 font-medium">Your green vehicle advisor</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={resetChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white" title="New chat">
                                    <Sparkles className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white" title="Close">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar chatflow-messages">
                            {messages.map(msg => (
                                <ChatMessage key={msg.id} msg={msg} />
                            ))}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 mb-3"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="chatflow-msg-bot px-4 py-2.5">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Session History Badge */}
                        {sessionHistory.length > 0 && (
                            <div className="px-4 py-1 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                                <div className="text-[9px] text-slate-400 font-medium">
                                    📋 {sessionHistory.length} search{sessionHistory.length > 1 ? 'es' : ''} this session
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        {renderInputArea()}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatflow;
