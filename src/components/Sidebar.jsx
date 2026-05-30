import React, { useState } from 'react';
import { ChevronDown, Home, TrendingUp, Eye, BarChart3, BookOpen } from 'lucide-react';
import './Sidebar.css';

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
    return <div className="sidebar collapsed" />;
  }

  return (
    <aside className="sidebar">
      <nav className="nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <button
              className="nav-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <span className="section-title">{section.title}</span>
              <ChevronDown
                size={18}
                className={`chevron ${expandedSections.includes(section.title) ? 'expanded' : ''}`}
              />
            </button>

            {expandedSections.includes(section.title) && (
              <ul className="nav-items">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <a href={item.href} className="nav-link">
                      {item.icon && <span className="nav-icon">{item.icon}</span>}
                      <span className="nav-label">{item.label}</span>
                      {item.badge && <span className="nav-badge">{item.badge}</span>}
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
