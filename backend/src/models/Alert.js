const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'high', 'critical', 'predictive'], required: true },
  type: { type: String, required: true },
  probability: { type: Number }
}, { timestamps: true });

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;
