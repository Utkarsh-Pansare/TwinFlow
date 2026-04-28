import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ShipmentMarker {
    lat: number;
    lng: number;
    location: string;
    count: number;
    statusBreakdown: {
        early: number;
        onTime: number;
        late: number;
        unknown: number;
    };
}

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Load TomTom SDK dynamically
function loadTomTomSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).tt) {
            resolve();
            return;
        }

        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TomTom SDK'));
        document.head.appendChild(script);
    });
}

export default function GoogleShipmentMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const ttMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shipments, setShipments] = useState<ShipmentMarker[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [autoUpdate, setAutoUpdate] = useState(true);

    // Load TomTom SDK and initialize map
    useEffect(() => {
        const init = async () => {
            if (!TOMTOM_API_KEY) {
                setError('TomTom API key not configured');
                setLoading(false);
                return;
            }

            try {
                await loadTomTomSDK();
                const tt = (window as any).tt;

                if (!mapRef.current || ttMapRef.current) return;

                const map = tt.map({
                    key: TOMTOM_API_KEY,
                    container: mapRef.current,
                    center: [20, 20],
                    zoom: 2,
                    style: {
                        map: 'basic_main',
                        poi: 'poi_main',
                    },
                });

                map.addControl(new tt.NavigationControl());

                map.on('load', () => {
                    ttMapRef.current = map;
                    setLoading(false);
                    fetchShipmentMarkers();
                });
            } catch (err) {
                setError('Failed to load TomTom Maps');
                setLoading(false);
            }
        };

        init();

        return () => {
            if (ttMapRef.current) {
                ttMapRef.current.remove();
                ttMapRef.current = null;
            }
        };
    }, []);

    // Fetch shipment data from backend
    const fetchShipmentMarkers = async () => {
        try {
            const response = await axios.get<{ data: ShipmentMarker[] }>(
                `${API_BASE_URL}/map/shipments`
            );

            if (response.data?.data) {
                setShipments(response.data.data);
                setLastUpdate(new Date());
                updateMarkers(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching shipments:', err);
            if (shipments.length === 0) {
                // Use demo data as fallback
                const demoData: ShipmentMarker[] = [
                    { lat: 19.076, lng: 72.8777, location: 'Mumbai', count: 45, statusBreakdown: { early: 12, onTime: 20, late: 8, unknown: 5 } },
                    { lat: 1.3521, lng: 103.8198, location: 'Singapore', count: 32, statusBreakdown: { early: 8, onTime: 15, late: 6, unknown: 3 } },
                    { lat: 51.5074, lng: -0.1278, location: 'London', count: 28, statusBreakdown: { early: 5, onTime: 18, late: 3, unknown: 2 } },
                    { lat: 40.7128, lng: -74.006, location: 'New York', count: 38, statusBreakdown: { early: 10, onTime: 22, late: 4, unknown: 2 } },
                    { lat: 35.6762, lng: 139.6503, location: 'Tokyo', count: 22, statusBreakdown: { early: 6, onTime: 12, late: 2, unknown: 2 } },
                    { lat: 22.3193, lng: 114.1694, location: 'Hong Kong', count: 18, statusBreakdown: { early: 4, onTime: 10, late: 3, unknown: 1 } },
                    { lat: 25.2048, lng: 55.2708, location: 'Dubai', count: 25, statusBreakdown: { early: 7, onTime: 13, late: 3, unknown: 2 } },
                    { lat: -33.8688, lng: 151.2093, location: 'Sydney', count: 15, statusBreakdown: { early: 3, onTime: 8, late: 2, unknown: 2 } },
                ];
                setShipments(demoData);
                setLastUpdate(new Date());
                updateMarkers(demoData);
            }
        }
    };

    // Update markers on map
    const updateMarkers = (data: ShipmentMarker[]) => {
        if (!ttMapRef.current) return;
        const tt = (window as any).tt;

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // Add new markers
        data.forEach((shipment) => {
            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'tt-marker-container';
            el.innerHTML = `
                <div style="
                    width: 40px; height: 40px;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(29, 78, 216, 0.4);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    position: relative;
                ">
                    <span style="color: white; font-weight: bold; font-size: 12px;">${shipment.count}</span>
                </div>
            `;

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.2)';
                el.style.zIndex = '999';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                el.style.zIndex = 'auto';
            });

            // Create popup content
            const popupContent = `
                <div style="padding: 12px; min-width: 200px; font-family: system-ui, sans-serif;">
                    <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>
                        ${shipment.location}
                    </div>
                    <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${shipment.count} <span style="font-size: 12px; font-weight: 400; color: #64748b;">shipments</span></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
                        <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #fce7f3; border-radius: 4px;">
                            <span>Early</span><strong>${shipment.statusBreakdown.early}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #dbeafe; border-radius: 4px;">
                            <span>On-time</span><strong>${shipment.statusBreakdown.onTime}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #f3e8ff; border-radius: 4px;">
                            <span>Late</span><strong>${shipment.statusBreakdown.late}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #ffedd5; border-radius: 4px;">
                            <span>Unknown</span><strong>${shipment.statusBreakdown.unknown}</strong>
                        </div>
                    </div>
                </div>
            `;

            const popup = new tt.Popup({ offset: 25 }).setHTML(popupContent);

            const marker = new tt.Marker({ element: el })
                .setLngLat([shipment.lng, shipment.lat])
                .setPopup(popup)
                .addTo(ttMapRef.current);

            markersRef.current.push(marker);
        });
    };

    // Auto-refresh shipment data
    useEffect(() => {
        if (!autoUpdate) return;

        const interval = setInterval(() => {
            fetchShipmentMarkers();
        }, 10000);

        return () => clearInterval(interval);
    }, [autoUpdate]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Global Shipment Map</h3>
                        <p className="text-xs text-slate-500">
                            Real-time tracking across {shipments.length} locations
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {lastUpdate && (
                        <span className="text-xs text-slate-500 px-3 py-1 bg-slate-100 rounded-full">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => setAutoUpdate(!autoUpdate)}
                        className={`p-2 rounded-lg transition-colors ${autoUpdate
                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title={autoUpdate ? 'Auto-update enabled' : 'Auto-update disabled'}
                    >
                        <Zap className="w-4 h-4" />
                    </button>
                    <button
                        onClick={fetchShipmentMarkers}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Refresh now"
                    >
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-96">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 z-10">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                        <p className="text-sm text-slate-600">Loading TomTom Maps...</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-10">
                        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <p className="text-xs text-red-500 mt-1">
                            Check VITE_TOMTOM_API_KEY in .env
                        </p>
                    </div>
                )}

                {/* TomTom Map */}
                <div
                    ref={mapRef}
                    className="w-full h-full"
                    style={{ backgroundColor: '#f8fafc' }}
                />

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-slate-200 max-w-xs z-10">
                    <p className="text-xs font-semibold text-slate-900 mb-2">Status Breakdown</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                            <span className="text-slate-600">Early Arrivals</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-slate-600">On-time</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                            <span className="text-slate-600">Late Arrivals</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-slate-600">Unknown Status</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 border-t border-slate-200 bg-slate-50">
                <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                        {shipments.reduce((sum, s) => sum + s.count, 0)}
                    </div>
                    <p className="text-xs text-slate-600">Total Shipments</p>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">{shipments.length}</div>
                    <p className="text-xs text-slate-600">Active Locations</p>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                        {shipments.reduce((sum, s) => sum + s.statusBreakdown.onTime, 0)}
                    </div>
                    <p className="text-xs text-slate-600">On-time</p>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                        {shipments.reduce((sum, s) => sum + s.statusBreakdown.late, 0)}
                    </div>
                    <p className="text-xs text-slate-600">Late</p>
                </div>
            </div>
        </div>
    );
}
