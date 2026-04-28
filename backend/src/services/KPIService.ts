import { shipmentRepository } from '../repositories/ShipmentRepository';
import { redis, getCacheKey, getCacheTTL } from '../lib/redis';

export class KPIService {
    async getShipmentKPIs() {
        const cacheKey = getCacheKey('kpi', 'shipments');

        // Try cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Get all shipments
        const shipments = await shipmentRepository.findAll({ limit: 10000 });

        // Calculate KPIs based on status and mode
        const kpis = {
            oceanLateDeparture: 0,
            oceanLateDischarge: 0,
            oceanEtaLate: 0,
            truckEtaLate: 0,
            truckEtaEarly: 0,
        };

        shipments.forEach((ship) => {
            // Ocean KPIs
            if (ship.mode === 'OCEAN') {
                // Count late arrivals
                if (ship.status === 'LATE') {
                    kpis.oceanEtaLate++;
                }

                // Simulate late departure (based on random factor)
                if (ship.actualArrival && ship.eta) {
                    const daysDifference = Math.floor(
                        (ship.actualArrival.getTime() - ship.eta.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (daysDifference > 2) {
                        kpis.oceanLateDeparture++;
                    }
                    if (daysDifference > 1) {
                        kpis.oceanLateDischarge++;
                    }
                } else if (Math.random() > 0.7) {
                    kpis.oceanLateDeparture++;
                }
            }

            // Truckload KPIs
            if (ship.mode === 'TRUCKLOAD') {
                if (ship.status === 'LATE') {
                    kpis.truckEtaLate++;
                }
                if (ship.status === 'EARLY') {
                    kpis.truckEtaEarly++;
                }
            }
        });

        const result = {
            oceanLateDeparture: kpis.oceanLateDeparture,
            oceanLateDischarge: kpis.oceanLateDischarge,
            oceanEtaLate: kpis.oceanEtaLate,
            truckloadEtaLate: kpis.truckEtaLate,
            truckloadEtaEarly: kpis.truckEtaEarly,
        };

        // Cache result
        await redis.setex(cacheKey, getCacheTTL(), JSON.stringify(result));

        return result;
    }

    /**
     * Calculate operational efficiency score (0-100)
     */
    async getEfficiencyScore(): Promise<number> {
        const kpis = await this.getShipmentKPIs();
        const shipments = await shipmentRepository.findAll({ limit: 10000 });

        // Base score
        let score = 80;

        // Reduce score based on delays
        const totalShipments = shipments.length || 1;
        const latePercentage = ((kpis.oceanEtaLate + kpis.truckloadEtaLate) / totalShipments) * 100;
        score -= latePercentage * 0.5;

        // Add bonus for early shipments
        const earlyPercentage = (kpis.truckloadEtaEarly / totalShipments) * 100;
        score += Math.min(earlyPercentage * 0.2, 10);

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Get on-time performance percentage
     */
    async getOnTimePerformance(): Promise<number> {
        const shipments = await shipmentRepository.findAll({ limit: 10000 });

        if (shipments.length === 0) return 0;

        const onTimeCount = shipments.filter((s) => s.status === 'ON_TIME').length;
        return Math.round((onTimeCount / shipments.length) * 100);
    }
}

export const kpiService = new KPIService();
