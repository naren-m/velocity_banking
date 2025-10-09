import os from 'os';
import { db } from '../models/db';
import { sql } from 'drizzle-orm';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  timestamp: string;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export class MonitoringService {
  private startTime: number;
  private performanceMetrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory
  private readonly MAX_ALERTS = 100; // Keep last 100 alerts

  // Thresholds
  private readonly MEMORY_WARNING_THRESHOLD = 0.75; // 75%
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.9; // 90%
  private readonly RESPONSE_TIME_WARNING = 500; // ms
  private readonly RESPONSE_TIME_CRITICAL = 1000; // ms
  private readonly ERROR_RATE_WARNING = 0.05; // 5%
  private readonly ERROR_RATE_CRITICAL = 0.1; // 10%

  constructor() {
    this.startTime = Date.now();
  }

  // System Health Check
  async getSystemHealth(): Promise<SystemHealth> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    // Check database connectivity
    const dbHealth = await this.checkDatabaseHealth();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (
      memoryUsagePercent > this.MEMORY_CRITICAL_THRESHOLD * 100 ||
      !dbHealth.connected ||
      dbHealth.responseTime > this.RESPONSE_TIME_CRITICAL
    ) {
      status = 'unhealthy';
    } else if (
      memoryUsagePercent > this.MEMORY_WARNING_THRESHOLD * 100 ||
      dbHealth.responseTime > this.RESPONSE_TIME_WARNING
    ) {
      status = 'degraded';
    }

    return {
      status,
      uptime: Date.now() - this.startTime,
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      database: dbHealth,
      timestamp: new Date().toISOString(),
    };
  }

  // Database Health Check
  private async checkDatabaseHealth(): Promise<{ connected: boolean; responseTime: number }> {
    const startTime = Date.now();
    try {
      // Simple query to test database connectivity
      await db.run(sql`SELECT 1`);
      const responseTime = Date.now() - startTime;
      return { connected: true, responseTime };
    } catch (error) {
      return { connected: false, responseTime: -1 };
    }
  }

  // Record performance metric
  recordMetric(endpoint: string, method: string, responseTime: number, statusCode: number) {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics.shift();
    }

    // Check for alerts
    this.checkPerformanceAlerts(metric);
  }

  // Get performance statistics
  getPerformanceStats(minutes: number = 5) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    const recentMetrics = this.performanceMetrics.filter(
      (m) => new Date(m.timestamp) >= cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        slowestEndpoint: null,
      };
    }

    const totalRequests = recentMetrics.length;
    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;
    const avgResponseTime =
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;

    // Find slowest endpoint
    const endpointTimes = new Map<string, { total: number; count: number }>();
    recentMetrics.forEach((m) => {
      const key = `${m.method} ${m.endpoint}`;
      const current = endpointTimes.get(key) || { total: 0, count: 0 };
      endpointTimes.set(key, {
        total: current.total + m.responseTime,
        count: current.count + 1,
      });
    });

    let slowestEndpoint = null;
    let slowestAvg = 0;
    endpointTimes.forEach((value, key) => {
      const avg = value.total / value.count;
      if (avg > slowestAvg) {
        slowestAvg = avg;
        slowestEndpoint = { endpoint: key, avgTime: Math.round(avg * 100) / 100 };
      }
    });

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round((errorCount / totalRequests) * 10000) / 100,
      slowestEndpoint,
    };
  }

  // Check for performance alerts
  private checkPerformanceAlerts(metric: PerformanceMetric) {
    // Response time alerts
    if (metric.responseTime > this.RESPONSE_TIME_CRITICAL) {
      this.createAlert(
        'critical',
        `Critical response time on ${metric.endpoint}`,
        'response_time',
        metric.responseTime,
        this.RESPONSE_TIME_CRITICAL
      );
    } else if (metric.responseTime > this.RESPONSE_TIME_WARNING) {
      this.createAlert(
        'warning',
        `Slow response time on ${metric.endpoint}`,
        'response_time',
        metric.responseTime,
        this.RESPONSE_TIME_WARNING
      );
    }

    // Error rate alerts
    if (metric.statusCode >= 500) {
      this.createAlert(
        'error',
        `Server error on ${metric.endpoint}`,
        'error_rate',
        metric.statusCode,
        500
      );
    }
  }

  // Create alert
  private createAlert(
    level: Alert['level'],
    message: string,
    metric: string,
    value: number,
    threshold: number
  ) {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      level,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (level === 'critical' || level === 'error') {
      console.error(`[ALERT ${level.toUpperCase()}] ${message} (${value} vs ${threshold})`);
    }
  }

  // Get recent alerts
  getRecentAlerts(count: number = 10): Alert[] {
    return this.alerts.slice(-count).reverse();
  }

  // Get alerts by level
  getAlertsByLevel(level: Alert['level']): Alert[] {
    return this.alerts.filter((a) => a.level === level);
  }

  // Clear old alerts
  clearOldAlerts(hours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    this.alerts = this.alerts.filter((a) => new Date(a.timestamp) >= cutoffTime);
  }

  // Get metrics for specific endpoint
  getEndpointMetrics(endpoint: string, minutes: number = 5) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    const endpointMetrics = this.performanceMetrics.filter(
      (m) => m.endpoint === endpoint && new Date(m.timestamp) >= cutoffTime
    );

    if (endpointMetrics.length === 0) {
      return null;
    }

    const avgResponseTime =
      endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / endpointMetrics.length;
    const errorCount = endpointMetrics.filter((m) => m.statusCode >= 400).length;

    return {
      endpoint,
      totalRequests: endpointMetrics.length,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round((errorCount / endpointMetrics.length) * 10000) / 100,
      minResponseTime: Math.min(...endpointMetrics.map((m) => m.responseTime)),
      maxResponseTime: Math.max(...endpointMetrics.map((m) => m.responseTime)),
    };
  }
}

export const monitoringService = new MonitoringService();
