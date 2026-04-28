import { shipmentRepository } from '../repositories/ShipmentRepository';
import { milestoneRepository } from '../repositories/MilestoneRepository';
import { demurrageRepository } from '../repositories/DemurrageRepository';
import { redis, getCacheKey, getCacheTTL } from '../lib/redis';
import { ShipmentStatus, TransportMode } from '@prisma/client';

export class ShipmentService {
    async getOverview() {
        const cacheKey = getCacheKey('shipment', 'overview');

        // Try cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Get counts by status
        const statusCounts = await shipmentRepository.countByStatus();

        const breakdown = {
            early: 0,
            onTime: 0,
            late: 0,
            unknown: 0,
        };

        statusCounts.forEach((item) => {
            if (item.status === 'EARLY') breakdown.early = item._count;
            else if (item.status === 'ON_TIME') breakdown.onTime = item._count;
            else if (item.status === 'LATE') breakdown.late = item._count;
            else if (item.status === 'UNKNOWN') breakdown.unknown = item._count;
        });

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

        const result = {
            total,
            breakdown,
        };

        // Cache result
        await redis.setex(cacheKey, getCacheTTL(), JSON.stringify(result));

        return result;
    }

    async search(query: string, limit = 50) {
        return shipmentRepository.findAll({
            searchQuery: query,
            limit,
        });
    }

    async getAll(filters: any = {}) {
        return shipmentRepository.findAll(filters);
    }

    async getById(id: string) {
        return shipmentRepository.findById(id);
    }

    async getKPIMetrics() {
        // Get shipments with necessary data
        const shipments = await shipmentRepository.findAll({ limit: 10000 });

        // Calculate KPIs
        const kpis = {
            oceanLateDeparture: 0,
            oceanLateDischarge: 0,
            oceanEtaLate: 0,
            truckEtaLate: 0,
            truckEtaEarly: 0,
        };

        shipments.forEach((ship) => {
            if (ship.mode === 'OCEAN') {
                if (ship.status === 'LATE') kpis.oceanEtaLate++;
                // Simulate late departure/discharge
                if (Math.random() > 0.8) kpis.oceanLateDeparture++;
                if (Math.random() > 0.85) kpis.oceanLateDischarge++;
            }

            if (ship.mode === 'TRUCKLOAD') {
                if (ship.status === 'LATE') kpis.truckEtaLate++;
                if (ship.status === 'EARLY') kpis.truckEtaEarly++;
            }
        });

        return kpis;
    }
}

export const shipmentService = new ShipmentService();
