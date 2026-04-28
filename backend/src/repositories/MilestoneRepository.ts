import { prisma } from '../lib/prisma';
import { MilestoneType } from '@prisma/client';

export class MilestoneRepository {
    async findByShipmentId(shipmentId: string) {
        return prisma.milestone.findMany({
            where: { shipmentId },
            orderBy: { type: 'asc' },
        });
    }

    async create(data: {
        shipmentId: string;
        type: MilestoneType;
        completed?: boolean;
        timestamp?: Date;
    }) {
        return prisma.milestone.create({ data });
    }

    async markComplete(id: string, timestamp: Date = new Date()) {
        return prisma.milestone.update({
            where: { id },
            data: { completed: true, timestamp },
        });
    }

    async getCompletionRateByType() {
        const totals = await prisma.milestone.groupBy({
            by: ['type'],
            _count: true,
        });

        const completed = await prisma.milestone.groupBy({
            by: ['type'],
            _count: true,
            where: { completed: true },
        });

        const completedMap = new Map(completed.map((c) => [c.type, c._count]));
        const result = totals.map((t) => ({
            type: t.type,
            total: t._count,
            completed: completedMap.get(t.type) || 0,
            percentage: ((completedMap.get(t.type) || 0) / t._count) * 100,
        }));

        return result;
    }

    async getCompletionPercentage(): Promise<Record<string, number>> {
        const rates = await this.getCompletionRateByType();
        const result: Record<string, number> = {};

        rates.forEach((rate) => {
            const stageNames: Record<string, string> = {
                DEPART_ORIGIN: 'Depart Origin',
                ARRIVE_TS: 'Arrive TS',
                DEPART_TS: 'Depart TS',
                ARRIVE_DESTINATION: 'Arrive Destination',
            };
            result[stageNames[rate.type] || rate.type] = Math.round(rate.percentage);
        });

        return result;
    }
}

export const milestoneRepository = new MilestoneRepository();
