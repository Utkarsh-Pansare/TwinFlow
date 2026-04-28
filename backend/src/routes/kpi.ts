import { Router, Request, Response, NextFunction } from 'express';
import { kpiService } from '../services/KPIService';

const router = Router();

/**
 * GET /api/kpi/shipments
 * Get KPI metrics for shipments
 */
router.get('/shipments', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kpis = await kpiService.getShipmentKPIs();

        res.json({
            status: 'success',
            data: {
                oceanLateDeparture: kpis.oceanLateDeparture,
                oceanLateDischarge: kpis.oceanLateDischarge,
                oceanEtaLate: kpis.oceanEtaLate,
                truckloadEtaLate: kpis.truckloadEtaLate,
                truckloadEtaEarly: kpis.truckloadEtaEarly,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/kpi/efficiency
 * Get operational efficiency score
 */
router.get('/efficiency', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const score = await kpiService.getEfficiencyScore();

        res.json({
            status: 'success',
            data: {
                efficiency: score,
                status: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor',
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/kpi/on-time-performance
 * Get on-time performance percentage
 */
router.get('/on-time-performance', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const percentage = await kpiService.getOnTimePerformance();

        res.json({
            status: 'success',
            data: {
                onTimePercentage: percentage,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
