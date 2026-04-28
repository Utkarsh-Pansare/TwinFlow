import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/AnalyticsService';

const router = Router();

/**
 * GET /api/analytics/demurrage
 * Get demurrage charges analysis
 */
router.get('/demurrage', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const demurrage = await analyticsService.getDemurrageAnalytics();

        res.json({
            status: 'success',
            data: demurrage,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/milestones
 * Get milestone completeness
 */
router.get('/milestones', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const milestones = await analyticsService.getMilestoneAnalytics();

        res.json({
            status: 'success',
            data: milestones,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/predictions
 * Get prediction accuracy metrics
 */
router.get('/predictions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const predictions = await analyticsService.getPredictionAnalytics();

        res.json({
            status: 'success',
            data: predictions,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/latency
 * Get data latency reduction
 */
router.get('/latency', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const latency = await analyticsService.getLatencyAnalytics();

        res.json({
            status: 'success',
            data: latency,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
