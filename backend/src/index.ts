import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { notFoundHandler } from './middleware/notFoundHandler';
import shipmentRoutes from './routes/shipments';
import analyticsRoutes from './routes/analytics';
import mapRoutes from './routes/map';
import demoRoutes from './routes/demo';
import alertRoutes from './routes/alerts';
import kpiRoutes from './routes/kpi';

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        redis: 'connected',
    });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use(`${API_PREFIX}/shipments`, shipmentRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/map`, mapRoutes);
app.use(`${API_PREFIX}/demo`, demoRoutes);
app.use(`${API_PREFIX}/alerts`, alertRoutes);
app.use(`${API_PREFIX}/kpi`, kpiRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        console.log('✓ Database connected');

        // Test Redis connection (non-fatal)
        try {
            await redis.connect();
            await redis.ping();
            console.log('✓ Redis connected');
        } catch (redisErr) {
            console.warn('⚠ Redis unavailable — running without cache');
        }

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 TwinFlow Logistics Analytics API                      ║
║  📍 http://localhost:${PORT}                              ║
║  📡 API: http://localhost:${PORT}${API_PREFIX}            ║
║  🏥 Health: http://localhost:${PORT}/health               ║
║                                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                           ║
║  Database: PostgreSQL                                      ║
║  Cache: Redis                                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    await redis.disconnect();
    process.exit(0);
});

startServer();
