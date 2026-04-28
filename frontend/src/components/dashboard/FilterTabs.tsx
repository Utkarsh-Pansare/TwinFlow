import { useState } from 'react'
import { Search, Plus } from 'lucide-react'

interface FilterTabsProps {
    onTabChange?: (tab: string) => void
    onSearch?: (query: string) => void
}

export default function FilterTabs({ onTabChange, onSearch }: FilterTabsProps) {
    const [activeTab, setActiveTab] = useState('shipments')
    const [searchQuery, setSearchQuery] = useState('')

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        onTabChange?.(tab)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        onSearch?.(query)
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                    {['Shipments', 'Orders', 'Recommended'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab.toLowerCase())}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.toLowerCase()
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:text-slate-700 border border-transparent'
                                }`}
                        >
                            {tab}
                            {tab === 'Shipments' && (
                                <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                    167
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-xs ml-auto">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search shipments"
                            className="bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 w-full"
                        />
                    </div>
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        <Plus size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>
        </div>
    )
}
