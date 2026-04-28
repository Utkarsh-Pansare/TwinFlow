require('dotenv').config();
require('express-async-errors');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const { initTwinSocket } = require('./sockets/twinSocket');
const { startSimulationLoop, startProactiveLoop, startExecutionMonitoringLoop } = require('./services/simulationService');
const shipmentsRouter = require('./routes/shipments');
const queryRouter     = require('./routes/query');
const alertsRouter    = require('./routes/alerts');
const twinsRouter     = require('./routes/twins');
const internalRouter  = require('./routes/internal');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/shipments', shipmentsRouter);
app.use('/query',     queryRouter);
app.use('/alerts',    alertsRouter);
app.use('/twins',     twinsRouter);
app.use('/internal',  internalRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Socket.io Setup
initTwinSocket(server);

const PORT = process.env.PORT || 3001;
const { MongoMemoryServer } = require('mongodb-memory-server');

// Database connection & Server start
async function startServer() {
  const mongoServer = await MongoMemoryServer.create();
  const MONGO_URI = mongoServer.getUri();
  
  mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Seed DB
    const ShipmentTwin = require('./models/ShipmentTwin');
    const seedData = [
      { shipmentId: 'SHP-MOCK1', origin: 'Pune', destination: 'Mumbai', status: 'In Transit', mode: 'road', currentLocation: { lat: 18.5204, lng: 73.8567 }, route: ['Pune', 'Lonavala', 'Mumbai'], route_legs: [], resilience: { score: 92 }, alerts: [] },
      { shipmentId: 'SHP-MOCK2', origin: 'Delhi', destination: 'Bangalore', status: 'Delayed', mode: 'air', currentLocation: { lat: 28.6139, lng: 77.2090 }, route: ['Delhi', 'Bangalore'], route_legs: [], resilience: { score: 45 }, alerts: [{ message: 'Severe weather delay at Delhi airport', severity: 'critical', type: 'disruption', timestamp: new Date() }] }
    ];
    await ShipmentTwin.deleteMany({});
    await ShipmentTwin.insertMany(seedData);
    console.log('🌱 Seeded mock shipments successfully');
    
    startSimulationLoop();
    startProactiveLoop();
    startExecutionMonitoringLoop();
    console.log('✅ Started background simulation loops (incl. Layer 6 execution monitoring)');
    
    // Worker is now called synchronously by replanQueue
    console.log('✅ BullMQ Worker bypassed, using direct invocation');
    
    server.listen(PORT, () => {
      console.log(`🚀 TwinFlow Node API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
}
startServer();
