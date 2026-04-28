import { alertRepository } from '../repositories/AlertRepository';
import { redis, getCacheKey, getCacheTTL } from '../lib/redis';
import { AlertSeverity } from '@prisma/client';

export class AlertService {
    async getTrendingAlerts(limit = 5) {
        const cacheKey = getCacheKey('alerts', 'trending');

        // Try cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const alerts = await alertRepository.getTrending(limit);

        const result = alerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            createdAt: alert.createdAt,
            shipmentRef: alert.shipment?.referenceNo,
        }));

        // Cache result
        await redis.setex(cacheKey, getCacheTTL(), JSON.stringify(result));

        return result;
    }

    async getAllAlerts(limit = 50, offset = 0) {
        return alertRepository.findAll(limit, offset);
    }

    async createAlert(data: {
        shipmentId?: string;
        title: string;
        description: string;
        severity: AlertSeverity;
    }) {
        const alert = await alertRepository.create(data);

        // Invalidate cache
        await redis.del(getCacheKey('alerts', 'trending'));

        return alert;
    }

    async resolveAlert(id: string) {
        const alert = await alertRepository.markResolved(id);

        // Invalidate cache
        await redis.del(getCacheKey('alerts', 'trending'));

        return alert;
    }

    /**
     * Simulate a disruption alert (Red Sea incident)
     */
    async createDisruptionAlert() {
        return this.createAlert({
            title: 'Red Sea Disruption Alert',
            description: 'Significant shipping disruptions detected in Red Sea region. ETA delays expected for Ocean freight shipments. Estimated impact: 2-5 days delay.',
            severity: 'HIGH' as AlertSeverity,
        });
    }
}

export const alertService = new AlertService();
