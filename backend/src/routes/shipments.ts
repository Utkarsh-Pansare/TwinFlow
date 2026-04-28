import { Router, Request, Response, NextFunction } from 'express';
import { shipmentService } from '../services/ShipmentService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const SearchSchema = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().optional(),
});

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /api/shipments/overview
 * Get shipment status breakdown
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const overview = await shipmentService.getOverview();
        res.json({
            status: 'success',
            data: overview,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/shipments/search
 * Search shipments by query
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q = '', limit = 50 } = SearchSchema.parse(req.query);

        if (!q || q.length < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query required (minimum 1 character)',
            });
        }

        const results = await shipmentService.search(q, Number(limit));

        res.json({
            status: 'success',
            data: results,
            count: results.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/shipments
 * Get all shipments with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, mode, limit = 50, offset = 0 } = req.query;

        const shipments = await shipmentService.getAll({
            status,
            mode,
            limit: Number(limit),
            offset: Number(offset),
        });

        res.json({
            status: 'success',
            data: shipments,
            count: shipments.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/shipments/:id
 * Get single shipment by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const shipment = await shipmentService.getById(id);

        if (!shipment) {
            return res.status(404).json({
                status: 'error',
                message: 'Shipment not found',
            });
        }

        res.json({
            status: 'success',
            data: shipment,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
