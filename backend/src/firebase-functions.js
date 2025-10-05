/**
 * Firebase Cloud Functions for Business Analytics
 *
 * This file contains Firebase Cloud Functions that can be deployed
 * to handle complex analytics aggregations more efficiently than client-side queries.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Helper function to calculate RFM scores
function calculateRFMScores(orders, currentDate) {
    if (orders.length === 0) {
        return { recency: 999, frequency: 0, monetary: 0, rScore: 1, fScore: 1, mScore: 1 };
    }

    // Recency: Days since last purchase
    const lastOrderDate = Math.max(...orders.map(order => order.createdAt._seconds * 1000));
    const recency = Math.floor((currentDate - lastOrderDate) / (1000 * 60 * 60 * 24));

    // Frequency: Number of orders
    const frequency = orders.length;

    // Monetary: Total spent
    const monetary = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate scores (1-5 scale)
    const rScore = recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 180 ? 2 : 1;
    const fScore = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1;
    const mScore = monetary >= 50000 ? 5 : monetary >= 25000 ? 4 : monetary >= 10000 ? 3 : monetary >= 5000 ? 2 : 1;

    return { recency, frequency, monetary, rScore, fScore, mScore };
}

// Helper function to get RFM segment
function getRFMSegment(rScore, fScore, mScore) {
    const score = rScore + fScore + mScore;

    if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'Champions';
    if (rScore >= 3 && fScore >= 3 && mScore >= 3) return 'Loyal Customers';
    if (rScore >= 3 && fScore <= 2 && mScore >= 3) return 'Potential Loyalists';
    if (rScore <= 2 && fScore >= 3 && mScore >= 3) return "Can't Lose Them";
    if (rScore <= 2 && fScore <= 2 && mScore >= 3) return 'At Risk';
    if (rScore >= 3 && fScore <= 2 && mScore <= 2) return 'New Customers';
    return 'Others';
}

// Cloud Function to calculate comprehensive business metrics
exports.calculateBusinessMetrics = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();
    const currentDate = Date.now();

    try {
        // Get all users and orders
        const [usersSnapshot, ordersSnapshot] = await Promise.all([
            db.collection('users').get(),
            db.collection('orders').get()
        ]);

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter out admin users for customer metrics
        const customers = users.filter(user => user.role !== 'admin');

        // Calculate revenue metrics
        const thirtyDaysAgo = new Date(currentDate - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(currentDate - (7 * 24 * 60 * 60 * 1000));

        const monthlyOrders = orders.filter(order => order.createdAt.toDate() >= thirtyDaysAgo);
        const weeklyOrders = orders.filter(order => order.createdAt.toDate() >= sevenDaysAgo);

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
        const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.total, 0);

        // Calculate customer metrics
        const customersWithCLV = customers.map(customer => {
            const customerOrders = orders.filter(order => order.userId === customer.id);
            const clv = calculateCLV(customer, customerOrders);
            return {
                id: customer.id,
                name: customer.name,
                clv: Math.round(clv * 100) / 100,
                tier: customer.tier,
                orderCount: customerOrders.length
            };
        });

        customersWithCLV.sort((a, b) => b.clv - a.clv);

        // Calculate RFM analysis
        const rfmData = customers.map(customer => {
            const customerOrders = orders.filter(order => order.userId === customer.id);
            const rfmScores = calculateRFMScores(customerOrders, currentDate);
            const segment = getRFMSegment(rfmScores.rScore, rfmScores.fScore, rfmScores.mScore);

            return {
                customerId: customer.id,
                name: customer.name,
                ...rfmScores,
                segment
            };
        });

        // Calculate segment distribution
        const segmentDistribution = {};
        rfmData.forEach(customer => {
            segmentDistribution[customer.segment] = (segmentDistribution[customer.segment] || 0) + 1;
        });

        // Calculate NPS data
        const npsSnapshot = await db.collection('nps_responses')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(currentDate - (90 * 24 * 60 * 60 * 1000))))
            .get();

        const npsResponses = npsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const promoters = npsResponses.filter(r => r.score >= 9).length;
        const passives = npsResponses.filter(r => r.score >= 7 && r.score <= 8).length;
        const detractors = npsResponses.filter(r => r.score <= 6).length;

        const npsScore = npsResponses.length > 0 ?
            Math.round(((promoters - detractors) / npsResponses.length) * 100) : 0;

        return {
            revenue: {
                totalRevenue,
                monthlyRevenue,
                weeklyRevenue,
                avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                totalOrders: orders.length,
                monthlyOrders: monthlyOrders.length,
                weeklyOrders: weeklyOrders.length
            },
            customers: {
                totalCustomers: customers.length,
                avgCLV: customersWithCLV.length > 0 ?
                    customersWithCLV.reduce((sum, c) => sum + c.clv, 0) / customersWithCLV.length : 0,
                topCustomers: customersWithCLV.slice(0, 10)
            },
            rfm: {
                rfmData,
                segmentDistribution,
                totalCustomers: customers.length
            },
            nps: {
                npsScore,
                promoters,
                passives,
                detractors,
                totalResponses: npsResponses.length
            }
        };

    } catch (error) {
        console.error('Error calculating business metrics:', error);
        throw new functions.https.HttpsError('internal', 'Failed to calculate business metrics');
    }
});

// Helper function to calculate Customer Lifetime Value
function calculateCLV(customer, orders) {
    if (orders.length === 0) return 0;

    // Average order value
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalSpent / orders.length;

    // Purchase frequency (orders per month)
    const firstOrder = Math.min(...orders.map(order => order.createdAt._seconds * 1000));
    const lastOrder = Math.max(...orders.map(order => order.createdAt._seconds * 1000));
    const customerLifespanDays = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24);
    const purchaseFrequency = customerLifespanDays > 0 ?
        (orders.length / (customerLifespanDays / 30)) : 1;

    // Estimated customer lifespan based on tier and activity
    const baseLifespan = 12; // months
    const tierMultiplier = { bronze: 1, silver: 1.5, gold: 2 };
    const estimatedLifespan = baseLifespan * (tierMultiplier[customer.tier] || 1);

    // Profit margin assumption (30%)
    const profitMargin = 0.3;

    return avgOrderValue * purchaseFrequency * estimatedLifespan * profitMargin;
}

// Cloud Function to generate advanced customer insights
exports.generateCustomerInsights = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    try {
        const [usersSnapshot, ordersSnapshot] = await Promise.all([
            db.collection('users').get(),
            db.collection('orders').get()
        ]);

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const customers = users.filter(user => user.role !== 'admin');

        // Calculate customer behavior patterns
        const behaviorAnalysis = customers.map(customer => {
            const customerOrders = orders.filter(order => order.userId === customer.id);

            if (customerOrders.length === 0) {
                return {
                    customerId: customer.id,
                    name: customer.name,
                    segment: 'New Customer',
                    avgOrderValue: 0,
                    purchaseFrequency: 0,
                    lastPurchaseDays: 999
                };
            }

            const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
            const avgOrderValue = totalSpent / customerOrders.length;

            const firstOrder = Math.min(...customerOrders.map(order => order.createdAt._seconds * 1000));
            const lastOrder = Math.max(...customerOrders.map(order => order.createdAt._seconds * 1000));
            const customerLifespanDays = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24);
            const purchaseFrequency = customerLifespanDays > 0 ?
                (customerOrders.length / (customerLifespanDays / 30)) : 0;

            const lastPurchaseDays = Math.floor((Date.now() - lastOrder) / (1000 * 60 * 60 * 24));

            let segment;
            if (lastPurchaseDays <= 30 && purchaseFrequency >= 2) segment = 'High-Value';
            else if (lastPurchaseDays <= 90 && purchaseFrequency >= 1) segment = 'Regular';
            else if (customerOrders.length >= 3) segment = 'Loyal';
            else if (lastPurchaseDays <= 30) segment = 'Recent';
            else if (lastPurchaseDays > 180) segment = 'At Risk';
            else segment = 'Inactive';

            return {
                customerId: customer.id,
                name: customer.name,
                segment,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
                lastPurchaseDays,
                totalOrders: customerOrders.length,
                totalSpent: Math.round(totalSpent * 100) / 100
            };
        });

        // Calculate segment statistics
        const segmentStats = {};
        behaviorAnalysis.forEach(customer => {
            if (!segmentStats[customer.segment]) {
                segmentStats[customer.segment] = {
                    count: 0,
                    avgOrderValue: 0,
                    avgPurchaseFrequency: 0,
                    totalRevenue: 0
                };
            }
            segmentStats[customer.segment].count++;
            segmentStats[customer.segment].totalRevenue += customer.totalSpent;
        });

        // Calculate averages
        Object.keys(segmentStats).forEach(segment => {
            const customersInSegment = behaviorAnalysis.filter(c => c.segment === segment);
            segmentStats[segment].avgOrderValue = segmentStats[segment].totalRevenue / customersInSegment.length;
            segmentStats[segment].avgPurchaseFrequency =
                customersInSegment.reduce((sum, c) => sum + c.purchaseFrequency, 0) / customersInSegment.length;
        });

        return {
            behaviorAnalysis,
            segmentStats,
            totalCustomers: customers.length,
            insights: {
                highValueCustomers: behaviorAnalysis.filter(c => c.segment === 'High-Value').length,
                atRiskCustomers: behaviorAnalysis.filter(c => c.segment === 'At Risk').length,
                loyalCustomers: behaviorAnalysis.filter(c => c.segment === 'Loyal').length,
                avgCustomerValue: behaviorAnalysis.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
            }
        };

    } catch (error) {
        console.error('Error generating customer insights:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate customer insights');
    }
});

// Cloud Function to calculate product performance metrics
exports.calculateProductPerformance = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    try {
        const [productsSnapshot, ordersSnapshot] = await Promise.all([
            db.collection('products').get(),
            db.collection('orders').get()
        ]);

        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate product performance
        const productPerformance = products.map(product => {
            const productOrders = orders.filter(order =>
                order.items && order.items.some(item => item.productId === product.id)
            );

            const totalSales = productOrders.reduce((sum, order) => {
                const item = order.items.find(i => i.productId === product.id);
                return sum + (item ? item.quantity : 0);
            }, 0);

            const totalRevenue = productOrders.reduce((sum, order) => {
                const item = order.items.find(i => i.productId === product.id);
                return sum + (item ? item.price * item.quantity : 0);
            }, 0);

            // Calculate conversion rate (simplified)
            const estimatedViews = Math.max(totalSales * 10, 1); // Assume 10 views per sale
            const conversionRate = totalSales > 0 ? (totalSales / estimatedViews) * 100 : 0;

            return {
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                sales: totalSales,
                revenue: totalRevenue,
                conversionRate: Math.round(conversionRate * 100) / 100,
                profitMargin: calculateProfitMargin(product),
                stockTurnover: product.stock > 0 ? totalSales / product.stock : 0
            };
        });

        // Sort by revenue
        productPerformance.sort((a, b) => b.revenue - a.revenue);

        // Calculate category performance
        const categoryPerformance = {};
        productPerformance.forEach(product => {
            if (!categoryPerformance[product.category]) {
                categoryPerformance[product.category] = {
                    products: 0,
                    totalSales: 0,
                    totalRevenue: 0,
                    avgConversionRate: 0
                };
            }
            categoryPerformance[product.category].products++;
            categoryPerformance[product.category].totalSales += product.sales;
            categoryPerformance[product.category].totalRevenue += product.revenue;
        });

        // Calculate averages for categories
        Object.keys(categoryPerformance).forEach(category => {
            const categoryProducts = productPerformance.filter(p => p.category === category);
            categoryPerformance[category].avgConversionRate =
                categoryProducts.reduce((sum, p) => sum + p.conversionRate, 0) / categoryProducts.length;
        });

        return {
            productPerformance,
            categoryPerformance,
            topProducts: productPerformance.slice(0, 10),
            insights: {
                totalProducts: products.length,
                outOfStockProducts: products.filter(p => p.stock === 0).length,
                lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= 5).length,
                avgProductPrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
                bestSellingCategory: Object.keys(categoryPerformance).reduce((a, b) =>
                    categoryPerformance[a].totalRevenue > categoryPerformance[b].totalRevenue ? a : b, '')
            }
        };

    } catch (error) {
        console.error('Error calculating product performance:', error);
        throw new functions.https.HttpsError('internal', 'Failed to calculate product performance');
    }
});

// Helper function to calculate profit margin
function calculateProfitMargin(product) {
    // Simplified: (selling price - cost) / selling price * 100
    // Assume cost is 70% of original price
    const cost = product.price * 0.7;
    const sellingPrice = product.price;

    return ((sellingPrice - cost) / sellingPrice) * 100;
}

// Cloud Function to generate sales forecasting
exports.generateSalesForecast = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();
    const { days = 30 } = data;

    try {
        // Get historical sales data for the last 90 days
        const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));

        const ordersSnapshot = await db.collection('orders')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
            .get();

        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().createdAt.toDate()
        }));

        // Group orders by day
        const dailySales = {};
        orders.forEach(order => {
            const dateKey = order.date.toISOString().split('T')[0];
            if (!dailySales[dateKey]) {
                dailySales[dateKey] = { revenue: 0, orders: 0 };
            }
            dailySales[dateKey].revenue += order.total;
            dailySales[dateKey].orders += 1;
        });

        // Calculate trend and seasonality
        const salesArray = Object.values(dailySales).map(day => day.revenue);
        const avgDailySales = salesArray.reduce((sum, sales) => sum + sales, 0) / salesArray.length;

        // Simple linear trend calculation
        const trend = calculateTrend(salesArray);

        // Generate forecast
        const forecast = [];
        const lastDate = new Date(Math.max(...Object.keys(dailySales).map(date => new Date(date).getTime())));

        for (let i = 1; i <= days; i++) {
            const forecastDate = new Date(lastDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const seasonalFactor = getSeasonalFactor(forecastDate);
            const trendAdjustment = trend * i;

            const predictedRevenue = Math.max(0, avgDailySales + trendAdjustment) * seasonalFactor;

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedRevenue: Math.round(predictedRevenue * 100) / 100,
                confidence: Math.max(0.6, 0.95 - (i * 0.01)) // Decreasing confidence over time
            });
        }

        return {
            forecast,
            historical: {
                avgDailySales: Math.round(avgDailySales * 100) / 100,
                trend: Math.round(trend * 100) / 100,
                totalHistoricalDays: Object.keys(dailySales).length
            },
            insights: {
                nextWeekForecast: forecast.slice(0, 7).reduce((sum, day) => sum + day.predictedRevenue, 0),
                nextMonthForecast: forecast.reduce((sum, day) => sum + day.predictedRevenue, 0),
                growthRate: trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable'
            }
        };

    } catch (error) {
        console.error('Error generating sales forecast:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate sales forecast');
    }
});

// Helper function to calculate trend
function calculateTrend(salesArray) {
    if (salesArray.length < 2) return 0;

    const n = salesArray.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = salesArray;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
}

// Helper function to get seasonal factor
function getSeasonalFactor(date) {
    // Simple seasonal adjustment based on day of week
    const dayOfWeek = date.getDay();
    const seasonalFactors = {
        0: 0.8,  // Sunday
        1: 1.0,  // Monday
        2: 1.1,  // Tuesday
        3: 1.1,  // Wednesday
        4: 1.2,  // Thursday
        5: 1.3,  // Friday
        6: 1.1   // Saturday
    };

    return seasonalFactors[dayOfWeek] || 1.0;
}
