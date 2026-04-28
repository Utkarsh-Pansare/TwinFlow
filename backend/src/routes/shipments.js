const express = require('express');
const router = express.Router();
const ShipmentTwin = require('../models/ShipmentTwin');
const { addReplanJob } = require('../queue/replanQueue');
const { replanRequestSchema } = require('../validators');
const { z } = require('zod');

// 1. GET /shipments
router.get('/', async (req, res) => {
  const shipments = await ShipmentTwin.find().lean();
  res.json(shipments);
});

// 2. GET /shipments/:id
router.get('/:id', async (req, res) => {
  const shipment = await ShipmentTwin.findOne({ shipmentId: req.params.id });
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(shipment);
});

// 3. POST /shipments/:id/replan
router.post('/:id/replan', async (req, res) => {
  try {
    const { shipmentId } = replanRequestSchema.parse({ shipmentId: req.params.id });
    
    // Ensure it exists
    const exists = await ShipmentTwin.exists({ shipmentId });
    if (!exists) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const job = await addReplanJob(shipmentId);
    
    res.json({
      queued: true,
      jobId: job.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    throw error;
  }
});

const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// 4. POST /shipments/:id/deliver
router.post('/:id/deliver', async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const shipment = await ShipmentTwin.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    shipment.status = 'DELIVERED';
    await shipment.save();

    // Calculate totals for ML feedback
    const totalDistKm = shipment.route_legs.reduce((sum, leg) => sum + (leg.distanceMeters || 0), 0) / 1000;
    const totalDurMin = shipment.route_legs.reduce((sum, leg) => sum + (leg.durationSeconds || 0), 0) / 60;
    const costInr = totalDistKm * 50;

    // Send to AI Service /learn
    try {
      await axios.post(`${AI_SERVICE_URL}/learn`, {
        route: shipment.route,
        final_outcome_score: shipment.resilience.score,
        disruptions: shipment.alerts.map(a => a.message),
        total_distance_km: totalDistKm,
        total_eta_minutes: totalDurMin,
        cost_inr: costInr,
        mode: shipment.mode
      });
      console.log(`[Learn] Submitted feedback for ${shipmentId}`);
    } catch (aiErr) {
      console.error(`[Learn] Failed to submit feedback for ${shipmentId}:`, aiErr.message);
    }

    const { getIo } = require('../sockets/twinSocket');
    const io = getIo();
    if (io) {
      const payload = {
        shipmentId: shipment.shipmentId,
        status: shipment.status,
        resilience: shipment.resilience,
        currentLocation: shipment.currentLocation,
        route: shipment.route
      };
      io.to(shipmentId).emit('twin:update', payload);
      const allShipments = await ShipmentTwin.find().lean();
      io.emit('overview:update', allShipments.map(s => ({
          shipmentId: s.shipmentId, status: s.status, resilience: s.resilience, currentLocation: s.currentLocation, route: s.route
      })));
    }

    res.json({ success: true, status: 'DELIVERED' });
  } catch (error) {
    console.error('Error delivering shipment:', error);
    res.status(500).json({ error: 'Failed to deliver shipment' });
  }
});

module.exports = router;
