import 'dotenv/config';
import { prisma } from '../lib/prisma';
import {
    ShipmentStatus,
    TransportMode,
    MilestoneType,
    DemurragePeriod,
    AlertSeverity,
} from '@prisma/client';

// City data for realistic distribution
const CITIES = [
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
    { name: 'New York, USA', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Mumbai, India', lat: 19.076, lng: 72.8777 },
    { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
];

const CARRIERS = [
    'Maersk',
    'MSC',
    'COSCO',
    'CMA CGM',
    'Evergreen',
    'ONE',
    'FedEx',
    'UPS',
    'DHL',
    'Amazon',
];

const STATUSES: ShipmentStatus[] = [
    'EARLY',
    'ON_TIME',
    'LATE',
    'UNKNOWN',
];

const MODES: TransportMode[] = ['OCEAN', 'TRUCKLOAD', 'AIR'];

const MILESTONE_TYPES: MilestoneType[] = [
    'DEPART_ORIGIN',
    'ARRIVE_TS',
    'DEPART_TS',
    'ARRIVE_DESTINATION',
];

const DEMURRAGE_PERIODS: DemurragePeriod[] = [
    'FREE',
    'FIRST',
    'SECOND',
    'THIRD',
];

function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateReferenceNo(): string {
    const prefix = ['SHP', 'PKG', 'ORD', 'CNT'][Math.floor(Math.random() * 4)];
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seed...');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await prisma.shipmentSnapshot.deleteMany();
        await prisma.demurrage.deleteMany();
        await prisma.milestone.deleteMany();
        await prisma.alert.deleteMany();
        await prisma.shipment.deleteMany();

        // Create shipments
        console.log('📦 Creating 10,000 shipments...');
        const shipmentBatch = [];

        for (let i = 0; i < 10000; i++) {
            const originCity = randomElement(CITIES);
            const destCity = randomElement(CITIES.filter((c) => c.name !== originCity.name));
            const status = randomElement(STATUSES);
            const mode = randomElement(MODES);

            // Calculate dates
            const createdDate = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);
            const eta = new Date(
                createdDate.getTime() + randomInt(7, 60) * 24 * 60 * 60 * 1000
            );
            const actualArrival =
                status === 'UNKNOWN'
                    ? undefined
                    : new Date(
                        eta.getTime() +
                        (status === 'EARLY'
                            ? -randomInt(1, 5) * 24 * 60 * 60 * 1000
                            : status === 'LATE'
                                ? randomInt(1, 10) * 24 * 60 * 60 * 1000
                                : randomInt(-2, 2) * 24 * 60 * 60 * 1000)
                    );

            shipmentBatch.push({
                referenceNo: generateReferenceNo(),
                origin: originCity.name,
                destination: destCity.name,
                originLat: originCity.lat,
                originLng: originCity.lng,
                destLat: destCity.lat,
                destLng: destCity.lng,
                status,
                mode,
                carrier: randomElement(CARRIERS),
                eta,
                actualArrival,
                createdAt: createdDate,
                updatedAt: createdDate,
            });

            if (shipmentBatch.length === 100) {
                await prisma.shipment.createMany({
                    data: shipmentBatch,
                    skipDuplicates: true,
                });
                console.log(`✓ Created ${i + 1} shipments`);
                shipmentBatch.length = 0;
            }
        }

        if (shipmentBatch.length > 0) {
            await prisma.shipment.createMany({
                data: shipmentBatch,
                skipDuplicates: true,
            });
        }

        console.log('✓ All 10,000 shipments created');

        // Get all shipments
        const shipments = await prisma.shipment.findMany();

        // Create milestones
        console.log('🎯 Creating milestones...');
        let milestoneCount = 0;
        for (const shipment of shipments) {
            for (const milestone of MILESTONE_TYPES) {
                const completed = Math.random() > 0.3; // 70% completion rate
                const completedDate = completed
                    ? new Date(
                        shipment.createdAt.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000
                    )
                    : null;

                await prisma.milestone.create({
                    data: {
                        shipmentId: shipment.id,
                        type: milestone,
                        completed,
                        timestamp: completedDate,
                    },
                });
                milestoneCount++;
            }
        }
        console.log(`✓ Created ${milestoneCount} milestones`);

        // Create demurrage charges
        console.log('💰 Creating demurrage charges...');
        let demurrageCount = 0;
        for (let i = 0; i < shipments.length * 0.3; i++) {
            const shipment = randomElement(shipments);
            const period = randomElement(DEMURRAGE_PERIODS);
            const containerCount = randomInt(1, 100);
            const costPerDay = randomInt(100, 500);
            const totalDays = randomInt(1, 15);
            const totalCost = containerCount * costPerDay * totalDays;
            const startDate = new Date(shipment.createdAt);
            const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

            await prisma.demurrage.create({
                data: {
                    shipmentId: shipment.id,
                    period,
                    containerCount,
                    costPerDay,
                    totalDays,
                    totalCost,
                    startDate,
                    endDate,
                },
            });
            demurrageCount++;
        }
        console.log(`✓ Created ${demurrageCount} demurrage records`);

        // Create alerts
        console.log('🚨 Creating alerts...');
        const alertMessages = [
            {
                title: 'Red Sea Disruption',
                description: 'Significant shipping disruptions detected in Red Sea region.',
                severity: 'HIGH' as AlertSeverity,
            },
            {
                title: 'Port Congestion',
                description: 'Port of Singapore experiencing congestion. ETAs may be delayed.',
                severity: 'MEDIUM' as AlertSeverity,
            },
            {
                title: 'Weather Alert',
                description: 'Typhoon approaching Pacific region. Ocean freight delays expected.',
                severity: 'HIGH' as AlertSeverity,
            },
            {
                title: 'Customs Delay',
                description: 'Customs processing delays at New York port.',
                severity: 'LOW' as AlertSeverity,
            },
            {
                title: 'Fuel Surcharge',
                description: 'New fuel surcharge applied to all Ocean freight shipments.',
                severity: 'MEDIUM' as AlertSeverity,
            },
        ];

        let alertCount = 0;
        for (let i = 0; i < 50; i++) {
            const message = randomElement(alertMessages);
            const shipment = Math.random() > 0.3 ? randomElement(shipments) : null;

            await prisma.alert.create({
                data: {
                    ...message,
                    shipmentId: shipment?.id,
                    isResolved: Math.random() > 0.7,
                },
            });
            alertCount++;
        }
        console.log(`✓ Created ${alertCount} alerts`);

        // Create snapshots for analytics
        console.log('📸 Creating shipment snapshots...');
        let snapshotCount = 0;
        for (const shipment of shipments.slice(0, 1000)) {
            // Create 5 snapshots per shipment for trending data
            for (let i = 0; i < 5; i++) {
                const snapshotDate = new Date(
                    shipment.createdAt.getTime() + i * 10 * 24 * 60 * 60 * 1000
                );

                await prisma.shipmentSnapshot.create({
                    data: {
                        shipmentId: shipment.id,
                        status: randomElement(STATUSES),
                        eta: shipment.eta,
                        actualArrival: shipment.actualArrival,
                        milestonesComplete: randomInt(0, 4),
                        demurrageCost: randomInt(0, 10000),
                        snapshotDate,
                    },
                });
                snapshotCount++;
            }
        }
        console.log(`✓ Created ${snapshotCount} snapshots`);

        console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ✅ DATABASE SEEDING COMPLETE!                           ║
║                                                            ║
║  📊 Data Summary:                                          ║
║     • Shipments: 10,000                                    ║
║     • Milestones: ${milestoneCount}                        ║
║     • Demurrage Records: ${demurrageCount}                 ║
║     • Alerts: ${alertCount}                                ║
║     • Snapshots: ${snapshotCount}                          ║
║                                                            ║
║  🎯 Cities: ${CITIES.length}                              ║
║  🚢 Transport Modes: 3 (Ocean, Truckload, Air)           ║
║  📍 Carrier Companies: ${CARRIERS.length}                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase();
