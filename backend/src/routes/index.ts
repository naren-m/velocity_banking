import { Router } from 'express';
import {
  createMortgage,
  getMortgage,
  getMortgagesByUser,
  updateMortgage,
  deleteMortgage,
  getAmortization,
} from '../controllers/mortgageController';
import {
  calculateVelocityScenario,
  calculateOptimalChunk,
  compareScenarios,
} from '../controllers/calculationController';
import {
  compareInvestmentScenarios,
} from '../controllers/investmentController';
import {
  createPayment,
  getPaymentHistory,
  getPayment,
  getTotalPaid,
} from '../controllers/paymentController';
import {
  createHeloc,
  getHelocByMortgage,
  calculateHelocStrategy,
  calculateOptimalStrategies,
  calculateStrategiesForTargetYear,
  updateHeloc,
} from '../controllers/helocController';
import {
  getOrCreateUser,
  getUser,
  getUserIdFromEmail,
  login,
  signup,
  passwordLogin,
} from '../controllers/userController';
import analyticsRoutes from './analytics';
import monitoringRoutes from './monitoring';

const router = Router();

// User routes
router.post('/users', getOrCreateUser);
router.get('/users/:id', getUser);
router.post('/users/get-id', getUserIdFromEmail);
router.post('/users/login', passwordLogin);
router.post('/users/login-email', login);
router.post('/users/signup', signup);

// Mortgage routes
router.post('/mortgages', createMortgage);
router.get('/mortgages/user/:userId', getMortgagesByUser);
router.get('/mortgages/:id', getMortgage);
router.put('/mortgages/:id', updateMortgage);
router.delete('/mortgages/:id', deleteMortgage);
router.get('/mortgages/:id/amortization', getAmortization);

// HELOC routes
router.post('/helocs', createHeloc);
router.get('/helocs/mortgage/:mortgageId', getHelocByMortgage);
router.put('/helocs/:id', updateHeloc);
router.post('/helocs/calculate-strategy', calculateHelocStrategy);
router.post('/helocs/calculate-optimal-strategies', calculateOptimalStrategies);
router.post('/helocs/calculate-strategies-for-target', calculateStrategiesForTargetYear);

// Calculation routes
router.post('/calculate/velocity', calculateVelocityScenario);
router.post('/calculate/optimal-chunk', calculateOptimalChunk);
router.post('/calculate/compare', compareScenarios);

// Investment comparison routes
router.post('/investment/compare', compareInvestmentScenarios);

// Payment routes
router.post('/payments', createPayment);
router.get('/payments/mortgage/:mortgageId', getPaymentHistory);
router.get('/payments/:id', getPayment);
router.get('/payments/mortgage/:mortgageId/totals', getTotalPaid);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Monitoring routes
router.use('/monitoring', monitoringRoutes);

export default router;
