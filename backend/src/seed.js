require('dotenv').config();
const mongoose = require('mongoose');
const ShipmentTwin = require('./models/ShipmentTwin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/twinflow';

const seedData = [
  {
    shipmentId: 'SHP-MOCK1',
    origin: 'Pune',
    destination: 'Mumbai',
    status: 'In Transit',
    mode: 'road',
    currentLocation: { lat: 18.5204, lng: 73.8567 },
    route: ['Pune', 'Lonavala', 'Mumbai'],
    route_legs: [],
    resilience: { score: 92 },
    alerts: []
  },
  {
    shipmentId: 'SHP-MOCK2',
    origin: 'Delhi',
    destination: 'Bangalore',
    status: 'Delayed',
    mode: 'air',
    currentLocation: { lat: 28.6139, lng: 77.2090 },
    route: ['Delhi', 'Bangalore'],
    route_legs: [],
    resilience: { score: 45 },
    alerts: [
      {
        message: 'Severe weather delay at Delhi airport',
        severity: 'critical',
        type: 'disruption',
        timestamp: new Date()
      }
    ]
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB for seeding');
    await ShipmentTwin.deleteMany({});
    console.log('🗑️  Cleared existing shipments');
    await ShipmentTwin.insertMany(seedData);
    console.log('🌱 Seeded mock shipments successfully');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('❌ MongoDB seeding error:', err);
    process.exit(1);
  });
