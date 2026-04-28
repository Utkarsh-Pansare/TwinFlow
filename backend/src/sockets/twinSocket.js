const { Server } = require('socket.io');

let ioInstance;

const initTwinSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Strict contract: subscribe:shipment (shipmentId)
    socket.on('subscribe:shipment', (shipmentId) => {
      if (typeof shipmentId === 'string' && shipmentId.trim() !== '') {
        socket.join(shipmentId);
        console.log(`📡 Client ${socket.id} subscribed to ${shipmentId}`);
      }
    });

    socket.on('health:request', () => {
      socket.emit('health:status', {
         status: 'LIVE',
         lastHeartbeat: new Date(),
         aiServiceReachable: true // in a real app, query AI service
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return ioInstance;
};

const getIo = () => {
  if (!ioInstance) {
    console.warn('Socket.io instance not initialized yet.');
  }
  return ioInstance;
};

module.exports = { initTwinSocket, getIo };
