// Queue management for flash sales
class QueueManager {
    constructor() {
        this.userQueues = new Map(); // Track user's queue status
        this.queueTimers = new Map(); // Track queue processing timers
        this.init();
    }
    
    init() {
        // Check for existing queue status
        this.loadQueueStatus();
        this.updateQueueUI();
    }
    
    canPurchaseDirectly(productId) {
        if (!authManager.currentUser) return false;
        
        const product = dataManager.getProduct(productId);
        if (!product || !product.isFlashSale) return true;
        
        // Check if user has early access
        const earlyAccessTime = authManager.getEarlyAccessTime();
        const saleStartTime = new Date(product.flashSaleEnd).getTime() - (2 * 60 * 60 * 1000); // 2 hours before end
        const earlyStartTime = saleStartTime - earlyAccessTime;
        
        if (Date.now() >= earlyStartTime) {
            return true;
        }
        
        // Check current queue length and stock
        const queueLength = dataManager.queue.filter(item => 
            item.productId === productId && !item.processed
        ).length;
        
        // Allow direct purchase if queue is short and stock is sufficient
        if (queueLength < 5 && product.flashSaleStock > queueLength) {
            return true;
        }
        
        return false;
    }
    
    joinQueue(productId, queueType = 'fifo') {
        if (!authManager.requireAuth()) return;
        
        const product = dataManager.getProduct(productId);
        if (!product || !product.isFlashSale) {
            showNotification('Product is not in flash sale!', 'error');
            return;
        }
        
        // Check if user is already in queue for this product
        const existingPosition = dataManager.getQueuePosition(authManager.currentUser.id, productId);
        if (existingPosition) {
            this.showQueueStatus(productId, existingPosition);
            return;
        }
        
        // Determine queue type based on user tier
        if (authManager.currentUser.tier === 'gold' || authManager.currentUser.tier === 'silver') {
            queueType = 'priority';
        }
        
        // Add user to queue
        const queueItem = dataManager.addToQueue(authManager.currentUser.id, productId, queueType);
        
        // Store user's queue status
        this.userQueues.set(productId, {
            position: queueItem.position,
            joinTime: queueItem.joinTime,
            queueType: queueType
        });
        
        // Show queue notification
        this.showQueueStatus(productId, queueItem.position);
        
        // Start processing queue for this product
        this.processQueueForProduct(productId);
        
        showNotification(`Joined queue for ${product.name}. Position: ${queueItem.position}`, 'success');
    }
    
    showQueueStatus(productId, position) {
        const product = dataManager.getProduct(productId);
        const queueStatus = document.getElementById('queue-status');
        const queueMessage = document.getElementById('queue-message');
        const queueProgress = document.getElementById('queue-progress');
        const queuePosition = document.getElementById('queue-position');
        
        if (!queueStatus || !queueMessage || !queueProgress || !queuePosition) return;
        
        queuePosition.textContent = position;
        queueMessage.innerHTML = `
            You're in the queue for <strong>${product.name}</strong>. Position: 
            <span id="queue-position">${position}</span>
        `;
        
        // Calculate progress (assume max 100 people in queue)
        const progressPercent = Math.max(0, (100 - position) / 100 * 100);
        queueProgress.style.width = `${progressPercent}%`;
        
        queueStatus.style.display = 'block';
        
        // Update queue position periodically
        const updateInterval = setInterval(() => {
            const newPosition = dataManager.getQueuePosition(authManager.currentUser.id, productId);
            if (newPosition === null) {
                // User's turn or removed from queue
                queueStatus.style.display = 'none';
                clearInterval(updateInterval);
                this.handleQueueCompletion(productId);
            } else if (newPosition !== position) {
                queuePosition.textContent = newPosition;
                const newProgressPercent = Math.max(0, (100 - newPosition) / 100 * 100);
                queueProgress.style.width = `${newProgressPercent}%`;
                position = newPosition;
            }
        }, 2000);
    }
    
    processQueueForProduct(productId) {
        // Prevent multiple timers for the same product
        if (this.queueTimers.has(productId)) return;
        
        const processNext = () => {
            const processed = dataManager.processQueue();
            if (processed && processed.productId === productId) {
                // Notify the user that it's their turn
                if (processed.userId === authManager.currentUser?.id) {
                    this.handleQueueCompletion(productId);
                }
                
                // Continue processing if there are more people in queue
                const remainingQueue = dataManager.queue.filter(item => 
                    item.productId === productId && !item.processed
                );
                
                if (remainingQueue.length > 0) {
                    // Process next person after a delay (simulate processing time)
                    setTimeout(processNext, 5000 + Math.random() * 10000); // 5-15 seconds
                } else {
                    this.queueTimers.delete(productId);
                }
            } else {
                this.queueTimers.delete(productId);
            }
        };
        
        // Start processing after initial delay
        const timer = setTimeout(processNext, 3000 + Math.random() * 7000); // 3-10 seconds
        this.queueTimers.set(productId, timer);
    }
    
    handleQueueCompletion(productId) {
        const product = dataManager.getProduct(productId);
        if (!product) return;
        
        // Hide queue status
        const queueStatus = document.getElementById('queue-status');
        if (queueStatus) {
            queueStatus.style.display = 'none';
        }
        
        // Remove from user queues
        this.userQueues.delete(productId);
        
        // Show purchase opportunity
        this.showPurchaseOpportunity(product);
    }
    
    showPurchaseOpportunity(product) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-star" style="font-size: 3rem; color: #ff9900; margin-bottom: 15px;"></i>
                    <h2>It's Your Turn!</h2>
                    <p>You can now purchase <strong>${product.name}</strong></p>
                    <p style="color: #e47911; font-weight: bold; font-size: 1.2rem;">
                        ₹${(product.flashSalePrice || product.price).toLocaleString()}
                    </p>
                    <p style="color: #dc3545; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> Limited time offer - Act fast!
                    </p>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove(); buyNow(${product.id}, true);" style="margin-right: 10px;">
                            Buy Now
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); addToCart(${product.id}, true);">
                            Add to Cart
                        </button>
                    </div>
                    <p style="font-size: 0.8rem; color: #666; margin-top: 15px;">
                        This opportunity expires in 5 minutes
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-close after 5 minutes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                showNotification('Purchase opportunity expired', 'warning');
            }
        }, 5 * 60 * 1000);
    }
    
    updateQueueUI() {
        // Update any queue-related UI elements
        const queueStatus = document.getElementById('queue-status');
        if (queueStatus && this.userQueues.size === 0) {
            queueStatus.style.display = 'none';
        }
    }
    
    saveQueueStatus() {
        localStorage.setItem('flashmart_queue_status', JSON.stringify([...this.userQueues]));
    }
    
    loadQueueStatus() {
        try {
            const queueData = localStorage.getItem('flashmart_queue_status');
            if (queueData) {
                const queueArray = JSON.parse(queueData);
                this.userQueues = new Map(queueArray);
                
                // Validate queue status (remove expired ones)
                for (const [productId, queueInfo] of this.userQueues) {
                    const actualPosition = dataManager.getQueuePosition(authManager.currentUser?.id, productId);
                    if (actualPosition === null) {
                        this.userQueues.delete(productId);
                    } else if (actualPosition !== queueInfo.position) {
                        queueInfo.position = actualPosition;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading queue status:', error);
            this.userQueues = new Map();
        }
    }
    
    leaveQueue(productId) {
        if (!authManager.currentUser) return;
        
        // Remove user from queue in dataManager
        dataManager.queue = dataManager.queue.filter(item => 
            !(item.userId === authManager.currentUser.id && item.productId === productId)
        );
        
        // Reorder positions
        dataManager.queue.forEach((item, index) => {
            item.position = index + 1;
        });
        
        dataManager.saveToStorage();
        
        // Remove from local tracking
        this.userQueues.delete(productId);
        
        // Hide queue status
        const queueStatus = document.getElementById('queue-status');
        if (queueStatus) {
            queueStatus.style.display = 'none';
        }
        
        showNotification('Left the queue', 'info');
    }
    
    getQueueStats() {
        const stats = {
            totalQueued: dataManager.queue.length,
            byProduct: {},
            avgWaitTime: 0
        };
        
        // Group by product
        dataManager.queue.forEach(item => {
            if (!stats.byProduct[item.productId]) {
                stats.byProduct[item.productId] = {
                    count: 0,
                    product: dataManager.getProduct(item.productId)
                };
            }
            stats.byProduct[item.productId].count++;
        });
        
        // Calculate average wait time (rough estimate)
        if (dataManager.queue.length > 0) {
            const avgPosition = dataManager.queue.reduce((sum, item) => sum + item.position, 0) / dataManager.queue.length;
            stats.avgWaitTime = avgPosition * 8; // Assume 8 seconds per person on average
        }
        
        return stats;
    }
}

// Global queue manager
const queueManager = new QueueManager();