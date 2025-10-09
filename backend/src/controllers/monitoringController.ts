import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService';
import { z } from 'zod';

const TimeWindowSchema = z.object({
  minutes: z.coerce.number().min(1).max(1440).default(5),
});

const AlertLevelSchema = z.object({
  level: z.enum(['info', 'warning', 'error', 'critical']),
});

export const monitoringController = {
  // Get system health status
  async getSystemHealth(req: Request, res: Response) {
    try {
      const health = await monitoringService.getSystemHealth();

      // Set appropriate status code based on health
      const statusCode =
        health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 :
        503;

      res.status(statusCode).json(health);
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: 'Failed to check system health',
      });
    }
  },

  // Get performance statistics
  async getPerformanceStats(req: Request, res: Response) {
    try {
      const validation = TimeWindowSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { minutes } = validation.data;
      const stats = monitoringService.getPerformanceStats(minutes);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      res.status(500).json({ error: 'Failed to fetch performance stats' });
    }
  },

  // Get recent alerts
  async getRecentAlerts(req: Request, res: Response) {
    try {
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 10;
      const alerts = monitoringService.getRecentAlerts(count);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  },

  // Get alerts by level
  async getAlertsByLevel(req: Request, res: Response) {
    try {
      const validation = AlertLevelSchema.safeParse(req.params);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { level } = validation.data;
      const alerts = monitoringService.getAlertsByLevel(level);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts by level:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  },

  // Get endpoint-specific metrics
  async getEndpointMetrics(req: Request, res: Response) {
    try {
      const { endpoint } = req.params;
      const validation = TimeWindowSchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { minutes } = validation.data;
      const metrics = monitoringService.getEndpointMetrics(
        decodeURIComponent(endpoint),
        minutes
      );

      if (!metrics) {
        return res.status(404).json({ error: 'No metrics found for this endpoint' });
      }

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching endpoint metrics:', error);
      res.status(500).json({ error: 'Failed to fetch endpoint metrics' });
    }
  },

  // Health check endpoint (lightweight)
  healthCheck(req: Request, res: Response) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  },

  // Ready check (includes database check)
  async readyCheck(req: Request, res: Response) {
    try {
      const health = await monitoringService.getSystemHealth();

      if (health.status === 'unhealthy') {
        return res.status(503).json({
          ready: false,
          reason: 'System unhealthy',
          health,
        });
      }

      res.json({
        ready: true,
        health,
      });
    } catch (error) {
      res.status(503).json({
        ready: false,
        reason: 'Health check failed',
      });
    }
  },
};
