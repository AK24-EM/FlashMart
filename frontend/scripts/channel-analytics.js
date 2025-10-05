/**
 * Channel-Wise Sales Tracking and Analytics System
 *
 * Advanced multi-channel sales performance tracking with
 * DSA-optimized analytics and omnichannel insights.
 */

class ChannelAnalyticsService {
    constructor(operationsService, orderTracker) {
        this.operationsService = operationsService;
        this.orderTracker = orderTracker;
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes

        // Performance tracking
        this.performanceMetrics = {
            byChannel: {},
            byTimeframe: {},
            trends: []
        };
    }

    /**
     * Initialize channel analytics service
     */
    async initialize() {
        console.log('📊 Initializing Channel Analytics Service...');
        this.setupRealTimeAnalytics();
        this.calculateInitialMetrics();
        console.log('✅ Channel Analytics Service initialized');
    }

    /**
     * Setup real-time analytics tracking
     */
    setupRealTimeAnalytics() {
        // Update metrics every 5 minutes
        setInterval(() => {
            this.updateAllChannelMetrics();
        }, 5 * 60 * 1000);

        // Update trends every hour
        setInterval(() => {
            this.updateTrendAnalysis();
        }, 60 * 60 * 1000);
    }

    /**
     * Get comprehensive channel performance data
     */
    getChannelPerformance(channelId, timeframe = '30d') {
        const cacheKey = `channel_${channelId}_${timeframe}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        const channel = this.operationsService.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }

        const days = this.getDaysFromTimeframe(timeframe);
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        // Get orders for this channel in timeframe
        const orders = this.orderTracker.getOrders({
            channel: channel.type,
            dateFrom: startDate
        });

        // Calculate metrics
        const metrics = this.calculateChannelMetrics(orders, channel);

        // Cache the result
        this.setCachedData(cacheKey, metrics);
        return metrics;
    }

    /**
     * Get omnichannel overview with all channels
     */
    getOmnichannelOverview(timeframe = '30d') {
        const cacheKey = `omnichannel_${timeframe}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        const overview = {
            summary: {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                channelCount: this.operationsService.channels.size,
                timeframe
            },
            channels: {},
            comparisons: {},
            insights: [],
            trends: [],
            generatedAt: new Date()
        };

        // Get data for each channel
        for (const [channelId, channel] of this.operationsService.channels) {
            const performance = this.getChannelPerformance(channelId, timeframe);
            overview.channels[channelId] = performance;

            // Update summary totals
            overview.summary.totalRevenue += performance.metrics.totalRevenue;
            overview.summary.totalOrders += performance.metrics.totalOrders;
        }

        // Calculate averages
        if (overview.summary.totalOrders > 0) {
            overview.summary.averageOrderValue = overview.summary.totalRevenue / overview.summary.totalOrders;
        }

        // Generate comparisons
        overview.comparisons = this.generateChannelComparisons(overview.channels);

        // Generate insights
        overview.insights = this.generateOmnichannelInsights(overview);

        // Get trends
        overview.trends = this.getOmnichannelTrends(timeframe);

        this.setCachedData(cacheKey, overview);
        return overview;
    }

    /**
     * Compare channel performance across different metrics
     */
    compareChannels(channels, metric = 'revenue') {
        const comparison = {
            metric,
            channels: {},
            rankings: [],
            insights: []
        };

        // Sort channels by the specified metric
        const sortedChannels = Object.entries(channels)
            .map(([channelId, data]) => ({
                channelId,
                channelName: data.channelName,
                value: data.metrics[metric] || 0,
                rank: 0
            }))
            .sort((a, b) => b.value - a.value);

        // Assign ranks
        sortedChannels.forEach((channel, index) => {
            channel.rank = index + 1;
            comparison.channels[channel.channelId] = channel;
        });

        comparison.rankings = sortedChannels;

        // Generate insights
        if (sortedChannels.length > 0) {
            const topChannel = sortedChannels[0];
            const bottomChannel = sortedChannels[sortedChannels.length - 1];

            comparison.insights.push({
                type: 'top_performer',
                message: `${topChannel.channelName} leads with ${this.formatMetric(metric, topChannel.value)}`
            });

            if (sortedChannels.length > 1) {
                comparison.insights.push({
                    type: 'improvement_opportunity',
                    message: `${bottomChannel.channelName} has room for improvement with ${this.formatMetric(metric, bottomChannel.value)}`
                });
            }
        }

        return comparison;
    }

    /**
     * Get channel performance trends over time
     */
    getChannelTrends(channelId, days = 30) {
        const channel = this.operationsService.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }

        const trends = [];
        const orders = this.orderTracker.getOrders({ channel: channel.type });

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));

            const dayOrders = orders.filter(order =>
                order.createdAt >= dayStart && order.createdAt < dayEnd
            );

            const dayRevenue = dayOrders
                .filter(order => order.status === ORDER_STATUS.DELIVERED)
                .reduce((sum, order) => sum + order.totalAmount, 0);

            trends.push({
                date: dayStart.toISOString().split('T')[0],
                orders: dayOrders.length,
                revenue: dayRevenue,
                conversionRate: dayOrders.length > 0 ? (dayRevenue / dayOrders.length) : 0
            });
        }

        return trends;
    }

    /**
     * Get omnichannel trends across all channels
     */
    getOmnichannelTrends(timeframe = '30d') {
        const days = this.getDaysFromTimeframe(timeframe);
        const trends = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));

            const dayData = {
                date: dayStart.toISOString().split('T')[0],
                totalOrders: 0,
                totalRevenue: 0,
                byChannel: {}
            };

            // Aggregate data from all channels
            for (const [channelId, channel] of this.operationsService.channels) {
                const orders = this.orderTracker.getOrders({
                    channel: channel.type,
                    dateFrom: dayStart,
                    dateTo: dayEnd
                });

                dayData.byChannel[channelId] = {
                    orders: orders.length,
                    revenue: orders.filter(o => o.status === ORDER_STATUS.DELIVERED)
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                };

                dayData.totalOrders += dayData.byChannel[channelId].orders;
                dayData.totalRevenue += dayData.byChannel[channelId].revenue;
            }

            trends.push(dayData);
        }

        return trends;
    }

    /**
     * Generate channel comparisons
     */
    generateChannelComparisons(channels) {
        const comparisons = {};

        // Revenue comparison
        comparisons.revenue = this.compareChannels(channels, 'totalRevenue');

        // Order volume comparison
        comparisons.volume = this.compareChannels(channels, 'totalOrders');

        // Average order value comparison
        comparisons.aov = this.compareChannels(channels, 'averageOrderValue');

        // Conversion rate comparison (if available)
        comparisons.conversion = this.compareChannels(channels, 'conversionRate');

        return comparisons;
    }

    /**
     * Generate omnichannel insights and recommendations
     */
    generateOmnichannelInsights(overview) {
        const insights = [];

        // Revenue insights
        if (overview.summary.totalRevenue > 0) {
            insights.push({
                type: 'revenue',
                priority: 'high',
                title: 'Revenue Performance',
                message: `Total revenue of ₹${this.formatNumber(overview.summary.totalRevenue)} across ${overview.summary.channelCount} channels`,
                actionable: true
            });
        }

        // Channel performance insights
        const topChannel = Object.values(overview.channels)
            .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)[0];

        if (topChannel) {
            insights.push({
                type: 'top_channel',
                priority: 'medium',
                title: 'Best Performing Channel',
                message: `${topChannel.channelName} leads with ₹${this.formatNumber(topChannel.metrics.totalRevenue)} in revenue`,
                actionable: true
            });
        }

        // Growth opportunities
        const lowPerformers = Object.values(overview.channels)
            .filter(channel => channel.metrics.totalOrders < 10)
            .sort((a, b) => a.metrics.totalOrders - b.metrics.totalOrders);

        if (lowPerformers.length > 0) {
            insights.push({
                type: 'growth_opportunity',
                priority: 'medium',
                title: 'Growth Opportunities',
                message: `${lowPerformers[0].channelName} shows potential for improvement with only ${lowPerformers[0].metrics.totalOrders} orders`,
                actionable: true
            });
        }

        // Channel balance insights
        const revenueDistribution = Object.values(overview.channels).map(c => c.metrics.totalRevenue);
        const maxRevenue = Math.max(...revenueDistribution);
        const minRevenue = Math.min(...revenueDistribution.filter(r => r > 0));

        if (maxRevenue > 0 && minRevenue > 0) {
            const imbalanceRatio = maxRevenue / minRevenue;
            if (imbalanceRatio > 3) {
                insights.push({
                    type: 'channel_balance',
                    priority: 'low',
                    title: 'Channel Balance',
                    message: `Revenue distribution shows ${imbalanceRatio.toFixed(1)}x difference between top and bottom channels`,
                    actionable: false
                });
            }
        }

        return insights;
    }

    /**
     * Calculate detailed metrics for a channel
     */
    calculateChannelMetrics(orders, channel) {
        const deliveredOrders = orders.filter(order => order.status === ORDER_STATUS.DELIVERED);
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;

        // Calculate conversion rate (simplified - in reality would need traffic data)
        const conversionRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders * 100) : 0;

        // Calculate average order value
        const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

        // Calculate processing efficiency
        const processingTimes = deliveredOrders
            .filter(order => order.processingTime > 0)
            .map(order => order.processingTime);

        const averageProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            : 0;

        // Customer satisfaction (would need actual survey data)
        const customerSatisfaction = 85 + (Math.random() * 10); // Simulated for demo

        // Channel-specific metrics
        const metrics = {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            conversionRate,
            averageProcessingTime: Math.round(averageProcessingTime / 1000 / 60), // Convert to minutes
            customerSatisfaction,
            successRate: totalOrders > 0 ? (deliveredOrders.length / totalOrders * 100) : 0,
            returnRate: 2 + (Math.random() * 3), // Simulated return rate
            channelPriority: channel.configuration.priority,
            commission: channel.configuration.commission
        };

        return {
            channelId: channel.id,
            channelName: channel.name,
            channelType: channel.type,
            configuration: channel.configuration,
            metrics,
            orders: orders.length,
            timeframe: '30d',
            lastUpdated: new Date()
        };
    }

    /**
     * Get channel attribution and customer journey data
     */
    getChannelAttribution(orderId) {
        const order = this.orderTracker.getOrder(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // Analyze customer journey based on UTM parameters and referrer
        const attribution = {
            primaryChannel: order.channel,
            utmSource: order.utmSource,
            utmMedium: order.utmMedium,
            utmCampaign: order.utmCampaign,
            referrer: order.referrer,
            journey: []
        };

        // Build customer journey (simplified for demo)
        attribution.journey.push({
            touchpoint: 'initial_visit',
            channel: order.utmSource || 'direct',
            timestamp: order.createdAt,
            conversion: true
        });

        if (order.channel !== order.utmSource) {
            attribution.journey.push({
                touchpoint: 'conversion',
                channel: order.channel,
                timestamp: order.createdAt,
                conversion: true
            });
        }

        return attribution;
    }

    /**
     * Get customer lifetime value by channel
     */
    async getCustomerLifetimeValueByChannel(customerId, channel) {
        const orders = this.orderTracker.getOrders({
            customerId,
            channel
        });

        const deliveredOrders = orders.filter(order => order.status === ORDER_STATUS.DELIVERED);

        if (deliveredOrders.length === 0) {
            return {
                customerId,
                channel,
                clv: 0,
                orderCount: 0,
                totalSpent: 0,
                averageOrderValue: 0
            };
        }

        const totalSpent = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalSpent / deliveredOrders.length;

        // Simple CLV calculation (would be more sophisticated in production)
        const clv = totalSpent * 1.2; // Assuming 20% margin

        return {
            customerId,
            channel,
            clv,
            orderCount: deliveredOrders.length,
            totalSpent,
            averageOrderValue,
            firstOrderDate: deliveredOrders.sort((a, b) => a.createdAt - b.createdAt)[0].createdAt,
            lastOrderDate: deliveredOrders.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt
        };
    }

    /**
     * Update all channel metrics
     */
    updateAllChannelMetrics() {
        for (const [channelId] of this.operationsService.channels) {
            this.getChannelPerformance(channelId, '30d');
        }
    }

    /**
     * Update trend analysis
     */
    updateTrendAnalysis() {
        const trends = this.getOmnichannelTrends('90d');
        this.performanceMetrics.trends = trends;
    }

    /**
     * Calculate initial metrics on startup
     */
    calculateInitialMetrics() {
        this.updateAllChannelMetrics();
        this.updateTrendAnalysis();
    }

    /**
     * Cache management for performance
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Utility functions
     */
    getDaysFromTimeframe(timeframe) {
        const timeframes = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };
        return timeframes[timeframe] || 30;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    formatMetric(metric, value) {
        switch (metric) {
            case 'totalRevenue':
            case 'averageOrderValue':
                return `₹${this.formatNumber(value)}`;
            case 'totalOrders':
                return `${this.formatNumber(value)} orders`;
            case 'conversionRate':
            case 'successRate':
            case 'customerSatisfaction':
                return `${value.toFixed(1)}%`;
            case 'averageProcessingTime':
                return `${value} minutes`;
            default:
                return value.toString();
        }
    }

    /**
     * Export channel analytics data
     */
    exportChannelData(format = 'json') {
        const data = {
            omnichannel: this.getOmnichannelOverview(),
            channels: {},
            trends: this.performanceMetrics.trends,
            exportedAt: new Date()
        };

        // Get data for all channels
        for (const [channelId] of this.operationsService.channels) {
            data.channels[channelId] = this.getChannelPerformance(channelId);
        }

        if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return JSON.stringify(data, null, 2);
    }

    /**
     * Convert analytics data to CSV format
     */
    convertToCSV(data) {
        const headers = ['Channel', 'Total Revenue', 'Total Orders', 'Average Order Value', 'Conversion Rate', 'Success Rate'];
        const rows = [headers.join(',')];

        for (const [channelId, channelData] of Object.entries(data.channels)) {
            const row = [
                `"${channelData.channelName}"`,
                channelData.metrics.totalRevenue,
                channelData.metrics.totalOrders,
                channelData.metrics.averageOrderValue,
                channelData.metrics.conversionRate,
                channelData.metrics.successRate
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    /**
     * Get real-time channel performance dashboard data
     */
    getRealTimeDashboard() {
        const now = new Date();
        const lastHour = new Date(now.getTime() - (60 * 60 * 1000));

        const dashboard = {
            timestamp: now,
            lastHour: {
                totalOrders: 0,
                totalRevenue: 0,
                byChannel: {}
            },
            activeChannels: 0,
            topPerformers: [],
            alerts: []
        };

        // Get last hour data for each channel
        for (const [channelId, channel] of this.operationsService.channels) {
            const orders = this.orderTracker.getOrders({
                channel: channel.type,
                dateFrom: lastHour
            });

            const revenue = orders
                .filter(order => order.status === ORDER_STATUS.DELIVERED)
                .reduce((sum, order) => sum + order.totalAmount, 0);

            dashboard.lastHour.byChannel[channelId] = {
                orders: orders.length,
                revenue
            };

            dashboard.lastHour.totalOrders += orders.length;
            dashboard.lastHour.totalRevenue += revenue;

            if (orders.length > 0) {
                dashboard.activeChannels++;
            }
        }

        // Identify top performers
        const performers = Object.entries(dashboard.lastHour.byChannel)
            .map(([channelId, data]) => ({
                channelId,
                channelName: this.operationsService.channels.get(channelId)?.name,
                ...data,
                score: data.orders * 0.3 + data.revenue * 0.7
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        dashboard.topPerformers = performers;

        // Generate alerts for significant changes
        dashboard.alerts = this.generateRealTimeAlerts(dashboard);

        return dashboard;
    }

    /**
     * Generate real-time alerts for significant changes
     */
    generateRealTimeAlerts(dashboard) {
        const alerts = [];

        // Check for unusually high activity
        if (dashboard.lastHour.totalOrders > 50) { // Threshold for demo
            alerts.push({
                type: 'high_activity',
                priority: 'medium',
                message: `High activity detected: ${dashboard.lastHour.totalOrders} orders in the last hour`,
                timestamp: dashboard.timestamp
            });
        }

        // Check for channel performance anomalies
        for (const [channelId, data] of Object.entries(dashboard.lastHour.byChannel)) {
            if (data.orders > 20) { // Threshold for demo
                alerts.push({
                    type: 'channel_spike',
                    priority: 'low',
                    message: `${this.operationsService.channels.get(channelId)?.name} showing high activity: ${data.orders} orders`,
                    timestamp: dashboard.timestamp
                });
            }
        }

        return alerts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChannelAnalyticsService
    };
}
