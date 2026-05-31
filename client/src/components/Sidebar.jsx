import React, { useState } from 'react';
import { ChevronDown, Home, TrendingUp, Eye, BarChart3, BookOpen, Briefcase, Zap } from 'lucide-react';

function Sidebar({ isOpen, isDarkMode }) {
  const [expandedSections, setExpandedSections] = useState(['Favorites']);

  const toggleSection = (section) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const navSections = [
    {
      title: 'Main',
      items: [
        { label: 'Home now', href: '/home', icon: <Home size={18} /> },
      ],
    },
    {
      title: 'Favorites',
      items: [
        { label: 'My Portfolio',        href: '/portfolio',  icon: <Briefcase size={18} />, badge: 'new' },
        { label: 'Volatility Forecast',  href: '/forecasts',  icon: <Zap size={18} />,      badge: 'new' },
        { label: 'Market News',          href: '/news/top',   icon: <BookOpen size={18} />,  badge: 'top' },
        { label: 'Market Movers',        href: '/mov',        icon: <TrendingUp size={18} />, badge: 'mov' },
      ],
    },
    {
      title: 'Security Analysis',
      items: [
        { label: 'Snapshots', href: '/', icon: <Eye size={18} /> },
        { label: 'Overview', href: '/snapshot/s', badge: 's' },
        { label: 'Description', href: '/snapshot/des', badge: 'des' },
        { label: 'Percentile Rank', href: '/snapshot/rank', badge: 'rank' },
        { label: 'Exposure', href: '/snapshot/fxp', badge: 'fxp' },
        { label: 'Holdings', href: '/snapshot/hds', badge: 'hds' },
      ],
    },
    {
      title: 'Market Overview',
      items: [
        { label: 'Market Indices', href: '/market/indices' },
        { label: 'Sectors', href: '/market/sectors' },
        { label: 'Top Gainers', href: '/market/gainers' },
      ],
    },
    {
      title: 'Research Tools',
      items: [
        { label: 'Financial Screener', href: '/screener' },
        { label: 'Portfolio Analysis', href: '/portfolio' },
        { label: 'Economic Calendar', href: '/calendar' },
      ],
    },
  ];

  if (!isOpen) {
    return <div className="w-0 transition-all duration-300 ease-in-out" />;
  }

  const getBgColor    = () => isDarkMode ? 'bg-slate-900 border-dark-border' : 'bg-white border-gray-200';
  const getTextColor  = () => isDarkMode ? 'text-white' : 'text-gray-900';
  const getHoverColor = () => isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-green-50';
  const getDividerColor = () => isDarkMode ? 'border-dark-border' : 'border-gray-200';

  return (
    <aside className={`w-72 border-r overflow-y-auto transition-all duration-300 ease-in-out ${getBgColor()}`}>
      <nav className="py-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <button
              className={`flex items-center justify-between w-full px-4 py-2.5 bg-transparent border-none text-xs font-semibold uppercase cursor-pointer transition-all ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-dark-hover' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={() => toggleSection(section.title)}
            >
              <span className="tracking-wider">{section.title}</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${expandedSections.includes(section.title) ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSections.includes(section.title) && (
              <ul className="list-none py-1 px-0 m-0">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <a 
                      href={item.href} 
                      className={`flex items-center gap-2.5 px-4 py-2 text-sm no-underline transition-all border-l-3 border-transparent
                        ${isDarkMode
                          ? 'text-dark-text hover:text-white hover:bg-slate-800 hover:border-l-green-400'
                          : 'text-gray-600 hover:text-green-700 hover:bg-green-50 hover:border-l-green-500'}`}
                    >
                      {item.icon && <span className="flex items-center justify-center w-4.5 h-4.5 flex-shrink-0">{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && <span className={`inline-block py-0.5 px-1.5 rounded text-xs ml-auto ${isDarkMode ? 'bg-dark-hover text-gray-600' : 'bg-gray-200 text-gray-600'}`}>{item.badge}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
