import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { demoScenarios, type ScenarioId } from '../services/demoScenarios';

const router = Router();

const StartSchema = z.object({
    scenarioId: z.enum(['normal-flow', 'disruption', 'constraint-failure', 'mid-transit-change', 'signal-loss']),
});

router.get('/scenarios', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        data: demoScenarios.getScenarioSummaries(),
        activeScenarioId: demoScenarios.getScenarioState().scenario?.id ?? null,
    });
});

router.get('/state', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        data: demoScenarios.getScenarioState(),
    });
});

router.post('/start', (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scenarioId } = StartSchema.parse(req.body) as { scenarioId: ScenarioId };
        const state = demoScenarios.startScenario(scenarioId);

        res.json({
            status: 'success',
            data: state,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/reset', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        data: demoScenarios.resetScenario(),
    });
});

export default router;