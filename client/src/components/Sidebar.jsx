import React, { useEffect, useState } from 'react';
import { ChevronDown, Home, TrendingUp, Eye, BarChart3, BookOpen, Briefcase, Zap, Activity, Building2, Gauge, Layers, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ isOpen, isDarkMode }) {
  const [expandedSections, setExpandedSections] = useState(['Favorites']);
  const { pathname: currentPath } = useLocation();

  useEffect(() => {
    if (currentPath.startsWith('/dashboard/snapshot') && !expandedSections.includes('Security Analysis')) {
      setExpandedSections((prev) => [...prev, 'Security Analysis']);
    }
  }, [currentPath, expandedSections]);

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
        { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
      ],
    },
    {
      title: 'Favorites',
      items: [
        { label: 'My Portfolio',        href: '/dashboard/portfolio',  icon: <Briefcase size={18} />, badge: 'new' },
        { label: 'Volatility Forecast',  href: '/dashboard/forecasts',  icon: <Zap size={18} />,      badge: 'new' },
        { label: 'Market News',          href: '/dashboard/news',       icon: <BookOpen size={18} />,  badge: 'live' },
        { label: 'Compare Stocks',       href: '/dashboard/compare',    icon: <BarChart3 size={18} />, badge: 'new' },
        { label: 'Market Movers',        href: '/dashboard/mov',        icon: <TrendingUp size={18} />, badge: 'mov' },
      ],
    },
    {
      title: 'Security Analysis',
      items: [
        { label: 'Snapshots', href: '/dashboard/snapshot', icon: <Eye size={18} /> },
        { label: 'Overview', href: '/dashboard/snapshot/s', icon: <Activity size={18} /> },
        { label: 'Description', href: '/dashboard/snapshot/des', icon: <Building2 size={18} /> },
        { label: 'Percentile Rank', href: '/dashboard/snapshot/rank', icon: <Gauge size={18} /> },
        { label: 'Exposure', href: '/dashboard/snapshot/fxp', icon: <Layers size={18} /> },
        { label: 'Holdings', href: '/dashboard/snapshot/hds', icon: <Briefcase size={18} /> },
      ],
    },
    {
      title: 'Market Overview',
      items: [
        { label: 'Market Overview', href: '/dashboard/market', icon: <Globe size={18} /> },
      ],
    },
  ];

  if (!isOpen) {
    return <div className="w-0 transition-all duration-300 ease-in-out" />;
  }

  const getBgColor    = () => isDarkMode ? 'sv-sidebar bg-slate-900 border-slate-800' : 'bg-white border-gray-200';

  return (
    <aside className={`w-72 border-r overflow-y-auto transition-all duration-300 ease-in-out ${getBgColor()}`}>
      <nav className="py-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <button
              className={`flex items-center justify-between w-full px-4 py-2.5 bg-transparent border-none text-xs font-semibold uppercase cursor-pointer transition-all ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
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
                {section.items.map((item, idx) => {
                  const active = (item.href === '/dashboard' || item.href === '/dashboard/snapshot')
                    ? currentPath === item.href || currentPath === `${item.href}/`
                    : currentPath.includes(item.href);

                  return (
                  <li key={idx}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-2.5 px-4 py-2 text-sm no-underline transition-all border-l-3 border-transparent
                        ${active ? (isDarkMode ? 'sv-nav-active' : 'sv-nav-active-light') : ''}
                        ${isDarkMode
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800 hover:border-l-green-400'
                          : 'text-gray-600 hover:text-green-700 hover:bg-green-50 hover:border-l-green-500'}`}
                    >
                      {item.icon && <span className="flex items-center justify-center w-4.5 h-4.5 flex-shrink-0">{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && <span className={`inline-block py-0.5 px-1.5 rounded text-xs ml-auto ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'}`}>{item.badge}</span>}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
