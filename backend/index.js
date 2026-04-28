const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const twinStore = require('./twins');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// API Endpoints
app.post('/shipment', async (req, res) => {
    const { query } = req.body;
    
    try {
        // 1. Get structured plan from Gemini
        const planResponse = await axios.post(`${AI_SERVICE_URL}/plan`, { query });
        const plan = planResponse.data;

        // 2. Create Order Twin
        const orderTwin = twinStore.createOrderTwin(plan);

        // 3. Optimize Route
        const routeResponse = await axios.post(`${AI_SERVICE_URL}/optimize`, {
            origin: plan.origin,
            destination: plan.destination,
            mode: plan.mode
        });

        // 4. Create Shipment Twin
        const shipmentTwin = twinStore.createShipmentTwin(orderTwin, routeResponse.data);
        
        io.emit('shipment-created', shipmentTwin);
        res.status(201).json(shipmentTwin);
    } catch (error) {
        console.error('Error creating shipment:', error.message);
        res.status(500).json({ error: 'System failure in twin orchestration' });
    }
});

app.get('/shipments', (req, res) => {
    res.json(twinStore.getAllShipments());
});

app.get('/alerts', (req, res) => {
    res.json(twinStore.getAlerts());
});

app.post('/query', async (req, res) => {
    const { query } = req.body;
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/plan`, { query });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Gemini query failed' });
    }
});

app.post('/reroute', async (req, res) => {
    const { shipmentId } = req.body;
    const shipment = twinStore.shipmentTwins.get(shipmentId);
    if (!shipment) return res.status(404).json({ error: 'Shipment twin not found' });

    try {
        const routeResponse = await axios.post(`${AI_SERVICE_URL}/optimize`, {
            origin: shipment.currentLocation,
            destination: shipment.destination,
            mode: shipment.mode
        });

        const updated = twinStore.updateShipment(shipmentId, {
            route: routeResponse.data.route,
            status: 'REROUTED',
            resilienceScore: Math.max(0, shipment.resilienceScore - 5)
        });

        io.emit('shipment-updated', updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Rerouting optimization failed' });
    }
});

// Simulation Loop
setInterval(async () => {
    const shipments = twinStore.getAllShipments();
    for (const shipment of shipments) {
        if (shipment.status === 'DELIVERED') continue;

        try {
            // Call AI service for a simulation tick
            const tickResponse = await axios.post(`${AI_SERVICE_URL}/simulate/tick`, shipment);
            const { disruption, status } = tickResponse.data;

            if (status === 'alert') {
                twinStore.addAlert({
                    shipmentId: shipment.id,
                    message: disruption.event,
                    severity: disruption.risk_score > 50 ? 'high' : 'medium'
                });
                
                // Update twin state
                const updated = twinStore.updateShipment(shipment.id, {
                    status: 'DELAYED',
                    riskScore: disruption.risk_score,
                    resilienceScore: Math.max(0, 100 - disruption.risk_score)
                });
                io.emit('shipment-updated', updated);
                io.emit('alert-new', twinStore.getAlerts().slice(-1)[0]);
            } else {
                // Normal progress simulation
                // For demo, just update "lastUpdate"
                io.emit('shipment-updated', shipment);
            }
        } catch (e) {
            // AI service might be down
        }
    }
}, 5000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`CIS Server active on port ${PORT}`);
});
