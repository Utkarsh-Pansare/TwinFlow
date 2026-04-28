// Dummy data for the logistics analytics dashboard

export const SHIPMENT_STATUS_BREAKDOWN = {
    early: 33794,
    onTime: 73589,
    unknown: 10879,
    late: 50692,
    total: 168974,
}

export const SHIPMENT_MAP_MARKERS = [
    { id: 1, lat: 51.5074, lng: -0.1278, city: 'London', count: 234, status: 'on-time' },
    { id: 2, lat: 48.8566, lng: 2.3522, city: 'Paris', count: 189, status: 'on-time' },
    { id: 3, lat: 52.52, lng: 13.405, city: 'Berlin', count: 156, status: 'late' },
    { id: 4, lat: 40.7128, lng: -74.006, city: 'New York', count: 892, status: 'on-time' },
    { id: 5, lat: 34.0522, lng: -118.2437, city: 'Los Angeles', count: 654, status: 'early' },
    { id: 6, lat: 35.6762, lng: 139.6503, city: 'Tokyo', count: 445, status: 'on-time' },
    { id: 7, lat: 22.3193, lng: 114.1694, city: 'Hong Kong', count: 523, status: 'late' },
    { id: 8, lat: -33.8688, lng: 151.2093, city: 'Sydney', count: 312, status: 'on-time' },
    { id: 9, lat: 1.3521, lng: 103.8198, city: 'Singapore', count: 678, status: 'on-time' },
    { id: 10, lat: 19.0760, lng: 72.8777, city: 'Mumbai', count: 445, status: 'unknown' },
    { id: 11, lat: 28.6139, lng: 77.209, city: 'Delhi', count: 267, status: 'early' },
    { id: 12, lat: -23.5505, lng: -46.6333, city: 'São Paulo', count: 389, status: 'late' },
]

export const KPI_CARDS = [
    { id: 1, title: 'Ocean: late departure', value: 402, icon: 'Waves', color: 'blue' },
    { id: 2, title: 'Ocean: late discharge', value: 856, icon: 'Waves', color: 'amber' },
    { id: 3, title: 'Ocean: ETA late', value: 546, icon: 'Waves', color: 'orange' },
    { id: 4, title: 'Truckload: ETA late', value: 1126, icon: 'Truck', color: 'red' },
    { id: 5, title: 'Truckload: ETA early', value: 604, icon: 'Truck', color: 'green' },
]

export const TRENDING_INSIGHTS = {
    id: 1,
    isLive: true,
    title: 'Red Sea incident causing potential delays for 5,802 shipments',
    description: 'Show impacted shipments',
    image: 'https://images.unsplash.com/photo-1578575437980-ea6141aa3e1e?w=400&h=300&fit=crop',
}

export const DEMURRAGE_CHARGES = {
    containers: 1975,
    cost: 527500,
    breakdown: [
        { period: 'Free period', containers: 330, cost: 0, percentage: 16.7 },
        { period: '1st period', containers: 264, cost: 160000, percentage: 13.4 },
        { period: '2nd period', containers: 156, cost: 97500, percentage: 7.9 },
        { period: '3rd period', containers: 225, cost: 270000, percentage: 11.4 },
    ],
}

export const MILESTONE_COMPLETENESS = [
    { name: 'Depart Origin', value: 93, label: '93%' },
    { name: 'Arrive TS', value: 89, label: '89%' },
    { name: 'Depart TS', value: 86, label: '86%' },
    { name: 'Arrive Dest', value: 71, label: '71%' },
]

export const PREDICTION_ACCURACY = {
    p44OverCarrier: 4.9,
    actualArrival: 12.7,
    measurableImpact: {
        advanceNotice: 4.8,
        accurateDischarge: 12.5,
    },
}

export const DATA_LATENCY_METRICS = [
    {
        name: 'Vessel Arrival',
        carrier: 60.4,
        aiEnhanced: 18.7,
        improvement: 66,
    },
    {
        name: 'Vessel Departure',
        carrier: 81.7,
        aiEnhanced: 50.6,
        improvement: 31,
    },
]

export const LATENCY_REDUCTION_SUMMARY = {
    dataLatencyReduction: 50.5,
    additionalPercentage: 31,
}

export const DUMMY_SHIPMENTS = [
    { id: 'SHP-001', route: 'Shanghai → Rotterdam', mode: 'Ocean', status: 'on-time', eta: '2024-05-15', resilience: 85 },
    { id: 'SHP-002', route: 'Los Angeles → Tokyo', mode: 'Air', status: 'early', eta: '2024-05-10', resilience: 92 },
    { id: 'SHP-003', route: 'Mumbai → Singapore', mode: 'Ocean', status: 'late', eta: '2024-05-20', resilience: 55 },
    { id: 'SHP-004', route: 'Dubai → London', mode: 'Road', status: 'on-time', eta: '2024-05-12', resilience: 78 },
    { id: 'SHP-005', route: 'Sydney → Bangkok', mode: 'Ocean', status: 'on-time', eta: '2024-05-18', resilience: 88 },
]
