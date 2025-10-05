// Main application controller
class FlashMartApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        // Initialize the application
        this.setupEventListeners();
        this.loadInitialData();
        this.startPeriodicUpdates();
        
        // Show initial page
        showPage('home');
        
        console.log('FlashMart Application Initialized');
    }
    
    setupEventListeners() {
        // Handle page navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="showPage"]')) {
                const page = e.target.getAttribute('onclick').match(/showPage\('(.+?)'\)/);
                if (page) {
                    this.handlePageChange(page[1]);
                }
            }
        });
        
        // Handle modal interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle before unload (save state)
        window.addEventListener('beforeunload', () => {
            this.saveApplicationState();
        });
        
        // Handle visibility change (pause/resume timers)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTimers();
            } else {
                this.resumeTimers();
            }
        });
    }
    
    loadInitialData() {
        // Load user session
        authManager.loadCurrentUser();
        authManager.updateUI();

        // Load cart data
        cartManager.loadCart();
        cartManager.updateCartUI();

        // Load products
        productManager.loadProducts();
        productManager.loadFlashSaleProducts();

        // Load queue status
        queueManager.loadQueueStatus();
        queueManager.updateQueueUI();

        // Load admin data if user is admin
        if (authManager.currentUser && authManager.currentUser.role === 'admin') {
            adminManager.loadAdminData();
        }
    }
    
    handlePageChange(newPage) {
        // Check authentication requirements
        if (['orders', 'loyalty'].includes(newPage) && !authManager.requireAuth()) {
            return;
        }
        
        if (newPage === 'admin' && !authManager.requireAdmin()) {
            return;
        }
        
        this.currentPage = newPage;
        
        // Load specific data for the page
        switch (newPage) {
            case 'home':
                productManager.loadFlashSaleProducts();
                break;
            case 'products':
                productManager.loadProducts();
                break;
            case 'orders':
                this.loadUserOrders();
                break;
            case 'loyalty':
                this.loadLoyaltyData();
                break;
            case 'admin':
                adminManager.loadAdminData();
                break;
        }
    }
    
    async loadUserOrders() {
        if (!authManager.currentUser) return;
        
        try {
            const userOrders = await dataManager.getUserOrders(authManager.currentUser.id);
            const container = document.getElementById('orders-list');
            
            if (!container) return;
            
            if (userOrders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <h3>No Orders Yet</h3>
                        <p>Start shopping to see your orders here!</p>
                        <button class="btn btn-primary" onclick="showPage('products')">
                            Browse Products
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = userOrders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <strong>Order #${order.id}</strong>
                                <small>${dataManager.formatDate(order.createdAt)}</small>
                            </div>
                            <div>
                                <span class="order-status" style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                                    ${order.status || 'Completed'}
                                </span>
                            </div>
                        </div>
                        <div class="order-body">
                            <div class="order-items">
                                ${order.items.map(item => `
                                    <div class="order-item">
                                        <img src="${item.image || this.getProductImage(item.productId)}" alt="${item.name}">
                                        <div class="order-item-info">
                                            <h4>${item.name}</h4>
                                            <p>Quantity: ${item.quantity}</p>
                                            <p>Price: ₹${item.price.toLocaleString()} each</p>
                                            ${item.isFlashSale ? '<small style="color: #e47911; font-weight: bold;">⚡ Flash Sale</small>' : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="order-total">
                                Total: ₹${order.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                `).join('');
        } catch (error) {
            console.error('Error loading user orders:', error);
            const container = document.getElementById('orders-list');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <h3>Error Loading Orders</h3>
                        <p>There was an error loading your orders. Please try again later.</p>
                    </div>
                `;
            }
        }
    }
    
    async loadLoyaltyData() {
        if (!authManager.currentUser) return;
        
        try {
            const user = authManager.currentUser;
            const pointsElement = document.getElementById('user-points');
            const historyContainer = document.getElementById('points-history-list');
            
            if (pointsElement) {
                pointsElement.textContent = user.loyaltyPoints;
            }
            
            // Update tier display
            document.querySelectorAll('.tier-card').forEach(card => {
                card.classList.remove('active');
                if (card.classList.contains(user.tier)) {
                    card.classList.add('active');
                }
            });
            
            // Load points history
            if (historyContainer) {
                const userOrders = await dataManager.getUserOrders(user.id);
                const pointsHistory = userOrders.map(order => ({
                    date: order.createdAt,
                    points: Math.floor(order.total / 100),
                    type: 'earned',
                    description: `Order #${order.id}`
                }));
                
                if (pointsHistory.length === 0) {
                    historyContainer.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: #666;">
                            <p>No points history yet. Make a purchase to start earning points!</p>
                        </div>
                    `;
                } else {
                    historyContainer.innerHTML = pointsHistory
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(item => `
                            <div class="points-history-item">
                                <div>
                                    <strong>${item.description}</strong><br>
                                    <small>${dataManager.formatDate(item.date)}</small>
                                </div>
                                <div class="points-${item.type}">
                                    +${item.points} points
                                </div>
                            </div>
                        `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading loyalty data:', error);
        }
    }
    
    getProductImage(productId) {
        const product = dataManager.getProduct(productId);
        return product ? product.image : 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
    
    startPeriodicUpdates() {
        // Update flash sale timers every second
        setInterval(() => {
            this.updateFlashSaleTimers();
        }, 1000);
        
        // Update admin stats every 30 seconds
        setInterval(() => {
            if (authManager.currentUser && authManager.currentUser.role === 'admin' && this.currentPage === 'admin') {
                adminManager.updateAdminStats();
            }
        }, 30000);
        
        // Auto-save application state every 5 minutes
        setInterval(() => {
            this.saveApplicationState();
        }, 5 * 60 * 1000);
        
        // Check for flash sale updates every minute
        setInterval(() => {
            this.checkFlashSaleUpdates();
        }, 60000);
    }
    
    updateFlashSaleTimers() {
        const flashSaleProducts = dataManager.getProducts({ flashSale: true });
        let needsRefresh = false;
        
        flashSaleProducts.forEach(product => {
            if (new Date() > new Date(product.flashSaleEnd)) {
                // Flash sale has ended, mark it
                product.isFlashSale = false;
                dataManager.updateProduct(product.id, product);
                needsRefresh = true;
            }
        });
        
        if (needsRefresh) {
            productManager.loadProducts();
            productManager.loadFlashSaleProducts();
            if (authManager.currentUser && authManager.currentUser.role === 'admin') {
                adminManager.loadFlashSales();
            }
        }
    }
    
    checkFlashSaleUpdates() {
        // Check if any flash sales have ended or started
        const flashSaleProducts = dataManager.getProducts({ flashSale: true });
        const activeCount = flashSaleProducts.filter(p => new Date() <= new Date(p.flashSaleEnd)).length;
        
        // Update admin stats if admin is viewing
        if (authManager.currentUser && authManager.currentUser.role === 'admin' && this.currentPage === 'admin') {
            adminManager.updateAdminStats();
        }
        
        // Show notifications for flash sales starting/ending soon
        this.checkFlashSaleNotifications();
    }
    
    checkFlashSaleNotifications() {
        if (!authManager.currentUser) return;
        
        const flashSaleProducts = dataManager.getProducts({ flashSale: true });
        const now = new Date();
        
        flashSaleProducts.forEach(product => {
            const timeLeft = new Date(product.flashSaleEnd) - now;
            const minutes = Math.floor(timeLeft / (1000 * 60));
            
            // Notify when 5 minutes left
            if (minutes === 5 && !product.notified5min) {
                showNotification(`${product.name} flash sale ends in 5 minutes!`, 'warning');
                product.notified5min = true;
                dataManager.updateProduct(product.id, product);
            }
            
            // Notify when 1 minute left
            if (minutes === 1 && !product.notified1min) {
                showNotification(`${product.name} flash sale ends in 1 minute!`, 'warning');
                product.notified1min = true;
                dataManager.updateProduct(product.id, product);
            }
        });
    }
    
    handleResize() {
        // Handle responsive layout changes
        const width = window.innerWidth;
        
        if (width <= 768) {
            // Mobile layout adjustments
            this.optimizeForMobile();
        } else {
            // Desktop layout adjustments
            this.optimizeForDesktop();
        }
    }
    
    optimizeForMobile() {
        // Adjust layouts for mobile
        const productGrids = document.querySelectorAll('.products-grid');
        productGrids.forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        });
    }
    
    optimizeForDesktop() {
        // Adjust layouts for desktop
        const productGrids = document.querySelectorAll('.products-grid');
        productGrids.forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        });
    }
    
    pauseTimers() {
        // Pause unnecessary timers when page is not visible
        this.timersPaused = true;
    }
    
    resumeTimers() {
        // Resume timers when page becomes visible
        this.timersPaused = false;
        this.updateFlashSaleTimers();
    }
    
    saveApplicationState() {
        // Save current application state
        const state = {
            currentPage: this.currentPage,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('flashmart_app_state', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving application state:', error);
        }
    }
    
    loadApplicationState() {
        try {
            const stateData = localStorage.getItem('flashmart_app_state');
            if (stateData) {
                const state = JSON.parse(stateData);
                return state;
            }
        } catch (error) {
            console.error('Error loading application state:', error);
        }
        return null;
    }
    
    // Utility methods
    formatPrice(price) {
        return dataManager.formatPrice(price);
    }
    
    formatDate(date) {
        return dataManager.formatDate(date);
    }
    
    showNotification(message, type) {
        showNotification(message, type);
    }
}
// Global utility functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    // Show selected page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update navigation
    updateNavigation(pageId);

    // Handle page-specific logic
    if (window.flashMartApp) {
        window.flashMartApp.handlePageChange(pageId);
    }
}

function updateNavigation(activePageId) {
    // Update navigation links if needed
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[onclick*="showPage('${activePageId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Cart functions
function addToCart(productId, isFlashSale, quantity = 1) {
    // Prefer CartManager.addItem if available
    if (typeof cartManager !== 'undefined' && cartManager && typeof cartManager.addItem === 'function') {
        cartManager.addItem(productId, isFlashSale, quantity);
        return;
    }
    // Fallback to global helper if defined elsewhere
    if (typeof window !== 'undefined' && typeof window.addToCart === 'function' && window.addToCart !== addToCart) {
        window.addToCart(productId, isFlashSale, quantity);
        return;
    }
    console.error('Cart manager not available');
}

function buyNow(productId, isFlashSale, quantity = 1) {
    // Prefer CartManager.addItem if available (supports async)
    if (typeof cartManager !== 'undefined' && cartManager && typeof cartManager.addItem === 'function') {
        Promise.resolve(cartManager.addItem(productId, isFlashSale, quantity)).then((added) => {
            if (added) {
                if (typeof showModal === 'function') {
                    showModal('cart-modal');
                } else {
                    showPage('cart');
                }
            }
        }).catch((e) => {
            console.error('buyNow failed:', e);
        });
        return;
    }
    // Fallback to global helper if defined elsewhere
    if (typeof window !== 'undefined' && typeof window.buyNow === 'function' && window.buyNow !== buyNow) {
        window.buyNow(productId, isFlashSale, quantity);
        return;
    }
    console.error('Cart manager not available');
}

// Product detail functions
function showProductDetails(productId) {
    if (typeof productManager !== 'undefined') {
        productManager.showProductDetails(productId);
    } else {
        console.error('Product manager not available');
    }
}

// Admin functions
function showAdminTab(tab) {
    if (typeof adminManager !== 'undefined') {
        adminManager.showTab(tab);
    } else {
        console.error('Admin manager not available');
    }
}

// Auth functions
function showAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showAuthTab('${tab}')"]`).classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Product modal functions
function changeQuantity(delta) {
    const quantityInput = document.getElementById('product-quantity');
    if (!quantityInput) return;
    const currentValue = parseInt(quantityInput.value);
    const newValue = currentValue + delta;
    const max = parseInt(quantityInput.max);
    const min = parseInt(quantityInput.min);

    if (newValue >= min && newValue <= max) {
        quantityInput.value = newValue.toString();
    }
}

function addToCartWithQuantity(productId, isFlashSale) {
    const quantityInput = document.getElementById('product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    addToCart(productId, isFlashSale, quantity);
    closeModal('product-modal');
}

function buyNowWithQuantity(productId, isFlashSale) {
    const quantityInput = document.getElementById('product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    buyNow(productId, isFlashSale, quantity);
    closeModal('product-modal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Add backdrop
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
            `;
            backdrop.onclick = () => closeModal(modalId);
            document.body.appendChild(backdrop);
        }
        backdrop.style.display = 'block';

        // Focus first input in modal if available
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }

    // Hide backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.style.display = 'none';
    }
}

// Make sure all global functions are properly defined
if (typeof window !== 'undefined') {
    // Ensure these functions are available globally
    window.showPage = showPage;
    window.showModal = showModal;
    window.closeModal = closeModal;
    window.addToCart = addToCart;
    window.buyNow = buyNow;
    window.showProductDetails = showProductDetails;
    window.showAdminTab = showAdminTab;
    window.showAuthTab = showAuthTab;
    window.changeQuantity = changeQuantity;
    window.addToCartWithQuantity = addToCartWithQuantity;
    window.buyNowWithQuantity = buyNowWithQuantity;
    

    // Initialize managers - these will be overridden when their respective files load
    if (typeof productManager === 'undefined') {
        window.productManager = null;
    }
    if (typeof cartManager === 'undefined') {
        window.cartManager = null;
    }
    if (typeof queueManager === 'undefined') {
        window.queueManager = null;
    }
    if (typeof adminManager === 'undefined') {
        window.adminManager = null;
    }
    if (typeof authManager === 'undefined') {
        window.authManager = null;
    }
    if (typeof searchManager === 'undefined') {
        window.searchManager = null;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize the entire application
        await appInitializer.initialize();
        // Handle authentication link click
        const authLink = document.getElementById('auth-link');
        if (authLink) {
            authLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (!authManager.currentUser) {
                    showModal('auth-modal');
                }
            });
        }

        // Handle escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });

        console.log('FlashMart DOM Content Loaded and initialized');
    } catch (error) {
        console.error('Failed to initialize FlashMart:', error);
        showNotification('Failed to load application. Please refresh the page.', 'error');
    }
});