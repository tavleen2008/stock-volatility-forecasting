import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, ChevronDown } from 'lucide-react';
import { authService } from '../services/auth';

const TICKERS = ['AAPL +2.4%', 'MSFT -0.6%', 'NVDA +5.2%', 'TSLA +1.9%'];

function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-green-500/20">
            S
          </div>
          <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
            Sentivvo
          </span>
        </div>

        {/* Nav links */}
        <div className={`hidden md:flex items-center gap-8 text-sm transition-colors duration-300 ${scrolled ? 'text-gray-600' : 'text-gray-300'}`}>
          <a href="#about" className={`hover:text-green-400 transition-colors ${scrolled ? 'hover:text-green-600' : ''}`}>About</a>
          <a href="#features" className={`hover:text-green-400 transition-colors ${scrolled ? 'hover:text-green-600' : ''}`}>Features</a>
          <a href="#how" className={`hover:text-green-400 transition-colors ${scrolled ? 'hover:text-green-600' : ''}`}>How It Works</a>
          <a href="#who" className={`hover:text-green-400 transition-colors ${scrolled ? 'hover:text-green-600' : ''}`}>Who It's For</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className={`text-sm px-4 py-2 rounded-lg transition-all font-medium ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm px-5 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md shadow-green-500/20"
          >
            Get Started →
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
