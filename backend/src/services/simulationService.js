/**
 * simulationService.js — Background loops for TwinFlow
 *
 * Loop 1 — startSimulationLoop()         every  5 s
 *   Simulates GPS movement, resilience drift, status transitions.
 *   Sets execution_status = 'in_transit' for 'In Transit' shipments.
 *
 * Loop 2 — startProactiveLoop()          every 15 s
 *   Proactively queues a replan when resilience drops below 60.
 *
 * Loop 3 — startExecutionMonitoringLoop()  every 15 s   ← NEW (Layer 6)
 *   Monitors in_transit shipments for mid-execution disruptions and deliveries.
 *   15 % → disruption_during_execution  → re-run full LangGraph pipeline
 *    5 % → delivery_completed           → mark delivered, broadcast events
 *   rest → move currentLocation slightly (continuous movement sim)
 */

const ShipmentTwin  = require('../models/ShipmentTwin');
const { getIo }     = require('../sockets/twinSocket');
const { addReplanJob }  = require('../queue/replanQueue');
const { processReplan } = require('../queue/worker');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Helper: build a slim twin:update payload ───────────────────────────────────
const buildPayload = (shipment) => ({
  shipmentId:       shipment.shipmentId,
  status:           shipment.status,
  resilience:       shipment.resilience,
  currentLocation:  shipment.currentLocation,
  route:            shipment.route,
  co2_kg:           shipment.co2_kg,
  loop_b_attempts:  shipment.loop_b_attempts,
  execution_status: shipment.execution_status,
  alerts:           shipment.alerts,
});

// ═══════════════════════════════════════════════════════════════════════════════
// Loop 1 — Simulation (movement + resilience drift)
// ═══════════════════════════════════════════════════════════════════════════════

const startSimulationLoop = () => {
  setInterval(async () => {
    try {
      const shipments = await ShipmentTwin.find({ status: { $ne: 'DELIVERED' } });
      const now = new Date();
      const io  = getIo();

      for (const shipment of shipments) {
        if (!shipment.currentLocation) continue;

        // Simulate GPS movement
        shipment.currentLocation.lat += (Math.random() - 0.5) * 0.01;
        shipment.currentLocation.lng += (Math.random() - 0.5) * 0.01;
        shipment.updatedAt = now;

        // Keep execution_status in sync with logical status
        if (shipment.status === 'In Transit' && shipment.execution_status === 'pending') {
          shipment.execution_status = 'in_transit';
        }

        // Random resilience drift (25 % chance each tick)
        if (Math.random() > 0.75) {
          shipment.resilience.score = Math.max(0, Math.min(100,
            shipment.resilience.score + (Math.random() - 0.5) * 12,
          ));

          if (shipment.resilience.score < 50) {
            shipment.status = 'Delayed';
            const newAlert = {
              message:   `Risk escalation for ${shipment.shipmentId} — resilience ${Math.round(shipment.resilience.score)}%`,
              severity:  shipment.resilience.score < 30 ? 'critical' : 'high',
              timestamp: now,
              type:      'disruption',
            };
            shipment.alerts.push(newAlert);

            if (io) {
              io.emit('alert:new', { ...newAlert, shipmentId: shipment.shipmentId });
            }
          } else {
            if (shipment.status === 'Delayed') {
              shipment.status = 'In Transit';
            }
          }
        }

        await shipment.save();

        if (io) {
          io.to(shipment.shipmentId).emit('twin:update', buildPayload(shipment));
        }
      }

      // Broadcast overview to all connected clients
      if (io) {
        const allShipments = await ShipmentTwin.find().lean();
        io.emit('overview:update', allShipments.map((s) => ({
          shipmentId:       s.shipmentId,
          status:           s.status,
          resilience:       s.resilience,
          currentLocation:  s.currentLocation,
          route:            s.route,
          execution_status: s.execution_status,
        })));
      }
    } catch (err) {
      console.error('[SimLoop] Error:', err.message);
    }
  }, 5000);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Loop 2 — Proactive replan (resilience < 60)
// ═══════════════════════════════════════════════════════════════════════════════

const startProactiveLoop = () => {
  setInterval(async () => {
    try {
      const shipments = await ShipmentTwin.find({ status: { $ne: 'DELIVERED' } });

      for (const shipment of shipments) {
        if (shipment.resilience.score < 60) {
          console.log(`🛡️ Queueing proactive replan for ${shipment.shipmentId}`);
          await addReplanJob(shipment.shipmentId);
        }
      }
    } catch (err) {
      console.error('[ProactiveLoop] Error:', err.message);
    }
  }, 15000);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Loop 3 — Layer 6: Execution Monitoring
// ═══════════════════════════════════════════════════════════════════════════════

const startExecutionMonitoringLoop = () => {
  setInterval(async () => {
    try {
      // Only watch shipments that are actively in transit
      const shipments = await ShipmentTwin.find({ execution_status: 'in_transit' });

      if (shipments.length === 0) return;

      const io = getIo();

      for (const shipment of shipments) {
        const rand = Math.random();

        // ── 15 %: disruption during execution ──────────────────────────────
        if (rand < 0.15) {
          console.log(
            `[Layer6] ⚠️  Disruption during execution detected — ${shipment.shipmentId}`,
          );

          shipment.execution_status = 'disrupted_in_execution';
          shipment.alerts.push({
            message:   'Layer 6: Disruption detected during execution — re-running agent pipeline',
            severity:  'critical',
            type:      'execution_disruption',
            timestamp: new Date(),
          });
          await shipment.save();

          // Notify frontend immediately so the dashboard reflects disruption
          if (io) {
            io.to(shipment.shipmentId).emit('twin:update', buildPayload(shipment));
          }

          // Re-run the full LangGraph pipeline (blocking per shipment is fine;
          // each iteration is independent and the loop is async)
          try {
            await processReplan(shipment.shipmentId);
            console.log(`[Layer6] ✅  Replan complete for ${shipment.shipmentId}`);
          } catch (replanErr) {
            console.error(
              `[Layer6] Replan failed for ${shipment.shipmentId}:`, replanErr.message,
            );
          }

          // Restore in_transit regardless of replan success (keep twin alive)
          const refreshed = await ShipmentTwin.findOne({ shipmentId: shipment.shipmentId });
          if (refreshed && refreshed.execution_status !== 'delivered') {
            refreshed.execution_status = 'in_transit';
            await refreshed.save();

            if (io) {
              io.to(shipment.shipmentId).emit('twin:update', buildPayload(refreshed));
            }
          }

        // ── 5 %: delivery completed ─────────────────────────────────────────
        } else if (rand < 0.20) {
          console.log(`[Layer6] 📦  Delivery complete — ${shipment.shipmentId}`);

          shipment.execution_status    = 'delivered';
          shipment.delivery_completed_at = new Date();
          shipment.status              = 'Delivered';
          shipment.alerts.push({
            message:   `Layer 6: Shipment ${shipment.shipmentId} delivered successfully`,
            severity:  'info',
            type:      'delivery',
            timestamp: new Date(),
          });
          await shipment.save();

          if (io) {
            // 1. Targeted update to shipment subscribers
            io.to(shipment.shipmentId).emit('twin:update', {
              ...buildPayload(shipment),
              execution_status:       'delivered',
              delivery_completed_at:  shipment.delivery_completed_at,
            });

            // 2. Broadcast delivery event to all connected clients
            io.emit('delivery:complete', {
              shipmentId:  shipment.shipmentId,
              timestamp:   shipment.delivery_completed_at,
            });
          }

        // ── 80 %: normal movement (already handled by sim loop; small nudge) ─
        } else {
          if (!shipment.currentLocation) continue;

          shipment.currentLocation.lat += (Math.random() - 0.5) * 0.005;
          shipment.currentLocation.lng += (Math.random() - 0.5) * 0.005;
          await shipment.save();

          if (io) {
            io.to(shipment.shipmentId).emit('twin:update', buildPayload(shipment));
          }
        }
      }
    } catch (err) {
      console.error('[Layer6] Execution monitoring error:', err.message);
    }
  }, 15000);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  startSimulationLoop,
  startProactiveLoop,
  startExecutionMonitoringLoop,
};
