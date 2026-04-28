import { prisma } from '../lib/prisma';
import { DemurragePeriod } from '@prisma/client';

export class DemurrageRepository {
    async findByShipmentId(shipmentId: string) {
        return prisma.demurrage.findMany({
            where: { shipmentId },
            orderBy: { period: 'asc' },
        });
    }

    async create(data: {
        shipmentId: string;
        period: DemurragePeriod;
        containerCount: number;
        costPerDay: number;
        totalDays: number;
        totalCost: number;
        startDate: Date;
        endDate: Date;
    }) {
        return prisma.demurrage.create({ data });
    }

    async getAggregation() {
        const demurrages = await prisma.demurrage.findMany();

        const aggregated = {
            totalContainers: 0,
            totalCost: 0,
            breakdown: {
                free: { count: 0, cost: 0 },
                first: { count: 0, cost: 0 },
                second: { count: 0, cost: 0 },
                third: { count: 0, cost: 0 },
            },
        };

        demurrages.forEach((d) => {
            aggregated.totalContainers += d.containerCount;
            aggregated.totalCost += d.totalCost;

            if (d.period === 'FREE') {
                aggregated.breakdown.free.count += d.containerCount;
                aggregated.breakdown.free.cost += d.totalCost;
            } else if (d.period === 'FIRST') {
                aggregated.breakdown.first.count += d.containerCount;
                aggregated.breakdown.first.cost += d.totalCost;
            } else if (d.period === 'SECOND') {
                aggregated.breakdown.second.count += d.containerCount;
                aggregated.breakdown.second.cost += d.totalCost;
            } else if (d.period === 'THIRD') {
                aggregated.breakdown.third.count += d.containerCount;
                aggregated.breakdown.third.cost += d.totalCost;
            }
        });

        return aggregated;
    }

    async getCostByPeriod(period: DemurragePeriod) {
        const result = await prisma.demurrage.aggregate({
            _sum: { totalCost: true, containerCount: true },
            where: { period },
        });
        return result;
    }
}

export const demurrageRepository = new DemurrageRepository();
