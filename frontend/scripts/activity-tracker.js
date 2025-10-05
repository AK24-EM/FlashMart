/**
 * Activity Tracker with Sliding Window Algorithm
 * Tracks and analyzes user activities in real-time within configurable time windows
 */

class ActivityTracker {
    constructor() {
        // Store events with their timestamps
        this.events = [];
        // Default window sizes in milliseconds (5min, 1hr, 24hrs)
        this.windowSizes = [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
        // Current active windows
        this.windows = new Map();
        this.initializeWindows();
    }

    initializeWindows() {
        // Initialize windows for each size
        this.windowSizes.forEach(size => {
            this.windows.set(size, {
                startTime: Date.now(),
                count: 0,
                typeCounts: new Map()
            });
        });

        // Schedule cleanup of old events
        setInterval(() => this.cleanupOldEvents(), 60000); // Run every minute
    }

    /**
     * Track a new event
     * @param {string} eventType - Type of event (e.g., 'page_view', 'add_to_cart', 'purchase')
     * @param {object} metadata - Additional event data
     */
    trackEvent(eventType, metadata = {}) {
        const now = Date.now();
        const event = {
            type: eventType,
            timestamp: now,
            ...metadata
        };

        // Add to events array
        this.events.push(event);

        // Update all windows
        this.updateWindows(event, now);

        return event;
    }

    updateWindows(event, timestamp) {
        // Update each window
        this.windows.forEach((window, windowSize) => {
            // Remove events outside the current window
            const windowStart = timestamp - windowSize;
            
            // Update counts
            window.count++;
            
            // Update type-specific counts
            if (!window.typeCounts.has(event.type)) {
                window.typeCounts.set(event.type, 0);
            }
            window.typeCounts.set(event.type, window.typeCounts.get(event.type) + 1);

            // Update window start time if this is a new window
            if (timestamp - window.startTime >= windowSize) {
                window.startTime = timestamp;
            }
        });
    }

    cleanupOldEvents() {
        const now = Date.now();
        // Remove events older than the largest window
        const oldestAllowed = now - Math.max(...this.windowSizes);
        
        // Find first index that's not too old
        const firstValidIndex = this.events.findIndex(event => event.timestamp >= oldestAllowed);
        
        if (firstValidIndex > 0) {
            // Remove old events
            this.events = this.events.slice(firstValidIndex);
        }
    }

    /**
     * Get activity metrics for a specific time window
     * @param {number} windowSize - Size of the window in milliseconds
     * @returns {object} Activity metrics for the window
     */
    getMetrics(windowSize) {
        if (!this.windows.has(windowSize)) {
            throw new Error(`Invalid window size. Available sizes: ${Array.from(this.windows.keys()).join(', ')}`);
        }

        const window = this.windows.get(windowSize);
        const now = Date.now();
        const windowStart = now - windowSize;
        
        // Filter events within the current window
        const recentEvents = this.events.filter(
            event => event.timestamp >= windowStart && event.testamp <= now
        );

        return {
            startTime: new Date(windowStart).toISOString(),
            endTime: new Date(now).toISOString(),
            totalEvents: recentEvents.length,
            eventsByType: this.countEventsByType(recentEvents),
            eventRate: this.calculateEventRate(recentEvents, windowSize)
        };
    }

    countEventsByType(events) {
        const counts = new Map();
        events.forEach(event => {
            counts.set(event.type, (counts.get(event.type) || 0) + 1);
        });
        return Object.fromEntries(counts);
    }

    calculateEventRate(events, windowSize) {
        if (events.length < 2) return 0;
        
        const timeSpan = events[events.length - 1].timestamp - events[0].timestamp;
        if (timeSpan === 0) return 0;
        
        const rate = (events.length / (timeSpan / 1000)); // events per second
        return Math.round(rate * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get all available window sizes
     * @returns {Array} List of available window sizes in milliseconds
     */
    getAvailableWindowSizes() {
        return [...this.windowSizes];
    }
}

// Export a singleton instance
const activityTracker = new ActivityTracker();

// Example usage:
// Track an event: activityTracker.trackEvent('page_view', { page: 'home' });
// Get metrics: const metrics = activityTracker.getMetrics(5 * 60 * 1000); // 5 minutes

export default activityTracker;
