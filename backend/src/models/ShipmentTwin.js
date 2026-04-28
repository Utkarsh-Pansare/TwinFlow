const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const AlertSchema = new mongoose.Schema({
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'high', 'critical', 'predictive'], required: true },
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  probability: { type: Number }
}, { _id: false });

const RouteLegSchema = new mongoose.Schema({
  from: LocationSchema,
  to: LocationSchema,
  fromName: { type: String },
  toName: { type: String },
  mode: { type: String },
  distanceMeters: { type: Number },
  durationSeconds: { type: Number },
  polyline: { type: String }
}, { _id: false });

const ShipmentTwinSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true, index: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  mode: { type: String, default: 'road' },
  currentLocation: LocationSchema,
  route: [{ type: String }],
  route_legs: [RouteLegSchema],
  resilience: {
    score: { type: Number, default: 100 }
  },
  alerts: [AlertSchema],
  explanation: { type: String },
  co2_kg: { type: Number, default: 0 },
  digipin: { type: String },
  execution_status: { type: String, enum: ['pending', 'in_transit', 'disrupted_in_execution', 'delivered'], default: 'pending' },
  delivery_completed_at: { type: Date },
  loop_b_attempts: { type: Number, default: 0 }
}, { timestamps: true });

const ShipmentTwin = mongoose.model('ShipmentTwin', ShipmentTwinSchema);

module.exports = ShipmentTwin;
