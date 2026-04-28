/**
 * twins.js — Digital Twin proxy & static data routes
 *
 * GET /twins/supplier           → proxy AI service GET /twins/supplier
 * GET /twins/financial/:id      → proxy AI service GET /twins/financial/{id}
 * GET /twins/order              → 2 hardcoded OrderTwin objects
 */

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── GET /twins/supplier ───────────────────────────────────────────────────────

router.get('/supplier', async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_SERVICE_URL}/twins/supplier`, {
      timeout: 8000,
    });
    res.json(data);
  } catch (err) {
    console.error('[/twins/supplier] AI service error:', err.message);
    // Graceful fallback — return hardcoded data so frontend never breaks
    res.json({
      suppliers: [
        {
          id:                'SUP-PUNE-001',
          name:              'Pune Auto Components',
          city:              'Pune',
          state:             'Maharashtra',
          lat:               18.5204,
          lng:               73.8567,
          reliability_score: 91,
          capacity_units:    1200,
          lead_time_days:    3,
          risk_flags:        [],
          status:            'active',
        },
        {
          id:                'SUP-DELHI-002',
          name:              'Delhi Industrial Supplies',
          city:              'Delhi',
          state:             'Delhi',
          lat:               28.6139,
          lng:               77.2090,
          reliability_score: 74,
          capacity_units:    950,
          lead_time_days:    5,
          risk_flags:        ['congestion_risk'],
          status:            'at_risk',
        },
        {
          id:                'SUP-CHENNAI-003',
          name:              'Chennai Textile Exports',
          city:              'Chennai',
          state:             'Tamil Nadu',
          lat:               13.0827,
          lng:               80.2707,
          reliability_score: 88,
          capacity_units:    800,
          lead_time_days:    4,
          risk_flags:        ['monsoon_exposure'],
          status:            'active',
        },
      ],
    });
  }
});

// ── GET /twins/financial/:shipmentId ─────────────────────────────────────────

router.get('/financial/:shipmentId', async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const { data } = await axios.get(
      `${AI_SERVICE_URL}/twins/financial/${encodeURIComponent(shipmentId)}`,
      { timeout: 8000 },
    );
    res.json(data);
  } catch (err) {
    console.error(`[/twins/financial/${shipmentId}] AI service error:`, err.message);
    // Graceful fallback
    const base    = 42000;
    const current = 47800;
    res.json({
      shipment_id:       shipmentId,
      currency:          'INR',
      base_cost_inr:     base,
      current_cost_inr:  current,
      cost_delta_inr:    current - base,
      cost_delta_pct:    parseFloat((((current - base) / base) * 100).toFixed(1)),
      margin_pct:        12.4,
      cost_delta_reason: 'Route changed from road to air due to weather disruption, +13.8% cost',
      insurance_inr:     1200,
      duties_inr:        3500,
      last_recalculated: new Date().toISOString(),
      risk_exposure_inr: parseFloat(((current - base) * 1.5).toFixed(2)),
    });
  }
});

// ── GET /twins/order ──────────────────────────────────────────────────────────

router.get('/order', async (req, res) => {
  res.json({
    orders: [
      {
        orderId:       'ORD-2026-001',
        shipmentId:    'SHP-MOCK1',
        customer:      'Tata Motors Ltd.',
        customerCity:  'Pune',
        priority:      'high',
        deadline:      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 h from now
        budget_inr:    55000,
        quantity:      240,
        product:       'Precision Auto Components',
        constraints:   ['temperature_controlled', 'fragile', 'deadline_critical'],
        status:        'in_transit',
        created_at:    new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        orderId:       'ORD-2026-002',
        shipmentId:    'SHP-MOCK2',
        customer:      'Flipkart Logistics',
        customerCity:  'Bangalore',
        priority:      'medium',
        deadline:      new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 h from now
        budget_inr:    28000,
        quantity:      1100,
        product:       'Consumer Electronics — Mixed SKU',
        constraints:   ['weather_sensitive', 'signature_required'],
        status:        'delayed',
        created_at:    new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      },
    ],
  });
});

module.exports = router;
