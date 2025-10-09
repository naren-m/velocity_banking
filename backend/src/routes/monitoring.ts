import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController';

const router = Router();

// Health checks
router.get('/health', monitoringController.healthCheck);
router.get('/ready', monitoringController.readyCheck);
router.get('/system', monitoringController.getSystemHealth);

// Performance metrics
router.get('/performance', monitoringController.getPerformanceStats);
router.get('/performance/:endpoint', monitoringController.getEndpointMetrics);

// Alerts
router.get('/alerts', monitoringController.getRecentAlerts);
router.get('/alerts/:level', monitoringController.getAlertsByLevel);

export default router;
