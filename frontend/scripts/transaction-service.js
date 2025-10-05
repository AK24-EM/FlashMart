/**
 * Firebase Transaction Service
 *
 * Handles atomic operations for order placement, stock management,
 * and other critical operations that require consistency guarantees.
 */

class TransactionService {
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
                console.log('Transaction Service initialized');
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Error initializing Transaction Service:', error);
            throw error;
        }
    }

    // Order Placement with Stock Management and Retry Logic
    async placeOrder(orderData, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this._placeOrderInternal(orderData);
            } catch (error) {
                console.warn(`Order placement attempt ${attempt} failed:`, error.message);

                if (attempt === maxRetries) {
                    throw new Error(`Order placement failed after ${maxRetries} attempts: ${error.message}`);
                }

                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async _placeOrderInternal(orderData) {
        try {
            await this.initialize();

            const productRef = this.db.collection('products').doc(orderData.productId);
            const orderRef = this.db.collection('orders').doc();
            const userRef = this.db.collection('users').doc(orderData.userId);

            return await this.db.runTransaction(async (transaction) => {
                // Get product data
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists) {
                    throw new Error('Product not found');
                }

                const product = productDoc.data();
                let stock = product.stock;
                const isFlashSale = orderData.isFlashSale;

                // Check if it's a flash sale and get flash sale stock
                if (isFlashSale && product.flashSaleStock !== undefined) {
                    stock = product.flashSaleStock;
                }

                // Check stock availability
                if (stock < orderData.quantity) {
                    throw new Error('Insufficient stock');
                }

                // Calculate order total
                const unitPrice = isFlashSale ? product.flashSalePrice : product.price;
                const total = unitPrice * orderData.quantity;

                // Update product stock
                const stockUpdate = {};
                if (isFlashSale && product.flashSaleStock !== undefined) {
                    stockUpdate.flashSaleStock = stock - orderData.quantity;
                } else {
                    stockUpdate.stock = stock - orderData.quantity;
                }
                stockUpdate.updatedAt = new Date();

                transaction.update(productRef, stockUpdate);

                // Create order
                const order = {
                    id: orderRef.id,
                    userId: orderData.userId,
                    productId: orderData.productId,
                    quantity: orderData.quantity,
                    price: unitPrice,
                    total: total,
                    status: 'confirmed',
                    isFlashSale: isFlashSale,
                    sessionId: orderData.sessionId || null,
                    items: [{
                        productId: orderData.productId,
                        name: product.name,
                        quantity: orderData.quantity,
                        price: unitPrice,
                        isFlashSale: isFlashSale
                    }],
                    createdAt: new Date()
                };

                transaction.set(orderRef, order);

                // Update user loyalty points and total spent
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists) {
                    const user = userDoc.data();
                    const currentPoints = user.loyaltyPoints || 0;
                    const currentSpent = user.totalSpent || 0;

                    // Calculate points to add (1 point per ₹100, with tier multiplier)
                    const pointsToAdd = Math.floor(total / 100);
                    const tier = user.tier || 'bronze';
                    const multiplier = tier === 'gold' ? 2 : tier === 'silver' ? 1.5 : 1;
                    const finalPoints = Math.floor(pointsToAdd * multiplier);

                    const newPoints = currentPoints + finalPoints;
                    const newSpent = currentSpent + total;

                    // Determine new tier
                    let newTier = 'bronze';
                    if (newPoints >= 5000) {
                        newTier = 'gold';
                    } else if (newPoints >= 1000) {
                        newTier = 'silver';
                    }

                    transaction.update(userRef, {
                        loyaltyPoints: newPoints,
                        totalSpent: newSpent,
                        tier: newTier,
                        updatedAt: new Date()
                    });

                    // Add to order result
                    order.loyaltyPointsEarned = finalPoints;
                    order.newTier = newTier;
                }

                return order;
            });
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    // Multi-item Order Placement
    async placeMultiItemOrder(orderData) {
        try {
            await this.initialize();

            const orderRef = this.db.collection('orders').doc();
            const userRef = this.db.collection('users').doc(orderData.userId);

            return await this.db.runTransaction(async (transaction) => {
                const productRefs = orderData.items.map(item =>
                    this.db.collection('products').doc(item.productId)
                );

                // Get all product documents
                const productDocs = await Promise.all(
                    productRefs.map(ref => transaction.get(ref))
                );

                // Validate products and stock
                const validatedItems = [];
                let totalAmount = 0;

                for (let i = 0; i < orderData.items.length; i++) {
                    const item = orderData.items[i];
                    const productDoc = productDocs[i];

                    if (!productDoc.exists) {
                        throw new Error(`Product ${item.productId} not found`);
                    }

                    const product = productDoc.data();
                    let stock = product.stock;
                    const isFlashSale = item.isFlashSale;

                    if (isFlashSale && product.flashSaleStock !== undefined) {
                        stock = product.flashSaleStock;
                    }

                    if (stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}`);
                    }

                    const unitPrice = isFlashSale ? product.flashSalePrice : product.price;
                    const itemTotal = unitPrice * item.quantity;

                    validatedItems.push({
                        productId: item.productId,
                        name: product.name,
                        quantity: item.quantity,
                        price: unitPrice,
                        total: itemTotal,
                        isFlashSale: isFlashSale
                    });

                    totalAmount += itemTotal;

                    // Update product stock
                    const stockUpdate = {};
                    if (isFlashSale && product.flashSaleStock !== undefined) {
                        stockUpdate.flashSaleStock = stock - item.quantity;
                    } else {
                        stockUpdate.stock = stock - item.quantity;
                    }
                    stockUpdate.updatedAt = new Date();

                    transaction.update(productRefs[i], stockUpdate);
                }

                // Create order
                const order = {
                    id: orderRef.id,
                    userId: orderData.userId,
                    items: validatedItems,
                    total: totalAmount,
                    status: 'confirmed',
                    sessionId: orderData.sessionId || null,
                    createdAt: new Date()
                };

                transaction.set(orderRef, order);

                // Update user loyalty points and total spent
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists) {
                    const user = userDoc.data();
                    const currentPoints = user.loyaltyPoints || 0;
                    const currentSpent = user.totalSpent || 0;

                    // Calculate points to add
                    const pointsToAdd = Math.floor(totalAmount / 100);
                    const tier = user.tier || 'bronze';
                    const multiplier = tier === 'gold' ? 2 : tier === 'silver' ? 1.5 : 1;
                    const finalPoints = Math.floor(pointsToAdd * multiplier);

                    const newPoints = currentPoints + finalPoints;
                    const newSpent = currentSpent + totalAmount;

                    // Determine new tier
                    let newTier = 'bronze';
                    if (newPoints >= 5000) {
                        newTier = 'gold';
                    } else if (newPoints >= 1000) {
                        newTier = 'silver';
                    }

                    transaction.update(userRef, {
                        loyaltyPoints: newPoints,
                        totalSpent: newSpent,
                        tier: newTier,
                        updatedAt: new Date()
                    });

                    order.loyaltyPointsEarned = finalPoints;
                    order.newTier = newTier;
                }

                return order;
            });
        } catch (error) {
            console.error('Error placing multi-item order:', error);
            throw error;
        }
    }

    // Stock Update Transaction
    async updateProductStock(productId, newStock, isFlashSale = false) {
        try {
            await this.initialize();

            const productRef = this.db.collection('products').doc(productId);

            return await this.db.runTransaction(async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists) {
                    throw new Error('Product not found');
                }

                const updateData = {
                    updatedAt: new Date()
                };

                if (isFlashSale) {
                    updateData.flashSaleStock = newStock;
                } else {
                    updateData.stock = newStock;
                }

                transaction.update(productRef, updateData);

                return {
                    id: productId,
                    ...updateData
                };
            });
        } catch (error) {
            console.error('Error updating product stock:', error);
            throw error;
        }
    }

    // Flash Sale Management Transaction
    async startFlashSale(productId, flashSaleData) {
        try {
            await this.initialize();

            const productRef = this.db.collection('products').doc(productId);
            const flashSaleRef = this.db.collection('flashSales').doc();

            return await this.db.runTransaction(async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists) {
                    throw new Error('Product not found');
                }

                const product = productDoc.data();

                // Create flash sale
                const flashSale = {
                    id: flashSaleRef.id,
                    productId: productId,
                    startTime: new Date(flashSaleData.startTime),
                    endTime: new Date(flashSaleData.endTime),
                    maxPerCustomer: flashSaleData.maxPerCustomer || 1,
                    isActive: true,
                    description: flashSaleData.description || '',
                    createdAt: new Date()
                };

                transaction.set(flashSaleRef, flashSale);

                // Update product with flash sale data
                transaction.update(productRef, {
                    isFlashSale: true,
                    flashSalePrice: flashSaleData.price,
                    flashSaleStock: flashSaleData.stock,
                    flashSaleEnd: new Date(flashSaleData.endTime),
                    updatedAt: new Date()
                });

                return flashSale;
            });
        } catch (error) {
            console.error('Error starting flash sale:', error);
            throw error;
        }
    }

    async endFlashSale(flashSaleId) {
        try {
            await this.initialize();

            const flashSaleRef = this.db.collection('flashSales').doc(flashSaleId);
            const ordersRef = this.db.collection('orders').where('sessionId', '==', flashSaleId);

            return await this.db.runTransaction(async (transaction) => {
                const flashSaleDoc = await transaction.get(flashSaleRef);
                if (!flashSaleDoc.exists) {
                    throw new Error('Flash sale not found');
                }

                const flashSale = flashSaleDoc.data();
                const productRef = this.db.collection('products').doc(flashSale.productId);

                // Get all orders for this flash sale
                const ordersSnapshot = await transaction.get(ordersRef);
                const orderCount = ordersSnapshot.size;

                // End flash sale
                transaction.update(flashSaleRef, {
                    isActive: false,
                    endedAt: new Date(),
                    totalOrders: orderCount
                });

                // Reset product flash sale status
                transaction.update(productRef, {
                    isFlashSale: false,
                    flashSalePrice: null,
                    flashSaleStock: null,
                    flashSaleEnd: null,
                    updatedAt: new Date()
                });

                return {
                    flashSaleId,
                    endedAt: new Date(),
                    totalOrders: orderCount
                };
            });
        } catch (error) {
            console.error('Error ending flash sale:', error);
            throw error;
        }
    }

    // Queue Processing Transaction
    async processQueueItem(queueItemId) {
        try {
            await this.initialize();

            const queueItemRef = this.db.collection('queue').doc(queueItemId);
            const userRef = this.db.collection('users').doc();

            return await this.db.runTransaction(async (transaction) => {
                const queueItemDoc = await transaction.get(queueItemRef);
                if (!queueItemDoc.exists) {
                    throw new Error('Queue item not found');
                }

                const queueItem = queueItemDoc.data();

                if (queueItem.processed) {
                    throw new Error('Queue item already processed');
                }

                // Mark queue item as processed
                transaction.update(queueItemRef, {
                    processed: true,
                    processedAt: new Date()
                });

                // Process the queue item based on type
                if (queueItem.queueType === 'priority' || queueItem.queueType === 'fifo') {
                    // Process flash sale access
                    return {
                        success: true,
                        queueItemId,
                        userId: queueItem.userId,
                        productId: queueItem.productId,
                        queueType: queueItem.queueType,
                        processedAt: new Date()
                    };
                }

                return {
                    success: true,
                    queueItemId,
                    processedAt: new Date()
                };
            });
        } catch (error) {
            console.error('Error processing queue item:', error);
            throw error;
        }
    }

    // Inventory Management Transaction
    async transferStock(sourceProductId, targetProductId, quantity) {
        try {
            await this.initialize();

            const sourceRef = this.db.collection('products').doc(sourceProductId);
            const targetRef = this.db.collection('products').doc(targetProductId);

            return await this.db.runTransaction(async (transaction) => {
                const [sourceDoc, targetDoc] = await Promise.all([
                    transaction.get(sourceRef),
                    transaction.get(targetRef)
                ]);

                if (!sourceDoc.exists) {
                    throw new Error('Source product not found');
                }

                if (!targetDoc.exists) {
                    throw new Error('Target product not found');
                }

                const sourceProduct = sourceDoc.data();
                const targetProduct = targetDoc.data();

                if (sourceProduct.stock < quantity) {
                    throw new Error('Insufficient stock in source product');
                }

                // Update stock levels
                transaction.update(sourceRef, {
                    stock: sourceProduct.stock - quantity,
                    updatedAt: new Date()
                });

                transaction.update(targetRef, {
                    stock: targetProduct.stock + quantity,
                    updatedAt: new Date()
                });

                return {
                    sourceProductId,
                    targetProductId,
                    transferredQuantity: quantity,
                    timestamp: new Date()
                };
            });
        } catch (error) {
            console.error('Error transferring stock:', error);
            throw error;
        }
    }

    // Bulk Operations
    async bulkUpdateProducts(productUpdates) {
        try {
            await this.initialize();

            // Process updates in batches to avoid exceeding Firestore limits
            const batchSize = 500;
            const batches = [];

            for (let i = 0; i < productUpdates.length; i += batchSize) {
                const batch = this.db.batch();
                const currentBatch = productUpdates.slice(i, i + batchSize);

                currentBatch.forEach(update => {
                    const productRef = this.db.collection('products').doc(update.productId);
                    batch.update(productRef, {
                        ...update.data,
                        updatedAt: new Date()
                    });
                });

                batches.push(batch.commit());
            }

            await Promise.all(batches);
            return { success: true, updatedCount: productUpdates.length };
        } catch (error) {
            console.error('Error bulk updating products:', error);
            throw error;
        }
    }

    async bulkCreateOrders(orders) {
        try {
            await this.initialize();

            // Create orders in batches
            const batchSize = 500;
            const results = [];

            for (let i = 0; i < orders.length; i += batchSize) {
                const batch = this.db.batch();
                const currentBatch = orders.slice(i, i + batchSize);

                currentBatch.forEach(orderData => {
                    const orderRef = this.db.collection('orders').doc();
                    batch.set(orderRef, {
                        ...orderData,
                        id: orderRef.id,
                        createdAt: new Date()
                    });
                });

                const batchResults = await batch.commit();
                results.push(...batchResults);
            }

            return {
                success: true,
                createdCount: orders.length,
                orderIds: results.map(result => result._key.path.segments[6])
            };
        } catch (error) {
            console.error('Error bulk creating orders:', error);
            throw error;
        }
    }

    // Error Recovery and Rollback
    async rollbackFailedOrder(orderId) {
        try {
            await this.initialize();

            const orderRef = this.db.collection('orders').doc(orderId);
            const productRefs = [];

            return await this.db.runTransaction(async (transaction) => {
                const orderDoc = await transaction.get(orderRef);
                if (!orderDoc.exists) {
                    throw new Error('Order not found');
                }

                const order = orderDoc.data();

                // Restore product stock
                if (order.items) {
                    for (const item of order.items) {
                        const productRef = this.db.collection('products').doc(item.productId);
                        productRefs.push(productRef);

                        const productDoc = await transaction.get(productRef);
                        if (productDoc.exists) {
                            const product = productDoc.data();
                            const stockUpdate = {};

                            if (item.isFlashSale && product.flashSaleStock !== undefined) {
                                stockUpdate.flashSaleStock = (product.flashSaleStock || 0) + item.quantity;
                            } else {
                                stockUpdate.stock = (product.stock || 0) + item.quantity;
                            }

                            transaction.update(productRef, stockUpdate);
                        }
                    }
                } else {
                    // Single product order
                    const productRef = this.db.collection('products').doc(order.productId);
                    const productDoc = await transaction.get(productRef);

                    if (productDoc.exists) {
                        const product = productDoc.data();
                        const stockField = order.isFlashSale ? 'flashSaleStock' : 'stock';
                        const currentStock = product[stockField] || 0;

                        transaction.update(productRef, {
                            [stockField]: currentStock + order.quantity
                        });
                    }
                }

                // Mark order as failed
                transaction.update(orderRef, {
                    status: 'failed',
                    failedAt: new Date(),
                    failureReason: 'Payment or processing error'
                });

                return {
                    orderId,
                    action: 'rollback',
                    timestamp: new Date()
                };
            });
        } catch (error) {
            console.error('Error rolling back failed order:', error);
            throw error;
        }
    }

    // Health Check and Monitoring
    async getTransactionHealth() {
        try {
            await this.initialize();

            const stats = {
                timestamp: new Date(),
                status: 'healthy',
                errors: []
            };

            // Check if we can perform basic operations
            try {
                const testRef = this.db.collection('_health_check').doc('test');
                await testRef.set({ timestamp: new Date() });
                await testRef.delete();
            } catch (error) {
                stats.status = 'unhealthy';
                stats.errors.push('Basic write operation failed: ' + error.message);
            }

            return stats;
        } catch (error) {
            console.error('Error checking transaction health:', error);
            return {
                timestamp: new Date(),
                status: 'error',
                errors: [error.message]
            };
        }
    }
}

// Global Transaction Service instance
const transactionService = new TransactionService();
