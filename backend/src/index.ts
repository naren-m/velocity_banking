import express from 'express';
import cors from 'cors';
import routes from './routes';
import { initializeDatabase } from './models/db';
import { errorHandler } from './middleware/errorHandler';
import {
  performanceMiddleware,
  requestLoggerMiddleware,
  errorTrackingMiddleware
} from './middleware/performanceMiddleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(performanceMiddleware);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API routes available at /api/*');
});
