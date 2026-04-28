const { processReplan } = require('./worker');

const addReplanJob = async (shipmentId) => {
  console.log(`[Queue] Bypassing BullMQ, triggering replan for ${shipmentId} directly...`);
  // Run asynchronously in the background
  processReplan(shipmentId).catch(err => console.error(err));
  return { id: 'mock-job-id' };
};

module.exports = { addReplanJob };
