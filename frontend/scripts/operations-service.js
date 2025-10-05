/**
 * Operations Module - Data Models and Core Services
 *
 * Implements efficient order tracking, inventory management, and
 * multi-channel sales performance with advanced DSA techniques.
 */

// ==================== DATA MODELS ====================

/**
 * Sales Channel Types
 */
const CHANNEL_TYPES = {
    ONLINE: 'online',
    MOBILE_APP: 'mobile_app',
    IN_STORE: 'in_store',
    WHOLESALE: 'wholesale',
    MARKETPLACE: 'marketplace',
    PHONE_ORDER: 'phone_order',
    SOCIAL_COMMERCE: 'social_commerce'
};

/**
 * Order Status Types
 */
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
    REFUNDED: 'refunded'
};

/**
 * Inventory Transaction Types
 */
const INVENTORY_TRANSACTION_TYPES = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer',
    RESERVATION: 'reservation',
    RELEASE: 'release'
};

/**
 * Order Schema - Enhanced with channel tracking and DSA optimization
 */
class Order {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.customerId = data.customerId;
        this.channel = data.channel || CHANNEL_TYPES.ONLINE;
        this.status = data.status || ORDER_STATUS.PENDING;
        this.items = data.items || [];
        this.totalAmount = data.totalAmount || 0;
        this.currency = data.currency || 'INR';
        this.shippingAddress = data.shippingAddress || {};
        this.billingAddress = data.billingAddress || {};

        // Timestamps for DSA operations
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.confirmedAt = data.confirmedAt || null;
        this.shippedAt = data.shippedAt || null;
        this.deliveredAt = data.deliveredAt || null;

        // Status history for tracking
        this.statusHistory = data.statusHistory || [{
            status: this.status,
            timestamp: this.createdAt,
            note: 'Order created'
        }];

        // Channel attribution data
        this.utmSource = data.utmSource || null;
        this.utmMedium = data.utmMedium || null;
        this.utmCampaign = data.utmCampaign || null;
        this.referrer = data.referrer || null;

        // Performance metrics
        this.processingTime = data.processingTime || 0;
        this.priority = data.priority || this.calculatePriority();
    }

    generateId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    calculatePriority() {
        // Higher value customers and urgent channels get higher priority
        const channelPriority = {
            [CHANNEL_TYPES.PHONE_ORDER]: 10,
            [CHANNEL_TYPES.WHOLESALE]: 8,
            [CHANNEL_TYPES.IN_STORE]: 6,
            [CHANNEL_TYPES.MOBILE_APP]: 5,
            [CHANNEL_TYPES.ONLINE]: 4,
            [CHANNEL_TYPES.SOCIAL_COMMERCE]: 3,
            [CHANNEL_TYPES.MARKETPLACE]: 2
        };
        return channelPriority[this.channel] || 1;
    }

    updateStatus(newStatus, note = '') {
        this.status = newStatus;
        this.updatedAt = new Date();

        // Track status change timing
        if (newStatus === ORDER_STATUS.CONFIRMED && !this.confirmedAt) {
            this.confirmedAt = this.updatedAt;
        } else if (newStatus === ORDER_STATUS.SHIPPED && !this.shippedAt) {
            this.shippedAt = this.updatedAt;
        } else if (newStatus === ORDER_STATUS.DELIVERED && !this.deliveredAt) {
            this.deliveredAt = this.updatedAt;
        }

        // Add to status history
        this.statusHistory.push({
            status: newStatus,
            timestamp: this.updatedAt,
            note: note
        });
    }

    addItem(productId, quantity, price, metadata = {}) {
        const item = {
            productId,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity,
            metadata,
            addedAt: new Date()
        };

        this.items.push(item);
        this.calculateTotal();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.calculateTotal();
    }

    calculateTotal() {
        this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
        this.updatedAt = new Date();
    }

    // DSA-optimized comparison methods for sorting
    static compareByAmount(a, b) {
        return b.totalAmount - a.totalAmount;
    }

    static compareByDate(a, b) {
        return b.createdAt - a.createdAt;
    }

    static compareByPriority(a, b) {
        return b.priority - a.priority;
    }
}

/**
 * Inventory Item Schema - Location and channel-aware
 */
class InventoryItem {
    constructor(data = {}) {
        this.productId = data.productId;
        this.sku = data.sku;
        this.name = data.name;
        this.category = data.category;

        // Stock levels by location/channel
        this.stock = {
            total: data.stock?.total || 0,
            available: data.stock?.available || 0,
            reserved: data.stock?.reserved || 0,
            damaged: data.stock?.damaged || 0,
            byLocation: data.stock?.byLocation || {},
            byChannel: data.stock?.byChannel || {}
        };

        // Inventory metadata
        this.unitCost = data.unitCost || 0;
        this.sellingPrice = data.sellingPrice || 0;
        this.reorderPoint = data.reorderPoint || 10;
        this.reorderQuantity = data.reorderQuantity || 50;

        // Tracking
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.lastStockedAt = data.lastStockedAt || null;

        // Suppliers and locations
        this.suppliers = data.suppliers || [];
        this.locations = data.locations || [];
        this.channels = data.channels || [CHANNEL_TYPES.ONLINE];
    }

    updateStock(location, channel, quantity, transactionType) {
        // Initialize location and channel if not exists
        if (!this.stock.byLocation[location]) {
            this.stock.byLocation[location] = { total: 0, available: 0, reserved: 0 };
        }
        if (!this.stock.byChannel[channel]) {
            this.stock.byChannel[channel] = { total: 0, available: 0, reserved: 0 };
        }

        const locationStock = this.stock.byLocation[location];
        const channelStock = this.stock.byChannel[channel];

        // Update based on transaction type
        switch (transactionType) {
            case INVENTORY_TRANSACTION_TYPES.PURCHASE:
            case INVENTORY_TRANSACTION_TYPES.ADJUSTMENT:
                locationStock.total += quantity;
                locationStock.available += quantity;
                channelStock.total += quantity;
                channelStock.available += quantity;
                break;

            case INVENTORY_TRANSACTION_TYPES.SALE:
                locationStock.total -= quantity;
                locationStock.available -= quantity;
                channelStock.total -= quantity;
                channelStock.available -= quantity;
                break;

            case INVENTORY_TRANSACTION_TYPES.RESERVATION:
                locationStock.available -= quantity;
                locationStock.reserved += quantity;
                channelStock.available -= quantity;
                channelStock.reserved += quantity;
                break;

            case INVENTORY_TRANSACTION_TYPES.RELEASE:
                locationStock.reserved -= quantity;
                locationStock.available += quantity;
                channelStock.reserved -= quantity;
                channelStock.available += quantity;
                break;

            case INVENTORY_TRANSACTION_TYPES.RETURN:
                locationStock.total += quantity;
                locationStock.available += quantity;
                channelStock.total += quantity;
                channelStock.available += quantity;
                break;
        }

        // Update totals
        this.stock.total = Object.values(this.stock.byLocation)
            .reduce((sum, loc) => sum + loc.total, 0);
        this.stock.available = Object.values(this.stock.byLocation)
            .reduce((sum, loc) => sum + loc.available, 0);
        this.stock.reserved = Object.values(this.stock.byLocation)
            .reduce((sum, loc) => sum + loc.reserved, 0);

        this.updatedAt = new Date();
        return this.stock;
    }

    isLowStock() {
        return this.stock.available <= this.reorderPoint;
    }

    getStockByChannel(channel) {
        return this.stock.byChannel[channel] || { total: 0, available: 0, reserved: 0 };
    }

    getStockByLocation(location) {
        return this.stock.byLocation[location] || { total: 0, available: 0, reserved: 0 };
    }
}

/**
 * Sales Channel Schema
 */
class SalesChannel {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.isActive = data.isActive !== false;

        // Channel configuration
        this.configuration = {
            priority: data.configuration?.priority || 1,
            commission: data.configuration?.commission || 0,
            processingTime: data.configuration?.processingTime || 24, // hours
            supportedPaymentMethods: data.configuration?.supportedPaymentMethods || ['card', 'upi', 'netbanking'],
            deliveryOptions: data.configuration?.deliveryOptions || ['standard', 'express']
        };

        // Performance metrics
        this.metrics = {
            totalRevenue: data.metrics?.totalRevenue || 0,
            totalOrders: data.metrics?.totalOrders || 0,
            averageOrderValue: data.metrics?.averageOrderValue || 0,
            conversionRate: data.metrics?.conversionRate || 0,
            customerSatisfaction: data.metrics?.customerSatisfaction || 0
        };

        // Tracking
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    updateMetrics(orderAmount, orderCount = 1) {
        this.metrics.totalRevenue += orderAmount;
        this.metrics.totalOrders += orderCount;
        this.metrics.averageOrderValue = this.metrics.totalRevenue / this.metrics.totalOrders;
        this.updatedAt = new Date();
    }
}

/**
 * Inventory Transaction Schema
 */
class InventoryTransaction {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.productId = data.productId;
        this.type = data.type;
        this.quantity = data.quantity;
        this.location = data.location;
        this.channel = data.channel;
        this.referenceOrder = data.referenceOrder || null;
        this.unitCost = data.unitCost || 0;
        this.totalValue = this.quantity * this.unitCost;
        this.notes = data.notes || '';
        this.createdBy = data.createdBy || 'system';
        this.createdAt = data.createdAt || new Date();
    }

    generateId() {
        return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
}

// ==================== DSA DATA STRUCTURES ====================

/**
 * HashMap for O(1) Order Lookups
 * Custom implementation for efficient order retrieval
 */
class OrderHashMap {
    constructor() {
        this.buckets = new Array(1000); // Initial capacity
        this.size = 0;
    }

    hash(key) {
        // Simple hash function for strings
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % this.buckets.length;
    }

    put(order) {
        const key = order.id;
        const index = this.hash(key);

        if (!this.buckets[index]) {
            this.buckets[index] = [];
        }

        // Update existing or add new
        const existingIndex = this.buckets[index].findIndex(item => item.key === key);
        if (existingIndex >= 0) {
            this.buckets[index][existingIndex] = { key, value: order };
        } else {
            this.buckets[index].push({ key, value: order });
            this.size++;
        }

        // Resize if needed (simple load factor check)
        if (this.size > this.buckets.length * 0.75) {
            this.resize();
        }
    }

    get(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        if (bucket) {
            const item = bucket.find(item => item.key === key);
            return item ? item.value : null;
        }
        return null;
    }

    remove(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        if (bucket) {
            const itemIndex = bucket.findIndex(item => item.key === key);
            if (itemIndex >= 0) {
                bucket.splice(itemIndex, 1);
                this.size--;
                return true;
            }
        }
        return false;
    }

    resize() {
        const oldBuckets = this.buckets;
        this.buckets = new Array(this.buckets.length * 2);
        this.size = 0;

        for (const bucket of oldBuckets) {
            if (bucket) {
                for (const item of bucket) {
                    this.put(item.value);
                }
            }
        }
    }

    getAll() {
        const orders = [];
        for (const bucket of this.buckets) {
            if (bucket) {
                for (const item of bucket) {
                    orders.push(item.value);
                }
            }
        }
        return orders;
    }

    getByChannel(channel) {
        return this.getAll().filter(order => order.channel === channel);
    }

    getByStatus(status) {
        return this.getAll().filter(order => order.status === status);
    }
}

/**
 * Binary Search Tree for Efficient Order Sorting
 */
class OrderBSTNode {
    constructor(order) {
        this.order = order;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

class OrderBST {
    constructor(compareFunction = Order.compareByDate) {
        this.root = null;
        this.compare = compareFunction;
        this.size = 0;
    }

    insert(order) {
        this.root = this._insertRecursive(this.root, order);
        this.size++;
    }

    _insertRecursive(node, order) {
        if (!node) {
            return new OrderBSTNode(order);
        }

        if (this.compare(order, node.order) < 0) {
            node.left = this._insertRecursive(node.left, order);
        } else {
            node.right = this._insertRecursive(node.right, order);
        }

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        return node;
    }

    search(key) {
        return this._searchRecursive(this.root, key);
    }

    _searchRecursive(node, key) {
        if (!node || node.order.id === key) {
            return node ? node.order : null;
        }

        if (key < node.order.id) {
            return this._searchRecursive(node.left, key);
        }
        return this._searchRecursive(node.right, key);
    }

    inOrder(callback) {
        this._inOrderRecursive(this.root, callback);
    }

    _inOrderRecursive(node, callback) {
        if (node) {
            this._inOrderRecursive(node.left, callback);
            callback(node.order);
            this._inOrderRecursive(node.right, callback);
        }
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    rangeSearch(startKey, endKey) {
        const results = [];
        this._rangeSearchRecursive(this.root, startKey, endKey, results);
        return results;
    }

    _rangeSearchRecursive(node, startKey, endKey, results) {
        if (!node) return;

        // Check if node is within range
        if (node.order.id >= startKey && node.order.id <= endKey) {
            results.push(node.order);
        }

        // Continue searching based on comparison
        if (node.order.id > startKey) {
            this._rangeSearchRecursive(node.left, startKey, endKey, results);
        }
        if (node.order.id < endKey) {
            this._rangeSearchRecursive(node.right, startKey, endKey, results);
        }
    }
}

/**
 * Priority Queue for Order Processing
 */
class PriorityQueue {
    constructor(compareFunction = (a, b) => a.priority - b.priority) {
        this.heap = [];
        this.compare = compareFunction;
    }

    push(order) {
        this.heap.push(order);
        this._bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.isEmpty()) return null;

        const root = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }

        return root;
    }

    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    size() {
        return this.heap.length;
    }

    _bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;

            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    _sinkDown(index) {
        const length = this.heap.length;

        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
                smallest = left;
            }

            if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
                smallest = right;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}

// ==================== CORE SERVICES ====================

/**
 * Operations Service - Main coordinator for all operations
 */
class OperationsService {
    constructor(db) {
        this.db = db;
        this.orderHashMap = new OrderHashMap();
        this.orderBST = new OrderBST();
        this.priorityQueue = new PriorityQueue();
        this.inventory = new Map();
        this.channels = new Map();
        this.transactions = [];

        this.initializeDefaultChannels();
    }

    async initialize() {
        console.log('🚀 Initializing Operations Module...');
        await this.loadDataFromFirestore();
        this.setupRealTimeListeners();
        console.log('✅ Operations Module initialized');
    }

    initializeDefaultChannels() {
        const defaultChannels = [
            { id: 'online', name: 'Online Store', type: CHANNEL_TYPES.ONLINE },
            { id: 'mobile', name: 'Mobile App', type: CHANNEL_TYPES.MOBILE_APP },
            { id: 'store', name: 'Physical Store', type: CHANNEL_TYPES.IN_STORE },
            { id: 'wholesale', name: 'Wholesale', type: CHANNEL_TYPES.WHOLESALE }
        ];

        defaultChannels.forEach(channelData => {
            const channel = new SalesChannel(channelData);
            this.channels.set(channel.id, channel);
        });
    }

    setupRealTimeListeners() {
        // Listen for order changes
        this.db.collection('orders').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const orderData = change.doc.data();
                    this.processOrderUpdate(orderData);
                }
            });
        });

        // Listen for inventory changes
        this.db.collection('inventory').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const inventoryData = change.doc.data();
                    this.processInventoryUpdate(inventoryData);
                }
            });
        });
    }

    processOrderUpdate(orderData) {
        const order = new Order(orderData);
        this.orderHashMap.put(order);
        this.orderBST.insert(order);

        if (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) {
            this.priorityQueue.push(order);
        }
    }

    processInventoryUpdate(inventoryData) {
        const item = new InventoryItem(inventoryData);
        this.inventory.set(item.productId, item);
    }

    async createOrder(orderData) {
        const order = new Order(orderData);

        // Check inventory availability
        for (const item of order.items) {
            const inventoryItem = this.inventory.get(item.productId);
            if (!inventoryItem || inventoryItem.stock.available < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.productId}`);
            }
        }

        // Reserve inventory
        for (const item of order.items) {
            const inventoryItem = this.inventory.get(item.productId);
            inventoryItem.updateStock('default', order.channel, item.quantity, INVENTORY_TRANSACTION_TYPES.RESERVATION);
        }

        // Save to Firestore
        await this.db.collection('orders').doc(order.id).set(order);
        return order;
    }

    async updateOrderStatus(orderId, newStatus, note = '') {
        const order = this.orderHashMap.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        const oldStatus = order.status;
        order.updateStatus(newStatus, note);

        // Handle inventory changes based on status transition
        if (oldStatus === ORDER_STATUS.PENDING && newStatus === ORDER_STATUS.CANCELLED) {
            // Release reserved inventory
            for (const item of order.items) {
                const inventoryItem = this.inventory.get(item.productId);
                if (inventoryItem) {
                    inventoryItem.updateStock('default', order.channel, item.quantity, INVENTORY_TRANSACTION_TYPES.RELEASE);
                }
            }
        } else if (newStatus === ORDER_STATUS.DELIVERED) {
            // Convert reserved to sold
            for (const item of order.items) {
                const inventoryItem = this.inventory.get(item.productId);
                if (inventoryItem) {
                    inventoryItem.updateStock('default', order.channel, item.quantity, INVENTORY_TRANSACTION_TYPES.SALE);
                }
            }
        }

        // Update in Firestore
        await this.db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: new Date(),
            statusHistory: order.statusHistory
        });

        return order;
    }

    getOrderById(orderId) {
        return this.orderHashMap.get(orderId);
    }

    getOrdersByChannel(channel) {
        return this.orderHashMap.getByChannel(channel);
    }

    getOrdersByStatus(status) {
        return this.orderHashMap.getByStatus(status);
    }

    getOrdersByDateRange(startDate, endDate) {
        const startKey = startDate.getTime().toString();
        const endKey = endDate.getTime().toString();
        return this.orderBST.rangeSearch(startKey, endKey);
    }

    getNextOrderToProcess() {
        return this.priorityQueue.pop();
    }

    addInventoryItem(inventoryData) {
        const item = new InventoryItem(inventoryData);
        this.inventory.set(item.productId, item);

        // Save to Firestore
        this.db.collection('inventory').doc(item.productId).set(item);
        return item;
    }

    getInventoryItem(productId) {
        return this.inventory.get(productId);
    }

    getLowStockItems() {
        return Array.from(this.inventory.values()).filter(item => item.isLowStock());
    }

    getChannelPerformance(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return null;

        const orders = this.getOrdersByChannel(channel.type);
        const totalRevenue = orders
            .filter(order => order.status === ORDER_STATUS.DELIVERED)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        return {
            ...channel,
            metrics: {
                ...channel.metrics,
                totalRevenue,
                totalOrders: orders.length,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
            }
        };
    }

    getOmnichannelOverview() {
        const overview = {
            totalOrders: 0,
            totalRevenue: 0,
            channelBreakdown: {},
            topProducts: [],
            inventoryAlerts: this.getLowStockItems().length
        };

        for (const [channelId, channel] of this.channels) {
            const performance = this.getChannelPerformance(channelId);
            if (performance) {
                overview.totalOrders += performance.metrics.totalOrders;
                overview.totalRevenue += performance.metrics.totalRevenue;
                overview.channelBreakdown[channelId] = performance.metrics;
            }
        }

        return overview;
    }

    async loadDataFromFirestore() {
        try {
            // Load orders
            const ordersSnapshot = await this.db.collection('orders').get();
            ordersSnapshot.forEach(doc => {
                this.processOrderUpdate(doc.data());
            });

            // Load inventory
            const inventorySnapshot = await this.db.collection('inventory').get();
            inventorySnapshot.forEach(doc => {
                this.processInventoryUpdate(doc.data());
            });

            console.log(`📦 Loaded ${this.orderHashMap.size} orders and ${this.inventory.size} inventory items`);
        } catch (error) {
            console.error('❌ Failed to load operations data:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OperationsService,
        Order,
        InventoryItem,
        SalesChannel,
        InventoryTransaction,
        OrderHashMap,
        OrderBST,
        PriorityQueue,
        CHANNEL_TYPES,
        ORDER_STATUS,
        INVENTORY_TRANSACTION_TYPES
    };
}
