import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardMetrics {
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
  };
  payments: {
    totalPayments: number;
    totalAmountPaid: number;
    avgPaymentAmount: number;
    paymentTypeDistribution: Array<{
      type: string;
      count: number;
      totalAmount: number;
    }>;
  };
  mortgages: {
    totalMortgages: number;
    avgCurrentBalance: number;
    avgInterestRate: number;
  };
  timestamp: string;
}

interface TimeSeriesData {
  date: string;
  count: number;
  total: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    usagePercent: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics: React.FC = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:3001';

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, timeSeriesRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/dashboard`),
        fetch(`${API_BASE}/api/analytics/timeseries/payments?days=30`),
        fetch(`${API_BASE}/api/monitoring/system`),
      ]);

      if (!metricsRes.ok || !timeSeriesRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const metrics = await metricsRes.json();
      const timeSeries = await timeSeriesRes.json();
      const health = await healthRes.json();

      setDashboardMetrics(metrics);
      setTimeSeriesData(timeSeries);
      setSystemHealth(health);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!dashboardMetrics) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date(dashboardMetrics.timestamp).toLocaleString()}
          </p>
        </div>

        {/* System Health Status */}
        {systemHealth && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className={`text-2xl font-bold ${getStatusColor(systemHealth.status)}`}>
                  {systemHealth.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatUptime(systemHealth.uptime)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemHealth.memory.usagePercent?.toFixed(1) ?? '0.0'}%
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Database</p>
                <p
                  className={`text-2xl font-bold ${
                    systemHealth.database.connected ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {systemHealth.database.connected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  {systemHealth.database.responseTime}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* User Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Users</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardMetrics.users.totalUsers}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Active Users (30d)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.users.activeUsers}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Growth Rate</p>
                <p className="text-xl font-bold text-green-600">
                  +{dashboardMetrics.users.userGrowthRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Payment Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Total Payments</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardMetrics.payments.totalPayments}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardMetrics.payments.totalAmountPaid)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Payment</p>
                <p className="text-xl font-bold text-gray-700">
                  {formatCurrency(dashboardMetrics.payments.avgPaymentAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Mortgage Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Mortgages</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Total Mortgages</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardMetrics.mortgages.totalMortgages}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardMetrics.mortgages.avgCurrentBalance)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Interest Rate</p>
                <p className="text-xl font-bold text-gray-700">
                  {dashboardMetrics.mortgages.avgInterestRate?.toFixed(2) ?? '0.00'}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Time Series */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Activity (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'total' ? formatCurrency(value) : value
                  }
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Payment Count"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  name="Total Amount"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Type Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Distribution</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardMetrics.payments.paymentTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) =>
                      `${type}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardMetrics.payments.paymentTypeDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) =>
                      `${value} payments (${formatCurrency(props.payload.totalAmount)})`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {dashboardMetrics.payments.paymentTypeDistribution.map((item, index) => (
                <div key={item.type} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-700">{item.type}</span>
                  </div>
                  <span className="text-gray-600">
                    {item.count} ({formatCurrency(item.totalAmount)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
