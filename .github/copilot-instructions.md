# Financial Analytics Dashboard - Customization Guide

This file contains instructions for customizing and extending the dashboard.

## Directory Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   ├── App.jsx          # Main app component
│   ├── index.jsx        # Entry point
│   └── index.css        # Global styles
├── package.json         # Dependencies
└── README.md           # Project documentation
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Key Features

- Modern React 18 with JavaScript
- Interactive Recharts visualizations
- Responsive dark theme UI
- Collapsible sidebar navigation
- Real-time market data cards
- Customizable stock table

## Extending the Dashboard

### Adding New Chart Types

Edit `src/components/Dashboard.jsx` and add new chart components from Recharts:

```javascript
import { PieChart, Pie } from 'recharts';

// Add to your dashboard
<PieChart width={400} height={300}>
  <Pie data={data} />
</PieChart>
```

### Connecting to Real APIs

Replace mock data with API calls:

```javascript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    setChartData(data);
  };
  fetchData();
}, []);
```

### Adding New Navigation Items

Edit `src/components/Sidebar.jsx` and add items to the `navSections` array:

```javascript
{
  title: 'New Section',
  items: [
    { label: 'Item 1', href: '/path', icon: <Icon size={18} /> }
  ]
}
```

### Customizing Colors

Edit CSS variables in component CSS files:

```css
/* Change primary cyan to your color */
.logo-icon {
  background: linear-gradient(135deg, #yourcolor, #anothercolor);
}
```

## Performance Tips

- Use React.memo for expensive components
- Implement lazy loading for charts
- Optimize re-renders with useCallback
- Use responsive images and SVGs

## Troubleshooting

- **Port 3000 in use**: `npm start -- --port 3001`
- **Module not found**: Run `npm install` again
- **Syntax errors**: Check JavaScript syntax and React import

## Testing

```bash
npm test
```

## Deployment

Build the project and deploy to your hosting:

```bash
npm run build
# Deploy the 'build' folder to your hosting service
```

Popular options: Vercel, Netlify, GitHub Pages, AWS S3
