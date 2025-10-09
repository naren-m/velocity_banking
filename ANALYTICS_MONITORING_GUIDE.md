# Analytics & Monitoring System - Complete Guide

**Version**: 1.0
**Date**: October 4, 2025
**Status**: Production Ready

---

## Overview

Comprehensive analytics and real-time monitoring system for the Velocity Banking application, providing insights into user activity, payment patterns, system health, and performance metrics.

---

## Architecture

### Backend Services
- **analyticsService.ts** - Data aggregation and analysis
- **monitoringService.ts** - System health and performance tracking
- **performanceMiddleware.ts** - Automatic request tracking

### Controllers
- **analyticsController.ts** - Analytics API endpoints
- **monitoringController.ts** - Health and monitoring endpoints

### Frontend Components
- **Analytics.tsx** - Dashboard UI with charts and metrics

---

## API Endpoints

### Analytics Endpoints

#### `GET /api/analytics/dashboard`
Comprehensive dashboard metrics including users, payments, and mortgages.

**Response:**
```json
{
  "users": {
    "totalUsers": 150,
    "activeUsers": 45,
    "newUsersThisMonth": 12,
    "userGrowthRate": 8.0
  },
  "payments": {
    "totalPayments": 450,
    "totalAmountPaid": 125000.00,
    "avgPaymentAmount": 278.00,
    "paymentTypeDistribution": [
      {
        "type": "regular",
        "count": 300,
        "totalAmount": 90000.00
      }
    ]
  },
  "mortgages": {
    "totalMortgages": 50,
    "avgCurrentBalance": 285000.00,
    "avgInterestRate": 6.25
  },
  "timestamp": "2025-10-04T14:30:00.000Z"
}
```

#### `GET /api/analytics/users?startDate=...&endDate=...`
User activity metrics with optional date filtering.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "totalUsers": 150,
  "activeUsers": 45,
  "newUsersThisMonth": 12,
  "userGrowthRate": 8.0
}
```

#### `GET /api/analytics/payments?startDate=...&endDate=...`
Payment metrics with optional date filtering.

**Response:**
```json
{
  "totalPayments": 450,
  "totalAmountPaid": 125000.00,
  "avgPaymentAmount": 278.00,
  "paymentTypeDistribution": [...]
}
```

#### `GET /api/analytics/mortgages`
Aggregate mortgage statistics.

**Response:**
```json
{
  "totalMortgages": 50,
  "avgCurrentBalance": 285000.00,
  "avgInterestRate": 6.25
}
```

#### `GET /api/analytics/activity/recent?limit=10`
Recent payment activity.

**Query Parameters:**
- `limit` (optional): Number of items (default: 10)

**Response:**
```json
[
  {
    "id": "pay_123",
    "mortgageId": "mtg_456",
    "amount": 1500.00,
    "type": "regular",
    "paymentDate": "2025-10-04T10:00:00.000Z"
  }
]
```

#### `GET /api/analytics/timeseries/payments?days=30`
Payment time series data for charts.

**Query Parameters:**
- `days` (optional): Number of days (default: 30, max: 365)

**Response:**
```json
[
  {
    "date": "2025-10-01",
    "count": 15,
    "total": 4200.00
  },
  {
    "date": "2025-10-02",
    "count": 18,
    "total": 5100.00
  }
]
```

---

### Monitoring Endpoints

#### `GET /api/monitoring/health`
Lightweight health check (suitable for load balancers).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T14:30:00.000Z"
}
```

#### `GET /api/monitoring/ready`
Readiness check including database connectivity.

**Response (200 OK):**
```json
{
  "ready": true,
  "health": {
    "status": "healthy",
    "uptime": 86400000,
    "memory": {...},
    "cpu": {...},
    "database": {
      "connected": true,
      "responseTime": 5
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "ready": false,
  "reason": "System unhealthy"
}
```

#### `GET /api/monitoring/system`
Comprehensive system health metrics.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 86400000,
  "memory": {
    "total": 8589934592,
    "used": 4294967296,
    "free": 4294967296,
    "usagePercent": 50.00
  },
  "cpu": {
    "cores": 8,
    "loadAverage": [1.5, 1.3, 1.2]
  },
  "database": {
    "connected": true,
    "responseTime": 5
  },
  "timestamp": "2025-10-04T14:30:00.000Z"
}
```

**Status Values:**
- `healthy`: All systems operational
- `degraded`: Some performance issues detected
- `unhealthy`: Critical issues requiring attention

#### `GET /api/monitoring/performance?minutes=5`
Performance statistics for recent requests.

**Query Parameters:**
- `minutes` (optional): Time window (default: 5, max: 1440)

**Response:**
```json
{
  "totalRequests": 150,
  "avgResponseTime": 125.50,
  "errorRate": 0.67,
  "slowestEndpoint": {
    "endpoint": "POST /api/calculate/optimal-strategies",
    "avgTime": 450.25
  }
}
```

#### `GET /api/monitoring/performance/:endpoint?minutes=5`
Performance metrics for a specific endpoint.

**Response:**
```json
{
  "endpoint": "/api/analytics/dashboard",
  "totalRequests": 25,
  "avgResponseTime": 85.50,
  "errorRate": 0.00,
  "minResponseTime": 45,
  "maxResponseTime": 150
}
```

#### `GET /api/monitoring/alerts?count=10`
Recent system alerts.

**Query Parameters:**
- `count` (optional): Number of alerts (default: 10)

**Response:**
```json
[
  {
    "id": "alert_123",
    "level": "warning",
    "message": "Slow response time on /api/calculate/velocity",
    "metric": "response_time",
    "value": 650,
    "threshold": 500,
    "timestamp": "2025-10-04T14:25:00.000Z"
  }
]
```

**Alert Levels:**
- `info`: Informational notifications
- `warning`: Performance degradation or non-critical issues
- `error`: Application errors that don't affect service
- `critical`: Service-affecting issues requiring immediate attention

#### `GET /api/monitoring/alerts/:level`
Alerts filtered by severity level.

**Parameters:**
- `level`: One of `info`, `warning`, `error`, `critical`

---

## Frontend Dashboard

### Analytics Dashboard Component

Located at: `/frontend/src/components/Analytics/Analytics.tsx`

**Features:**
- Real-time data refresh (30-second interval)
- System health status card
- User, payment, and mortgage metric cards
- Payment activity line chart (30 days)
- Payment type distribution pie chart
- Responsive design with Tailwind CSS
- Recharts visualizations

**Integration:**
Add to your router:
```typescript
import Analytics from './components/Analytics/Analytics';

<Route path="/analytics" element={<Analytics />} />
```

---

## Performance Monitoring

### Automatic Request Tracking

All API requests are automatically tracked by `performanceMiddleware.ts`:

**Metrics Collected:**
- Endpoint path
- HTTP method
- Response time (ms)
- Status code
- Timestamp

**Thresholds:**
- **Warning**: Response time > 500ms
- **Critical**: Response time > 1000ms
- **Error**: Status code >= 500

### Alert Generation

Alerts are automatically generated when:
- Response time exceeds warning threshold (500ms)
- Response time exceeds critical threshold (1000ms)
- Server errors occur (5xx status codes)
- Memory usage exceeds 75% (warning) or 90% (critical)
- Database becomes unavailable

---

## System Health Monitoring

### Health Status Determination

**Healthy:**
- Memory usage < 75%
- Database connected
- API response time < 500ms

**Degraded:**
- Memory usage 75-90%
- API response time 500-1000ms

**Unhealthy:**
- Memory usage > 90%
- Database disconnected
- API response time > 1000ms

### Metrics Tracked

1. **Uptime**: Milliseconds since service start
2. **Memory**: Total, used, free, usage percentage
3. **CPU**: Core count, load averages (1m, 5m, 15m)
4. **Database**: Connection status, response time
5. **Performance**: Request counts, response times, error rates

---

## Usage Examples

### Monitoring System Health

```bash
# Quick health check
curl http://localhost:3001/api/monitoring/health

# Comprehensive system status
curl http://localhost:3001/api/monitoring/system

# Performance over last 15 minutes
curl http://localhost:3001/api/monitoring/performance?minutes=15
```

### Accessing Analytics

```bash
# Full dashboard data
curl http://localhost:3001/api/analytics/dashboard

# User metrics for last month
START_DATE=$(date -u -v-30d +%Y-%m-%dT%H:%M:%S.000Z)
curl "http://localhost:3001/api/analytics/users?startDate=$START_DATE"

# Payment time series (last 7 days)
curl http://localhost:3001/api/analytics/timeseries/payments?days=7
```

### Monitoring Alerts

```bash
# Recent alerts
curl http://localhost:3001/api/monitoring/alerts?count=20

# Critical alerts only
curl http://localhost:3001/api/monitoring/alerts/critical

# Warning alerts only
curl http://localhost:3001/api/monitoring/alerts/warning
```

---

## Configuration

### Monitoring Thresholds

Edit `/backend/src/services/monitoringService.ts`:

```typescript
private readonly MEMORY_WARNING_THRESHOLD = 0.75;  // 75%
private readonly MEMORY_CRITICAL_THRESHOLD = 0.9;  // 90%
private readonly RESPONSE_TIME_WARNING = 500;      // ms
private readonly RESPONSE_TIME_CRITICAL = 1000;    // ms
private readonly ERROR_RATE_WARNING = 0.05;        // 5%
private readonly ERROR_RATE_CRITICAL = 0.1;        // 10%
```

### Analytics Refresh Rate

Edit `/frontend/src/components/Analytics/Analytics.tsx`:

```typescript
const interval = setInterval(fetchAnalyticsData, 30000); // 30 seconds
```

### Metrics Retention

In-memory metrics are limited to prevent unbounded growth:

```typescript
private readonly MAX_METRICS = 1000;  // Last 1000 API calls
private readonly MAX_ALERTS = 100;    // Last 100 alerts
```

---

## Production Deployment

### Health Check Endpoints

Configure your load balancer/orchestrator:

**Liveness Probe:**
```yaml
httpGet:
  path: /api/monitoring/health
  port: 3001
initialDelaySeconds: 30
periodSeconds: 10
```

**Readiness Probe:**
```yaml
httpGet:
  path: /api/monitoring/ready
  port: 3001
initialDelaySeconds: 10
periodSeconds: 5
failureThreshold: 3
```

### Monitoring Integration

For production monitoring services (e.g., Datadog, New Relic, Grafana):

1. **Export metrics endpoint** (future enhancement)
2. **Webhook alerts** (future enhancement)
3. **Log aggregation** (Splunk, ELK stack ready)

### Current Logging

All performance metrics and alerts are logged to console:

```
[2025-10-04T14:30:00.000Z] GET /api/analytics/dashboard
[Analytics] /api/analytics/dashboard - 125ms - 200
[ALERT WARNING] Slow response time on /api/calculate/velocity (650 vs 500)
```

---

## Testing

### Test Analytics Endpoints

```bash
# Start services
make dev

# Test dashboard endpoint
curl -s http://localhost:3001/api/analytics/dashboard | jq '.'

# Test monitoring health
curl -s http://localhost:3001/api/monitoring/system | jq '.status'

# Test performance tracking
for i in {1..10}; do
  curl -s http://localhost:3001/api/mortgages/user/test_user > /dev/null
done
curl -s http://localhost:3001/api/monitoring/performance | jq '.'
```

### Load Testing

```bash
# Generate load
ab -n 1000 -c 10 http://localhost:3001/api/analytics/dashboard

# Check performance impact
curl http://localhost:3001/api/monitoring/performance?minutes=1
```

---

## Troubleshooting

### No Data Showing

**Problem**: Analytics dashboard shows zero metrics

**Solution**:
1. Ensure database has data: `make db-shell`
2. Check recent payments: `SELECT COUNT(*) FROM payments;`
3. Verify API responses: `curl http://localhost:3001/api/analytics/dashboard`

### High Memory Usage

**Problem**: System status shows high memory usage

**Solution**:
1. Check container resources: `docker stats`
2. Restart services: `make restart`
3. Clear metrics cache (restart clears in-memory data)

### Slow Response Times

**Problem**: Alerts showing slow API responses

**Solution**:
1. Check slowest endpoints: `curl http://localhost:3001/api/monitoring/performance`
2. Review database queries in slow services
3. Consider adding database indexes

### Database Connection Errors

**Problem**: Monitoring shows database disconnected

**Solution**:
1. Check backend logs: `make logs-backend`
2. Verify database file exists: `ls -lh backend/data/`
3. Restart services: `make restart`

---

## Future Enhancements

### Planned Features (Phase 6+)

1. **Metrics Export** - Prometheus/StatsD integration
2. **Webhook Alerts** - Send alerts to Slack/PagerDuty/Email
3. **Custom Dashboards** - User-configurable metrics
4. **Historical Data** - Long-term metrics storage
5. **Predictive Analytics** - ML-based forecasting
6. **A/B Testing** - Feature performance tracking
7. **User Segmentation** - Cohort analysis
8. **Real-time Streaming** - WebSocket data updates

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/analytics/dashboard` | GET | All metrics | None |
| `/api/analytics/users` | GET | User metrics | None |
| `/api/analytics/payments` | GET | Payment metrics | None |
| `/api/analytics/mortgages` | GET | Mortgage stats | None |
| `/api/analytics/activity/recent` | GET | Recent activity | None |
| `/api/analytics/timeseries/payments` | GET | Payment charts | None |
| `/api/monitoring/health` | GET | Quick health | None |
| `/api/monitoring/ready` | GET | Readiness check | None |
| `/api/monitoring/system` | GET | System health | None |
| `/api/monitoring/performance` | GET | Performance stats | None |
| `/api/monitoring/performance/:endpoint` | GET | Endpoint metrics | None |
| `/api/monitoring/alerts` | GET | Recent alerts | None |
| `/api/monitoring/alerts/:level` | GET | Filtered alerts | None |

---

## Support

For issues or questions:
1. Check logs: `make logs`
2. Verify system health: `curl http://localhost:3001/api/monitoring/system`
3. Review documentation in this file
4. Check test results: `make test`

---

**Last Updated**: October 4, 2025
**Next Review**: Post-production deployment
