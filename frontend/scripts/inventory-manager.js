/**
 * Inventory Management System
 *
 * Advanced inventory management with real-time tracking,
 * automated alerts, and DSA-optimized operations.
 */

class InventoryManager {
    constructor(operationsService) {
        this.operationsService = operationsService;
        this.inventory = new Map(); // productId -> InventoryItem
        this.transactions = new Map(); // transactionId -> InventoryTransaction
        this.alerts = [];
        this.reorderQueue = new PriorityQueue((a, b) => a.priority - b.priority);

        // Event listeners for real-time updates
        this.eventListeners = {
            stockChange: [],
            lowStock: [],
            reorder: [],
            transaction: []
        };
    }

    /**
     * Initialize inventory system
     */
    async initialize() {
        console.log('📦 Initializing Inventory Management System...');
        await this.loadInventoryFromFirestore();
        this.setupAutomatedAlerts();
        console.log('✅ Inventory Management System initialized');
    }

    /**
     * Add a new inventory item
     */
    addInventoryItem(inventoryData) {
        const item = new InventoryItem(inventoryData);
        this.inventory.set(item.productId, item);

        // Check if needs reordering
        if (item.isLowStock()) {
            this.createReorderAlert(item);
        }

        // Save to Firestore
        this.operationsService.db.collection('inventory').doc(item.productId).set(item);
        this.emitEvent('stockChange', { type: 'add', item });

        return item;
    }

    /**
     * Update inventory stock levels
     */
    async updateStock(productId, location, channel, quantity, transactionType, metadata = {}) {
        const item = this.inventory.get(productId);
        if (!item) {
            throw new Error(`Inventory item ${productId} not found`);
        }

        // Create transaction record
        const transaction = new InventoryTransaction({
            productId,
            type: transactionType,
            quantity,
            location,
            channel,
            unitCost: item.unitCost,
            notes: metadata.notes || '',
            createdBy: metadata.createdBy || 'system'
        });

        // Update inventory
        const previousStock = { ...item.stock };
        item.updateStock(location, channel, quantity, transactionType);

        // Store transaction
        this.transactions.set(transaction.id, transaction);

        // Save to Firestore
        await this.operationsService.db.collection('inventory_transactions').doc(transaction.id).set(transaction);
        await this.operationsService.db.collection('inventory').doc(productId).update({
            stock: item.stock,
            updatedAt: new Date()
        });

        // Check for alerts
        this.checkInventoryAlerts(item, previousStock);

        // Emit events
        this.emitEvent('stockChange', { item, transaction, previousStock });
        this.emitEvent('transaction', { transaction });

        return { item, transaction };
    }

    /**
     * Reserve inventory for an order
     */
    async reserveInventory(orderId, items) {
        const reservations = [];

        for (const item of items) {
            const inventoryItem = this.inventory.get(item.productId);
            if (!inventoryItem) {
                throw new Error(`Product ${item.productId} not found in inventory`);
            }

            if (inventoryItem.stock.available < item.quantity) {
                throw new Error(`Insufficient stock for ${item.productId}. Available: ${inventoryItem.stock.available}, Requested: ${item.quantity}`);
            }

            // Reserve the stock
            const result = await this.updateStock(
                item.productId,
                'default',
                'online',
                item.quantity,
                INVENTORY_TRANSACTION_TYPES.RESERVATION,
                {
                    referenceOrder: orderId,
                    notes: `Reserved for order ${orderId}`
                }
            );

            reservations.push(result);
        }

        return reservations;
    }

    /**
     * Release reserved inventory
     */
    async releaseInventory(orderId, items) {
        const releases = [];

        for (const item of items) {
            const result = await this.updateStock(
                item.productId,
                'default',
                'online',
                item.quantity,
                INVENTORY_TRANSACTION_TYPES.RELEASE,
                {
                    referenceOrder: orderId,
                    notes: `Released from cancelled order ${orderId}`
                }
            );

            releases.push(result);
        }

        return releases;
    }

    /**
     * Process order fulfillment (convert reserved to sold)
     */
    async fulfillOrder(orderId, items) {
        const fulfillments = [];

        for (const item of items) {
            const result = await this.updateStock(
                item.productId,
                'default',
                'online',
                item.quantity,
                INVENTORY_TRANSACTION_TYPES.SALE,
                {
                    referenceOrder: orderId,
                    notes: `Sold via order ${orderId}`
                }
            );

            fulfillments.push(result);
        }

        return fulfillments;
    }

    /**
     * Get inventory item with full details
     */
    getInventoryItem(productId) {
        return this.inventory.get(productId);
    }

    /**
     * Get all inventory items
     */
    getAllInventory() {
        return Array.from(this.inventory.values());
    }

    /**
     * Get inventory by category
     */
    getInventoryByCategory(category) {
        return this.getAllInventory().filter(item => item.category === category);
    }

    /**
     * Get low stock items
     */
    getLowStockItems() {
        return this.getAllInventory().filter(item => item.isLowStock());
    }

    /**
     * Get out of stock items
     */
    getOutOfStockItems() {
        return this.getAllInventory().filter(item => item.stock.available === 0);
    }

    /**
     * Get inventory value (total cost)
     */
    getInventoryValue() {
        return this.getAllInventory().reduce((total, item) => {
            return total + (item.stock.total * item.unitCost);
        }, 0);
    }

    /**
     * Get inventory by location
     */
    getInventoryByLocation(location) {
        const locationInventory = {};

        for (const item of this.inventory.values()) {
            const locationStock = item.getStockByLocation(location);
            if (locationStock.total > 0) {
                locationInventory[item.productId] = {
                    item,
                    stock: locationStock
                };
            }
        }

        return locationInventory;
    }

    /**
     * Get inventory by channel
     */
    getInventoryByChannel(channel) {
        const channelInventory = {};

        for (const item of this.inventory.values()) {
            const channelStock = item.getStockByChannel(channel);
            if (channelStock.total > 0) {
                channelInventory[item.productId] = {
                    item,
                    stock: channelStock
                };
            }
        }

        return channelInventory;
    }

    /**
     * Search inventory by name or SKU
     */
    searchInventory(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const item of this.inventory.values()) {
            if (item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.productId.toLowerCase().includes(searchTerm)) {
                results.push(item);
            }
        }

        return results;
    }

    /**
     * Generate inventory report
     */
    generateInventoryReport(filters = {}) {
        let items = this.getAllInventory();

        // Apply filters
        if (filters.category) {
            items = items.filter(item => item.category === filters.category);
        }

        if (filters.location) {
            const locationInventory = this.getInventoryByLocation(filters.location);
            items = items.filter(item => locationInventory[item.productId]);
        }

        if (filters.channel) {
            const channelInventory = this.getInventoryByChannel(filters.channel);
            items = items.filter(item => channelInventory[item.productId]);
        }

        if (filters.lowStock === true) {
            items = items.filter(item => item.isLowStock());
        }

        // Calculate summary
        const summary = {
            totalItems: items.length,
            totalValue: items.reduce((sum, item) => sum + (item.stock.total * item.unitCost), 0),
            totalAvailable: items.reduce((sum, item) => sum + item.stock.available, 0),
            totalReserved: items.reduce((sum, item) => sum + item.stock.reserved, 0),
            lowStockCount: items.filter(item => item.isLowStock()).length,
            outOfStockCount: items.filter(item => item.stock.available === 0).length
        };

        // Group by category
        const byCategory = {};
        for (const item of items) {
            if (!byCategory[item.category]) {
                byCategory[item.category] = {
                    items: [],
                    totalValue: 0,
                    totalStock: 0
                };
            }
            byCategory[item.category].items.push(item);
            byCategory[item.category].totalValue += item.stock.total * item.unitCost;
            byCategory[item.category].totalStock += item.stock.total;
        }

        return {
            summary,
            items,
            byCategory,
            generatedAt: new Date()
        };
    }

    /**
     * Create reorder alert
     */
    createReorderAlert(item) {
        const alert = {
            id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: 'low_stock',
            productId: item.productId,
            productName: item.name,
            currentStock: item.stock.available,
            reorderPoint: item.reorderPoint,
            suggestedQuantity: item.reorderQuantity,
            priority: item.reorderQuantity > item.reorderPoint * 2 ? 'high' : 'medium',
            createdAt: new Date(),
            status: 'active'
        };

        this.alerts.push(alert);
        this.reorderQueue.push(alert);
        this.emitEvent('lowStock', { alert, item });

        return alert;
    }

    /**
     * Process reorder alerts
     */
    async processReorderAlerts() {
        const alerts = [];

        while (!this.reorderQueue.isEmpty()) {
            const alert = this.reorderQueue.pop();

            if (alert.status === 'active') {
                // Here you would integrate with supplier systems
                console.log(`🔄 Processing reorder for ${alert.productName}: ${alert.suggestedQuantity} units`);

                // Mark as processed
                alert.status = 'processed';
                alert.processedAt = new Date();

                alerts.push(alert);
            }
        }

        return alerts;
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => alert.status === 'active');
    }

    /**
     * Get transaction history for a product
     */
    getTransactionHistory(productId, limit = 50) {
        return Array.from(this.transactions.values())
            .filter(transaction => transaction.productId === productId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    /**
     * Get inventory trends over time
     */
    getInventoryTrends(productId, days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const transactions = this.getTransactionHistory(productId, 1000)
            .filter(t => t.createdAt >= startDate && t.createdAt <= endDate);

        // Group by day and calculate running totals
        const trends = [];
        let runningTotal = 0;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));

            const dayTransactions = transactions.filter(t =>
                t.createdAt >= dayStart && t.createdAt < dayEnd
            );

            // Calculate net change for the day
            let dayChange = 0;
            for (const transaction of dayTransactions) {
                switch (transaction.type) {
                    case INVENTORY_TRANSACTION_TYPES.PURCHASE:
                    case INVENTORY_TRANSACTION_TYPES.RETURN:
                    case INVENTORY_TRANSACTION_TYPES.ADJUSTMENT:
                        dayChange += transaction.quantity;
                        break;
                    case INVENTORY_TRANSACTION_TYPES.SALE:
                        dayChange -= transaction.quantity;
                        break;
                }
            }

            runningTotal += dayChange;

            trends.push({
                date: dayStart.toISOString().split('T')[0],
                stock: runningTotal,
                transactions: dayTransactions.length,
                netChange: dayChange
            });
        }

        return trends;
    }

    /**
     * Setup automated alert system
     */
    setupAutomatedAlerts() {
        // Check for low stock every 5 minutes
        setInterval(() => {
            this.checkAllInventoryAlerts();
        }, 5 * 60 * 1000);

        // Process reorder queue every hour
        setInterval(() => {
            this.processReorderAlerts();
        }, 60 * 60 * 1000);
    }

    /**
     * Check alerts for all inventory items
     */
    checkAllInventoryAlerts() {
        for (const item of this.inventory.values()) {
            if (item.isLowStock() && !this.alerts.some(alert =>
                alert.productId === item.productId && alert.status === 'active'
            )) {
                this.createReorderAlert(item);
            }
        }
    }

    /**
     * Check alerts for a specific item
     */
    checkInventoryAlerts(item, previousStock) {
        // Check if stock just went below reorder point
        if (!previousStock || previousStock.available > item.reorderPoint) {
            if (item.stock.available <= item.reorderPoint) {
                if (!this.alerts.some(alert =>
                    alert.productId === item.productId && alert.status === 'active'
                )) {
                    this.createReorderAlert(item);
                }
            }
        }

        // Check if stock was low but now is replenished
        if (previousStock && previousStock.available <= item.reorderPoint &&
            item.stock.available > item.reorderPoint) {
            // Remove active alerts for this item
            this.alerts = this.alerts.filter(alert =>
                !(alert.productId === item.productId && alert.status === 'active')
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
     * Load inventory data from Firestore
     */
    async loadInventoryFromFirestore() {
        try {
            const snapshot = await this.operationsService.db.collection('inventory').get();
            snapshot.forEach(doc => {
                const item = new InventoryItem(doc.data());
                this.inventory.set(item.productId, item);
            });

            // Load transaction history (last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const transactionsSnapshot = await this.operationsService.db
                .collection('inventory_transactions')
                .where('createdAt', '>=', thirtyDaysAgo)
                .get();

            transactionsSnapshot.forEach(doc => {
                const transaction = new InventoryTransaction(doc.data());
                this.transactions.set(transaction.id, transaction);
            });

            console.log(`📦 Loaded ${this.inventory.size} inventory items`);
        } catch (error) {
            console.error('❌ Failed to load inventory data:', error);
        }
    }

    /**
     * Export inventory data
     */
    exportInventory(format = 'json') {
        const data = {
            items: this.getAllInventory(),
            transactions: Array.from(this.transactions.values()),
            alerts: this.getActiveAlerts(),
            summary: this.generateInventoryReport().summary,
            exportedAt: new Date()
        };

        if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return JSON.stringify(data, null, 2);
    }

    /**
     * Convert inventory data to CSV format
     */
    convertToCSV(data) {
        const headers = ['Product ID', 'Name', 'SKU', 'Category', 'Available Stock', 'Reserved Stock', 'Unit Cost', 'Total Value'];
        const rows = [headers.join(',')];

        for (const item of data.items) {
            const row = [
                item.productId,
                `"${item.name}"`,
                item.sku || '',
                item.category,
                item.stock.available,
                item.stock.reserved,
                item.unitCost,
                (item.stock.total * item.unitCost).toFixed(2)
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    /**
     * Bulk update inventory
     */
    async bulkUpdateInventory(updates) {
        const results = [];

        for (const update of updates) {
            try {
                const result = await this.updateStock(
                    update.productId,
                    update.location || 'default',
                    update.channel || 'online',
                    update.quantity,
                    update.transactionType,
                    update.metadata
                );
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({ success: false, error: error.message, productId: update.productId });
            }
        }

        return results;
    }

    /**
     * Transfer inventory between locations
     */
    async transferInventory(productId, fromLocation, toLocation, quantity) {
        // First, reduce stock from source location
        await this.updateStock(
            productId,
            fromLocation,
            'transfer',
            -quantity,
            INVENTORY_TRANSACTION_TYPES.TRANSFER,
            { notes: `Transfer from ${fromLocation} to ${toLocation}` }
        );

        // Then, add stock to destination location
        await this.updateStock(
            productId,
            toLocation,
            'transfer',
            quantity,
            INVENTORY_TRANSACTION_TYPES.TRANSFER,
            { notes: `Transfer from ${fromLocation} to ${toLocation}` }
        );

        return { success: true, productId, fromLocation, toLocation, quantity };
    }
}

// ==================== ADVANCED DSA FEATURES ====================

/**
 * Fenwick Tree for range queries on inventory levels
 */
class InventoryFenwickTree {
    constructor(size) {
        this.size = size;
        this.tree = new Array(size + 1).fill(0);
    }

    update(index, value) {
        index++; // 1-based indexing
        while (index <= this.size) {
            this.tree[index] += value;
            index += index & -index;
        }
    }

    query(index) {
        index++; // 1-based indexing
        let sum = 0;
        while (index > 0) {
            sum += this.tree[index];
            index -= index & -index;
        }
        return sum;
    }

    rangeQuery(left, right) {
        return this.query(right) - this.query(left - 1);
    }
}

/**
 * Segment Tree for inventory trend analysis
 */
class InventorySegmentTree {
    constructor(arr) {
        this.n = arr.length;
        this.tree = new Array(4 * this.n).fill(0);
        this.build(arr, 0, 0, this.n - 1);
    }

    build(arr, node, start, end) {
        if (start === end) {
            this.tree[node] = arr[start];
            return;
        }

        const mid = Math.floor((start + end) / 2);
        this.build(arr, 2 * node + 1, start, mid);
        this.build(arr, 2 * node + 2, mid + 1, end);

        this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }

    query(node, start, end, l, r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return this.tree[node];

        const mid = Math.floor((start + end) / 2);
        const left = this.query(2 * node + 1, start, mid, l, r);
        const right = this.query(2 * node + 2, mid + 1, end, l, r);

        return left + right;
    }

    update(node, start, end, index, value) {
        if (start === end) {
            this.tree[node] = value;
            return;
        }

        const mid = Math.floor((start + end) / 2);
        if (index <= mid) {
            this.update(2 * node + 1, start, mid, index, value);
        } else {
            this.update(2 * node + 2, mid + 1, end, index, value);
        }

        this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InventoryManager,
        InventoryFenwickTree,
        InventorySegmentTree
    };
}
