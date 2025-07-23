// Business Intelligence Dashboard
// Comprehensive real-time analytics and monitoring interface

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, AlertTriangle, 
  Shield, Clock, DollarSign, Eye, Target, Activity, Zap,
  CheckCircle, XCircle, AlertCircle, BarChart3, PieChart,
  MapPin, CreditCard, Package, Truck, Star, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import { 
  TYPOGRAPHY, 
  COLORS, 
  LAYOUT, 
  ANIMATIONS 
} from '@/lib/design-system';
import { monitoring, BusinessIntelligence } from '@/lib/monitoring';
import { resilience } from '@/lib/resilience';
import { security } from '@/lib/security';
import { customerExperience } from '@/lib/customer-experience';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface DashboardMetrics {
  revenue: {
    total: number;
    growth: number;
    orders: number;
    avgOrderValue: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    churnRate: number;
  };
  performance: {
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  security: {
    threats: number;
    blockedRequests: number;
    riskScore: number;
    vulnerabilities: number;
  };
  conversion: {
    rate: number;
    funnel: Array<{ step: string; value: number; conversion: number }>;
    abandonment: number;
  };
}

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

// ============================================================================
// METRIC CARDS COMPONENT
// ============================================================================

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ title, value, change, icon, description, trend, colorScheme = 'default' }) => {
  const getTrendIcon = () => {
    if (!change) return null;
    
    if (trend === 'up' || change > 0) {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    } else if (trend === 'down' || change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'danger':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <GlassCard className={`p-6 ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${TYPOGRAPHY.label.small} ${COLORS.text.muted} mb-1`}>
            {title}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary} font-bold`}>
              {value}
            </span>
            {getTrendIcon()}
          </div>
          {change !== undefined && (
            <p className={`${TYPOGRAPHY.body.small} ${change >= 0 ? 'text-emerald-400' : 'text-red-400'} mt-1`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </p>
          )}
          {description && (
            <p className={`${TYPOGRAPHY.body.small} ${COLORS.text.muted} mt-2`}>
              {description}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${LAYOUT.glass}`}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================================================
// REAL-TIME ALERTS COMPONENT
// ============================================================================

const AlertsPanel: React.FC<{ alerts: AlertItem[] }> = ({ alerts }) => {
  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary}`}>
          Real-time Alerts
        </h3>
        <Badge variant="outline">
          {alerts.filter(a => !a.resolved).length} Active
        </Badge>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.slice(0, 10).map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
              alert.resolved ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <h4 className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} mb-1`}>
                  {alert.title}
                </h4>
                <p className={`${TYPOGRAPHY.body.small} ${COLORS.text.secondary}`}>
                  {alert.message}
                </p>
                <p className={`${TYPOGRAPHY.body.small} ${COLORS.text.muted} mt-2`}>
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// CONVERSION FUNNEL COMPONENT
// ============================================================================

const ConversionFunnel: React.FC<{
  funnel: Array<{ step: string; value: number; conversion: number }>;
}> = ({ funnel }) => {
  return (
    <GlassCard className="p-6">
      <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-6`}>
        Conversion Funnel
      </h3>
      
      <div className="space-y-4">
        {funnel.map((step, index) => (
          <div key={step.step} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary}`}>
                {step.step}
              </span>
              <div className="flex items-center space-x-4">
                <span className={`${TYPOGRAPHY.body.small} ${COLORS.text.secondary}`}>
                  {step.value.toLocaleString()} users
                </span>
                <span className={`${TYPOGRAPHY.body.small} ${
                  step.conversion >= 70 ? 'text-emerald-400' : 
                  step.conversion >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {step.conversion.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="relative">
              <Progress value={step.conversion} className="h-3" />
              {index < funnel.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <TrendingDown className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// PERFORMANCE MONITORING COMPONENT
// ============================================================================

const PerformanceMonitor: React.FC<{
  performance: DashboardMetrics['performance'];
}> = ({ performance }) => {
  const getPerformanceStatus = (value: number, thresholds: { good: number; ok: number }) => {
    if (value <= thresholds.good) return { color: 'text-emerald-400', status: 'Excellent' };
    if (value <= thresholds.ok) return { color: 'text-yellow-400', status: 'Good' };
    return { color: 'text-red-400', status: 'Needs Attention' };
  };

  const pageLoadStatus = getPerformanceStatus(performance.pageLoadTime, { good: 1500, ok: 3000 });
  const apiStatus = getPerformanceStatus(performance.apiResponseTime, { good: 500, ok: 1000 });

  return (
    <GlassCard className="p-6">
      <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-6`}>
        Performance Monitoring
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary}`}>
              Page Load Time
            </span>
            <span className={`${TYPOGRAPHY.body.small} ${pageLoadStatus.color}`}>
              {pageLoadStatus.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              {performance.pageLoadTime}ms
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary}`}>
              API Response Time
            </span>
            <span className={`${TYPOGRAPHY.body.small} ${apiStatus.color}`}>
              {apiStatus.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              {performance.apiResponseTime}ms
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary}`}>
              Error Rate
            </span>
            <span className={`${TYPOGRAPHY.body.small} ${
              performance.errorRate < 0.01 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {performance.errorRate < 0.01 ? 'Excellent' : 'High'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              {(performance.errorRate * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${TYPOGRAPHY.label.secondary} ${COLORS.text.primary}`}>
              Uptime
            </span>
            <span className={`${TYPOGRAPHY.body.small} ${
              performance.uptime > 99.9 ? 'text-emerald-400' : 'text-yellow-400'
            }`}>
              {performance.uptime > 99.9 ? 'Excellent' : 'Good'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              {performance.uptime.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const BusinessDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // In a real implementation, this would call your analytics API
        // For now, we'll simulate data based on our monitoring systems
        
        const performanceData = monitoring.getDashboardData();
        const securityStats = security.getStats();
        const resilienceStats = resilience.getStats();
        const customerInsights = customerExperience.getCustomerInsights();
        const businessAnalytics = BusinessIntelligence.getCustomerAnalytics();

        const simulatedMetrics: DashboardMetrics = {
          revenue: {
            total: 12847.50,
            growth: 15.3,
            orders: 89,
            avgOrderValue: 144.35,
          },
          customers: {
            // TODO: Enhance BusinessIntelligenceService to provide real customer analytics
            total: businessAnalytics.totalPurchases || 1234, // Using total purchases as a proxy
            new: 67, // Hardcoded placeholder
            active: 456, // Hardcoded placeholder
            churnRate: 8.2,
          },
          performance: {
            pageLoadTime: performanceData.performance.avgPageLoadTime || 1250,
            apiResponseTime: performanceData.performance.avgApiResponseTime || 450,
            errorRate: performanceData.performance.errorRate || 0.005,
            uptime: 99.97,
          },
          security: {
            threats: securityStats.rateLimiting.blockedRecords || 12,
            blockedRequests: securityStats.rateLimiting.blockedRecords || 47,
            riskScore: 2.1,
            vulnerabilities: 0,
          },
          conversion: {
            rate: businessAnalytics.conversionRate || 15.7,
            funnel: [
              { step: 'Page Views', value: 2847, conversion: 100 },
              { step: 'Product Views', value: 1923, conversion: 67.5 },
              { step: 'Add to Cart', value: 892, conversion: 46.4 },
              { step: 'Checkout', value: 534, conversion: 59.9 },
              { step: 'Purchase', value: 447, conversion: 83.7 },
            ],
            abandonment: 40.1,
          },
        };

        // Generate sample alerts
        const sampleAlerts: AlertItem[] = [
          {
            id: '1',
            type: 'warning',
            title: 'High Cart Abandonment',
            message: 'Cart abandonment rate is above 40% in the last hour',
            timestamp: Date.now() - 300000,
            resolved: false,
          },
          {
            id: '2',
            type: 'info',
            title: 'Revenue Milestone',
            message: 'Daily revenue target of $10,000 achieved',
            timestamp: Date.now() - 600000,
            resolved: true,
          },
          {
            id: '3',
            type: 'critical',
            title: 'API Rate Limit',
            message: 'Printful API rate limit approaching threshold',
            timestamp: Date.now() - 900000,
            resolved: false,
          },
        ];

        setMetrics(simulatedMetrics);
        setAlerts(sampleAlerts);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`${LAYOUT.container} ${LAYOUT.spacing.section} bg-gray-950 text-white min-h-screen`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`${LAYOUT.container} ${LAYOUT.spacing.section} bg-gray-950 text-white min-h-screen`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className={`${TYPOGRAPHY.section.primary} ${COLORS.text.primary} mb-2`}>
            Unable to Load Dashboard
          </h2>
          <p className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${LAYOUT.container} ${LAYOUT.spacing.section} bg-gray-950 text-white min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`${TYPOGRAPHY.hero.secondary} ${COLORS.text.brand} mb-4`}>
          Business Intelligence Dashboard
        </h1>
        <div className="flex items-center justify-between">
          <p className={`${TYPOGRAPHY.body.large} ${COLORS.text.secondary}`}>
            Real-time analytics and performance monitoring
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className={`${TYPOGRAPHY.body.small} ${COLORS.text.muted}`}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.revenue.total.toLocaleString()}`}
          change={metrics.revenue.growth}
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
          description="This month"
          colorScheme="success"
        />
        <MetricCard
          title="Active Customers"
          value={metrics.customers.active.toLocaleString()}
          change={12.5}
          icon={<Users className="w-6 h-6 text-blue-400" />}
          description="Last 30 days"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversion.rate}%`}
          change={2.3}
          icon={<Target className="w-6 h-6 text-purple-400" />}
          description="Monthly average"
          colorScheme="success"
        />
        <MetricCard
          title="Security Score"
          value="98.7%"
          change={0.5}
          icon={<Shield className="w-6 h-6 text-green-400" />}
          description="System security"
          colorScheme="success"
        />
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`${LAYOUT.glass} p-1`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ConversionFunnel funnel={metrics.conversion.funnel} />
            </div>
            <div>
              <AlertsPanel alerts={alerts} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Orders Today"
              value={metrics.revenue.orders}
              change={8.2}
              icon={<ShoppingCart className="w-6 h-6 text-blue-400" />}
              description="Completed orders"
            />
            <MetricCard
              title="Avg Order Value"
              value={`$${metrics.revenue.avgOrderValue}`}
              change={5.7}
              icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
              description="Per transaction"
            />
            <MetricCard
              title="Cart Abandonment"
              value={`${metrics.conversion.abandonment}%`}
              change={-2.1}
              icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
              description="Last 24 hours"
              colorScheme="warning"
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitor performance={metrics.performance} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-4`}>
                Circuit Breaker Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Stripe API
                  </span>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    CLOSED
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Printful API
                  </span>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    CLOSED
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Email Service
                  </span>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    CLOSED
                  </Badge>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-4`}>
                Dead Letter Queue
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Pending Items
                  </span>
                  <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
                    0
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Retry Success Rate
                  </span>
                  <span className={`${TYPOGRAPHY.hero.tertiary} text-emerald-400`}>
                    94.2%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Avg Retry Time
                  </span>
                  <span className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
                    2.3s
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Threats Blocked"
              value={metrics.security.threats}
              icon={<Shield className="w-6 h-6 text-red-400" />}
              description="Last 24 hours"
              colorScheme="danger"
            />
            <MetricCard
              title="Rate Limited"
              value={metrics.security.blockedRequests}
              icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
              description="Blocked requests"
              colorScheme="warning"
            />
            <MetricCard
              title="Risk Score"
              value={metrics.security.riskScore}
              icon={<Target className="w-6 h-6 text-green-400" />}
              description="System risk level"
              colorScheme="success"
            />
            <MetricCard
              title="Vulnerabilities"
              value={metrics.security.vulnerabilities}
              icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
              description="Known issues"
              colorScheme="success"
            />
          </div>

          <GlassCard className="p-6">
            <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-6`}>
              Fraud Detection Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">98.7%</div>
                <div className={`${TYPOGRAPHY.body.small} ${COLORS.text.secondary}`}>
                  Detection Accuracy
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">12</div>
                <div className={`${TYPOGRAPHY.body.small} ${COLORS.text.secondary}`}>
                  High-Risk Orders
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">3</div>
                <div className={`${TYPOGRAPHY.body.small} ${COLORS.text.secondary}`}>
                  Blocked Transactions
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Customers"
              value={metrics.customers.total.toLocaleString()}
              change={8.3}
              icon={<Users className="w-6 h-6 text-blue-400" />}
              description="All time"
            />
            <MetricCard
              title="New Customers"
              value={metrics.customers.new}
              change={12.5}
              icon={<Star className="w-6 h-6 text-purple-400" />}
              description="This month"
              colorScheme="success"
            />
            <MetricCard
              title="Customer LTV"
              value="$284.50"
              change={6.8}
              icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
              description="Average lifetime value"
              colorScheme="success"
            />
            <MetricCard
              title="Churn Rate"
              value={`${metrics.customers.churnRate}%`}
              change={-1.2}
              icon={<TrendingDown className="w-6 h-6 text-red-400" />}
              description="Monthly churn"
              colorScheme="success"
            />
          </div>

          <GlassCard className="p-6">
            <h3 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.primary} mb-6`}>
              Customer Segments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    VIP Customers
                  </span>
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.primary}`}>
                    143
                  </span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    Repeat Customers
                  </span>
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.primary}`}>
                    567
                  </span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.secondary}`}>
                    New Customers
                  </span>
                  <span className={`${TYPOGRAPHY.body.regular} ${COLORS.text.primary}`}>
                    324
                  </span>
                </div>
                <Progress value={32} className="h-2" />
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessDashboard; 