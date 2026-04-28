/**
 * internal.js — Internal / demo-only routes
 *
 * POST /internal/inject-disruption
 *   Injects a forced disruption into the AI pipeline, persists the result
 *   to MongoDB, and broadcasts real-time socket events.
 */

const express        = require('express');
const router         = express.Router();
const axios          = require('axios');
const ShipmentTwin   = require('../models/ShipmentTwin');
const { getIo }      = require('../sockets/twinSocket');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── POST /internal/inject-disruption ─────────────────────────────────────────

router.post('/inject-disruption', async (req, res) => {
  const { shipmentId, type, severity } = req.body;

  // ── Validate input ─────────────────────────────────────────────────────────
  if (!shipmentId || typeof shipmentId !== 'string') {
    return res.status(400).json({ error: 'shipmentId is required and must be a string' });
  }
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'type is required (e.g. "weather", "congestion")' });
  }
  if (severity === undefined || isNaN(Number(severity))) {
    return res.status(400).json({ error: 'severity is required and must be a number (0–10)' });
  }

  console.log(`[InjectDisruption] shipment=${shipmentId}  type=${type}  severity=${severity}`);

  // ── Fetch shipment from MongoDB ────────────────────────────────────────────
  const shipment = await ShipmentTwin.findOne({ shipmentId });
  if (!shipment) {
    return res.status(404).json({ error: `Shipment ${shipmentId} not found` });
  }

  // ── Call Python AI service ─────────────────────────────────────────────────
  let result;
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/internal/inject-disruption`,
      {
        shipment_id: shipmentId,
        type,
        severity: Number(severity),
        twin_data: {
          origin:          shipment.origin,
          destination:     shipment.destination,
          deadline_hours:  48,
          mode:            shipment.mode || 'road',
          currentLocation: shipment.currentLocation
            ? { lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }
            : { lat: 19.076, lng: 72.877 },
        },
      },
      { timeout: 30000 },
    );
    result = data;
    console.log(
      `[InjectDisruption] AI result  route=${result.selected_route}  ` +
      `resilience=${result.resilience_score}  loop_b=${result.loop_b_attempts}`,
    );
  } catch (aiErr) {
    console.error('[InjectDisruption] AI service error:', aiErr.message);
    return res.status(502).json({
      error: 'AI service unavailable',
      detail: aiErr.message,
    });
  }

  // ── Persist updated twin to MongoDB ───────────────────────────────────────
  shipment.resilience.score = result.resilience_score ?? shipment.resilience.score;

  if (Array.isArray(result.selected_route) && result.selected_route.length > 0) {
    shipment.route = result.selected_route;
  }

  if (result.gemini_explanation) {
    shipment.explanation = result.gemini_explanation;
  }

  if (typeof result.co2_kg === 'number') {
    shipment.co2_kg = result.co2_kg;
  }

  if (result.loop_b_attempts > 0) {
    shipment.loop_b_attempts = result.loop_b_attempts;
  }

  // Push injected-disruption alert
  shipment.alerts.push({
    message:   `INJECTED: ${type} severity ${severity}`,
    severity:  'critical',
    type:      'disruption',
    timestamp: new Date(),
  });

  // Push any learning-agent alerts returned by the pipeline
  if (Array.isArray(result.alerts)) {
    result.alerts.forEach((alertText) => {
      if (typeof alertText === 'string') {
        shipment.alerts.push({
          message:   alertText,
          severity:  'warning',
          type:      'replan',
          timestamp: new Date(),
        });
      }
    });
  }

  shipment.status = 'Disruption Detected';
  await shipment.save();

  // ── Broadcast socket events ───────────────────────────────────────────────
  const io = getIo();
  if (io) {
    const updatedPayload = {
      shipmentId:        shipment.shipmentId,
      status:            shipment.status,
      resilience:        shipment.resilience,
      currentLocation:   shipment.currentLocation,
      route:             shipment.route,
      explanation:       shipment.explanation,
      co2_kg:            shipment.co2_kg,
      loop_b_attempts:   shipment.loop_b_attempts,
      alerts:            shipment.alerts,
      risk_detected:     result.risk_detected,
      disruption_event:  result.disruption_event,
    };

    // 1. Notify subscribers of this specific shipment
    io.to(shipmentId).emit('twin:update', updatedPayload);

    // 2. Broadcast injection event to all connected clients
    io.emit('disruption:injected', {
      shipmentId,
      type,
      severity: Number(severity),
      resilience_score: result.resilience_score,
      selected_route:   result.selected_route,
      co2_kg:           result.co2_kg,
      timestamp:        new Date().toISOString(),
    });

    console.log(`[InjectDisruption] Socket events emitted for ${shipmentId}`);
  }

  // ── Return updated shipment ───────────────────────────────────────────────
  res.json({
    success:  true,
    shipment: shipment.toObject(),
  });
});

module.exports = router;
