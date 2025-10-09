import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

// Dashboard metrics (comprehensive)
router.get('/dashboard', analyticsController.getDashboardMetrics);

// User metrics
router.get('/users', analyticsController.getUserMetrics);

// Payment metrics
router.get('/payments', analyticsController.getPaymentMetrics);

// Mortgage metrics
router.get('/mortgages', analyticsController.getMortgageMetrics);

// Recent activity
router.get('/activity/recent', analyticsController.getRecentActivity);

// Time series data
router.get('/timeseries/payments', analyticsController.getPaymentTimeSeries);

export default router;
