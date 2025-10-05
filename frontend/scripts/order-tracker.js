/**
 * Order Tracking and Processing System
 *
 * Advanced order management with real-time tracking,
 * status workflows, and DSA-optimized operations.
 */

class OrderTracker {
    constructor(operationsService, inventoryManager) {
        this.operationsService = operationsService;
        this.inventoryManager = inventoryManager;
        this.processingQueue = new PriorityQueue();
        this.activeOrders = new Set();
        this.orderMetrics = {
            totalProcessed: 0,
            averageProcessingTime: 0,
            successRate: 0,
            byChannel: {},
            byStatus: {}
        };

        // Event listeners
        this.eventListeners = {
            orderCreated: [],
            orderUpdated: [],
            orderProcessed: [],
            orderFailed: []
        };
    }

    /**
     * Initialize order tracking system
     */
    async initialize() {
        console.log('📋 Initializing Order Tracking System...');
        this.setupOrderProcessing();
        this.setupMetricsTracking();
        console.log('✅ Order Tracking System initialized');
    }

    /**
     * Create a new order with full validation and inventory checks
     */
    async createOrder(orderData) {
        try {
            // Validate order data
            this.validateOrderData(orderData);

            // Create order object
            const order = new Order(orderData);

            // Check inventory availability across all channels
            await this.validateInventoryAvailability(order);

            // Reserve inventory
            await this.inventoryManager.reserveInventory(order.id, order.items);

            // Save order to database
            await this.operationsService.db.collection('orders').doc(order.id).set(order);

            // Add to processing queue if auto-processing is enabled
            if (orderData.autoProcess !== false) {
                this.processingQueue.push(order);
            }

            // Update metrics
            this.updateOrderMetrics(order, 'created');

            // Emit events
            this.emitEvent('orderCreated', { order });

            return order;

        } catch (error) {
            console.error('❌ Failed to create order:', error);
            this.emitEvent('orderFailed', { error, orderData });
            throw error;
        }
    }

    /**
     * Update order status with full workflow management
     */
    async updateOrderStatus(orderId, newStatus, metadata = {}) {
        const order = this.operationsService.orderHashMap.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        const oldStatus = order.status;
        const timestamp = new Date();

        // Validate status transition
        this.validateStatusTransition(order, newStatus);

        // Update order status
        order.updateStatus(newStatus, metadata.note || '');

        // Handle inventory based on status changes
        await this.handleInventoryForStatusChange(order, oldStatus, newStatus);

        // Update processing time metrics
        if (newStatus === ORDER_STATUS.DELIVERED) {
            order.processingTime = timestamp - order.createdAt;
            this.updateProcessingTimeMetrics(order.processingTime);
        }

        // Save to database
        await this.operationsService.db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: timestamp,
            statusHistory: order.statusHistory,
            processingTime: order.processingTime
        });

        // Update metrics
        this.updateOrderMetrics(order, 'updated');

        // Emit events
        this.emitEvent('orderUpdated', { order, oldStatus, newStatus });

        return order;
    }

    /**
     * Process orders from the queue
     */
    async processOrderQueue() {
        const processedOrders = [];
        const failedOrders = [];

        while (!this.processingQueue.isEmpty()) {
            const order = this.processingQueue.pop();

            if (this.activeOrders.has(order.id)) {
                continue; // Skip already processing orders
            }

            this.activeOrders.add(order.id);

            try {
                await this.processOrder(order);
                processedOrders.push(order);
                this.emitEvent('orderProcessed', { order });
            } catch (error) {
                console.error(`❌ Failed to process order ${order.id}:`, error);
                failedOrders.push({ order, error: error.message });
                this.emitEvent('orderFailed', { order, error });
            } finally {
                this.activeOrders.delete(order.id);
            }
        }

        return { processedOrders, failedOrders };
    }

    /**
     * Process a single order through its workflow
     */
    async processOrder(order) {
        const startTime = Date.now();

        try {
            // Step 1: Confirm order
            if (order.status === ORDER_STATUS.PENDING) {
                await this.updateOrderStatus(order.id, ORDER_STATUS.CONFIRMED, {
                    note: 'Order automatically confirmed'
                });
            }

            // Step 2: Process payment (simulate)
            await this.simulatePaymentProcessing(order);

            // Step 3: Check inventory availability
            await this.validateInventoryAvailability(order);

            // Step 4: Process order
            await this.updateOrderStatus(order.id, ORDER_STATUS.PROCESSING, {
                note: 'Order is being processed'
            });

            // Step 5: Simulate fulfillment time based on channel
            await this.simulateFulfillment(order);

            // Step 6: Ship order
            await this.updateOrderStatus(order.id, ORDER_STATUS.SHIPPED, {
                note: 'Order has been shipped'
            });

            // Step 7: Deliver order (simulate delivery time)
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delivery
            await this.updateOrderStatus(order.id, ORDER_STATUS.DELIVERED, {
                note: 'Order has been delivered'
            });

            // Update processing metrics
            const processingTime = Date.now() - startTime;
            order.processingTime = processingTime;
            this.updateProcessingTimeMetrics(processingTime);

        } catch (error) {
            // Handle processing failure
            await this.updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, {
                note: `Processing failed: ${error.message}`
            });
            throw error;
        }
    }

    /**
     * Get order by ID with full details
     */
    getOrder(orderId) {
        return this.operationsService.orderHashMap.get(orderId);
    }

    /**
     * Get orders by various criteria using DSA-optimized structures
     */
    getOrders(filters = {}) {
        let orders = this.operationsService.orderHashMap.getAll();

        // Apply filters
        if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
        }

        if (filters.channel) {
            orders = orders.filter(order => order.channel === filters.channel);
        }

        if (filters.customerId) {
            orders = orders.filter(order => order.customerId === filters.customerId);
        }

        if (filters.dateFrom) {
            orders = orders.filter(order => order.createdAt >= filters.dateFrom);
        }

        if (filters.dateTo) {
            orders = orders.filter(order => order.createdAt <= filters.dateTo);
        }

        if (filters.minAmount) {
            orders = orders.filter(order => order.totalAmount >= filters.minAmount);
        }

        if (filters.maxAmount) {
            orders = orders.filter(order => order.totalAmount <= filters.maxAmount);
        }

        // Apply sorting
        if (filters.sortBy) {
            orders = this.sortOrders(orders, filters.sortBy, filters.sortOrder || 'asc');
        } else {
            // Default sort by priority and date
            orders.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return b.createdAt - a.createdAt;
            });
        }

        return orders;
    }

    /**
     * Get orders by status
     */
    getOrdersByStatus(status) {
        return this.operationsService.orderHashMap.getByStatus(status);
    }

    /**
     * Get orders by channel
     */
    getOrdersByChannel(channel) {
        return this.operationsService.orderHashMap.getByChannel(channel);
    }

    /**
     * Get orders in date range using BST
     */
    getOrdersByDateRange(startDate, endDate) {
        return this.operationsService.orderBST.rangeSearch(
            startDate.getTime().toString(),
            endDate.getTime().toString()
        );
    }

    /**
     * Search orders by ID, customer info, or product
     */
    searchOrders(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const order of this.operationsService.orderHashMap.getAll()) {
            // Search in order ID
            if (order.id.toLowerCase().includes(searchTerm)) {
                results.push(order);
                continue;
            }

            // Search in customer info (if available)
            if (order.customerId && order.customerId.toLowerCase().includes(searchTerm)) {
                results.push(order);
                continue;
            }

            // Search in items
            for (const item of order.items) {
                if (item.productId.toLowerCase().includes(searchTerm)) {
                    results.push(order);
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Get order statistics and analytics
     */
    getOrderAnalytics(timeframe = '30d') {
        const now = new Date();
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        const orders = this.getOrders({ dateFrom: startDate });

        // Basic metrics
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(order => order.status === ORDER_STATUS.DELIVERED)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        // Status breakdown
        const statusBreakdown = {};
        for (const order of orders) {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        }

        // Channel breakdown
        const channelBreakdown = {};
        for (const order of orders) {
            channelBreakdown[order.channel] = (channelBreakdown[order.channel] || 0) + 1;
        }

        // Average order value
        const deliveredOrders = orders.filter(order => order.status === ORDER_STATUS.DELIVERED);
        const avgOrderValue = deliveredOrders.length > 0
            ? totalRevenue / deliveredOrders.length
            : 0;

        // Processing time analysis
        const processingTimes = deliveredOrders
            .filter(order => order.processingTime > 0)
            .map(order => order.processingTime);

        const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            : 0;

        // Daily trends
        const dailyTrends = this.getDailyOrderTrends(orders, days);

        return {
            timeframe,
            summary: {
                totalOrders,
                totalRevenue,
                avgOrderValue,
                avgProcessingTime: Math.round(avgProcessingTime / 1000 / 60), // Convert to minutes
                successRate: totalOrders > 0 ? (deliveredOrders.length / totalOrders * 100) : 0
            },
            breakdown: {
                byStatus: statusBreakdown,
                byChannel: channelBreakdown
            },
            trends: dailyTrends,
            generatedAt: now
        };
    }

    /**
     * Get daily order trends for analytics
     */
    getDailyOrderTrends(orders, days) {
        const trends = [];

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
                avgOrderValue: dayOrders.length > 0 ? dayRevenue / dayOrders.length : 0
            });
        }

        return trends;
    }

    /**
     * Setup automated order processing
     */
    setupOrderProcessing() {
        // Process order queue every 30 seconds
        setInterval(() => {
            this.processOrderQueue();
        }, 30000);

        // Check for stuck orders every 5 minutes
        setInterval(() => {
            this.checkStuckOrders();
        }, 5 * 60 * 1000);
    }

    /**
     * Setup metrics tracking
     */
    setupMetricsTracking() {
        // Update channel metrics every hour
        setInterval(() => {
            this.updateChannelMetrics();
        }, 60 * 60 * 1000);
    }

    /**
     * Check for stuck orders and attempt recovery
     */
    async checkStuckOrders() {
        const stuckOrders = [];

        for (const order of this.operationsService.orderHashMap.getAll()) {
            const timeSinceUpdate = Date.now() - order.updatedAt.getTime();

            // Consider orders stuck if not updated for 2 hours and in processing state
            if (timeSinceUpdate > 2 * 60 * 60 * 1000 &&
                (order.status === ORDER_STATUS.PROCESSING || order.status === ORDER_STATUS.CONFIRMED)) {

                stuckOrders.push(order);

                // Attempt to recover stuck orders
                console.warn(`⚠️ Found stuck order: ${order.id} (${order.status})`);

                // For demo purposes, we'll just log it
                // In production, you might want to retry processing or alert administrators
            }
        }

        return stuckOrders;
    }

    /**
     * Validate order data
     */
    validateOrderData(orderData) {
        if (!orderData.customerId) {
            throw new Error('Customer ID is required');
        }

        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (!orderData.totalAmount || orderData.totalAmount <= 0) {
            throw new Error('Order total amount must be greater than 0');
        }

        // Validate each item
        for (const item of orderData.items) {
            if (!item.productId || !item.quantity || !item.unitPrice) {
                throw new Error('Each order item must have productId, quantity, and unitPrice');
            }

            if (item.quantity <= 0 || item.unitPrice <= 0) {
                throw new Error('Item quantity and unit price must be greater than 0');
            }
        }
    }

    /**
     * Validate inventory availability
     */
    async validateInventoryAvailability(order) {
        for (const item of order.items) {
            const inventoryItem = this.inventoryManager.getInventoryItem(item.productId);
            if (!inventoryItem) {
                throw new Error(`Product ${item.productId} not found in inventory`);
            }

            if (inventoryItem.stock.available < item.quantity) {
                throw new Error(`Insufficient stock for ${item.productId}. Available: ${inventoryItem.stock.available}, Requested: ${item.quantity}`);
            }
        }
    }

    /**
     * Validate status transition
     */
    validateStatusTransition(order, newStatus) {
        const validTransitions = {
            [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
            [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
            [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
            [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED],
            [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED],
            [ORDER_STATUS.CANCELLED]: [],
            [ORDER_STATUS.RETURNED]: [ORDER_STATUS.REFUNDED],
            [ORDER_STATUS.REFUNDED]: []
        };

        if (!validTransitions[order.status].includes(newStatus)) {
            throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
        }
    }

    /**
     * Handle inventory changes for status transitions
     */
    async handleInventoryForStatusChange(order, oldStatus, newStatus) {
        if (oldStatus === ORDER_STATUS.PENDING && newStatus === ORDER_STATUS.CANCELLED) {
            // Release reserved inventory
            await this.inventoryManager.releaseInventory(order.id, order.items);
        } else if (newStatus === ORDER_STATUS.DELIVERED) {
            // Convert reserved to sold
            await this.inventoryManager.fulfillOrder(order.id, order.items);
        } else if (oldStatus === ORDER_STATUS.DELIVERED && newStatus === ORDER_STATUS.RETURNED) {
            // Handle return - add back to inventory
            for (const item of order.items) {
                await this.inventoryManager.updateStock(
                    item.productId,
                    'default',
                    order.channel,
                    item.quantity,
                    INVENTORY_TRANSACTION_TYPES.RETURN,
                    {
                        referenceOrder: order.id,
                        notes: `Returned from order ${order.id}`
                    }
                );
            }
        }
    }

    /**
     * Simulate payment processing
     */
    async simulatePaymentProcessing(order) {
        // Simulate payment processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        // In a real system, this would integrate with payment gateways
        console.log(`💳 Processing payment for order ${order.id}: ₹${order.totalAmount}`);
    }

    /**
     * Simulate fulfillment processing
     */
    async simulateFulfillment(order) {
        // Simulate fulfillment time based on channel
        const fulfillmentTime = {
            [CHANNEL_TYPES.ONLINE]: 2000,
            [CHANNEL_TYPES.MOBILE_APP]: 1500,
            [CHANNEL_TYPES.IN_STORE]: 500,
            [CHANNEL_TYPES.WHOLESALE]: 3000
        };

        const time = fulfillmentTime[order.channel] || 2000;
        await new Promise(resolve => setTimeout(resolve, time));

        console.log(`📦 Fulfilled order ${order.id} via ${order.channel}`);
    }

    /**
     * Sort orders using DSA-optimized methods
     */
    sortOrders(orders, sortBy, sortOrder = 'asc') {
        const compareFunctions = {
            date: (a, b) => b.createdAt - a.createdAt,
            amount: (a, b) => b.totalAmount - a.totalAmount,
            priority: (a, b) => b.priority - a.priority,
            status: (a, b) => a.status.localeCompare(b.status)
        };

        const compareFn = compareFunctions[sortBy] || compareFunctions.date;

        const sorted = [...orders].sort(compareFn);
        return sortOrder === 'desc' ? sorted.reverse() : sorted;
    }

    /**
     * Update order metrics
     */
    updateOrderMetrics(order, action) {
        this.orderMetrics.totalProcessed++;

        // Update channel metrics
        if (!this.orderMetrics.byChannel[order.channel]) {
            this.orderMetrics.byChannel[order.channel] = { count: 0, revenue: 0 };
        }
        this.orderMetrics.byChannel[order.channel].count++;

        if (order.status === ORDER_STATUS.DELIVERED) {
            this.orderMetrics.byChannel[order.channel].revenue += order.totalAmount;
        }

        // Update status metrics
        if (!this.orderMetrics.byStatus[order.status]) {
            this.orderMetrics.byStatus[order.status] = 0;
        }
        this.orderMetrics.byStatus[order.status]++;
    }

    /**
     * Update processing time metrics
     */
    updateProcessingTimeMetrics(processingTime) {
        const current = this.orderMetrics.averageProcessingTime;
        const total = this.orderMetrics.totalProcessed;

        // Calculate running average
        this.orderMetrics.averageProcessingTime =
            (current * (total - 1) + processingTime) / total;
    }

    /**
     * Update channel-specific metrics
     */
    updateChannelMetrics() {
        for (const [channelId, channel] of this.operationsService.channels) {
            const orders = this.getOrdersByChannel(channel.type);
            const deliveredOrders = orders.filter(order => order.status === ORDER_STATUS.DELIVERED);

            channel.updateMetrics(
                deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
                deliveredOrders.length
            );
        }
    }

    /**
     * Event system for real-time updates
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emitEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get next order to process from queue
     */
    getNextOrderToProcess() {
        return this.processingQueue.peek();
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId, reason = '') {
        return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
            note: `Order cancelled: ${reason}`
        });
    }

    /**
     * Return an order
     */
    async returnOrder(orderId, reason = '') {
        return await this.updateOrderStatus(orderId, ORDER_STATUS.RETURNED, {
            note: `Order returned: ${reason}`
        });
    }

    /**
     * Get order processing statistics
     */
    getProcessingStats() {
        const orders = this.operationsService.orderHashMap.getAll();
        const now = Date.now();

        return {
            queueSize: this.processingQueue.size(),
            activeOrders: this.activeOrders.size(),
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
            processingOrders: orders.filter(o => o.status === ORDER_STATUS.PROCESSING).length,
            completedOrders: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length,
            averageProcessingTime: Math.round(this.orderMetrics.averageProcessingTime / 1000 / 60), // minutes
            successRate: this.orderMetrics.totalProcessed > 0
                ? (orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length / this.orderMetrics.totalProcessed * 100)
                : 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OrderTracker
    };
}
