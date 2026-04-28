const mongoose = require('mongoose');

const OrderTwinSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  shipmentId: { type: String, ref: 'ShipmentTwin' },
  customer: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  deadline: { type: Date },
  budget_inr: { type: Number },
  constraints: [{ type: String }]
}, { timestamps: true });

const OrderTwin = mongoose.model('OrderTwin', OrderTwinSchema);

module.exports = OrderTwin;
