const mongoose = require('mongoose');

const SupplierTwinSchema = new mongoose.Schema({
  supplierId: { type: String, required: true, unique: true },
  name: { type: String },
  city: { type: String },
  reliability_score: { type: Number, default: 85 },
  capacity_available: { type: Number },
  risk_flags: [{ type: String }],
  historical_on_time_pct: { type: Number }
}, { timestamps: true });

const SupplierTwin = mongoose.model('SupplierTwin', SupplierTwinSchema);

module.exports = SupplierTwin;
