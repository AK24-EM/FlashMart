/**
 * Business Metrics Service
 *
 * Handles advanced business analytics including RFM segmentation,
 * Customer Lifetime Value (CLV), and Net Promoter Score (NPS)
 * using Firebase Firestore for real-time data processing.
 */

class BusinessMetricsService {
    constructor() {
        this.db = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.realTimeListeners = new Map();
    }

    /**
     * Initialize the business metrics service
     */
    async initialize(db) {
        if (!db) {
            throw new Error('Database instance is required for Business Metrics Service');
        }

        this.db = db;
        console.log('📊 Business Metrics Service initialized');
        console.log('📊 Database instance:', !!this.db);

        // Set up real-time listeners for key metrics
        await this.setupRealTimeListeners();
    }

    /**
     * Set up real-time listeners for dashboard metrics
     */
    async setupRealTimeListeners() {
        try {
            // Listen for new orders to update metrics in real-time
            this.db.collection('orders')
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added' || change.type === 'modified') {
                            this.invalidateCache(['orders', 'revenue', 'clv', 'rfm']);
                            this.updateDashboardMetrics();
                        }
                    });
                });

            // Listen for user changes
            this.db.collection('users')
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added' || change.type === 'modified') {
                            this.invalidateCache(['customers', 'clv', 'rfm']);
                        }
                    });
                });

            console.log('✅ Real-time listeners set up');
        } catch (error) {
            console.error('❌ Error setting up real-time listeners:', error);
        }
    }

    /**
     * Update dashboard metrics (placeholder for real-time updates)
     */
    updateDashboardMetrics() {
        // This would trigger dashboard updates in real-time
        // For now, just log the update
        console.log('📊 Dashboard metrics updated');
    }

    /**
     * Get comprehensive business metrics dashboard data
     */
    async getBusinessMetricsDashboard() {
        try {
            const cacheKey = 'business_dashboard';
            const cached = this.getCachedData(cacheKey);

            if (cached) {
                console.log('📊 Returning cached dashboard data');
                return cached;
            }

            console.log('📊 Generating business metrics dashboard...');

            // Get all data in parallel to reduce total loading time
            console.log('📊 Fetching all dashboard data in parallel...');

            // Fetch orders and users in parallel first (they're needed by multiple calculations)
            const [ordersSnapshot, usersSnapshot] = await Promise.all([
                this.db.collection('orders').get(),
                this.db.collection('users').get()
            ]);

            const orders = [];
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                orders.push({
                    id: doc.id,
                    ...order,
                    createdAt: order.createdAt?.toDate()
                });
            });

            const users = [];
            usersSnapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });

            console.log(`📊 Loaded ${orders.length} orders and ${users.length} users in parallel`);

            // Now run other queries in parallel
            const [
                revenue,
                customers,
                nps,
                recentOrders,
                topProducts,
                dailyData
            ] = await Promise.all([
                this.getRevenueMetricsOptimized(orders),
                this.getCustomerMetricsOptimized(users, orders),
                this.getNPSMetrics(),
                this.getRecentOrdersOptimized(orders),
                this.getTopProductsOptimized(orders),
                this.getDailyRevenueDataOptimized(orders)
            ]);

            // Get RFM segments and customer insights
            const rfm = await this.getRFMSegmentsOptimized(users, orders);
            const customerInsights = await this.getCustomerInsightsOptimized(users, orders);

            const dashboardData = {
                timestamp: new Date(),
                revenue,
                customers,
                nps,
                rfm,
                recentOrders,
                topProducts,
                customerInsights,
                dailyData
            };

            this.setCachedData(cacheKey, dashboardData);
            console.log('✅ Business metrics dashboard generated');

            return dashboardData;

        } catch (error) {
            console.error('❌ Error generating business metrics dashboard:', error);
            throw error;
        }
    }

    /**
     * Get revenue metrics (optimized version)
     */
    async getRevenueMetricsOptimized(orders) {
        try {
            console.log('📊 Getting optimized revenue metrics...');

            if (!orders || orders.length === 0) {
                console.log('📊 No orders found, using sample revenue data for demonstration');
                return {
                    totalRevenue: 125000,
                    monthlyRevenue: 45000,
                    weeklyRevenue: 12000,
                    avgOrderValue: 850,
                    totalOrders: 147,
                    monthlyGrowth: 15.3
                };
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Calculate revenue metrics from provided orders
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            const totalOrders = orders.length;

            const monthlyOrders = orders.filter(order => order.createdAt >= startOfMonth);
            const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);

            const weeklyOrders = orders.filter(order => order.createdAt >= startOfWeek);
            const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + (order.total || 0), 0);

            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Calculate monthly growth (simplified)
            const monthlyGrowth = monthlyRevenue > 0 ? ((monthlyRevenue - weeklyRevenue) / weeklyRevenue) * 100 : 0;

            console.log('📊 Revenue metrics calculated:', { totalRevenue, totalOrders, monthlyRevenue });

            return {
                totalRevenue,
                monthlyRevenue,
                weeklyRevenue,
                avgOrderValue,
                totalOrders,
                monthlyGrowth
            };

        } catch (error) {
            console.error('❌ Error getting optimized revenue metrics:', error);
            throw error;
        }
    }

    /**
     * Get customer metrics (optimized version)
     */
    async getCustomerMetricsOptimized(users, orders) {
        try {
            if (!users || users.length === 0) {
                console.log('📊 No users found, using sample customer data for demonstration');
                return {
                    totalCustomers: 80,
                    avgCLV: 1250,
                    customerGrowthRate: 8.5
                };
            }

            const totalCustomers = users.length;

            // Group orders by user
            const userOrders = {};
            orders.forEach(order => {
                if (!userOrders[order.userId]) {
                    userOrders[order.userId] = [];
                }
                userOrders[order.userId].push(order);
            });

            // Calculate CLV for each user
            const userCLVs = Object.values(userOrders).map(userOrderList => {
                const totalSpent = userOrderList.reduce((sum, order) => sum + (order.total || 0), 0);
                const orderCount = userOrderList.length;
                return { totalSpent, orderCount };
            });

            const avgCLV = userCLVs.length > 0
                ? userCLVs.reduce((sum, user) => sum + user.totalSpent, 0) / userCLVs.length
                : 0;

            // Calculate customer growth rate (simplified)
            const customerGrowthRate = totalCustomers > 0 ? 5.2 : 0; // Placeholder

            return {
                totalCustomers,
                avgCLV,
                customerGrowthRate
            };

        } catch (error) {
            console.error('❌ Error getting optimized customer metrics:', error);
            throw error;
        }
    }

    /**
     * Get recent orders (optimized version)
     */
    async getRecentOrdersOptimized(orders, limit = 10) {
        try {
            if (!orders || orders.length === 0) {
                return [];
            }

            // Sort orders by creation date (most recent first)
            const sortedOrders = orders
                .filter(order => order.createdAt) // Filter out orders without valid dates
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, limit);

            return sortedOrders;

        } catch (error) {
            console.error('❌ Error getting optimized recent orders:', error);
            throw error;
        }
    }

    /**
     * Get top products (optimized version)
     */
    async getTopProductsOptimized(orders, limit = 5) {
        try {
            if (!orders || orders.length === 0) {
                return [];
            }

            // Count product sales
            const productSales = {};
            orders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                    });
                } else {
                    productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
                }
            });

            // Get top products
            const topProductIds = Object.entries(productSales)
                .sort(([,a], [,b]) => b - a)
                .slice(0, limit)
                .map(([productId]) => productId);

            const topProducts = [];
            for (const productId of topProductIds) {
                const product = await this.db.collection('products').doc(productId).get();
                if (product.exists) {
                    topProducts.push({
                        id: product.id,
                        ...product.data(),
                        sales: productSales[productId]
                    });
                }
            }

            return topProducts;

        } catch (error) {
            console.error('❌ Error getting optimized top products:', error);
            throw error;
        }
    }

    /**
     * Get daily revenue data (optimized version)
     */
    async getDailyRevenueDataOptimized(orders) {
        try {
            console.log('📊 Getting optimized daily revenue data...');

            if (!orders || orders.length === 0) {
                // Return sample data if no orders
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return days.map((dayName, index) => ({
                    date: new Date(),
                    revenue: [45000, 52000, 48000, 61000, 55000, 38000, 42000][index],
                    orders: [12, 15, 13, 18, 16, 10, 11][index],
                    dayName
                }));
            }

            // Group orders by day for the last 7 days
            const last7Days = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const dayOrders = orders.filter(order =>
                    order.createdAt >= dayStart && order.createdAt < dayEnd
                );

                const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

                last7Days.push({
                    date: dayStart,
                    revenue: dayRevenue,
                    orders: dayOrders.length,
                    dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()]
                });
            }

            console.log('📊 Daily revenue data calculated:', last7Days);

            return last7Days;

        } catch (error) {
            console.error('❌ Error getting optimized daily revenue data:', error);
            throw error;
        }
    }

    /**
     * Get RFM segments (optimized version)
     */
    async getRFMSegmentsOptimized(users, orders) {
        try {
            const rfmData = {
                segments: {
                    champions: [],
                    loyalCustomers: [],
                    potentialLoyalists: [],
                    newCustomers: [],
                    promising: [],
                    needsAttention: [],
                    aboutToSleep: [],
                    atRisk: [],
                    cantLoseThem: [],
                    hibernating: [],
                    lost: []
                },
                summary: {
                    total: users.length,
                    segmented: 0
                }
            };

            // Simplified RFM calculation
            users.forEach(user => {
                const userOrders = orders.filter(order => order.userId === user.id);

                if (userOrders.length === 0) {
                    rfmData.segments.newCustomers.push(user);
                    return;
                }

                const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                const lastOrder = Math.max(...userOrders.map(order => order.createdAt?.getTime() || 0));
                const daysSinceLastOrder = Math.floor((Date.now() - lastOrder) / (1000 * 60 * 60 * 24));

                // Simple RFM scoring (simplified)
                if (totalSpent > 50000 && daysSinceLastOrder < 30) {
                    rfmData.segments.champions.push(user);
                } else if (totalSpent > 25000 && daysSinceLastOrder < 60) {
                    rfmData.segments.loyalCustomers.push(user);
                } else if (totalSpent > 10000 && daysSinceLastOrder < 90) {
                    rfmData.segments.potentialLoyalists.push(user);
                } else if (daysSinceLastOrder < 30) {
                    rfmData.segments.promising.push(user);
                } else if (daysSinceLastOrder < 90) {
                    rfmData.segments.needsAttention.push(user);
                } else if (totalSpent > 10000) {
                    rfmData.segments.atRisk.push(user);
                } else {
                    rfmData.segments.hibernating.push(user);
                }
            });

            rfmData.summary.segmented = Object.values(rfmData.segments)
                .reduce((sum, segment) => sum + segment.length, 0);

            return rfmData;

        } catch (error) {
            console.error('❌ Error getting optimized RFM segments:', error);
            throw error;
        }
    }

    /**
     * Get customer insights (optimized version)
     */
    async getCustomerInsightsOptimized(users, orders) {
        try {
            // Calculate insights from provided data
            const tierDistribution = { bronze: 0, silver: 0, gold: 0 };

            // If no users exist, provide sample data for demonstration
            if (users.length === 0) {
                console.log('📊 No users found, using sample tier data for demonstration');
                tierDistribution.bronze = 45;
                tierDistribution.silver = 23;
                tierDistribution.gold = 12;
            } else {
                console.log('📊 Processing tier distribution for', users.length, 'users');
                users.forEach(user => {
                    const tier = user.tier || 'bronze';
                    if (tierDistribution.hasOwnProperty(tier)) {
                        tierDistribution[tier]++;
                    } else {
                        tierDistribution.bronze++; // Default to bronze for unknown tiers
                    }
                });
                console.log('📊 Calculated tier distribution:', tierDistribution);
            }

            const avgOrdersPerCustomer = users.length > 0 ? orders.length / users.length : 0;

            console.log('📊 Customer insights calculated:', {
                tierDistribution,
                avgOrdersPerCustomer,
                totalUsers: users.length,
                totalOrders: orders.length
            });

            return {
                tierDistribution,
                avgOrdersPerCustomer,
                totalUsers: users.length,
                totalOrders: orders.length
            };

        } catch (error) {
            console.error('❌ Error getting optimized customer insights:', error);
            throw error;
        }
    }

    /**
     * Get NPS metrics
     */
    async getNPSMetrics() {
        try {
            // Get NPS responses
            const npsSnapshot = await this.db.collection('nps_responses').get();
            const responses = [];

            npsSnapshot.forEach(doc => {
                responses.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            if (responses.length === 0) {
                console.log('📊 No NPS responses found, using sample NPS data for demonstration');
                return {
                    npsScore: 67,
                    trend: 5.2,
                    totalResponses: 156,
                    promoters: 94,
                    passives: 35,
                    detractors: 27
                };
            }

            // Calculate NPS
            const promoters = responses.filter(r => r.score >= 9).length;
            const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
            const detractors = responses.filter(r => r.score <= 6).length;

            const npsScore = Math.round(((promoters - detractors) / responses.length) * 100);

            // Calculate trend (simplified)
            const trend = 2.5; // Placeholder

            return {
                npsScore,
                trend,
                totalResponses: responses.length,
                promoters,
                passives,
                detractors
            };

        } catch (error) {
            console.error('❌ Error getting NPS metrics:', error);
            throw error;
        }
    }

    /**
     * Get RFM segments
     */
    async getRFMSegments() {
        try {
            // Get users and their orders
            const usersSnapshot = await this.db.collection('users').get();
            const ordersSnapshot = await this.db.collection('orders').get();

            const users = [];
            usersSnapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });

            const orders = [];
            ordersSnapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            // Calculate RFM for each user
            const rfmData = {
                segments: {
                    champions: [],
                    loyalCustomers: [],
                    potentialLoyalists: [],
                    newCustomers: [],
                    promising: [],
                    needsAttention: [],
                    aboutToSleep: [],
                    atRisk: [],
                    cantLoseThem: [],
                    hibernating: [],
                    lost: []
                },
                summary: {
                    total: users.length,
                    segmented: 0
                }
            };

            // Simplified RFM calculation
            users.forEach(user => {
                const userOrders = orders.filter(order => order.userId === user.id);

                if (userOrders.length === 0) {
                    rfmData.segments.newCustomers.push(user);
                    return;
                }

                const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                const lastOrder = Math.max(...userOrders.map(order => order.createdAt?.toDate().getTime() || 0));
                const daysSinceLastOrder = Math.floor((Date.now() - lastOrder) / (1000 * 60 * 60 * 24));

                // Simple RFM scoring (simplified)
                if (totalSpent > 50000 && daysSinceLastOrder < 30) {
                    rfmData.segments.champions.push(user);
                } else if (totalSpent > 25000 && daysSinceLastOrder < 60) {
                    rfmData.segments.loyalCustomers.push(user);
                } else if (totalSpent > 10000 && daysSinceLastOrder < 90) {
                    rfmData.segments.potentialLoyalists.push(user);
                } else if (daysSinceLastOrder < 30) {
                    rfmData.segments.promising.push(user);
                } else if (daysSinceLastOrder < 90) {
                    rfmData.segments.needsAttention.push(user);
                } else if (totalSpent > 10000) {
                    rfmData.segments.atRisk.push(user);
                } else {
                    rfmData.segments.hibernating.push(user);
                }
            });

            rfmData.summary.segmented = Object.values(rfmData.segments)
                .reduce((sum, segment) => sum + segment.length, 0);

            return rfmData;

        } catch (error) {
            console.error('❌ Error getting RFM segments:', error);
            throw error;
        }
    }

    /**
     * Get recent orders
     */
    async getRecentOrders(limit = 10) {
        try {
            const ordersSnapshot = await this.db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const orders = [];
            ordersSnapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            return orders;

        } catch (error) {
            console.error('❌ Error getting recent orders:', error);
            throw error;
        }
    }

    /**
     * Get top products
     */
    async getTopProducts(limit = 5) {
        try {
            const ordersSnapshot = await this.db.collection('orders').get();
            const orders = [];

            ordersSnapshot.forEach(doc => {
                orders.push(doc.data());
            });

            // Count product sales
            const productSales = {};
            orders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                    });
                } else {
                    productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
                }
            });

            // Get top products
            const topProductIds = Object.entries(productSales)
                .sort(([,a], [,b]) => b - a)
                .slice(0, limit)
                .map(([productId]) => productId);

            const topProducts = [];
            for (const productId of topProductIds) {
                const product = await this.db.collection('products').doc(productId).get();
                if (product.exists) {
                    topProducts.push({
                        id: product.id,
                        ...product.data(),
                        sales: productSales[productId]
                    });
                }
            }

            return topProducts;

        } catch (error) {
            console.error('❌ Error getting top products:', error);
            throw error;
        }
    }

    /**
     * Get customer insights
     */
    async getCustomerInsights() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const ordersSnapshot = await this.db.collection('orders').get();

            const users = [];
            usersSnapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });

            const orders = [];
            ordersSnapshot.forEach(doc => {
                orders.push(doc.data());
            });

            // Calculate insights
            const tierDistribution = { bronze: 0, silver: 0, gold: 0 };
            
            // If no users exist, provide sample data for demonstration
            if (users.length === 0) {
                console.log('📊 No users found, using sample tier data for demonstration');
                tierDistribution.bronze = 45;
                tierDistribution.silver = 23;
                tierDistribution.gold = 12;
            } else {
                console.log('📊 Processing tier distribution for', users.length, 'users');
                users.forEach(user => {
                    const tier = user.tier || 'bronze';
                    if (tierDistribution.hasOwnProperty(tier)) {
                        tierDistribution[tier]++;
                    } else {
                        tierDistribution.bronze++; // Default to bronze for unknown tiers
                    }
                });
                console.log('📊 Calculated tier distribution:', tierDistribution);
            }

            const avgOrdersPerCustomer = users.length > 0 ? orders.length / users.length : 0;

            console.log('📊 Customer insights calculated:', {
                tierDistribution,
                avgOrdersPerCustomer,
                totalUsers: users.length,
                totalOrders: orders.length
            });

            return {
                tierDistribution,
                avgOrdersPerCustomer,
                totalUsers: users.length,
                totalOrders: orders.length
            };

        } catch (error) {
            console.error('❌ Error getting customer insights:', error);
            throw error;
        }
    }

    /**
     * Get daily revenue data for the last 7 days
     */
    async getDailyRevenueData() {
        try {
            console.log('📊 Getting daily revenue data...');

            const ordersSnapshot = await this.db.collection('orders').get();
            const orders = [];

            ordersSnapshot.forEach(doc => {
                orders.push({
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            // Group orders by day for the last 7 days
            const last7Days = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const dayOrders = orders.filter(order =>
                    order.createdAt >= dayStart && order.createdAt < dayEnd
                );

                const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

                last7Days.push({
                    date: dayStart,
                    revenue: dayRevenue,
                    orders: dayOrders.length,
                    dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()]
                });
            }

            console.log('📊 Daily revenue data calculated:', last7Days);

            return last7Days;

        } catch (error) {
            console.error('❌ Error getting daily revenue data:', error);
            throw error;
        }
    }

    // Cache management methods
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

    invalidateCache(keys) {
        keys.forEach(key => {
            if (key === 'all') {
                this.cache.clear();
            } else {
                this.cache.delete(key);
                // Also clear related composite keys
                this.cache.delete(`business_dashboard`);
            }
        });
    }

    // Export methods
    async exportBusinessReport(format = 'json') {
        const dashboardData = await this.getBusinessMetricsDashboard();

        if (format === 'csv') {
            return this.generateCSVReport(dashboardData);
        }

        return dashboardData;
    }

    generateCSVReport(data) {
        const csvData = [
            ['Metric', 'Value', 'Category'],
            ['Total Revenue', data.revenue.totalRevenue, 'Revenue'],
            ['Total Customers', data.customers.totalCustomers, 'Customers'],
            ['Average CLV', data.customers.avgCLV, 'Customers'],
            ['NPS Score', data.nps.npsScore, 'Satisfaction'],
            ['Champions', data.rfm.segments.champions.length, 'RFM'],
            ['Loyal Customers', data.rfm.segments.loyalCustomers.length, 'RFM'],
            ['At Risk', data.rfm.segments.atRisk.length, 'RFM']
        ];

        return csvData.map(row => row.join(',')).join('\n');
    }
}

// Create global instance
const businessMetricsService = new BusinessMetricsService();
