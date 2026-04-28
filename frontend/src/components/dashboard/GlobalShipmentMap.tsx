import { SHIPMENT_MAP_MARKERS } from '../../data/dashboardData'
import { MapPin, ZoomIn, ZoomOut, Filter } from 'lucide-react'
import { useState } from 'react'

export default function GlobalShipmentMap() {
    const [hoveredMarker, setHoveredMarker] = useState<number | null>(null)

    const getMarkerColor = (status: string) => {
        switch (status) {
            case 'on-time':
                return '#3b82f6'
            case 'early':
                return '#ec4899'
            case 'late':
                return '#a855f7'
            case 'unknown':
                return '#f97316'
            default:
                return '#64748b'
        }
    }

    const getMarkerLabel = (status: string) => {
        switch (status) {
            case 'on-time':
                return '●'
            case 'early':
                return '●'
            case 'late':
                return '●'
            case 'unknown':
                return '●'
            default:
                return '●'
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Map Container */}
            <div className="relative h-96 bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Simplified Map Background */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 1200 600"
                    preserveAspectRatio="xMidYMid slice"
                >
                    {/* Ocean base */}
                    <rect width="1200" height="600" fill="#e8f4f8" />

                    {/* Continental shapes (simplified) */}
                    <g fill="#f0f0f0" stroke="#d0d0d0" strokeWidth="1">
                        {/* North America */}
                        <path d="M 150 150 L 250 140 L 280 200 L 240 250 L 180 230 Z" />
                        {/* South America */}
                        <path d="M 250 350 L 280 340 L 290 450 L 260 480 Z" />
                        {/* Europe */}
                        <path d="M 450 120 L 550 110 L 560 180 L 480 190 Z" />
                        {/* Africa */}
                        <path d="M 550 200 L 650 190 L 670 400 L 580 420 Z" />
                        {/* Asia */}
                        <path d="M 700 100 L 900 120 L 920 300 L 750 320 Z" />
                        {/* Australia */}
                        <path d="M 850 450 L 900 460 L 890 520 L 840 510 Z" />
                    </g>

                    {/* Grid lines */}
                    <g stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" opacity="0.3">
                        {Array.from({ length: 13 }).map((_, i) => (
                            <line
                                key={`v${i}`}
                                x1={i * 100}
                                y1="0"
                                x2={i * 100}
                                y2="600"
                            />
                        ))}
                        {Array.from({ length: 7 }).map((_, i) => (
                            <line
                                key={`h${i}`}
                                x1="0"
                                y1={i * 100}
                                x2="1200"
                                y2={i * 100}
                            />
                        ))}
                    </g>

                    {/* Markers */}
                    {SHIPMENT_MAP_MARKERS.map((marker) => {
                        const x = ((marker.lng + 180) / 360) * 1200
                        const y = ((90 - marker.lat) / 180) * 600
                        const isHovered = hoveredMarker === marker.id

                        return (
                            <g key={marker.id}>
                                {/* Outer pulse circle */}
                                {isHovered && (
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="25"
                                        fill={getMarkerColor(marker.status)}
                                        opacity="0.1"
                                    />
                                )}

                                {/* Main marker circle */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? 12 : 8}
                                    fill={getMarkerColor(marker.status)}
                                    stroke="white"
                                    strokeWidth="2"
                                    style={{ transition: 'r 0.2s' }}
                                    onMouseEnter={() => setHoveredMarker(marker.id)}
                                    onMouseLeave={() => setHoveredMarker(null)}
                                    className="cursor-pointer"
                                />

                                {/* Count label */}
                                {isHovered && (
                                    <text
                                        x={x}
                                        y={y - 20}
                                        textAnchor="middle"
                                        className="text-xs font-semibold fill-slate-900"
                                        fontSize="12"
                                    >
                                        {marker.count}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </svg>

                {/* Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm">
                        <ZoomIn size={18} className="text-slate-600" />
                    </button>
                    <button className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm">
                        <ZoomOut size={18} className="text-slate-600" />
                    </button>
                    <button className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm">
                        <Filter size={18} className="text-slate-600" />
                    </button>
                </div>

                {/* Hover Tooltip */}
                {hoveredMarker !== null && (
                    <div className="absolute top-4 left-4 bg-white rounded-lg border border-slate-200 p-3 shadow-lg">
                        {(() => {
                            const marker = SHIPMENT_MAP_MARKERS.find((m) => m.id === hoveredMarker)
                            return (
                                <>
                                    <p className="font-semibold text-slate-900">{marker?.city}</p>
                                    <p className="text-sm text-slate-600">{marker?.count} shipments</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: getMarkerColor(marker?.status || '') }}
                                        />
                                        <span className="text-xs text-slate-500 capitalize">
                                            {marker?.status?.replace('-', ' ')}
                                        </span>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-xs text-slate-600">On Time</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <span className="text-xs text-slate-600">Early</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    <span className="text-xs text-slate-600">Late</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400" />
                    <span className="text-xs text-slate-600">Unknown</span>
                </div>
            </div>
        </div>
    )
}
