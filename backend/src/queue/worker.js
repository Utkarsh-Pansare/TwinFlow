const axios        = require('axios');
const ShipmentTwin = require('../models/ShipmentTwin');
const { getIo }    = require('../sockets/twinSocket');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const processReplan = async (shipmentId) => {
  console.log(`[Worker] Processing replan for shipment: ${shipmentId}`);

  try {
    const shipment = await ShipmentTwin.findOne({ shipmentId });
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    // Call Python AI Service — /agents/run (new LangGraph pipeline)
    const response = await axios.post(
      `${AI_SERVICE_URL}/agents/run`,
      { shipment_id: shipmentId, twin_data: shipment.toObject() },
      { timeout: 30000 },
    );

    const result = response.data;

    // ── Persist core fields ───────────────────────────────────────────────
    if (result.selected_route)              shipment.route              = result.selected_route;
    if (result.resilience_score !== undefined) shipment.resilience.score = result.resilience_score;
    if (result.gemini_explanation)          shipment.explanation        = result.gemini_explanation;
    if (result.route_legs)                  shipment.route_legs         = result.route_legs;

    // ── New fields from LangGraph SupplyChainState ────────────────────────
    if (typeof result.co2_kg === 'number') {
      shipment.co2_kg = result.co2_kg;
    }
    if (typeof result.loop_b_attempts === 'number') {
      shipment.loop_b_attempts = result.loop_b_attempts;
    }
    if (result.loop_b_attempts > 0) {
      shipment.alerts.push({
        message:   'Loop B: No valid routes found, re-generating alternatives',
        severity:  'warning',
        type:      'loop_b',
        timestamp: new Date(),
      });
    }

    // Push learning-agent alerts returned by the pipeline
    if (result.alerts && Array.isArray(result.alerts)) {
      result.alerts.forEach((alertText) => {
        shipment.alerts.push({
          message:   alertText,
          severity:  'high',
          type:      'replan',
          timestamp: new Date(),
        });
      });
    }

    shipment.status = 'AI Optimized';
    await shipment.save();

    // ── Broadcast update ──────────────────────────────────────────────────
    const io = getIo();
    if (io) {
      const payload = {
        shipmentId:      shipment.shipmentId,
        status:          shipment.status,
        resilience:      shipment.resilience,
        currentLocation: shipment.currentLocation,
        route:           shipment.route,
        co2_kg:          shipment.co2_kg,
        loop_b_attempts: shipment.loop_b_attempts,
      };
      io.to(shipmentId).emit('twin:update', payload);
    }

    console.log(`[Worker] Completed replan for shipment: ${shipmentId}`);
    return { success: true, shipmentId };

  } catch (error) {
    console.error(`[Worker] Failed replan for shipment ${shipmentId}:`, error.message);
    throw error;
  }
};

module.exports = { processReplan };
