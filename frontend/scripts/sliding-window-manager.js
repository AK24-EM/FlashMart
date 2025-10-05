/**
 * Unified Sliding Window Manager for FlashMart
 *
 * Provides efficient sliding window algorithms for:
 * - Real-time activity tracking and metrics
 * - Recent activity analysis with configurable time windows
 * - Activity pattern detection and insights
 * - Performance monitoring and optimization
 */

class SlidingWindowManager {
    constructor(options = {}) {
        this.options = {
            maxWindowSize: options.maxWindowSize || 1000, // Maximum activities to keep in memory
            timeWindows: options.timeWindows || [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000], // 5min, 1hr, 24hrs
            cleanupInterval: options.cleanupInterval || 60000, // Cleanup every minute
            enablePersistence: options.enablePersistence || false,
            ...options
        };

        this.activities = [];
        this.windows = new Map();
        this.activityCounts = new Map();
        this.eventListeners = new Map();

        this.initialize();
    }

    initialize() {
        // Initialize time windows
        this.options.timeWindows.forEach(windowSize => {
            this.windows.set(windowSize, {
                startTime: Date.now(),
                activities: [],
                count: 0,
                typeCounts: new Map()
            });
        });

        // Set up automatic cleanup
        if (this.options.cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.options.cleanupInterval);
        }

        // Set up activity type tracking
        this.setupActivityTypeTracking();
    }

    setupActivityTypeTracking() {
        // Common activity types for tracking
        this.activityTypes = [
            'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
            'purchase', 'search', 'login', 'logout', 'signup', 'wishlist_add',
            'wishlist_remove', 'review_submit', 'share', 'click'
        ];

        // Initialize counters for each activity type
        this.activityTypes.forEach(type => {
            this.activityCounts.set(type, {
                total: 0,
                current: 0,
                trend: 0,
                lastHour: 0,
                lastDay: 0
            });
        });
    }

    /**
     * Track a new activity/event
     * @param {string} type - Activity type (e.g., 'page_view', 'purchase')
     * @param {object} data - Activity data (productId, userId, metadata, etc.)
     * @param {number} timestamp - Timestamp (defaults to now)
     */
    trackActivity(type, data = {}, timestamp = Date.now()) {
        const activity = {
            type,
            data,
            timestamp,
            id: this.generateActivityId()
        };

        // Add to main activities array
        this.activities.unshift(activity);

        // Update all time windows
        this.updateWindows(activity);

        // Update activity counters
        this.updateActivityCounters(activity);

        // Trigger event listeners
        this.triggerEventListeners(type, activity);

        // Maintain memory limit
        this.enforceMemoryLimit();

        // Persist if enabled
        if (this.options.enablePersistence) {
            this.persistActivity(activity);
        }

        return activity;
    }

    generateActivityId() {
        return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateWindows(activity) {
        const now = Date.now();

        this.windows.forEach((window, windowSize) => {
            // Remove activities outside the time window
            window.activities = window.activities.filter(
                a => (now - a.timestamp) <= windowSize
            );

            // Add new activity if it's within the window
            if ((now - activity.timestamp) <= windowSize) {
                window.activities.unshift(activity);
                window.count = window.activities.length;

                // Update type counts
                const typeCount = window.typeCounts.get(activity.type) || 0;
                window.typeCounts.set(activity.type, typeCount + 1);
            }
        });
    }

    updateActivityCounters(activity) {
        const { type } = activity;
        const now = Date.now();

        if (!this.activityCounts.has(type)) return;

        const counter = this.activityCounts.get(type);

        // Update total count
        counter.total++;

        // Update current window counts
        counter.current++;

        // Update last hour count (if within last hour)
        if ((now - activity.timestamp) <= 60 * 60 * 1000) {
            counter.lastHour++;
        }

        // Update last day count (if within last 24 hours)
        if ((now - activity.timestamp) <= 24 * 60 * 60 * 1000) {
            counter.lastDay++;
        }

        // Calculate trend (simple moving average)
        const recentActivities = this.getRecentActivities(10, type);
        counter.trend = recentActivities.length / Math.min(10, this.activities.length);
    }

    triggerEventListeners(type, activity) {
        if (this.eventListeners.has(type)) {
            this.eventListeners.get(type).forEach(callback => {
                try {
                    callback(activity);
                } catch (error) {
                    console.error(`Error in event listener for ${type}:`, error);
                }
            });
        }

        // Trigger global listeners
        if (this.eventListeners.has('*')) {
            this.eventListeners.get('*').forEach(callback => {
                try {
                    callback(type, activity);
                } catch (error) {
                    console.error('Error in global event listener:', error);
                }
            });
        }
    }

    enforceMemoryLimit() {
        if (this.activities.length > this.options.maxWindowSize) {
            const excess = this.activities.length - this.options.maxWindowSize;
            this.activities = this.activities.slice(0, this.options.maxWindowSize);

            // Also clean up old activities from windows
            this.windows.forEach(window => {
                if (window.activities.length > this.options.maxWindowSize) {
                    window.activities = window.activities.slice(0, this.options.maxWindowSize);
                    window.count = window.activities.length;

                    // Recalculate type counts
                    const typeCounts = new Map();
                    window.activities.forEach(activity => {
                        const count = typeCounts.get(activity.type) || 0;
                        typeCounts.set(activity.type, count + 1);
                    });
                    window.typeCounts = typeCounts;
                }
            });
        }
    }

    /**
     * Get recent activities within a time window
     * @param {number} limit - Maximum number of activities to return
     * @param {string} type - Optional activity type filter
     * @param {number} windowSize - Time window in milliseconds
     */
    getRecentActivities(limit = 50, type = null, windowSize = null) {
        let activities = this.activities;

        // Filter by type if specified
        if (type) {
            activities = activities.filter(a => a.type === type);
        }

        // Filter by time window if specified
        if (windowSize) {
            const now = Date.now();
            activities = activities.filter(a => (now - a.timestamp) <= windowSize);
        }

        return activities.slice(0, limit);
    }

    /**
     * Get activity counts for a specific time window
     * @param {number} windowSize - Time window in milliseconds
     */
    getActivityCounts(windowSize = null) {
        if (windowSize && this.windows.has(windowSize)) {
            const window = this.windows.get(windowSize);
            return {
                total: window.count,
                byType: Object.fromEntries(window.typeCounts),
                windowSize
            };
        }

        // Return global counts if no window specified
        const globalCounts = {};
        this.activityCounts.forEach((counter, type) => {
            globalCounts[type] = {
                total: counter.total,
                current: counter.current,
                trend: counter.trend,
                lastHour: counter.lastHour,
                lastDay: counter.lastDay
            };
        });

        return {
            total: this.activities.length,
            byType: globalCounts,
            windowSize: 'global'
        };
    }

    /**
     * Get activity insights and patterns
     */
    getActivityInsights() {
        const insights = {
            totalActivities: this.activities.length,
            uniqueUsers: this.getUniqueUsers(),
            topActivityTypes: this.getTopActivityTypes(),
            activityTrends: this.getActivityTrends(),
            peakHours: this.getPeakHours(),
            conversionRate: this.getConversionRate()
        };

        return insights;
    }

    getUniqueUsers() {
        const userIds = new Set();
        this.activities.forEach(activity => {
            if (activity.data.userId) {
                userIds.add(activity.data.userId);
            }
        });
        return userIds.size;
    }

    getTopActivityTypes(limit = 5) {
        const typeCounts = {};
        this.activities.forEach(activity => {
            typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
        });

        return Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([type, count]) => ({ type, count }));
    }

    getActivityTrends() {
        const trends = {};
        this.activityCounts.forEach((counter, type) => {
            trends[type] = counter.trend;
        });
        return trends;
    }

    getPeakHours() {
        const hourCounts = new Array(24).fill(0);

        this.activities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            hourCounts[hour]++;
        });

        const maxCount = Math.max(...hourCounts);
        const peakHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(({ count }) => count === maxCount)
            .map(({ hour }) => hour);

        return {
            peakHours,
            distribution: hourCounts
        };
    }

    getConversionRate() {
        const views = this.activities.filter(a => a.type === 'product_view').length;
        const purchases = this.activities.filter(a => a.type === 'purchase').length;

        return views > 0 ? (purchases / views) * 100 : 0;
    }

    /**
     * Add event listener for specific activity types
     * @param {string} type - Activity type or '*' for all
     * @param {function} callback - Callback function
     */
    addEventListener(type, callback) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        this.eventListeners.get(type).push(callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(type, callback) {
        if (this.eventListeners.has(type)) {
            const listeners = this.eventListeners.get(type);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Get activities for a specific time range
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     */
    getActivitiesInRange(startTime, endTime, type = null) {
        let activities = this.activities.filter(
            a => a.timestamp >= startTime && a.timestamp <= endTime
        );

        if (type) {
            activities = activities.filter(a => a.type === type);
        }

        return activities;
    }

    /**
     * Export activities for analysis or backup
     */
    exportActivities(format = 'json') {
        const data = {
            activities: this.activities,
            windows: Object.fromEntries(this.windows),
            counts: Object.fromEntries(this.activityCounts),
            exportedAt: Date.now()
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }

        return data;
    }

    /**
     * Import activities from backup
     */
    importActivities(data) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        if (data.activities) {
            this.activities = data.activities;
        }

        if (data.windows) {
            this.windows = new Map(Object.entries(data.windows));
        }

        if (data.counts) {
            this.activityCounts = new Map(Object.entries(data.counts));
        }

        return true;
    }

    /**
     * Clean up old activities and maintain memory efficiency
     */
    cleanup() {
        const now = Date.now();
        const oldestAllowed = now - Math.max(...this.options.timeWindows);

        // Remove very old activities
        this.activities = this.activities.filter(a => a.timestamp > oldestAllowed);

        // Clean up windows
        this.windows.forEach((window, windowSize) => {
            const windowCutoff = now - windowSize;
            window.activities = window.activities.filter(a => a.timestamp > windowCutoff);
            window.count = window.activities.length;

            // Recalculate type counts
            const typeCounts = new Map();
            window.activities.forEach(activity => {
                const count = typeCounts.get(activity.type) || 0;
                typeCounts.set(activity.type, count + 1);
            });
            window.typeCounts = typeCounts;
        });

        // Update global counters based on cleaned data
        this.activityCounts.forEach(counter => {
            counter.current = 0;
            counter.lastHour = 0;
            counter.lastDay = 0;
        });

        this.activities.forEach(activity => {
            this.updateActivityCounters(activity);
        });
    }

    /**
     * Persist activity to storage (if enabled)
     */
    persistActivity(activity) {
        // Implementation depends on storage mechanism (localStorage, IndexedDB, etc.)
        // For now, we'll use localStorage as an example
        try {
            const key = `activity_${activity.id}`;
            localStorage.setItem(key, JSON.stringify(activity));

            // Keep track of activity IDs for cleanup
            const existingIds = JSON.parse(localStorage.getItem('activity_ids') || '[]');
            existingIds.unshift(activity.id);

            // Keep only recent activity IDs
            const maxStored = 1000;
            if (existingIds.length > maxStored) {
                const toRemove = existingIds.slice(maxStored);
                toRemove.forEach(id => localStorage.removeItem(`activity_${id}`));
                existingIds.splice(maxStored);
            }

            localStorage.setItem('activity_ids', JSON.stringify(existingIds));
        } catch (error) {
            console.warn('Failed to persist activity:', error);
        }
    }

    /**
     * Load persisted activities on initialization
     */
    loadPersistedActivities() {
        try {
            const activityIds = JSON.parse(localStorage.getItem('activity_ids') || '[]');
            const recentIds = activityIds.slice(0, 500); // Load only recent activities

            recentIds.forEach(id => {
                const stored = localStorage.getItem(`activity_${id}`);
                if (stored) {
                    const activity = JSON.parse(stored);
                    // Only load if not too old
                    if ((Date.now() - activity.timestamp) <= Math.max(...this.options.timeWindows)) {
                        this.activities.push(activity);
                        this.updateActivityCounters(activity);
                    }
                }
            });

            this.activities.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.warn('Failed to load persisted activities:', error);
        }
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        return {
            activitiesCount: this.activities.length,
            windowsCount: this.windows.size,
            memoryUsage: JSON.stringify(this.activities).length + JSON.stringify([...this.windows]).length,
            oldestActivity: this.activities.length > 0 ? Math.min(...this.activities.map(a => a.timestamp)) : null,
            newestActivity: this.activities.length > 0 ? Math.max(...this.activities.map(a => a.timestamp)) : null
        };
    }

    /**
     * Destroy the manager and clean up resources
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.activities = [];
        this.windows.clear();
        this.activityCounts.clear();
        this.eventListeners.clear();
    }
}

// Factory function for easy creation
function createSlidingWindowManager(options = {}) {
    return new SlidingWindowManager(options);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlidingWindowManager, createSlidingWindowManager };
}

// Global export
window.SlidingWindowManager = SlidingWindowManager;
window.createSlidingWindowManager = createSlidingWindowManager;
