import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { z } from 'zod';

// Validation schemas
const DateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const TimeSeriesSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

export const analyticsController = {
  // Get comprehensive dashboard metrics
  async getDashboardMetrics(req: Request, res: Response) {
    try {
      const metrics = await analyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  },

  // Get user activity metrics
  async getUserMetrics(req: Request, res: Response) {
    try {
      const validation = DateRangeSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { startDate, endDate } = validation.data;
      const metrics = await analyticsService.getUserActivityMetrics(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      res.status(500).json({ error: 'Failed to fetch user metrics' });
    }
  },

  // Get payment metrics
  async getPaymentMetrics(req: Request, res: Response) {
    try {
      const validation = DateRangeSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { startDate, endDate } = validation.data;
      const metrics = await analyticsService.getPaymentMetrics(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching payment metrics:', error);
      res.status(500).json({ error: 'Failed to fetch payment metrics' });
    }
  },

  // Get mortgage metrics
  async getMortgageMetrics(req: Request, res: Response) {
    try {
      const metrics = await analyticsService.getMortgageMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching mortgage metrics:', error);
      res.status(500).json({ error: 'Failed to fetch mortgage metrics' });
    }
  },

  // Get recent activity
  async getRecentActivity(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const activity = await analyticsService.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  },

  // Get payment time series data
  async getPaymentTimeSeries(req: Request, res: Response) {
    try {
      const validation = TimeSeriesSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { days } = validation.data;
      const timeSeries = await analyticsService.getPaymentTimeSeries(days);
      res.json(timeSeries);
    } catch (error) {
      console.error('Error fetching payment time series:', error);
      res.status(500).json({ error: 'Failed to fetch payment time series' });
    }
  },
};
