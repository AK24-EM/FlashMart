/**
 * Advanced Firestore Queries
 *
 * This module contains complex queries for analytics, reporting,
 * and business intelligence operations on Firebase Firestore.
 */

class FirestoreQueries {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                this.db = firebaseService.db;
                this.initialized = true;
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Error initializing Firestore Queries:', error);
            throw error;
        }
    }

    // Advanced Product Queries
    async getProductsByCategory(category, limit = 50) {
        try {
            await this.initialize();
            const snapshot = await this.db.collection('products')
                .where('category', '==', category)
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
        } catch (error) {
            console.error('Error getting products by category:', error);
            throw error;
        }
    }

    async getProductsByPriceRange(minPrice, maxPrice, category = null) {
        try {
            await this.initialize();
            let query = this.db.collection('products')
                .where('price', '>=', minPrice)
                .where('price', '<=', maxPrice);

            if (category) {
                query = query.where('category', '==', category);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
        } catch (error) {
            console.error('Error getting products by price range:', error);
            throw error;
        }
    }

    async searchProducts(searchTerm, filters = {}) {
        try {
            await this.initialize();
            // Firestore doesn't support full-text search natively
            // We'll need to fetch all products and filter client-side
            // For production, consider using Algolia or Elasticsearch
            let query = this.db.collection('products');

            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }

            const snapshot = await query.get();
            let products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Client-side search
            const searchLower = searchTerm.toLowerCase();
            products = products.filter(product =>
                product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower) ||
                product.category.toLowerCase().includes(searchLower)
            );

            return products;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    async getTopSellingProducts(limit = 10, timeRange = '30d') {
        try {
            await this.initialize();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(timeRange));

            const ordersSnapshot = await this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .get();

            const productSales = {};
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.items) {
                    order.items.forEach(item => {
                        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                    });
                } else {
                    // Single product order
                    productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
                }
            });

            // Get product details for top selling products
            const topProducts = [];
            const sortedProducts = Object.entries(productSales)
                .sort(([,a], [,b]) => b - a)
                .slice(0, limit);

            for (const [productId, sales] of sortedProducts) {
                const product = await this.getProduct(productId);
                if (product) {
                    topProducts.push({ ...product, sales });
                }
            }

            return topProducts;
        } catch (error) {
            console.error('Error getting top selling products:', error);
            throw error;
        }
    }

    async getProduct(productId) {
        try {
            await this.initialize();
            const doc = await this.db.collection('products').doc(productId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    }

    // Advanced Order Queries
    async getOrdersByDateRange(startDate, endDate, userId = null) {
        try {
            await this.initialize();
            let query = this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .orderBy('createdAt', 'desc');

            if (userId) {
                query = query.where('userId', '==', userId);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
        } catch (error) {
            console.error('Error getting orders by date range:', error);
            throw error;
        }
    }

    async getRevenueByProduct(productId, timeRange = '30d') {
        try {
            await this.initialize();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(timeRange));

            let query = this.db.collection('orders')
                .where('createdAt', '>=', startDate);

            if (productId) {
                // For single product, we need to check both single product orders and multi-item orders
                const snapshot = await query.get();
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }));

                return orders.filter(order =>
                    order.productId === productId ||
                    (order.items && order.items.some(item => item.productId === productId))
                ).reduce((total, order) => {
                    if (order.productId === productId) {
                        return total + order.total;
                    } else {
                        const item = order.items.find(item => item.productId === productId);
                        return total + (item ? item.price * item.quantity : 0);
                    }
                }, 0);
            }

            // For all products
            const snapshot = await query.get();
            return snapshot.docs.reduce((total, doc) => total + doc.data().total, 0);
        } catch (error) {
            console.error('Error getting revenue:', error);
            throw error;
        }
    }

    async getOrderStats(timeRange = '30d') {
        try {
            await this.initialize();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(timeRange));

            const snapshot = await this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .get();

            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Orders by status
            const ordersByStatus = orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {});

            // Daily revenue for the last 30 days
            const dailyRevenue = {};
            orders.forEach(order => {
                const date = order.createdAt.toISOString().split('T')[0];
                dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;
            });

            return {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                ordersByStatus,
                dailyRevenue,
                timeRange
            };
        } catch (error) {
            console.error('Error getting order stats:', error);
            throw error;
        }
    }

    // User Analytics Queries
    async getUserBehavior(userId) {
        try {
            await this.initialize();

            // Get user's orders
            const ordersSnapshot = await this.db.collection('orders')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Get user profile
            const userDoc = await this.db.collection('users').doc(userId).get();
            const userProfile = userDoc.exists ? userDoc.data() : {};

            // Calculate user metrics
            const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
            const orderCount = orders.length;
            const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

            // Get user's favorite categories
            const categoryCount = {};
            orders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        // This would need product data to get categories
                        categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
                    });
                }
            });

            const favoriteCategories = Object.entries(categoryCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([category, count]) => ({ category, count }));

            // Recent activity
            const recentOrders = orders.slice(0, 5);

            return {
                userProfile,
                totalSpent,
                orderCount,
                avgOrderValue,
                favoriteCategories,
                recentOrders,
                lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
            };
        } catch (error) {
            console.error('Error getting user behavior:', error);
            throw error;
        }
    }

    async getTopCustomers(limit = 10, timeRange = '30d') {
        try {
            await this.initialize();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(timeRange));

            const ordersSnapshot = await this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .get();

            const customerSpending = {};
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                customerSpending[order.userId] = (customerSpending[order.userId] || 0) + order.total;
            });

            // Get user details for top customers
            const topCustomers = [];
            const sortedCustomers = Object.entries(customerSpending)
                .sort(([,a], [,b]) => b - a)
                .slice(0, limit);

            for (const [userId, totalSpent] of sortedCustomers) {
                const userDoc = await this.db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    topCustomers.push({
                        id: userId,
                        name: userData.name,
                        email: userData.email,
                        totalSpent,
                        tier: userData.tier,
                        orderCount: 0 // Would need additional query to get order count
                    });
                }
            }

            return topCustomers;
        } catch (error) {
            console.error('Error getting top customers:', error);
            throw error;
        }
    }

    // Flash Sale Analytics
    async getFlashSalePerformance(flashSaleId = null) {
        try {
            await this.initialize();
            let query = this.db.collection('orders');

            if (flashSaleId) {
                query = query.where('sessionId', '==', flashSaleId);
            } else {
                // Get orders from active flash sales
                const activeFlashSales = await this.getActiveFlashSales();
                const sessionIds = activeFlashSales.map(fs => fs.id);
                if (sessionIds.length === 0) return [];

                query = query.where('sessionId', 'in', sessionIds);
            }

            const snapshot = await query.get();
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Group by flash sale session
            const sessionStats = {};
            orders.forEach(order => {
                const sessionId = order.sessionId;
                if (!sessionStats[sessionId]) {
                    sessionStats[sessionId] = {
                        sessionId,
                        totalRevenue: 0,
                        orderCount: 0,
                        uniqueCustomers: new Set()
                    };
                }
                sessionStats[sessionId].totalRevenue += order.total;
                sessionStats[sessionId].orderCount += 1;
                sessionStats[sessionId].uniqueCustomers.add(order.userId);
            });

            // Convert sets to counts
            Object.keys(sessionStats).forEach(sessionId => {
                sessionStats[sessionId].uniqueCustomers = sessionStats[sessionId].uniqueCustomers.size;
                sessionStats[sessionId].avgOrderValue = sessionStats[sessionId].totalRevenue / sessionStats[sessionId].orderCount;
            });

            return {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                sessionStats: Object.values(sessionStats),
                timeRange: 'all'
            };
        } catch (error) {
            console.error('Error getting flash sale performance:', error);
            throw error;
        }
    }

    async getActiveFlashSales() {
        try {
            await this.initialize();
            const now = new Date();
            const snapshot = await this.db.collection('flashSales')
                .where('isActive', '==', true)
                .where('startTime', '<=', now)
                .where('endTime', '>', now)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startTime: doc.data().startTime?.toDate(),
                endTime: doc.data().endTime?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            }));
        } catch (error) {
            console.error('Error getting active flash sales:', error);
            throw error;
        }
    }

    // Queue Analytics
    async getQueueStats(productId = null) {
        try {
            await this.initialize();
            let query = this.db.collection('queue').where('processed', '==', false);

            if (productId) {
                query = query.where('productId', '==', productId);
            }

            const snapshot = await query.get();
            const queueItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                joinTime: doc.data().joinTime?.toDate()
            }));

            // Calculate queue statistics
            const totalWaiting = queueItems.length;
            const avgWaitTime = queueItems.length > 0 ?
                queueItems.reduce((sum, item) => {
                    const waitTime = (new Date() - item.joinTime) / (1000 * 60); // minutes
                    return sum + waitTime;
                }, 0) / queueItems.length : 0;

            // Queue by type
            const queueByType = queueItems.reduce((acc, item) => {
                acc[item.queueType] = (acc[item.queueType] || 0) + 1;
                return acc;
            }, {});

            // Queue positions
            const positions = queueItems.map(item => item.position).sort((a, b) => a - b);

            return {
                totalWaiting,
                avgWaitTime: Math.round(avgWaitTime * 100) / 100,
                queueByType,
                positions,
                longestWait: Math.max(...positions) || 0
            };
        } catch (error) {
            console.error('Error getting queue stats:', error);
            throw error;
        }
    }

    // Feedback and Reviews
    async getProductReviews(productId, limit = 20) {
        try {
            await this.initialize();
            const snapshot = await this.db.collection('feedback')
                .where('productId', '==', productId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Calculate average rating
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

            // Rating distribution
            const ratingDistribution = reviews.reduce((acc, review) => {
                acc[review.rating] = (acc[review.rating] || 0) + 1;
                return acc;
            }, {});

            return {
                reviews,
                avgRating: Math.round(avgRating * 10) / 10,
                ratingDistribution,
                totalReviews: reviews.length
            };
        } catch (error) {
            console.error('Error getting product reviews:', error);
            throw error;
        }
    }

    async getUserFeedback(userId) {
        try {
            await this.initialize();
            const snapshot = await this.db.collection('feedback')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
        } catch (error) {
            console.error('Error getting user feedback:', error);
            throw error;
        }
    }

    // Real-time Data Streams
    subscribeToCollection(collection, callback, filters = {}) {
        try {
            this.initialize();
            let query = this.db.collection(collection);

            // Apply filters if provided
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.where(key, '==', value);
                }
            });

            return query.onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }));
                callback(data);
            });
        } catch (error) {
            console.error('Error subscribing to collection:', error);
            throw error;
        }
    }

    subscribeToProduct(productId, callback) {
        try {
            this.initialize();
            return this.db.collection('products').doc(productId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const product = {
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate()
                        };
                        callback(product);
                    } else {
                        callback(null);
                    }
                });
        } catch (error) {
            console.error('Error subscribing to product:', error);
            throw error;
        }
    }

    subscribeToUserOrders(userId, callback) {
        try {
            this.initialize();
            return this.db.collection('orders')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .onSnapshot((snapshot) => {
                    const orders = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate()
                    }));
                    callback(orders);
                });
        } catch (error) {
            console.error('Error subscribing to user orders:', error);
            throw error;
        }
    }
}

// Global Firestore Queries instance
const firestoreQueries = new FirestoreQueries();
