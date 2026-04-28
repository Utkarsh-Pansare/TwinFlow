const mongoose = require('mongoose');

const FinancialTwinSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  base_cost_inr: { type: Number },
  current_cost_inr: { type: Number },
  margin_pct: { type: Number },
  cost_delta_reason: { type: String },
  spot_rate_usd: { type: Number }
}, { timestamps: true });

const FinancialTwin = mongoose.model('FinancialTwin', FinancialTwinSchema);

module.exports = FinancialTwin;
