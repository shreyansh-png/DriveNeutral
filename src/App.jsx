import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ComparisonSection from './components/ComparisonSection';
import CarbonCalculator from './components/CarbonCalculator';
import SavingsImpact from './components/SavingsImpact';
import Footer from './components/Footer';
import CarPricing from './components/CarPricing';
import Methodology from './components/Methodology';
import QuickLinks from './components/QuickLinks';
import AIChatflow from './components/AIChatflow';
import { AuthProvider } from './context/AuthContext';

const Home = () => (
  <>
    <HeroSection />
    <CarbonCalculator />
    <SavingsImpact />
  </>
);

function App() {
  const [darkMode, setDarkMode] = useState(false); // default light

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-300">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-grow pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/compare" element={<ComparisonSection />} />
              <Route path="/pricing" element={<CarPricing />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/quick-links" element={<QuickLinks />} />
            </Routes>
          </main>
          <Footer />
          <AIChatflow />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
