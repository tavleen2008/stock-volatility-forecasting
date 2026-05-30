import React, { useState } from 'react';
import { ChevronDown, Home, TrendingUp, Eye, BarChart3, BookOpen } from 'lucide-react';

function Sidebar({ isOpen }) {
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
        { label: 'Market News', href: '/news/top', icon: <BookOpen size={18} />, badge: 'top' },
        { label: 'Market Movers', href: '/mov', icon: <TrendingUp size={18} />, badge: 'mov' },
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

  return (
    <aside className="w-72 bg-dark-card border-r border-dark-border overflow-y-auto transition-all duration-300 ease-in-out">
      <nav className="py-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <button
              className="flex items-center justify-between w-full px-4 py-2.5 bg-transparent border-none text-gray-500 text-xs font-semibold uppercase cursor-pointer transition-all hover:text-white hover:bg-dark-hover"
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
                      className="flex items-center gap-2.5 px-4 py-2 text-dark-text text-sm no-underline transition-all border-l-3 border-transparent hover:text-white hover:bg-dark-hover hover:border-l-accent-cyan"
                    >
                      {item.icon && <span className="flex items-center justify-center w-4.5 h-4.5 flex-shrink-0">{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && <span className="inline-block py-0.5 px-1.5 bg-dark-hover rounded text-xs text-gray-600 ml-auto">{item.badge}</span>}
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
