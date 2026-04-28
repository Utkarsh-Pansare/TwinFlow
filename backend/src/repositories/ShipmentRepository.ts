import { prisma } from '../lib/prisma';
import { ShipmentStatus, TransportMode } from '@prisma/client';

export interface ShipmentFilters {
    status?: ShipmentStatus;
    mode?: TransportMode;
    limit?: number;
    offset?: number;
    searchQuery?: string;
}

export class ShipmentRepository {
    async findAll(filters: ShipmentFilters = {}) {
        const { status, mode, limit = 50, offset = 0, searchQuery } = filters;

        return prisma.shipment.findMany({
            where: {
                AND: [
                    status ? { status } : {},
                    mode ? { mode } : {},
                    searchQuery
                        ? {
                            OR: [
                                { referenceNo: { contains: searchQuery, mode: 'insensitive' } },
                                { origin: { contains: searchQuery, mode: 'insensitive' } },
                                { destination: { contains: searchQuery, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                ],
            },
            include: {
                milestones: true,
                demurrage: true,
                alerts: { where: { isResolved: false } },
            },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        return prisma.shipment.findUnique({
            where: { id },
            include: {
                milestones: true,
                demurrage: true,
                alerts: true,
                snapshots: { orderBy: { snapshotDate: 'desc' }, take: 10 },
            },
        });
    }

    async create(data: {
        referenceNo: string;
        origin: string;
        destination: string;
        originLat?: number;
        originLng?: number;
        destLat?: number;
        destLng?: number;
        mode: TransportMode;
        eta: Date;
        carrier?: string;
    }) {
        return prisma.shipment.create({ data });
    }

    async updateStatus(id: string, status: ShipmentStatus, actualArrival?: Date) {
        return prisma.shipment.update({
            where: { id },
            data: {
                status,
                actualArrival: actualArrival || undefined,
                updatedAt: new Date(),
            },
        });
    }

    async count(filters: Omit<ShipmentFilters, 'limit' | 'offset'> = {}) {
        const { status, mode } = filters;
        return prisma.shipment.count({
            where: {
                AND: [status ? { status } : {}, mode ? { mode } : {}],
            },
        });
    }

    async countByStatus() {
        return prisma.shipment.groupBy({
            by: ['status'],
            _count: true,
        });
    }

    async countByMode() {
        return prisma.shipment.groupBy({
            by: ['mode'],
            _count: true,
        });
    }

    async getGroupedByLocation() {
        const shipments = await prisma.shipment.findMany({
            where: { originLat: { not: null }, originLng: { not: null } },
            select: {
                origin: true,
                originLat: true,
                originLng: true,
                status: true,
            },
        });

        // Group by location
        const grouped = new Map<string, any>();
        shipments.forEach((ship) => {
            const key = `${ship.originLat},${ship.originLng}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    lat: ship.originLat,
                    lng: ship.originLng,
                    location: ship.origin,
                    count: 0,
                    breakdown: {
                        early: 0,
                        onTime: 0,
                        late: 0,
                        unknown: 0,
                    },
                });
            }
            const data = grouped.get(key);
            data.count++;
            if (ship.status === 'EARLY') data.breakdown.early++;
            else if (ship.status === 'ON_TIME') data.breakdown.onTime++;
            else if (ship.status === 'LATE') data.breakdown.late++;
            else data.breakdown.unknown++;
        });

        return Array.from(grouped.values());
    }
}

export const shipmentRepository = new ShipmentRepository();
