const { z } = require('zod');

const queryRequestSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters long")
});

const replanRequestSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required")
});

module.exports = {
  queryRequestSchema,
  replanRequestSchema
};
