# Financial Analytics Dashboard

A modern, professional financial analytics dashboard built with React and JavaScript. Features real-time market data visualization, interactive charts, and a responsive multi-panel layout.

## Features

✨ **Key Features:**
- **Dark Theme Professional UI** - Sleek dark mode design optimized for financial data
- **Responsive Sidebar Navigation** - Collapsible navigation with organized market sections
- **Real-Time Charts** - Interactive price performance and trading volume charts using Recharts
- **Market Overview** - At-a-glance stats cards showing key market metrics
- **Stock Table** - Sortable top movers table with price changes and volume
- **Global Search** - Search for tickers, company names, or functions
- **Mobile Responsive** - Fully responsive design for all screen sizes

## Tech Stack

- **React 18** - UI framework
- **JavaScript** - Interactive programming language
- **Recharts** - Interactive charts and data visualization
- **Lucide React** - Beautiful SVG icons
- **CSS3** - Modern styling with flexbox and grid

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx & Header.css
│   │   ├── Sidebar.jsx & Sidebar.css
│   │   ├── MainContent.jsx & MainContent.css
│   │   ├── Dashboard.jsx & Dashboard.css
│   ├── App.jsx & App.css
│   ├── index.jsx & index.css
├── package.json
└── README.md
```

## Installation

1. Navigate to the project directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Project

### Development Mode
Start the development server with hot reload:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Build for Production
Create an optimized production build:
```bash
npm run build
```

## Components Overview

### Header
- Logo and branding
- Global search functionality
- Help center, Sign Up, and Login buttons
- Sidebar toggle

### Sidebar
- Expandable/collapsible navigation sections:
  - Main navigation (Home)
  - Favorites (Market News, Market Movers)
  - Security Analysis (Snapshots, Overview, Descriptions, etc.)
  - Market Overview
  - Research Tools
- Active state indicators and badges

### Dashboard
- **Stat Cards** - Key market metrics (Index, Volume, 52-Week High, Status)
- **Charts** - Price performance area chart and trading volume bar chart
- **Controls** - Time range selector (1D, 1W, 1M, 3M, 1Y)
- **Stock Table** - Top movers with real-time data

## Customization

### Adding Real Market Data
Replace mock data in `Dashboard.jsx` with API calls:

```javascript
// Example API integration
useEffect(() => {
  fetch('/api/market-data')
    .then(res => res.json())
    .then(data => setChartData(data));
}, []);
```

### Recommended APIs
- **Finnhub** - Real-time stock market data
- **Alpha Vantage** - Free stock data API
- **IEX Cloud** - Comprehensive financial data

### Styling Customization
Colors defined in CSS files:
- Primary: `#00d4ff` (Cyan)
- Success: `#00d966` (Green)
- Danger: `#ff3366` (Red)
- Background: `#0f0f0f` (Dark)
- Card: `#1a1a1a` (Dark Card)

## Performance Optimizations

- Lazy loading for charts and components
- Memoized components to prevent unnecessary re-renders
- CSS Grid for responsive layouts
- Optimized SVG icons with Lucide React

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Real-time WebSocket data integration
- [ ] User authentication
- [ ] Portfolio management
- [ ] Advanced charting tools (TradingView integration)
- [ ] Alerts and notifications
- [ ] Dark/Light theme toggle
- [ ] Export reports (PDF, CSV)
- [ ] Multi-timeframe analysis

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please refer to the documentation or open an issue in the repository.

---

**Built with ❤️ for financial data enthusiasts**
