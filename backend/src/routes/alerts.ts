import { Router, Request, Response, NextFunction } from 'express';
import { alertService } from '../services/AlertService';
import { AlertSeverity } from '@prisma/client';

const router = Router();

/**
 * GET /api/alerts
 * Get trending alerts
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = 5 } = req.query;
        const alerts = await alertService.getTrendingAlerts(Number(limit));

        res.json({
            status: 'success',
            data: alerts,
            count: alerts.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shipmentId, title, description, severity = 'MEDIUM' } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                status: 'error',
                message: 'Title and description are required',
            });
        }

        const alert = await alertService.createAlert({
            shipmentId,
            title,
            description,
            severity: severity as AlertSeverity,
        });

        res.status(201).json({
            status: 'success',
            data: alert,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/alerts/disruption
 * Create a disruption alert (Red Sea example)
 */
router.post('/disruption', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alert = await alertService.createDisruptionAlert();

        res.status(201).json({
            status: 'success',
            data: alert,
            message: 'Disruption alert created',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/alerts/:id/resolve
 * Mark alert as resolved
 */
router.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const alert = await alertService.resolveAlert(id);

        res.json({
            status: 'success',
            data: alert,
            message: 'Alert marked as resolved',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
