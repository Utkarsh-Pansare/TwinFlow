import { Router, Request, Response, NextFunction } from 'express';
import { mapService } from '../services/MapService';

const router = Router();

/**
 * GET /api/map/shipments
 * Get shipment clusters for map visualization
 */
router.get('/shipments', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const markers = await mapService.getDefaultMarkers();

        res.json({
            status: 'success',
            data: markers,
            count: markers.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/map/clusters
 * Get actual geo-clustered data
 */
router.get('/clusters', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clusters = await mapService.getShipmentClusters();

        res.json({
            status: 'success',
            data: clusters,
            count: clusters.length,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
