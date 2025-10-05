/**
 * Queue Management Service with DSA Algorithms
 *
 * Implements various queue algorithms for fair access to flash sales:
 * - FIFO (First In, First Out)
 * - Priority Queue (based on user tier and loyalty)
 * - Randomized Selection (Lottery system)
 */

class QueueService {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.queueListeners = new Map();
    }

    async initialize() {
        if (this.initialized) return;

        try {
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                this.db = firebaseService.db;
                this.initialized = true;
                console.log('Queue Service initialized');
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Error initializing Queue Service:', error);
            throw error;
        }
    }

    // Join Queue with Different Algorithms
    async joinQueue(productId, queueType = 'fifo', userId = null) {
        try {
            await this.initialize();

            if (!userId && authManager.currentUser) {
                userId = authManager.currentUser.uid;
            }

            if (!userId) {
                throw new Error('User must be authenticated to join queue');
            }

            // Check if user is already in queue for this product
            const existingQueueItem = await this.getQueuePosition(productId, userId);
            if (existingQueueItem) {
                throw new Error('User is already in queue for this product');
            }

            const queueItem = {
                userId,
                productId,
                queueType,
                joinTime: new Date(),
                processed: false,
                status: 'waiting',
                position: 0 // Will be calculated
            };

            // Calculate position based on algorithm
            const position = await this.calculateQueuePosition(productId, queueType, userId);

            queueItem.position = position;

            const docRef = await this.db.collection('queue').add(queueItem);

            // Start listening for queue updates
            this.subscribeToQueueUpdates(productId);

            return {
                id: docRef.id,
                ...queueItem
            };
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    }

    async calculateQueuePosition(productId, queueType, userId) {
        try {
            let query = this.db.collection('queue')
                .where('productId', '==', productId)
                .where('processed', '==', false);

            const snapshot = await query.get();
            const currentQueue = snapshot.docs.map(doc => doc.data());

            switch (queueType) {
                case 'priority':
                    return await this.calculatePriorityPosition(currentQueue, userId);
                case 'random':
                    return this.calculateRandomPosition(currentQueue);
                case 'fifo':
                default:
                    return currentQueue.length + 1;
            }
        } catch (error) {
            console.error('Error calculating queue position:', error);
            return 1;
        }
    }

    async calculatePriorityPosition(currentQueue, userId) {
        try {
            // Get user data for priority calculation
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return currentQueue.length + 1;
            }

            const userData = userDoc.data();
            const userTier = userData.tier || 'bronze';
            const userPoints = userData.loyaltyPoints || 0;
            const joinDate = userData.joinDate?.toDate() || new Date();

            // Priority score calculation
            let priorityScore = 0;

            // Tier-based priority (Gold > Silver > Bronze)
            switch (userTier) {
                case 'gold':
                    priorityScore += 1000;
                    break;
                case 'silver':
                    priorityScore += 500;
                    break;
                case 'bronze':
                default:
                    priorityScore += 100;
                    break;
            }

            // Loyalty points factor (more points = higher priority)
            priorityScore += Math.min(userPoints / 10, 200); // Cap at 200 points

            // Seniority factor (earlier join date = higher priority)
            const daysSinceJoin = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
            priorityScore += Math.min(daysSinceJoin / 2, 100); // Cap at 100 points

            // Find insertion point based on priority scores
            const sortedQueue = currentQueue
                .map(item => ({ ...item, priorityScore: 0 })) // Simplified for demo
                .sort((a, b) => b.priorityScore - a.priorityScore);

            // Insert at appropriate position
            let position = 1;
            for (const item of sortedQueue) {
                if (priorityScore > item.priorityScore) {
                    break;
                }
                position++;
            }

            return position;
        } catch (error) {
            console.error('Error calculating priority position:', error);
            return currentQueue.length + 1;
        }
    }

    calculateRandomPosition(currentQueue) {
        // Random lottery system - insert at random position
        if (currentQueue.length === 0) {
            return 1;
        }

        return Math.floor(Math.random() * (currentQueue.length + 1)) + 1;
    }

    async getQueuePosition(productId, userId = null) {
        try {
            await this.initialize();

            if (!userId && authManager.currentUser) {
                userId = authManager.currentUser.uid;
            }

            if (!userId) {
                return null;
            }

            const snapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('userId', '==', userId)
                .where('processed', '==', false)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    joinTime: doc.data().joinTime?.toDate()
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting queue position:', error);
            return null;
        }
    }

    async getQueueStatus(productId) {
        try {
            await this.initialize();

            const snapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('processed', '==', false)
                .orderBy('joinTime', 'asc')
                .get();

            const queueItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                joinTime: doc.data().joinTime?.toDate()
            }));

            // Calculate statistics
            const totalWaiting = queueItems.length;
            const avgWaitTime = totalWaiting > 0 ?
                queueItems.reduce((sum, item) => {
                    const waitTime = (new Date() - item.joinTime) / (1000 * 60); // minutes
                    return sum + waitTime;
                }, 0) / totalWaiting : 0;

            // Queue distribution by type
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
                longestWait: Math.max(...positions) || 0,
                queueItems: queueItems.slice(0, 10) // Return first 10 items
            };
        } catch (error) {
            console.error('Error getting queue status:', error);
            throw error;
        }
    }

    // Process Queue (Admin function)
    async processNextInQueue(productId, maxToProcess = 1) {
        try {
            await this.initialize();

            const snapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('processed', '==', false)
                .orderBy('position', 'asc')
                .limit(maxToProcess)
                .get();

            const processedItems = [];

            for (const doc of snapshot.docs) {
                const queueItem = doc.data();

                // Process the queue item
                await this.db.collection('queue').doc(doc.id).update({
                    processed: true,
                    processedAt: new Date(),
                    status: 'processed'
                });

                processedItems.push({
                    id: doc.id,
                    ...queueItem,
                    processedAt: new Date()
                });
            }

            return processedItems;
        } catch (error) {
            console.error('Error processing queue:', error);
            throw error;
        }
    }

    // Subscribe to queue updates for real-time UI updates
    subscribeToQueueUpdates(productId, callback) {
        try {
            this.initialize();

            const key = `queue_${productId}`;
            if (this.queueListeners.has(key)) {
                this.queueListeners.get(key)(); // Unsubscribe existing listener
            }

            const unsubscribe = this.db.collection('queue')
                .where('productId', '==', productId)
                .where('processed', '==', false)
                .orderBy('joinTime', 'asc')
                .onSnapshot((snapshot) => {
                    const queueItems = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        joinTime: doc.data().joinTime?.toDate()
                    }));

                    if (callback) {
                        callback(queueItems);
                    }
                });

            this.queueListeners.set(key, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to queue updates:', error);
            throw error;
        }
    }

    unsubscribeFromQueueUpdates(productId) {
        const key = `queue_${productId}`;
        if (this.queueListeners.has(key)) {
            this.queueListeners.get(key)();
            this.queueListeners.delete(key);
        }
    }

    // Advanced Queue Analytics
    async getQueueAnalytics(productId = null, timeRange = '24h') {
        try {
            await this.initialize();

            const startDate = new Date();
            const hours = parseInt(timeRange);
            startDate.setHours(startDate.getHours() - hours);

            let query = this.db.collection('queue')
                .where('joinTime', '>=', startDate);

            if (productId) {
                query = query.where('productId', '==', productId);
            }

            const snapshot = await query.get();
            const queueItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                joinTime: doc.data().joinTime?.toDate(),
                processedAt: doc.data().processedAt?.toDate()
            }));

            // Calculate analytics
            const totalJoined = queueItems.length;
            const processed = queueItems.filter(item => item.processed).length;
            const stillWaiting = totalJoined - processed;

            // Average processing time
            const processedItems = queueItems.filter(item => item.processed);
            const avgProcessingTime = processedItems.length > 0 ?
                processedItems.reduce((sum, item) => {
                    if (item.processedAt) {
                        const processingTime = (item.processedAt - item.joinTime) / (1000 * 60); // minutes
                        return sum + processingTime;
                    }
                    return sum;
                }, 0) / processedItems.length : 0;

            // Queue abandonment rate (items that left queue without being processed)
            const abandoned = queueItems.filter(item => !item.processed && !item.processedAt).length;
            const abandonmentRate = totalJoined > 0 ? (abandoned / totalJoined) * 100 : 0;

            // Peak hours analysis
            const hourlyDistribution = {};
            queueItems.forEach(item => {
                const hour = item.joinTime.getHours();
                hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            });

            // Queue type distribution
            const typeDistribution = queueItems.reduce((acc, item) => {
                acc[item.queueType] = (acc[item.queueType] || 0) + 1;
                return acc;
            }, {});

            return {
                timeRange,
                totalJoined,
                processed,
                stillWaiting,
                avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
                abandonmentRate: Math.round(abandonmentRate * 100) / 100,
                hourlyDistribution,
                typeDistribution,
                peakHour: Object.entries(hourlyDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
            };
        } catch (error) {
            console.error('Error getting queue analytics:', error);
            throw error;
        }
    }

    // Queue Optimization Suggestions
    async getOptimizationSuggestions(productId) {
        try {
            const analytics = await this.getQueueAnalytics(productId, '24h');
            const suggestions = [];

            // Analyze abandonment rate
            if (analytics.abandonmentRate > 20) {
                suggestions.push({
                    type: 'high_abandonment',
                    message: `High abandonment rate (${analytics.abandonmentRate.toFixed(1)}%). Consider reducing queue wait times or improving user experience.`,
                    priority: 'high'
                });
            }

            // Analyze processing time
            if (analytics.avgProcessingTime > 30) {
                suggestions.push({
                    type: 'slow_processing',
                    message: `Average processing time is ${analytics.avgProcessingTime.toFixed(1)} minutes. Consider optimizing the processing workflow.`,
                    priority: 'medium'
                });
            }

            // Analyze peak hours
            if (analytics.peakHour !== 'N/A') {
                suggestions.push({
                    type: 'peak_hours',
                    message: `Peak queue hour is ${analytics.peakHour}:00. Consider scheduling flash sales during off-peak hours.`,
                    priority: 'low'
                });
            }

            // Analyze queue type distribution
            const total = Object.values(analytics.typeDistribution).reduce((sum, count) => sum + count, 0);
            Object.entries(analytics.typeDistribution).forEach(([type, count]) => {
                const percentage = (count / total) * 100;
                if (percentage > 60) {
                    suggestions.push({
                        type: 'queue_type_dominance',
                        message: `${type.toUpperCase()} queue type dominates (${percentage.toFixed(1)}%). Consider balancing queue types for fairness.`,
                        priority: 'medium'
                    });
                }
            });

            return suggestions;
        } catch (error) {
            console.error('Error getting optimization suggestions:', error);
            return [];
        }
    }

    // Leave Queue
    async leaveQueue(productId, userId = null) {
        try {
            await this.initialize();

            if (!userId && authManager.currentUser) {
                userId = authManager.currentUser.uid;
            }

            if (!userId) {
                throw new Error('User must be authenticated to leave queue');
            }

            const snapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('userId', '==', userId)
                .where('processed', '==', false)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                await this.db.collection('queue').doc(doc.id).update({
                    status: 'left',
                    leftAt: new Date()
                });

                return {
                    success: true,
                    message: 'Successfully left queue'
                };
            }

            return {
                success: false,
                message: 'User not found in queue'
            };
        } catch (error) {
            console.error('Error leaving queue:', error);
            throw error;
        }
    }

    // Clean up old queue items (maintenance)
    async cleanupOldQueueItems(daysOld = 7) {
        try {
            await this.initialize();

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const snapshot = await this.db.collection('queue')
                .where('joinTime', '<', cutoffDate)
                .get();

            const batch = this.db.batch();
            let count = 0;

            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                count++;
            });

            if (count > 0) {
                await batch.commit();
            }

            return {
                cleanedItems: count,
                message: `Cleaned up ${count} old queue items`
            };
        } catch (error) {
            console.error('Error cleaning up queue:', error);
            throw error;
        }
    }

    // Get queue statistics for admin dashboard
    async getQueueStats() {
        try {
            await this.initialize();

            const snapshot = await this.db.collection('queue')
                .where('processed', '==', false)
                .get();

            const queueItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                joinTime: doc.data().joinTime?.toDate()
            }));

            const stats = {
                totalActiveQueues: queueItems.length,
                byProduct: {},
                byType: {},
                avgWaitTime: 0,
                longestWait: 0
            };

            // Group by product
            queueItems.forEach(item => {
                stats.byProduct[item.productId] = (stats.byProduct[item.productId] || 0) + 1;
                stats.byType[item.queueType] = (stats.byType[item.queueType] || 0) + 1;
            });

            // Calculate wait times
            if (queueItems.length > 0) {
                const waitTimes = queueItems.map(item =>
                    (new Date() - item.joinTime) / (1000 * 60) // minutes
                );

                stats.avgWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
                stats.longestWait = Math.max(...waitTimes);
            }

            return stats;
        } catch (error) {
            console.error('Error getting queue stats:', error);
            throw error;
        }
    }
}

// Global Queue Service instance
const queueService = new QueueService();
