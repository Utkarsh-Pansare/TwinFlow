const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { queryRequestSchema } = require('../validators');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const ShipmentTwin = require('../models/ShipmentTwin');
const { getIo } = require('../sockets/twinSocket');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.post('/', async (req, res) => {
  try {
    const { query } = queryRequestSchema.parse(req.body);

    // 1. Plan (Gemini)
    const planResponse = await axios.post(`${AI_SERVICE_URL}/plan`, { query }, { timeout: 15000 });
    const plan = planResponse.data;

    // 2. Resolve origin and destination via Digipin
    const originResponse = await axios.post(`${AI_SERVICE_URL}/digipin/resolve`, { address: plan.origin });
    const originData = originResponse.data;

    const destResponse = await axios.post(`${AI_SERVICE_URL}/digipin/resolve`, { address: plan.destination });
    const destData = destResponse.data;

    const shipmentId = `SHP-${uuidv4().substring(0, 6).toUpperCase()}`;

    const nodes = [
      { id: 'origin', lat: originData.lat, lng: originData.lng },
      { id: 'hub_nagpur', lat: 21.1458, lng: 79.0882 }, // Using Nagpur as a static middle node for demo
      { id: 'dest', lat: destData.lat, lng: destData.lng }
    ];

    // 3. Optimize (OR-Tools)
    const optimizeResponse = await axios.post(`${AI_SERVICE_URL}/optimize`, {
      shipment_id: shipmentId,
      nodes,
      constraints: {
        deadline_h: plan.deadline_hours,
        max_cost_inr: plan.max_cost_inr,
        forbidden_ids: []
      }
    });
    const optimizeResult = optimizeResponse.data;

    // Extract names for route array
    const names = [plan.origin, 'Hub (Nagpur)', plan.destination];

    // 4. Score (Resilience)
    const scoreResponse = await axios.post(`${AI_SERVICE_URL}/score`, {
      route: names,
      disruptions: [],
      weather_severity: 0.1,
      congestion_level: 0.2
    });
    const scoreResult = scoreResponse.data;

    // 5. Build and save ShipmentTwin
    const newShipment = new ShipmentTwin({
      shipmentId,
      origin: plan.origin,
      destination: plan.destination,
      status: 'Planned',
      mode: plan.preferred_mode || 'road',
      currentLocation: { lat: originData.lat, lng: originData.lng },
      route: names,
      route_legs: optimizeResult.legs,
      resilience: {
        score: scoreResult.score
      },
      explanation: plan.summary,
      alerts: []
    });

    await newShipment.save();

    // 6. Broadcast via Socket
    const io = getIo();
    if (io) {
      const allShipments = await ShipmentTwin.find().lean();
      const overviewPayload = allShipments.map(s => ({
          shipmentId: s.shipmentId,
          status: s.status,
          resilience: s.resilience,
          currentLocation: s.currentLocation,
          route: s.route
      }));
      io.emit('overview:update', overviewPayload);

      const payload = {
        shipmentId: newShipment.shipmentId,
        status: newShipment.status,
        resilience: newShipment.resilience,
        currentLocation: newShipment.currentLocation,
        route: newShipment.route
      };
      io.to(shipmentId).emit('twin:update', payload);
    }

    res.json({
      shipmentId,
      route: names,
      explanation: plan.summary,
      resilienceScore: scoreResult.score,
      digipinDestination: destData.digipin,
      legs: optimizeResult.legs,
      plan: plan,
      disruptionRisk: scoreResult.disruptionRisk,
      recommendation: scoreResult.disruptionRisk && scoreResult.disruptionRisk.probability > 0.6 ? "Consider alternative mode" : "Proceed with caution"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error processing query:', error.message);
    res.status(500).json({ error: 'Failed to process natural language query.' });
  }
});

module.exports = router;
