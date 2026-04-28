# Modern Logistics Analytics Dashboard

A production-ready SaaS-style logistics analytics dashboard built with React, Vite, TypeScript, and Tailwind CSS.

## 🏗️ Architecture

```
src/
├── pages/app/
│   └── DashboardPage.tsx          # Main dashboard page
├── components/dashboard/
│   ├── ShipmentOverviewCard.tsx    # Welcome + status breakdown
│   ├── GlobalShipmentMap.tsx       # Interactive world map with markers
│   ├── TrendingAlertCard.tsx       # Live alert banner
│   ├── KPICardsRow.tsx             # 5 KPI metrics
│   ├── FilterTabs.tsx              # Tab filters + search
│   ├── DemurrageChargesCard.tsx    # Demurrage analysis
│   ├── MilestoneCompletenessChart.tsx  # Bar chart
│   ├── PredictionAccuracyCard.tsx  # Accuracy metrics
│   └── DataLatencyCard.tsx         # Latency comparison
└── data/
    └── dashboardData.ts            # Dummy data for all components
```

## 🎯 Key Features

### 1. Shipment Overview Card
- Welcome message with user name
- Total active shipments (168,974)
- Multi-color progress bar (Early, On-time, Unknown, Late)
- Status breakdown with color indicators

### 2. Global Shipment Map
- SVG-based world map (can integrate Leaflet/Mapbox)
- Interactive markers with status colors
- Hover tooltips showing shipment details
- Zoom and filter controls
- Legend with status breakdown

### 3. Trending Alert Card
- Live alert banner with pulse indicator
- Red Sea incident example
- CTA button for detailed view

### 4. KPI Cards
- 5 metric cards (Ocean/Truckload metrics)
- Colored borders by severity
- Hover effects
- Shipment count display

### 5. Filter Tabs
- Shipments/Orders/Recommended tabs
- Search bar with live filtering
- Add button for new shipments
- Active tab styling

### 6. Analytics Charts

#### Demurrage Charges
- Container count and total cost
- Period-wise breakdown
- Stacked bar visualization

#### Milestone Completeness
- Bar chart with 4 milestones
- AI enhancement badge
- Percentage display

#### Prediction Accuracy
- P44 over carrier ETA
- Actual arrival percentage
- Measurable impact metrics

#### Data Latency Reduction
- Carrier vs AI-enhanced comparison
- Percentage improvements
- Vessel arrival/departure metrics

## 🎨 Design System

- **Primary Color**: Blue (#1D4ED8)
- **Accent Colors**: Pink, Purple, Orange
- **Background**: Light slate (#F8FAFC)
- **Cards**: Rounded-2xl with shadow-sm
- **Font**: Inter (from Tailwind)
- **Spacing**: 8px base unit

## 📊 Components Used

- **Chart Library**: Recharts
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks (useState)

## 🚀 Usage

All components are modular and reusable:

```tsx
import ShipmentOverviewCard from '@/components/dashboard/ShipmentOverviewCard'

// Use component
<ShipmentOverviewCard />
```

### Dummy Data

All data is stored in `src/data/dashboardData.ts` and can be replaced with real API data.

```tsx
import { SHIPMENT_STATUS_BREAKDOWN } from '@/data/dashboardData'
```

## 🔄 Integration

To integrate with real data:

1. Replace dummy data in `dashboardData.ts` with API calls
2. Use React Query or similar for data fetching
3. Update component props to accept real data
4. Add loading/error states

## ✨ Performance

- Lazy-loaded components
- Optimized SVG map rendering
- Memoized chart components
- Minimal re-renders

## 📱 Responsive

- Mobile-first design
- Responsive grid layouts
- Touch-friendly controls
- Adapts to all screen sizes

## 🎯 Future Enhancements

- [ ] Real map integration (Mapbox/Leaflet)
- [ ] Live data updates with WebSockets
- [ ] Export to PDF
- [ ] Custom date range filtering
- [ ] Data drill-down capabilities
- [ ] Dark mode support
