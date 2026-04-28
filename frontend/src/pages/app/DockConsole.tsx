import React, { useState } from 'react'
import { Plus, Grid3x3, List, Settings2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'

interface DockSite {
    id: string
    name: string
}

interface DockCard {
    id: string
    status: 'DROP' | 'LOADED' | 'EMPTY' | 'PULLING'
    reference: string
    type: string
    location: string
    item?: string
    priority?: 'BUMP' | 'FULL' | 'PULL' | 'SPOT'
    duration?: string
    countdown?: string
}

const DOCK_SITES: DockSite[] = [
    { id: 'collegedale', name: 'COLLEGEDALE' },
    { id: 'brp-juarez', name: 'BRP_JUAREZ' },
    { id: 'brp-juarez-2', name: 'BRP_JUAREZ 2' },
]

const SITE_SECTIONS = [
    'Bakery',
    'Corp Shop',
    'Ingredients',
    'Parts Receiving',
    'Plant 2',
    'Plant 2-Sd',
    'Plant 5',
    'Plant 6',
    'Sau',
]

const MOCK_DOCKS: DockCard[] = [
    {
        id: 'P2-SD-04',
        status: 'DROP',
        reference: 'PRU 1013483',
        type: 'BUMP',
        location: 'Outbound',
        priority: 'FULL',
        duration: '16 h 10 m',
    },
    {
        id: 'P2-SD-05',
        status: 'DROP',
        reference: 'CRFR T01868',
        type: 'BUMP',
        location: 'Outbound',
        priority: 'FULL',
        duration: '0 m',
    },
    {
        id: 'P2-SD-06',
        status: 'LOADED',
        reference: 'CRFR 1988502',
        item: 'SPOT',
        priority: 'BUMP',
        duration: '5 m',
    },
    {
        id: 'P2-SD-07',
        status: 'LOADED',
        reference: '',
        item: 'SPOT',
        priority: 'FULL',
        duration: '16 h 10 m',
    },
    {
        id: 'P2-SD-08',
        status: 'DROP',
        reference: 'CRFR T074220',
        type: 'BUMP',
        location: 'Outbound',
        priority: 'FULL',
        duration: '5 m',
    },
    {
        id: 'P2-SD-09',
        status: 'DROP',
        reference: 'CRFR T219842',
        type: 'PULL',
        location: 'Outbound',
        priority: 'FULL',
        duration: '11 h 40 m',
    },
    {
        id: 'P2-SD-10',
        status: 'DROP',
        reference: 'PRU 1836598',
        type: 'BUMP',
        location: 'Inbound',
        priority: 'FULL',
        duration: '1 h 46 m',
    },
    {
        id: 'P2-SD-11',
        status: 'DROP',
        reference: 'UXDI T911332',
        type: 'BUMP',
        location: 'Outbound',
        priority: 'FULL',
        duration: '1 h 40 m',
    },
    {
        id: 'P2-SD-12',
        status: 'LOADED',
        reference: 'CRFR T061230',
        duration: '29 m',
    },
    {
        id: 'P2-SD-13',
        status: 'LOADED',
        reference: 'CRFR T061230',
        type: 'BUMP',
        priority: 'FULL',
        duration: '1 m',
    },
    {
        id: 'P2-SD-14',
        status: 'LOADED',
        reference: '',
        item: 'SPOT',
        duration: '2 h 49 m',
    },
    {
        id: 'P2-SD-15',
        status: 'LOADED',
        reference: 'CRFR T214842',
        type: 'PULL',
        location: 'Outbound',
        priority: 'FULL',
        duration: '11 h 40 m',
    },
]

export default function DockConsole() {
    const [selectedSite, setSelectedSite] = useState<string>('collegedale')
    const [selectedSection, setSelectedSection] = useState<string>('Bakery')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DROP':
                return 'border-green-200 bg-green-50'
            case 'LOADED':
                return 'border-blue-200 bg-blue-50'
            case 'EMPTY':
                return 'border-amber-200 bg-amber-50'
            case 'PULLING':
                return 'border-purple-200 bg-purple-50'
            default:
                return 'border-slate-200 bg-white'
        }
    }

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'DROP':
                return 'text-green-700'
            case 'LOADED':
                return 'text-blue-700'
            case 'EMPTY':
                return 'text-amber-700'
            case 'PULLING':
                return 'text-purple-700'
            default:
                return 'text-slate-700'
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'BUMP':
                return 'bg-pink-100 text-pink-700 border border-pink-200'
            case 'FULL':
                return 'bg-orange-100 text-orange-700 border border-orange-200'
            case 'PULL':
                return 'bg-cyan-100 text-cyan-700 border border-cyan-200'
            case 'SPOT':
                return 'bg-blue-100 text-blue-700 border border-blue-200'
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-200'
        }
    }

    return (
        <div className="page-enter">
            <PageHeader
                title="Dock Console"
                subtitle="Real-time dock operations and shipment tracking"
                actions={
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setViewMode('grid')}>
                            <Grid3x3 size={18} className={viewMode === 'grid' ? 'text-orange-600' : 'text-slate-400'} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setViewMode('list')}>
                            <List size={18} className={viewMode === 'list' ? 'text-orange-600' : 'text-slate-400'} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <Settings2 size={18} className="text-slate-400" />
                        </button>
                    </div>
                }
            />

            {/* Site & Section Tabs */}
            <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {DOCK_SITES.map((site) => (
                        <button
                            key={site.id}
                            onClick={() => setSelectedSite(site.id)}
                            className={cn(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                selectedSite === site.id
                                    ? 'bg-orange-500 text-white shadow-card'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 shadow-card'
                            )}
                        >
                            {site.name}
                        </button>
                    ))}
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1 border border-slate-200 hover:border-slate-300 bg-white shadow-card">
                        <Plus size={16} /> Add Site
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {SITE_SECTIONS.map((section) => (
                        <button
                            key={section}
                            onClick={() => setSelectedSection(section)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border shadow-card',
                                selectedSection === section
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            )}
                        >
                            {section}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {MOCK_DOCKS.map((dock) => (
                            <div
                                key={dock.id}
                                className={cn(
                                    'border rounded-xl p-4 transition-all hover:shadow-md hover:border-opacity-100 shadow-card bg-white',
                                    getStatusColor(dock.status)
                                )}
                            >
                                {/* Dock ID */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-slate-800 font-semibold text-lg">{dock.id}</h3>
                                        <p className={cn('text-xs font-bold', getStatusTextColor(dock.status))}>
                                            {dock.status}
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-3 text-xs">
                                    {dock.reference && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Ref:</span>
                                            <span className="text-slate-700 font-medium">{dock.reference}</span>
                                        </div>
                                    )}
                                    {dock.location && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Location:</span>
                                            <span className="text-slate-700">{dock.location}</span>
                                        </div>
                                    )}
                                    {dock.type && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Type:</span>
                                            <span className="text-slate-700">{dock.type}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Priority & Duration */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    {dock.priority && (
                                        <span className={cn('text-xs font-bold px-2 py-1 rounded', getPriorityColor(dock.priority))}>
                                            {dock.priority}
                                        </span>
                                    )}
                                    {dock.duration && (
                                        <span className="text-xs text-slate-500">{dock.duration}</span>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg font-medium transition-colors">
                                    SPOT
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {MOCK_DOCKS.map((dock) => (
                            <div
                                key={dock.id}
                                className={cn(
                                    'border rounded-xl p-4 transition-all hover:shadow-md flex items-center justify-between shadow-card bg-white',
                                    getStatusColor(dock.status)
                                )}
                            >
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="min-w-[80px]">
                                        <h3 className="text-slate-800 font-semibold">{dock.id}</h3>
                                        <p className={cn('text-xs font-bold', getStatusTextColor(dock.status))}>
                                            {dock.status}
                                        </p>
                                    </div>
                                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 text-xs">Reference</p>
                                            <p className="text-slate-800">{dock.reference || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Location</p>
                                            <p className="text-slate-800">{dock.location || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Type</p>
                                            <p className="text-slate-800">{dock.type || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Duration</p>
                                            <p className="text-slate-800">{dock.duration || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {dock.priority && (
                                        <span className={cn('text-xs font-bold px-2 py-1 rounded', getPriorityColor(dock.priority))}>
                                            {dock.priority}
                                        </span>
                                    )}
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors">
                                        SPOT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
