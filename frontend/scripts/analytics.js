import activityTracker from './activity-tracker.js';

// Sliding Window Manager for tracking recent activities
class SlidingWindowManager {
    constructor(windowSize = 100, timeWindowMs = 24 * 60 * 60 * 1000) {
        this.windowSize = windowSize; // Max number of activities to keep
        this.timeWindowMs = timeWindowMs; // Time window in milliseconds (default 24 hours)
        this.activities = [];
    }

    // Add a new activity to the window
    addActivity(activity) {
        const now = Date.now();
        
        // Remove activities outside the time window
        this.activities = this.activities.filter(
            a => (now - a.timestamp) <= this.timeWindowMs
        );
        
        // Add new activity with timestamp
        this.activities.unshift({
            ...activity,
            timestamp: now
        });
        
        // Trim to window size
        if (this.activities.length > this.windowSize) {
            this.activities = this.activities.slice(0, this.windowSize);
        }
    }
    
    // Get recent activities (optionally filtered by type)
    getRecentActivities(limit = 20, type = null) {
        const now = Date.now();
        let activities = this.activities;
        
        // Filter by type if specified
        if (type) {
            activities = activities.filter(a => a.type === type);
        }
        
        // Filter by time window and apply limit
        return activities
            .filter(a => (now - a.timestamp) <= this.timeWindowMs)
            .slice(0, limit);
    }
    
    // Get activity counts by type in the current window
    getActivityCounts() {
        const now = Date.now();
        const counts = {};
        
        this.activities
            .filter(a => (now - a.timestamp) <= this.timeWindowMs)
            .forEach(activity => {
                counts[activity.type] = (counts[activity.type] || 0) + 1;
            });
            
        return counts;
    }
}

// Analytics and insights management
class AnalyticsManager {
    constructor() {
        this.activityTracker = activityTracker;
        this.activityWindow = new SlidingWindowManager(200); // Keep last 200 activities
        this.init();
    }
    
    async init() {
        // Start tracking page views by default
        this.trackPageView();
        
        // Set up event listeners for common user interactions
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Track cart additions
        document.addEventListener('addToCart', (e) => {
            this.trackEvent('add_to_cart', {
                productId: e.detail?.productId,
                quantity: e.detail?.quantity || 1
            });        
        });
        
        // Track purchases
        document.addEventListener('purchaseComplete', (e) => {
            this.trackEvent('purchase', {
                orderId: e.detail?.orderId,
                amount: e.detail?.amount,
                items: e.detail?.items?.length || 0
            });
        });
    }
    
    /**
     * Track a page view
     * @param {string} page - Page name/identifier
     */
    trackPageView(page = document.title) {
        return this.trackEvent('page_view', { page });
    }
    
    /**
     * Track a custom event
     * @param {string} eventType - Type of event
     * @param {object} metadata - Additional event data
     */
    trackEvent(eventType, metadata = {}) {
        const eventData = {
            ...metadata,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        // Add to sliding window for recent activities
        this.activityWindow.addActivity({
            type: eventType,
            ...eventData
        });
        
        return this.activityTracker.trackEvent(eventType, eventData);
    }
    
    // Get recent activities for admin dashboard
    getRecentActivities(limit = 10) {
        return this.activityWindow.getRecentActivities(limit);
    }
    
    // Get activity metrics for dashboard
    getActivityMetrics() {
        const counts = this.activityWindow.getActivityCounts();
        const now = Date.now();
        
        // Calculate activity in last hour vs previous hour
        const lastHour = this.activityWindow.activities
            .filter(a => (now - a.timestamp) <= 3600000)
            .length;
            
        const prevHour = this.activityWindow.activities
            .filter(a => (now - a.timestamp) > 3600000 && (now - a.timestamp) <= 7200000)
            .length;
            
        const trend = prevHour > 0 
            ? ((lastHour - prevHour) / prevHour) * 100 
            : lastHour > 0 ? 100 : 0;
            
        return {
            totalActivities: this.activityWindow.activities.length,
            activityCounts: counts,
            lastHourActivity: lastHour,
            activityTrend: Math.round(trend * 10) / 10 // Round to 1 decimal place
        };
    }

    async generateReports() {
        const analytics = await dataManager.getAnalytics();
        if (!analytics) return null;

        return {
            salesReport: this.generateSalesReport(analytics),
            customerReport: this.generateCustomerReport(analytics),
            productReport: this.generateProductReport(analytics),
            flashSaleReport: this.generateFlashSaleReport(analytics),
            rfmAnalysis: this.generateRFMAnalysis(analytics),
            cohortAnalysis: this.generateCohortAnalysis(analytics)
        };
    }
    
    generateSalesReport(analytics) {
        const orders = analytics.orders || [];
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        // Filter orders by time periods
        const totalOrders = orders.length;
        const monthlyOrders = orders.filter(order => new Date(order.createdAt) >= lastMonth).length;
        const weeklyOrders = orders.filter(order => new Date(order.createdAt) >= lastWeek).length;
        const dailyOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === now.toDateString();
        }).length;
        
        // Revenue calculations
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const monthlyRevenue = orders
            .filter(order => new Date(order.createdAt) >= lastMonth)
            .reduce((sum, order) => sum + order.total, 0);
        const weeklyRevenue = orders
            .filter(order => new Date(order.createdAt) >= lastWeek)
            .reduce((sum, order) => sum + order.total, 0);
        
        // Average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Sales by category
        const salesByCategory = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const product = dataManager.getProduct(item.productId);
                if (product) {
                    if (!salesByCategory[product.category]) {
                        salesByCategory[product.category] = {
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    salesByCategory[product.category].quantity += item.quantity;
                    salesByCategory[product.category].revenue += item.price * item.quantity;
                }
            });
        });
        
        // Growth rates
        const monthlyGrowthRate = this.calculateGrowthRate('monthly');
        const weeklyGrowthRate = this.calculateGrowthRate('weekly');
        
        return {
            totalOrders,
            monthlyOrders,
            weeklyOrders,
            dailyOrders,
            totalRevenue,
            monthlyRevenue,
            weeklyRevenue,
            avgOrderValue,
            salesByCategory,
            monthlyGrowthRate,
            weeklyGrowthRate
        };
    }
    
    generateCustomerReport(analytics) {
        const users = (analytics.users || []).filter(u => u.role !== 'admin');
        const orders = analytics.orders || [];
        
        // Customer segmentation by tier
        const tierDistribution = {
            bronze: users.filter(u => u.tier === 'bronze').length,
            silver: users.filter(u => u.tier === 'silver').length,
            gold: users.filter(u => u.tier === 'gold').length
        };
        
        // Customer lifetime value analysis
        const clvData = users.map(user => ({
            userId: user.id,
            name: user.name,
            tier: user.tier,
            totalSpent: user.totalSpent,
            loyaltyPoints: user.loyaltyPoints,
            orderCount: orders.filter(o => o.userId === user.id).length,
            clv: this.calculateCustomerCLV(user),
            rfmScore: this.calculateRFMScore(user)
        })).sort((a, b) => b.clv - a.clv);
        
        // Top customers by value
        const topCustomers = clvData.slice(0, 10);
        
        // Customer acquisition and retention
        const newCustomers = this.getNewCustomers();
        const returningCustomers = this.getReturningCustomers();
        const churnRate = this.calculateChurnRate();
        
        // Customer satisfaction proxy (based on repeat purchases)
        const customerSatisfaction = this.calculateCustomerSatisfaction();
        
        return {
            totalCustomers: users.length,
            tierDistribution,
            topCustomers,
            newCustomers,
            returningCustomers,
            churnRate,
            customerSatisfaction,
            avgCustomerValue: clvData.reduce((sum, c) => sum + c.clv, 0) / users.length
        };
    }
    
    generateProductReport(analytics) {
        const products = analytics.products || [];
        const orders = analytics.orders || [];
        
        // Product sales performance
        const productPerformance = products.map(product => {
            const sales = orders.reduce((total, order) => {
                const item = order.items.find(i => i.productId === product.id);
                return total + (item ? item.quantity : 0);
            }, 0);
            
            const revenue = orders.reduce((total, order) => {
                const item = order.items.find(i => i.productId === product.id);
                return total + (item ? item.price * item.quantity : 0);
            }, 0);
            
            return {
                ...product,
                sales,
                revenue,
                conversionRate: this.calculateProductConversionRate(product.id),
                profitMargin: this.calculateProfitMargin(product)
            };
        }).sort((a, b) => b.sales - a.sales);
        
        // Inventory analysis
        const inventoryTurnover = this.calculateInventoryTurnover();
        const slowMovingProducts = productPerformance.filter(p => p.sales === 0);
        const fastMovingProducts = productPerformance.slice(0, 5);
        
        // Category performance
        const categoryPerformance = this.getCategoryPerformance();
        
        return {
            totalProducts: products.length,
            productPerformance,
            fastMovingProducts,
            slowMovingProducts,
            inventoryTurnover,
            categoryPerformance
        };
    }
    
    generateFlashSaleReport() {
        const products = dataManager.products;
        const orders = dataManager.orders;
        const flashSaleProducts = products.filter(p => p.isFlashSale);
        
        // Flash sale performance
        const flashSalePerformance = flashSaleProducts.map(product => {
            const flashSales = orders.reduce((total, order) => {
                const item = order.items.find(i => i.productId === product.id && i.isFlashSale);
                return total + (item ? item.quantity : 0);
            }, 0);
            
            const flashRevenue = orders.reduce((total, order) => {
                const item = order.items.find(i => i.productId === product.id && i.isFlashSale);
                return total + (item ? item.price * item.quantity : 0);
            }, 0);
            
            const conversionRate = this.calculateFlashSaleConversionRate(product.id);
            const timeRemaining = new Date(product.flashSaleEnd) - new Date();
            
            return {
                ...product,
                flashSales,
                flashRevenue,
                conversionRate,
                timeRemaining: Math.max(0, timeRemaining),
                stockSoldPercentage: ((product.stock - product.flashSaleStock) / product.stock) * 100
            };
        });
        
        // Queue analysis
        const queueStats = queueManager.getQueueStats();
        const avgWaitTime = queueStats.avgWaitTime;
        const queueDropOffRate = this.calculateQueueDropOffRate();
        
        return {
            activeFlashSales: flashSaleProducts.length,
            flashSalePerformance,
            totalFlashRevenue: flashSalePerformance.reduce((sum, p) => sum + p.flashRevenue, 0),
            queueStats,
            avgWaitTime,
            queueDropOffRate,
            successRate: this.calculateFlashSaleSuccessRate()
        };
    }
    
    generateRFMAnalysis() {
        const users = dataManager.users.filter(u => u.role !== 'admin');
        const orders = dataManager.orders;
        const now = new Date();
        
        const rfmData = users.map(user => {
            const userOrders = orders.filter(o => o.userId === user.id);
            
            // Recency: Days since last purchase
            const lastOrder = userOrders.length > 0 ? 
                Math.max(...userOrders.map(o => new Date(o.createdAt).getTime())) : 0;
            const recency = lastOrder > 0 ? Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24)) : 999;
            
            // Frequency: Number of orders
            const frequency = userOrders.length;
            
            // Monetary: Total spent
            const monetary = user.totalSpent;
            
            // Calculate RFM scores (1-5 scale)
            const rScore = this.calculateRScore(recency);
            const fScore = this.calculateFScore(frequency);
            const mScore = this.calculateMScore(monetary);
            
            // RFM segment
            const segment = this.getRFMSegment(rScore, fScore, mScore);
            
            return {
                userId: user.id,
                name: user.name,
                recency,
                frequency,
                monetary,
                rScore,
                fScore,
                mScore,
                rfmScore: `${rScore}${fScore}${mScore}`,
                segment
            };
        });
        
        // Segment distribution
        const segmentDistribution = {};
        rfmData.forEach(item => {
            segmentDistribution[item.segment] = (segmentDistribution[item.segment] || 0) + 1;
        });
        
        return {
            rfmData,
            segmentDistribution,
            champions: rfmData.filter(item => item.segment === 'Champions'),
            loyalCustomers: rfmData.filter(item => item.segment === 'Loyal Customers'),
            potentialLoyalists: rfmData.filter(item => item.segment === 'Potential Loyalists'),
            atRisk: rfmData.filter(item => item.segment === 'At Risk'),
            cantLoseThem: rfmData.filter(item => item.segment === "Can't Lose Them")
        };
    }
    
    generateCohortAnalysis() {
        const orders = dataManager.orders;
        const users = dataManager.users.filter(u => u.role !== 'admin');
        
        // Group users by join month
        const cohorts = {};
        users.forEach(user => {
            const joinMonth = new Date(user.joinDate).toISOString().substring(0, 7);
            if (!cohorts[joinMonth]) {
                cohorts[joinMonth] = [];
            }
            cohorts[joinMonth].push(user);
        });
        
        // Calculate retention rates for each cohort
        const cohortAnalysis = {};
        Object.keys(cohorts).forEach(cohortMonth => {
            const cohortUsers = cohorts[cohortMonth];
            const cohortSize = cohortUsers.length;
            
            cohortAnalysis[cohortMonth] = {
                size: cohortSize,
                retention: {}
            };
            
            // Calculate retention for each month after join
            for (let month = 0; month < 12; month++) {
                const targetMonth = new Date(cohortMonth);
                targetMonth.setMonth(targetMonth.getMonth() + month);
                
                const activeUsers = cohortUsers.filter(user => {
                    const userOrders = orders.filter(o => o.userId === user.id);
                    return userOrders.some(order => {
                        const orderMonth = new Date(order.createdAt).toISOString().substring(0, 7);
                        return orderMonth === targetMonth.toISOString().substring(0, 7);
                    });
                }).length;
                
                cohortAnalysis[cohortMonth].retention[`month_${month}`] = {
                    activeUsers,
                    retentionRate: cohortSize > 0 ? (activeUsers / cohortSize) * 100 : 0
                };
            }
        });
        
        return cohortAnalysis;
    }
    
    // Helper methods for calculations
    calculateGrowthRate(period) {
        const orders = dataManager.orders;
        const now = new Date();
        let currentPeriod, previousPeriod;
        
        if (period === 'monthly') {
            currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
            previousPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        } else {
            currentPeriod = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            previousPeriod = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
        }
        
        const currentRevenue = orders
            .filter(order => new Date(order.createdAt) >= currentPeriod)
            .reduce((sum, order) => sum + order.total, 0);
            
        const previousRevenue = orders
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= previousPeriod && orderDate < currentPeriod;
            })
            .reduce((sum, order) => sum + order.total, 0);
        
        return previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    }
    
    calculateCustomerCLV(user) {
        // Simple CLV calculation
        const averageOrderValue = user.totalSpent / Math.max(1, dataManager.orders.filter(o => o.userId === user.id).length);
        const purchaseFrequency = this.calculatePurchaseFrequency(user);
        const customerLifespan = this.estimateCustomerLifespan(user);
        
        return averageOrderValue * purchaseFrequency * customerLifespan;
    }
    
    calculateRFMScore(user) {
        const orders = dataManager.orders.filter(o => o.userId === user.id);
        const now = new Date();
        
        // Recency
        const lastOrder = orders.length > 0 ? 
            Math.max(...orders.map(o => new Date(o.createdAt).getTime())) : 0;
        const recency = lastOrder > 0 ? Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24)) : 999;
        
        // Frequency
        const frequency = orders.length;
        
        // Monetary
        const monetary = user.totalSpent;
        
        return {
            recency: this.calculateRScore(recency),
            frequency: this.calculateFScore(frequency),
            monetary: this.calculateMScore(monetary)
        };
    }
    
    calculateRScore(recency) {
        if (recency <= 30) return 5;
        if (recency <= 60) return 4;
        if (recency <= 90) return 3;
        if (recency <= 180) return 2;
        return 1;
    }
    
    calculateFScore(frequency) {
        if (frequency >= 10) return 5;
        if (frequency >= 5) return 4;
        if (frequency >= 3) return 3;
        if (frequency >= 2) return 2;
        return 1;
    }
    
    calculateMScore(monetary) {
        if (monetary >= 50000) return 5;
        if (monetary >= 25000) return 4;
        if (monetary >= 10000) return 3;
        if (monetary >= 5000) return 2;
        return 1;
    }
    
    getRFMSegment(rScore, fScore, mScore) {
        const score = rScore + fScore + mScore;
        
        if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'Champions';
        if (rScore >= 3 && fScore >= 3 && mScore >= 3) return 'Loyal Customers';
        if (rScore >= 3 && fScore <= 2 && mScore >= 3) return 'Potential Loyalists';
        if (rScore <= 2 && fScore >= 3 && mScore >= 3) return "Can't Lose Them";
        if (rScore <= 2 && fScore <= 2 && mScore >= 3) return 'At Risk';
        if (rScore >= 3 && fScore <= 2 && mScore <= 2) return 'New Customers';
        return 'Others';
    }
    
    getNewCustomers() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return dataManager.users.filter(user => 
            user.role !== 'admin' && new Date(user.joinDate) >= thirtyDaysAgo
        ).length;
    }
    
    getReturningCustomers() {
        const orders = dataManager.orders;
        const returningUsers = new Set();
        
        dataManager.users.forEach(user => {
            const userOrders = orders.filter(o => o.userId === user.id);
            if (userOrders.length > 1) {
                returningUsers.add(user.id);
            }
        });
        
        return returningUsers.size;
    }
    
    calculateChurnRate() {
        // Users who haven't ordered in 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const totalUsers = dataManager.users.filter(u => u.role !== 'admin').length;
        const churned = dataManager.users.filter(user => {
            if (user.role === 'admin') return false;
            const userOrders = dataManager.orders.filter(o => o.userId === user.id);
            if (userOrders.length === 0) return true;
            
            const lastOrderDate = Math.max(...userOrders.map(o => new Date(o.createdAt).getTime()));
            return lastOrderDate < ninetyDaysAgo.getTime();
        }).length;
        
        return totalUsers > 0 ? (churned / totalUsers) * 100 : 0;
    }
    
    calculateCustomerSatisfaction() {
        // Proxy: percentage of customers who made repeat purchases
        const totalCustomers = dataManager.users.filter(u => u.role !== 'admin').length;
        const repeatCustomers = this.getReturningCustomers();
        
        return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    }
    
    calculateProductConversionRate(productId) {
        // Simplified: orders containing product / total views (we don't track views, so use orders)
        const orders = dataManager.orders;
        const productOrders = orders.filter(order => 
            order.items.some(item => item.productId === productId)
        ).length;
        
        // Assume 100 views per order as a rough estimate
        const estimatedViews = productOrders * 10;
        return estimatedViews > 0 ? (productOrders / estimatedViews) * 100 : 0;
    }
    
    calculateProfitMargin(product) {
        // Simplified: (selling price - cost) / selling price * 100
        // Assume cost is 70% of original price
        const cost = product.originalPrice * 0.7;
        const sellingPrice = product.isFlashSale ? product.flashSalePrice : product.price;
        
        return ((sellingPrice - cost) / sellingPrice) * 100;
    }
    
    calculateInventoryTurnover() {
        // Simplified calculation
        const totalProducts = dataManager.products.length;
        const soldProducts = dataManager.orders.reduce((total, order) => {
            return total + order.items.reduce((orderTotal, item) => orderTotal + item.quantity, 0);
        }, 0);
        
        return totalProducts > 0 ? soldProducts / totalProducts : 0;
    }
    
    getCategoryPerformance() {
        const categories = {};
        const orders = dataManager.orders;
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const product = dataManager.getProduct(item.productId);
                if (product) {
                    if (!categories[product.category]) {
                        categories[product.category] = {
                            sales: 0,
                            revenue: 0,
                            products: 0
                        };
                    }
                    categories[product.category].sales += item.quantity;
                    categories[product.category].revenue += item.price * item.quantity;
                }
            });
        });
        
        // Count products per category
        dataManager.products.forEach(product => {
            if (categories[product.category]) {
                categories[product.category].products++;
            } else {
                categories[product.category] = {
                    sales: 0,
                    revenue: 0,
                    products: 1
                };
            }
        });
        
        return categories;
    }
    
    calculateFlashSaleConversionRate(productId) {
        const queueLength = dataManager.queue.filter(item => item.productId === productId).length;
        const orders = dataManager.orders;
        const sales = orders.reduce((total, order) => {
            const item = order.items.find(i => i.productId === productId && i.isFlashSale);
            return total + (item ? item.quantity : 0);
        }, 0);
        
        const totalInterest = queueLength + sales;
        return totalInterest > 0 ? (sales / totalInterest) * 100 : 0;
    }
    
    calculateQueueDropOffRate() {
        // Simplified: assume 20% of people who join queue don't complete purchase
        return 20; // This would be calculated from actual queue data in a real system
    }
    
    calculateFlashSaleSuccessRate() {
        const flashSaleProducts = dataManager.products.filter(p => p.isFlashSale);
        if (flashSaleProducts.length === 0) return 0;
        
        const successfulSales = flashSaleProducts.filter(product => {
            const soldOut = product.flashSaleStock === 0;
            const timeUp = new Date() > new Date(product.flashSaleEnd);
            const hasSales = dataManager.orders.some(order => 
                order.items.some(item => item.productId === product.id && item.isFlashSale)
            );
            return soldOut || (timeUp && hasSales);
        }).length;
        
        return (successfulSales / flashSaleProducts.length) * 100;
    }
    
    calculatePurchaseFrequency(user) {
        const userOrders = dataManager.orders.filter(o => o.userId === user.id);
        if (userOrders.length <= 1) return 1;
        
        const firstOrder = Math.min(...userOrders.map(o => new Date(o.createdAt).getTime()));
        const lastOrder = Math.max(...userOrders.map(o => new Date(o.createdAt).getTime()));
        const daysDiff = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24);
        
        return daysDiff > 0 ? userOrders.length / (daysDiff / 30) : 1; // Orders per month
    }
    
    estimateCustomerLifespan(user) {
        // Simple estimation based on tier and activity
        const baseLifespan = 12; // months
        const tierMultiplier = {
            'bronze': 1,
            'silver': 1.5,
            'gold': 2
        };
        
        return baseLifespan * (tierMultiplier[user.tier] || 1);
    }
    
    // Method to generate and download reports
    generateCSVReport(reportType) {
        let data = [];
        let filename = '';
        
        switch (reportType) {
            case 'sales':
                const salesReport = this.generateSalesReport();
                data = this.formatSalesDataForCSV(salesReport);
                filename = 'sales_report.csv';
                break;
            case 'customers':
                const customerReport = this.generateCustomerReport();
                data = this.formatCustomerDataForCSV(customerReport);
                filename = 'customer_report.csv';
                break;
            case 'products':
                const productReport = this.generateProductReport();
                data = this.formatProductDataForCSV(productReport);
                filename = 'product_report.csv';
                break;
            case 'rfm':
                const rfmReport = this.generateRFMAnalysis();
                data = this.formatRFMDataForCSV(rfmReport);
                filename = 'rfm_analysis.csv';
                break;
        }
        
        this.downloadCSV(data, filename);
    }
    
    formatSalesDataForCSV(salesReport) {
        return [
            ['Metric', 'Value'],
            ['Total Orders', salesReport.totalOrders],
            ['Total Revenue', salesReport.totalRevenue],
            ['Average Order Value', salesReport.avgOrderValue],
            ['Monthly Growth Rate', salesReport.monthlyGrowthRate + '%'],
            ['Weekly Growth Rate', salesReport.weeklyGrowthRate + '%']
        ];
    }
    
    formatCustomerDataForCSV(customerReport) {
        const headers = ['Customer Name', 'Tier', 'Total Spent', 'Loyalty Points', 'CLV', 'Order Count'];
        const rows = customerReport.topCustomers.map(customer => [
            customer.name,
            customer.tier,
            customer.totalSpent,
            customer.loyaltyPoints,
            customer.clv,
            customer.orderCount
        ]);
        
        return [headers, ...rows];
    }
    
    formatProductDataForCSV(productReport) {
        const headers = ['Product Name', 'Category', 'Sales', 'Revenue', 'Stock', 'Conversion Rate'];
        const rows = productReport.productPerformance.map(product => [
            product.name,
            product.category,
            product.sales,
            product.revenue,
            product.stock,
            product.conversionRate.toFixed(2) + '%'
        ]);
        
        return [headers, ...rows];
    }
    
    formatRFMDataForCSV(rfmReport) {
        const headers = ['Customer Name', 'Recency', 'Frequency', 'Monetary', 'RFM Score', 'Segment'];
        const rows = rfmReport.rfmData.map(item => [
            item.name,
            item.recency,
            item.frequency,
            item.monetary,
            item.rfmScore,
            item.segment
        ]);
        
        return [headers, ...rows];
    }
    
    downloadCSV(data, filename) {
        const csv = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        window.URL.revokeObjectURL(url);
        showNotification(`${filename} downloaded successfully!`, 'success');
    }

    renderSalesChart(salesReport) {
        const ctx = document.getElementById('sales-performance-chart');
        if (!ctx) return;

        if (!salesReport || !salesReport.salesByCategory) return;

        // Destroy existing chart instance if it exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(salesReport.salesByCategory),
                datasets: [{
                    label: 'Revenue by Category',
                    data: Object.values(salesReport.salesByCategory).map(c => c.revenue),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Global analytics manager
const analyticsManager = new AnalyticsManager();
