/**
 * Firebase Data Service
 *
 * This service replaces the local dataManager and handles all data operations
 * using Firebase Firestore for persistent storage.
 */

// Helper class for BST Node
class Node {
    constructor(product) {
        this.product = product;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

// AVL Tree implementation for efficient product search
class ProductSearchTree {
    constructor() {
        this.root = null;
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    rightRotate(y) {
        const x = y.left;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

        return x;
    }

    leftRotate(x) {
        const y = x.right;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

        return y;
    }

    insert(root, product) {
        if (!root) return new Node(product);

        if (product.name.toLowerCase() < root.product.name.toLowerCase()) {
            root.left = this.insert(root.left, product);
        } else if (product.name.toLowerCase() > root.product.name.toLowerCase()) {
            root.right = this.insert(root.right, product);
        } else {
            return root; // No duplicates
        }

        root.height = 1 + Math.max(this.getHeight(root.left), this.getHeight(root.right));

        const balance = this.getBalance(root);

        // Left Left Case
        if (balance > 1 && product.name.toLowerCase() < root.left.product.name.toLowerCase()) {
            return this.rightRotate(root);
        }

        // Right Right Case
        if (balance < -1 && product.name.toLowerCase() > root.right.product.name.toLowerCase()) {
            return this.leftRotate(root);
        }

        // Left Right Case
        if (balance > 1 && product.name.toLowerCase() > root.left.product.name.toLowerCase()) {
            root.left = this.leftRotate(root.left);
            return this.rightRotate(root);
        }

        // Right Left Case
        if (balance < -1 && product.name.toLowerCase() < root.right.product.name.toLowerCase()) {
            root.right = this.rightRotate(root.right);
            return this.leftRotate(root);
        }

        return root;
    }

    search(root, name) {
        if (!root) return [];
        
        const searchTerm = name.toLowerCase();
        const results = [];
        
        // In-order traversal to find all matching products
        const traverse = (node) => {
            if (!node) return;
            
            if (node.left) traverse(node.left);
            
            if (node.product.name.toLowerCase().includes(searchTerm)) {
                results.push(node.product);
            }
            
            if (node.right) traverse(node.right);
        };
        
        traverse(root);
        return results;
    }
}

// Max Heap for top products
class MaxHeap {
    constructor(property) {
        this.heap = [];
        this.property = property || 'rating'; // Default to rating
    }

    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    heapify(i) {
        const left = this.left(i);
        const right = this.right(i);
        let largest = i;
        const n = this.heap.length;

        if (left < n && this.heap[left][this.property] > this.heap[largest][this.property]) {
            largest = left;
        }

        if (right < n && this.heap[right][this.property] > this.heap[largest][this.property]) {
            largest = right;
        }

        if (largest !== i) {
            this.swap(i, largest);
            this.heapify(largest);
        }
    }

    insert(product) {
        this.heap.push(product);
        let i = this.heap.length - 1;

        while (i !== 0 && this.heap[this.parent(i)][this.property] < this.heap[i][this.property]) {
            this.swap(i, this.parent(i));
            i = this.parent(i);
        }
    }

    extractMax() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapify(0);
        return root;
    }

    getTopK(k) {
        const result = [];
        const tempHeap = new MaxHeap(this.property);
        tempHeap.heap = [...this.heap];
        
        for (let i = 0; i < k && tempHeap.heap.length > 0; i++) {
            result.push(tempHeap.extractMax());
        }
        
        return result;
    }
}

class FirebaseDataService {
    constructor() {
        this.initialized = false;
        this.products = [];
        this.users = [];
        this.orders = [];
        this.flashSales = [];
        this.queue = [];
        this.feedback = [];
        this.cache = new Map();
        this.searchTree = new ProductSearchTree();
        this.topRatedHeap = new MaxHeap('rating');
        this.mostViewedHeap = new MaxHeap('views');
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure Firebase is initialized first
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                this.initialized = true;
                console.log('Firebase Data Service initialized');

                // Load from localStorage for offline support
                this.loadFromLocalStorage();
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Error initializing Firebase Data Service:', error);
            throw error;
        }
    }

    // Product methods
    async getProducts(filters = {}) {
        try {
            await this.initialize();
            console.log('FirebaseDataService: getProducts called with filters:', filters);

            // Check cache first
            if (filters.search) {
                const cachedResults = this.searchProducts(filters.search);
                if (cachedResults.length > 0) {
                    console.log('Returning products from search tree cache');
                    return this.applyFilters(cachedResults, filters);
                }
            }

            // If no cache hit, fetch from Firebase
            const products = await firebaseService.getProducts(filters);
            const result = Array.isArray(products) ? products : [];
            
            if (result.length > 0) {
                await this.updateProductStructures(result);
            }
            
            return this.applyFilters(result, filters);
        } catch (error) {
            console.error('Error getting products from Firebase:', error);
            // Fallback to localStorage for offline support
            try {
                console.log('FirebaseDataService: falling back to cache');
                return this.getProductsFromCache(filters);
            } catch (cacheError) {
                console.error('Error getting products from cache:', cacheError);
                return [];
            }
        }
    }

    // Update product data structures
    async updateProductStructures(products) {
        const productsMap = new Map();
        
        // Reset heaps
        this.topRatedHeap = new MaxHeap('rating');
        this.mostViewedHeap = new MaxHeap('views');
        
        // Process each product
        products.forEach(product => {
            if (!product.id) {
                console.warn('Product missing ID:', product);
                return;
            }
            
            // Add to search tree
            this.searchTree.root = this.searchTree.insert(this.searchTree.root, product);
            
            // Add to heaps
            if (product.rating !== undefined) {
                this.topRatedHeap.insert(product);
            }
            if (product.views !== undefined) {
                this.mostViewedHeap.insert(product);
            }
            
            // Add to cache
            productsMap.set(product.id, product);
        });
        
        this.cache.set('products', productsMap);
        console.log('Updated product search structures with', products.length, 'products');
    }
    
    // Search products using BST
    searchProducts(searchTerm) {
        if (!searchTerm || !this.searchTree.root) return [];
        return this.searchTree.search(this.searchTree.root, searchTerm);
    }
    
    // Get top rated products using MaxHeap
    getTopRatedProducts(limit = 5) {
        return this.topRatedHeap.getTopK(limit);
    }
    
    // Get most viewed products using MaxHeap
    getMostViewedProducts(limit = 5) {
        return this.mostViewedHeap.getTopK(limit);
    }
    
    // Apply additional filters to products
    applyFilters(products, filters) {
        return products.filter(product => {
            let matches = true;
            
            if (filters.category && product.category !== filters.category) {
                matches = false;
            }
            if (filters.minPrice && product.price < filters.minPrice) {
                matches = false;
            }
            if (filters.maxPrice && product.price > filters.maxPrice) {
                matches = false;
            }
            if (filters.rating && product.rating < filters.rating) {
                matches = false;
            }
            
            return matches;
        });
    }

    async getProduct(productId) {
        try {
            // First, try to get from cache for performance
            if (this.cache.has('products')) {
                const productsCache = this.cache.get('products');
                if (productsCache.has(productId)) {
                    // Update view count
                    const product = productsCache.get(productId);
                    if (product.views === undefined) product.views = 0;
                    product.views++;
                    
                    // Update in heaps if needed
                    this.topRatedHeap.insert({...product});
                    this.mostViewedHeap.insert({...product});
                    
                    return product;
                }
            }

            // If not in cache, fetch from Firebase
            await this.initialize();
            const product = await firebaseService.getProduct(productId);
            if (product) {
                this.updateCache('products', product);
            }
            return product;
        } catch (error) {
            console.error(`Error getting product ${productId}:`, error);
            return null;
        }
    }

    async addProduct(productData) {
        try {
            await this.initialize();

            // Generate custom string ID
            const customId = this.generateProductId(productData);

            const product = {
                id: customId,
                ...productData,
                createdAt: new Date()
            };

            // Use the custom ID when adding to Firebase
            await firebaseService.db.collection('products').doc(customId).set(product);
            this.updateCache('products', product);
            return product;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(productId, updates) {
        try {
            await this.initialize();
            const product = await firebaseService.updateProduct(productId, updates);
            this.updateCache('products', product);
            return product;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await this.initialize();
            await firebaseService.deleteProduct(productId);
            this.removeFromCache('products', productId);
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Flash Sale methods
    async getActiveFlashSales() {
        try {
            await this.initialize();
            return await firebaseService.getActiveFlashSales();
        } catch (error) {
            console.error('Error getting flash sales:', error);
            return this.getFromCache('flashSales', []);
        }
    }

    async createFlashSale(flashSaleData) {
        try {
            await this.initialize();
            const flashSale = await firebaseService.createFlashSale(flashSaleData);
            this.updateCache('flashSales', flashSale);
            return flashSale;
        } catch (error) {
            console.error('Error creating flash sale:', error);
            throw error;
        }
    }

    // Order methods
    async placeOrder(orderData) {
        try {
            await this.initialize();
            const order = await firebaseService.placeOrder(orderData);

            // Update user's total spent and loyalty points
            if (authManager.currentUser && authManager.userProfile) {
                const pointsToAdd = Math.floor(order.total / 100);
                const multiplier = authManager.userProfile.tier === 'gold' ? 2 :
                                authManager.userProfile.tier === 'silver' ? 1.5 : 1;
                const finalPoints = Math.floor(pointsToAdd * multiplier);

                await authManager.updateLoyaltyPoints(finalPoints);

                // Update total spent
                await firebaseService.db.collection('users').doc(authManager.currentUser.uid).update({
                    totalSpent: firebaseService.db.firestore.FieldValue.increment(order.total)
                });
            }

            this.updateCache('orders', order);
            return order;
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    async getUserOrders(userId) {
        try {
            await this.initialize();
            const orders = await firebaseService.getUserOrders(userId);
            // Ensure we always return an array
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Error getting user orders from Firebase:', error);
            return this.getUserOrdersFromCache(userId);
        }
    }

    // Queue methods
    async joinQueue(productId, queueType = 'fifo') {
        try {
            await this.initialize();
            const queueItem = await firebaseService.joinQueue(productId, queueType);
            // Update the queue cache with the entire queue array
            const currentQueue = this.getFromCache('queue', []);
            currentQueue.push(queueItem);
            this.updateCache('queue', currentQueue);
            return queueItem;
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    }

    async getQueuePosition(productId) {
        try {
            await this.initialize();
            return await firebaseService.getQueuePosition(productId);
        } catch (error) {
            console.error('Error getting queue position:', error);
            return null;
        }
    }

    // Analytics methods
    async getAnalytics(timeRange = '30d') {
        try {
            await this.initialize();
            return await firebaseService.getAnalytics(timeRange);
        } catch (error) {
            console.error('Error getting analytics:', error);
            return this.getAnalyticsFromCache();
        }
    }

    // User methods
    async getUser(userId) {
        try {
            await this.initialize();
            const userDoc = await firebaseService.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                return {
                    id: userId,
                    ...data,
                    joinDate: data.joinDate?.toDate(),
                    createdAt: data.createdAt?.toDate()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return this.getUserFromCache(userId);
        }
    }

    async getUsers() {
        try {
            await this.initialize();
            const snapshot = await firebaseService.db.collection('users').get();
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            this.cache.set('users', new Map(users.map(u => [u.id, u])));
            return users;
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    async updateUser(userId, updates) {
        try {
            await this.initialize();

            // Update tier based on loyalty points if points are being updated
            if (updates.loyaltyPoints) {
                let newTier = 'bronze';
                if (updates.loyaltyPoints >= 5000) {
                    newTier = 'gold';
                } else if (updates.loyaltyPoints >= 1000) {
                    newTier = 'silver';
                }
                updates.tier = newTier;
            }

            await firebaseService.db.collection('users').doc(userId).update({
                ...updates,
                updatedAt: new Date()
            });

            this.updateCache('users', { id: userId, ...updates });
            return this.getUser(userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Feedback methods
    async addFeedback(feedbackData) {
        try {
            await this.initialize();
            const feedback = {
                ...feedbackData,
                userId: authManager.currentUser.uid,
                createdAt: new Date()
            };

            const docRef = await firebaseService.db.collection('feedback').add(feedback);
            this.updateCache('feedback', { id: docRef.id, ...feedback });
            return { id: docRef.id, ...feedback };
        } catch (error) {
            console.error('Error adding feedback:', error);
            throw error;
        }
    }

    async getFeedback(productId = null, userId = null) {
        try {
            await this.initialize();
            let query = firebaseService.db.collection('feedback');

            if (productId) {
                query = query.where('productId', '==', productId);
            }

            if (userId) {
                query = query.where('userId', '==', userId);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const feedback = [];

            snapshot.forEach(doc => {
                feedback.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            return feedback;
        } catch (error) {
            console.error('Error getting feedback:', error);
            return this.getFromCache('feedback', []);
        }
    }

    // Generate custom string ID for products
    generateProductId(productData) {
        // Create a readable ID from product name and timestamp
        const nameSlug = productData.name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .substring(0, 20); // Limit length

        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        return `${nameSlug}-${timestamp}`;
    }

    // Cache management methods
    updateCache(collection, item) {
        if (!this.cache.has(collection)) {
            this.cache.set(collection, new Map());
        }

        const collectionCache = this.cache.get(collection);

        if (item.id) {
            collectionCache.set(item.id, item);
        } else {
            // For array-based collections
            collectionCache.set('data', item);
        }
    }

    removeFromCache(collection, itemId) {
        if (this.cache.has(collection)) {
            const collectionCache = this.cache.get(collection);
            collectionCache.delete(itemId);
        }
    }

    getFromCache(collection, defaultValue = null) {
        if (this.cache.has(collection)) {
            const collectionCache = this.cache.get(collection);

            // Handle both Map and plain object cases
            if (collectionCache instanceof Map) {
                const data = collectionCache.get('data');
                return data !== undefined ? data : defaultValue;
            } else if (collectionCache && typeof collectionCache === 'object' && collectionCache.data) {
                return collectionCache.data;
            } else {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    getProductFromCache(productId) {
        if (this.cache.has('products')) {
            return this.cache.get('products').get(productId) || null;
        }
        return null;
    }

    getUserFromCache(userId) {
        if (this.cache.has('users')) {
            return this.cache.get('users').get(userId) || null;
        }
        return null;
    }

    getUserOrdersFromCache(userId) {
        if (this.cache.has('orders')) {
            const ordersCache = this.cache.get('orders');
            const userOrders = [];
            ordersCache.forEach(order => {
                if (order.userId === userId) {
                    userOrders.push(order);
                }
            });
            return userOrders;
        }
        return [];
    }

    getAnalyticsFromCache() {
        // Return cached analytics or calculate from cached data
        if (this.cache.has('analytics')) {
            return this.cache.get('analytics').get('data');
        }

        // Calculate from cached orders
        const orders = this.getFromCache('orders', []);
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            usersByTier: { bronze: 0, silver: 0, gold: 0 }, // Would need user cache for this
            topProducts: [],
            timeRange: 'cached',
            activeFlashSales: this.getFromCache('flashSales', []).length,
            queueLength: this.getFromCache('queue', []).length
        };
    }

    getProductsFromCache(filters = {}) {
        let products = [];

        console.log('getProductsFromCache: checking cache for products');
        console.log('getProductsFromCache: cache has products?', this.cache.has('products'));

        if (this.cache.has('products')) {
            const productsCache = this.cache.get('products');
            console.log('getProductsFromCache: productsCache type:', typeof productsCache);
            products = Array.from(productsCache.values());
            console.log('getProductsFromCache: products from cache:', products);
        }

        // Ensure products is always an array
        if (!Array.isArray(products)) {
            products = [];
        }

        console.log('getProductsFromCache: final products array:', products);

        // Apply filters
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }

        if (filters.flashSale) {
            products = products.filter(p => p.isFlashSale);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort products
        if (filters.sort) {
            products.sort((a, b) => {
                switch (filters.sort) {
                    case 'price-low':
                        return (a.isFlashSale ? a.flashSalePrice : a.price) - (b.isFlashSale ? b.flashSalePrice : b.price);
                    case 'price-high':
                        return (b.isFlashSale ? b.flashSalePrice : b.price) - (a.isFlashSale ? a.flashSalePrice : a.price);
                    case 'discount':
                        const aDiscount = ((a.originalPrice - (a.isFlashSale ? a.flashSalePrice : a.price)) / a.originalPrice) * 100;
                        const bDiscount = ((b.originalPrice - (b.isFlashSale ? b.flashSalePrice : b.price)) / b.originalPrice) * 100;
                        return bDiscount - aDiscount;
                    default:
                        return a.name.localeCompare(b.name);
                }
            });
        }

        console.log('getProductsFromCache: returning filtered products:', products);
        return products;
    }

    // Queue management methods (delegating to queue service)
    async addToQueue(userId, productId, queueType = 'fifo') {
        try {
            await this.initialize();
            if (typeof queueService !== 'undefined') {
                return await queueService.joinQueue(productId, queueType, userId);
            }
            console.warn('Queue service not available');
            return null;
        } catch (error) {
            console.error('Error adding to queue:', error);
            return null;
        }
    }

    async processQueue() {
        // Queue processing is now handled by the queue service
        console.warn('Queue processing is handled by queueService.processNextInQueue()');
        return null;
    }

    async getQueuePosition(userId, productId) {
        try {
            await this.initialize();
            if (typeof queueService !== 'undefined') {
                return await queueService.getQueuePosition(productId, userId);
            }
            return null;
        } catch (error) {
            console.error('Error getting queue position:', error);
            return null;
        }
    }

    // Order management methods
    async addOrder(orderData) {
        try {
            await this.initialize();

            const newOrder = {
                ...orderData,
                id: Date.now().toString(),
                createdAt: new Date(),
                status: 'completed'
            };

            // Save to Firebase
            await firebaseService.db.collection('orders').doc(newOrder.id).set(newOrder);

            // Update user's loyalty points and order history
            if (orderData.userId) {
                const userRef = firebaseService.db.collection('users').doc(orderData.userId);
                const userDoc = await userRef.get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const currentPoints = userData.loyaltyPoints || 0;
                    const pointsToAdd = Math.floor(orderData.total / 100);
                    const multiplier = userData.tier === 'gold' ? 2 : userData.tier === 'silver' ? 1.5 : 1;
                    const finalPoints = Math.floor(pointsToAdd * multiplier);

                    await userRef.update({
                        loyaltyPoints: currentPoints + finalPoints,
                        totalSpent: (userData.totalSpent || 0) + orderData.total,
                        orders: [...(userData.orders || []), newOrder.id],
                        updatedAt: new Date()
                    });

                    // Update tier if needed
                    let newTier = userData.tier || 'bronze';
                    if (currentPoints + finalPoints >= 5000) {
                        newTier = 'gold';
                    } else if (currentPoints + finalPoints >= 1000) {
                        newTier = 'silver';
                    }

                    if (newTier !== userData.tier) {
                        await userRef.update({ tier: newTier });
                    }
                }
            }

            // Update product stock
            for (const item of orderData.items) {
                const productRef = firebaseService.db.collection('products').doc(item.productId.toString());
                const productDoc = await productRef.get();

                if (productDoc.exists) {
                    const product = productDoc.data();
                    if (item.isFlashSale) {
                        await productRef.update({
                            flashSaleStock: Math.max(0, (product.flashSaleStock || 0) - item.quantity)
                        });
                    } else {
                        await productRef.update({
                            stock: Math.max(0, (product.stock || 0) - item.quantity)
                        });
                    }
                }
            }

            // Update cache
            this.updateCache('orders', newOrder);
            this.saveToLocalStorage();

            return newOrder;
        } catch (error) {
            console.error('Error adding order:', error);
            throw error;
        }
    }

    getUserOrders(userId) {
        try {
            // Try to get from cache first
            if (this.cache.has('orders_data')) {
                const ordersData = this.cache.get('orders_data');
                const orders = ordersData.data || ordersData;
                return orders.filter(order => order.userId == userId);
            }

            // Fallback to localStorage
            try {
                const ordersData = localStorage.getItem('flashmart_orders');
                if (ordersData) {
                    const orders = JSON.parse(ordersData);
                    return orders.filter(order => order.userId == userId);
                }
            } catch (error) {
                console.error('Error loading orders from localStorage:', error);
            }

            return [];
        } catch (error) {
            console.error('Error getting user orders:', error);
            return [];
        }
    }

    getAnalytics() {
        // Use the Firebase service analytics method
        return this.getAnalyticsFromCache();
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Legacy method aliases for backward compatibility
    initializeSampleData() {
        // This is now handled by setupFirestoreDatabase()
        console.log('Sample data initialization handled by setupFirestoreDatabase()');
    }

    saveToStorage() {
        // This is now handled by Firebase real-time updates
        console.log('Data is automatically saved to Firebase');
    }

    loadFromStorage() {
        // This is now handled by Firebase initialization
        console.log('Data is loaded from Firebase on initialization');
    }

    // Load data from localStorage for offline support
    loadFromLocalStorage() {
        try {
            const products = localStorage.getItem('flashmart_products');
            const users = localStorage.getItem('flashmart_users');
            const orders = localStorage.getItem('flashmart_orders');
            const queue = localStorage.getItem('flashmart_queue');

            console.log('loadFromLocalStorage: products from localStorage:', products);
            console.log('loadFromLocalStorage: users from localStorage:', users);
            console.log('loadFromLocalStorage: orders from localStorage:', orders);
            console.log('loadFromLocalStorage: queue from localStorage:', queue);

            if (products) {
                const parsedProducts = JSON.parse(products);
                console.log('loadFromLocalStorage: parsed products:', parsedProducts);
                this.cache.set('products', new Map(parsedProducts.map(p => [p.id, p])));
                console.log('loadFromLocalStorage: products cached successfully');
            } else {
                // Add sample products if none exist
                console.log('loadFromLocalStorage: no products found, adding sample products');
                this.addSampleProducts();
            }

            if (users) {
                this.cache.set('users', new Map(JSON.parse(users).map(u => [u.id, u])));
            }

            if (orders) {
                const ordersData = JSON.parse(orders);
                this.cache.set('orders', new Map(ordersData.map(o => [o.id, o])));
                this.cache.set('orders_data', { data: ordersData });
            }

            if (queue) {
                const queueData = JSON.parse(queue);
                this.cache.set('queue', { data: queueData });
            }

            console.log('Loaded data from localStorage for offline support');
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    addSampleProducts() {
        const sampleProducts = [
            {
                id: 'wireless-bluetooth-hea-123456',
                name: 'Wireless Bluetooth Headphones',
                category: 'electronics',
                price: 2999,
                originalPrice: 3999,
                stock: 25,
                image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'High-quality wireless headphones with noise cancellation',
                isFlashSale: false,
                createdAt: new Date()
            },
            {
                id: 'smart-fitness-watch-789012',
                name: 'Smart Fitness Watch',
                category: 'electronics',
                price: 4999,
                originalPrice: 6999,
                stock: 15,
                image: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Track your fitness goals with this advanced smartwatch',
                isFlashSale: true,
                flashSalePrice: 3999,
                flashSaleStock: 10,
                flashSaleEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date()
            },
            {
                id: 'cotton-t-shirt-345678',
                name: 'Cotton T-Shirt',
                category: 'clothing',
                price: 999,
                originalPrice: 1499,
                stock: 50,
                image: 'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Comfortable cotton t-shirt in multiple colors',
                isFlashSale: false,
                createdAt: new Date()
            }
        ];

        console.log('addSampleProducts: adding sample products to Firebase...');

        // Add sample products to Firebase
        sampleProducts.forEach(async (product) => {
            try {
                await firebaseService.db.collection('products').doc(product.id).set(product);
                console.log('addSampleProducts: added product:', product.name, 'with ID:', product.id);
            } catch (error) {
                console.error('addSampleProducts: error adding product:', error);
            }
        });

        this.cache.set('products', new Map(sampleProducts.map(p => [p.id, p])));
        localStorage.setItem('flashmart_products', JSON.stringify(sampleProducts));
        console.log('Sample products added to cache and localStorage');
    }

    // Save to localStorage for offline support
    saveToLocalStorage() {
        try {
            if (this.cache.has('products')) {
                const products = Array.from(this.cache.get('products').values());
                localStorage.setItem('flashmart_products', JSON.stringify(products));
            }

            if (this.cache.has('users')) {
                const users = Array.from(this.cache.get('users').values());
                localStorage.setItem('flashmart_users', JSON.stringify(users));
            }

            if (this.cache.has('orders_data')) {
                const ordersData = this.cache.get('orders_data');
                const orders = ordersData.data || ordersData;
                localStorage.setItem('flashmart_orders', JSON.stringify(orders));
            }

            if (this.cache.has('queue')) {
                const queueData = this.cache.get('queue');
                const queue = queueData.data || queueData;
                localStorage.setItem('flashmart_queue', JSON.stringify(queue));
            }

            console.log('Saved data to localStorage for offline support');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }
}

// Global Firebase Data Service instance
const dataManager = new FirebaseDataService();

// Make sure dataManager is available globally
if (typeof window !== 'undefined') {
    window.dataManager = dataManager;
}

// Make debugging functions globally available
if (typeof window !== 'undefined') {
    window.debugDataManagerCache = () => {
        console.log('=== DataManager Cache Debug ===');
        console.log('Cache has products?', dataManager.cache.has('products'));
        if (dataManager.cache.has('products')) {
            const productsCache = dataManager.cache.get('products');
            console.log('Products cache type:', typeof productsCache);
            if (productsCache instanceof Map) {
                console.log('Cache size:', productsCache.size);
                console.log('Available product IDs:', Array.from(productsCache.keys()));
                console.log('Sample product:', Array.from(productsCache.values())[0]);
            }
        }
        console.log('Firebase service initialized?', firebaseService?.initialized);
        return dataManager.cache;
    };

    window.forceRefreshProducts = async () => {
        console.log('=== Force Refreshing Products ===');
        try {
            const products = await dataManager.getProducts();
            console.log('Loaded products:', products.length);
            debugDataManagerCache();
            return products;
        } catch (error) {
            console.error('Error refreshing products:', error);
        }
    };
}

// Clear cache and reload from localStorage for offline support
dataManager.clearCache();
dataManager.loadFromLocalStorage();


// =====================================================
// INTEGRATION WITH NEW ANALYTICS SERVICES
// =====================================================

// Enhanced order placement with analytics tracking
const originalPlaceOrder = dataManager.placeOrder;
dataManager.placeOrder = async function(orderData) {
    try {
        // Place the order normally
        const orderId = await originalPlaceOrder.call(this, orderData);

        // Track customer journey - Purchase phase
        if (window.customerAnalytics && orderData.userId) {
            await window.customerAnalytics.trackPurchase(
                orderId,
                orderData.userId,
                orderData.items.map(item => item.productId),
                orderData.total,
                {
                    paymentMethod: orderData.paymentMethod,
                    currency: orderData.currency || INR
                }
            );
        }

        // Award loyalty points
        if (window.loyaltyService && orderData.userId) {
            await window.loyaltyService.awardPurchasePoints(
                orderId,
                orderData.userId,
                orderData.total
            );
        }

        // Collect NPS after successful purchase (schedule for later)
        if (window.npsService && orderData.userId) {
            // Schedule NPS collection for 24 hours after purchase
            setTimeout(async () => {
                try {
                    // This would typically send an NPS survey email/SMS
                    console.log(`NPS survey scheduled for order ${orderId}`);
                } catch (error) {
                    console.error("Error scheduling NPS survey:", error);
                }
            }, 24 * 60 * 60 * 1000); // 24 hours
        }

        return orderId;
    } catch (error) {
        console.error("Error in enhanced order placement:", error);
        throw error;
    }
};

// Enhanced product view tracking
const originalGetProduct = dataManager.getProduct;
dataManager.getProduct = async function(productId) {
    try {
        const product = await originalGetProduct.call(this, productId);

        // Track customer journey - Interest phase
        if (window.customerAnalytics && firebaseService?.currentUser) {
            await window.customerAnalytics.trackProductView(
                productId,
                firebaseService.currentUser.uid,
                { source: product_detail }
            );
        }

        return product;
    } catch (error) {
        console.error("Error in enhanced product retrieval:", error);
        throw error;
    }
};

// Enhanced queue join tracking
const originalJoinQueue = dataManager.joinQueue;
dataManager.joinQueue = async function(productId, queueType = fifo) {
    try {
        // Get current user
        const currentUser = firebaseService?.currentUser;
        if (!currentUser) {
            throw new Error("User must be logged in to join queue");
        }

        // Join queue normally
        const position = await originalJoinQueue.call(this, productId, queueType);

        // Track customer journey - Purchase intent phase
        if (window.customerAnalytics) {
            await window.customerAnalytics.trackQueueJoin(
                productId,
                currentUser.uid,
                queueType,
                position
            );
        }

        return position;
    } catch (error) {
        console.error("Error in enhanced queue join:", error);
        throw error;
    }
};

// Enhanced search with analytics
const originalSearchProducts = dataManager.searchProducts;
dataManager.searchProducts = async function(searchTerm) {
    try {
        const products = await originalSearchProducts.call(this, searchTerm);

        // Track search analytics
        if (window.customerAnalytics && firebaseService?.currentUser) {
            // Track search behavior for insights
            await window.customerAnalytics.trackSessionEvent(product_search, {
                searchTerm,
                resultCount: products.length
            });
        }

        return products;
    } catch (error) {
        console.error("Error in enhanced search:", error);
        throw error;
    }
};

// =====================================================
// BUSINESS INTELLIGENCE DASHBOARD INTEGRATION
// =====================================================

// Function to get comprehensive business metrics
window.getBusinessMetrics = async function(timeRange = '7d') {
    try {
        const metrics = {
            customerJourney: {},
            nps: {},
            rfm: {},
            loyalty: {},
            operations: {},
            timestamp: new Date()
        };

        // Get customer journey metrics
        if (window.customerAnalytics) {
            metrics.customerJourney = await window.customerAnalytics.getFunnelAnalytics(timeRange);
        }

        // Get NPS metrics
        if (window.npsService) {
            metrics.nps = await window.npsService.getNPSAnalytics(timeRange);
        }

        // Get RFM metrics
        if (window.rfmService) {
            metrics.rfm = await window.rfmService.getRFMAnalytics();
        }

        // Get loyalty metrics
        if (window.loyaltyService) {
            metrics.loyalty = await window.loyaltyService.getLoyaltyAnalytics();
        }

        // Get operational metrics (existing functionality)
        if (window.dataManager) {
            metrics.operations = {
                totalProducts: window.dataManager.products?.length || 0,
                totalOrders: window.dataManager.orders?.length || 0,
                totalUsers: window.dataManager.users?.length || 0
            };
        }

        return metrics;
    } catch (error) {
        console.error("Error getting business metrics:", error);
        return {};
    }
};

// Function to get customer insights for specific user
window.getCustomerInsights = async function(userId) {
    try {
        const insights = {
            journey: [],
            rfm: {},
            loyalty: {},
            nps: [],
            recommendations: []
        };

        // Get customer journey
        if (window.customerAnalytics) {
            insights.journey = await window.customerAnalytics.getCustomerJourney(userId);
        }

        // Get RFM analysis
        if (window.rfmService) {
            insights.rfm = await window.rfmService.calculateUserRFM(userId);
        }

        // Get loyalty information
        if (window.loyaltyService) {
            insights.loyalty = await window.loyaltyService.getLoyaltySummary(userId);
        }

        // Get NPS history
        if (window.npsService) {
            insights.nps = await window.npsService.getUserNPSHistory(userId);
        }

        // Generate personalized recommendations
        if (insights.rfm.segment) {
            insights.recommendations = window.rfmService.getSegmentRecommendations(insights.rfm.segment);
        }

        return insights;
    } catch (error) {
        console.error("Error getting customer insights:", error);
        return {};
    }
};

// =====================================================
// AUTOMATED PROCESSES AND SCHEDULED TASKS
// =====================================================

// Daily RFM calculation (should be called by a scheduler)
window.runDailyRFMCalculation = async function() {
    try {
        console.log("Running daily RFM calculation...");
        if (window.rfmService) {
            const result = await window.rfmService.calculateAllUsersRFM();
            console.log("RFM calculation completed:", result);
            return result;
        }
    } catch (error) {
        console.error("Error in daily RFM calculation:", error);
    }
};

// Process pending NPS follow-ups (should be called by a scheduler)
window.processNPSFollowUps = async function() {
    try {
        console.log("Processing NPS follow-ups...");
        if (window.npsService) {
            await window.npsService.processPendingFollowUps();
            console.log("NPS follow-ups processed");
        }
    } catch (error) {
        console.error("Error processing NPS follow-ups:", error);
    }
};

// Session cleanup (flush events every 30 seconds)
setInterval(async () => {
    try {
        if (window.customerAnalytics) {
            await window.customerAnalytics.flushSessionEvents();
        }
    } catch (error) {
        console.error("Error flushing session events:", error);
    }
}, 30000);

// =====================================================
// ENHANCED ERROR HANDLING AND MONITORING
// =====================================================

// Track errors for monitoring
window.trackError = function(error, context = {}) {
    try {
        if (window.customerAnalytics) {
            window.customerAnalytics.trackSessionEvent(error, {
                message: error.message || error,
                stack: error.stack,
                context: context,
                url: window.location.href,
                timestamp: new Date()
            });
        }

        // Also log to console
        console.error("Tracked error:", error, context);
    } catch (trackingError) {
        console.error("Error tracking failed:", trackingError);
    }
};

// Global error handler
window.addEventListener(error, function(event) {
    window.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Promise rejection handler
window.addEventListener(unhandledrejection, function(event) {
    window.trackError(event.reason, {
        type: unhandled_promise_rejection
    });
});

// Clear cache and reload from localStorage for offline support
dataManager.clearCache();
dataManager.loadFromLocalStorage();

