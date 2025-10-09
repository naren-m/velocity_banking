import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoringService';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to capture response time
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const responseTime = Date.now() - startTime;

    // Record the metric
    monitoringService.recordMetric(
      req.path,
      req.method,
      responseTime,
      res.statusCode
    );

    // Call the original end function
    if (typeof encoding === 'function') {
      return originalEnd.call(this, chunk, encoding);
    }
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

// Request logging middleware
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// Error tracking middleware
export const errorTrackingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Track error in monitoring service
  monitoringService.recordMetric(
    req.path,
    req.method,
    0,
    500
  );

  // Pass to next error handler
  next(err);
};
