import { useState } from 'react'
import ShipmentOverviewCard from '../../components/dashboard/ShipmentOverviewCard'
import GoogleShipmentMap from '../../components/dashboard/GoogleShipmentMap'
import TrendingAlertCard from '../../components/dashboard/TrendingAlertCard'
import KPICardsRow from '../../components/dashboard/KPICardsRow'
import FilterTabs from '../../components/dashboard/FilterTabs'
import DemurrageChargesCard from '../../components/dashboard/DemurrageChargesCard'
import MilestoneCompletenessChart from '../../components/dashboard/MilestoneCompletenessChart'
import PredictionAccuracyCard from '../../components/dashboard/PredictionAccuracyCard'
import DataLatencyCard from '../../components/dashboard/DataLatencyCard'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('shipments')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="page-enter bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Top Layout: Left Panel + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Left Panel */}
        <div className="lg:col-span-1">
          <ShipmentOverviewCard />
        </div>

        {/* Map Section */}
        <div className="lg:col-span-3">
          <GoogleShipmentMap />
        </div>
      </div>

      {/* Trending Alert */}
      <div className="mb-8">
        <TrendingAlertCard />
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <FilterTabs onTabChange={setActiveTab} onSearch={setSearchQuery} />
      </div>

      {/* KPI Cards Row */}
      <div className="mb-8">
        <KPICardsRow />
      </div>

      {/* Snapshots Section */}
      <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-700 font-semibold">Snapshots</span>
            <div className="flex items-center gap-2">
              {['Ocean', 'Truckload', 'All analytics'].map((snapshot) => (
                <button
                  key={snapshot}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white transition-all"
                >
                  {snapshot}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Viewing: Last 12 mos</span>
            <button className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1">
              ↓
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemurrageChargesCard />
        <MilestoneCompletenessChart />
        <PredictionAccuracyCard />
        <DataLatencyCard />
      </div>
    </div>
  )
}
