import { prisma } from '../lib/prisma';
import { AlertSeverity } from '@prisma/client';

export class AlertRepository {
    async findAll(limit = 50, offset = 0, unresolved = true) {
        return prisma.alert.findMany({
            where: unresolved ? { isResolved: false } : {},
            include: { shipment: { select: { referenceNo: true, status: true } } },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findBySeverity(severity: AlertSeverity) {
        return prisma.alert.findMany({
            where: { severity, isResolved: false },
            include: { shipment: { select: { referenceNo: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: {
        shipmentId?: string;
        title: string;
        description: string;
        severity: AlertSeverity;
    }) {
        return prisma.alert.create({ data });
    }

    async markResolved(id: string) {
        return prisma.alert.update({
            where: { id },
            data: { isResolved: true, resolvedAt: new Date() },
        });
    }

    async countByStatus() {
        return prisma.alert.groupBy({
            by: ['severity'],
            _count: true,
            where: { isResolved: false },
        });
    }

    async getTrending(limit = 5) {
        const alerts = await prisma.alert.findMany({
            where: { isResolved: false },
            include: { shipment: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return alerts;
    }
}

export const alertRepository = new AlertRepository();
