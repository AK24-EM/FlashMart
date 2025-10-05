// Shopping cart management
class CartManager {
    constructor() {
        this.cart = [];
        this.loadCart();
        this.updateCartUI();
    }
    
    async addItem(productId, isFlashSale = false, quantity = 1) {
        if (!authManager.requireAuth()) return false;
        
        console.log('CartManager: Adding item to cart:', { productId, isFlashSale, quantity });

        // Resolve product by id or slug (supports sync and async data sources)
        let product = await dataManager.getProduct(productId);
        console.log('CartManager: Retrieved product:', product);

        // If not found by id, try a slug/name fallback
        if (!product) {
            // Prefer a dedicated slug resolver if available
            if (typeof dataManager.getProductBySlug === 'function') {
                try {
                    product = await Promise.resolve(dataManager.getProductBySlug(productId));
                } catch (e) {
                    console.warn('CartManager: getProductBySlug failed:', e);
                }
            }
            // Final fallback: scan all products client-side
            if (!product && typeof dataManager.getProducts === 'function') {
                try {
                    const all = await Promise.resolve(dataManager.getProducts({}));
                    if (Array.isArray(all)) {
                        product = all.find(p => p && (p.id === productId || p.slug === productId || p.name === productId));
                    }
                } catch (e) {
                    console.warn('CartManager: getProducts fallback failed:', e);
                }
            }
        }

        if (!product) {
            console.error('CartManager: Product not found:', productId);
            showNotification('Product not found!', 'error');
            return false;
        }
        
        // Check if flash sale is still active
        if (isFlashSale && new Date() > new Date(product.flashSaleEnd)) {
            showNotification('Flash sale has ended!', 'error');
            return false;
        }
        
        // Check stock availability
        const availableStock = isFlashSale ? product.flashSaleStock : product.stock;
        if (availableStock < quantity) {
            showNotification('Insufficient stock!', 'error');
            return false;
        }
        
        // Check if item already exists in cart
        const existingItem = this.cart.find(item => 
            item.productId === productId && item.isFlashSale === isFlashSale
        );
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > availableStock) {
                showNotification('Cannot add more items. Stock limit reached!', 'error');
                return false;
            }
            existingItem.quantity = newQuantity;
        } else {
            const price = isFlashSale ? product.flashSalePrice : product.price;
            this.cart.push({
                id: Date.now(),
                productId,
                name: product.name,
                image: product.image,
                price,
                originalPrice: product.originalPrice,
                quantity,
                isFlashSale,
                addedAt: new Date()
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        showNotification(`${product.name} added to cart!`, 'success');
        return true;
    }
    
    removeItem(cartItemId) {
        this.cart = this.cart.filter(item => item.id !== cartItemId);
        this.saveCart();
        this.updateCartUI();
        showNotification('Item removed from cart!', 'success');
    }
    
    updateQuantity(cartItemId, newQuantity) {
        const item = this.cart.find(item => item.id === cartItemId);
        if (!item) return;
        
        const product = dataManager.getProduct(item.productId);
        if (!product) return;
        
        const availableStock = item.isFlashSale ? product.flashSaleStock : product.stock;
        
        if (newQuantity <= 0) {
            this.removeItem(cartItemId);
            return;
        }
        
        if (newQuantity > availableStock) {
            showNotification('Cannot update quantity. Stock limit reached!', 'error');
            return;
        }
        
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartUI();
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
    }
    
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    updateCartUI() {
        // Update cart count in header
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = this.getItemCount();
        }
        
        // Update cart modal content
        this.renderCartModal();
    }
    
    renderCartModal() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems || !cartTotal) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started!</p>
                    <button class="btn btn-primary" onclick="closeModal('cart-modal'); showPage('products');">
                        Continue Shopping
                    </button>
                </div>
            `;
            cartTotal.textContent = '0';
            return;
        }
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${item.isFlashSale ? '<span style="color: #e47911; font-size: 0.8rem; font-weight: bold;">⚡ FLASH SALE</span>' : ''}
                    <div class="cart-item-price">
                        ${item.originalPrice !== item.price ? `<span style="text-decoration: line-through; color: #999; margin-right: 8px;">₹${item.originalPrice.toLocaleString()}</span>` : ''}
                        <span style="font-weight: bold; color: #e47911;">₹${item.price.toLocaleString()}</span>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               onchange="cartManager.updateQuantity(${item.id}, parseInt(this.value))" 
                               min="1" max="10">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        <button class="btn btn-secondary" style="margin-left: 15px; padding: 5px 10px;" 
                                onclick="cartManager.removeItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="item-total">
                        Subtotal: ₹${(item.price * item.quantity).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('');
        
        cartTotal.textContent = this.getTotal().toLocaleString();
    }
    
    saveCart() {
        localStorage.setItem('flashmart_cart', JSON.stringify(this.cart));
    }
    
    loadCart() {
        try {
            const cartData = localStorage.getItem('flashmart_cart');
            if (cartData) {
                this.cart = JSON.parse(cartData);
                // Convert date strings back to Date objects
                this.cart.forEach(item => {
                    item.addedAt = new Date(item.addedAt);
                });
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }
    
    async checkout() {
        if (!authManager.requireAuth()) return;
        
        if (this.cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // Validate stock availability before checkout
        const stockIssues = [];
        for (const item of this.cart) {
            const product = dataManager.getProduct(item.productId);
            if (!product) {
                stockIssues.push(`${item.name} is no longer available`);
                continue;
            }
            
            // Check if flash sale is still active
            if (item.isFlashSale && new Date() > new Date(product.flashSaleEnd)) {
                stockIssues.push(`Flash sale for ${item.name} has ended`);
                continue;
            }
            
            const availableStock = item.isFlashSale ? product.flashSaleStock : product.stock;
            if (availableStock < item.quantity) {
                stockIssues.push(`Only ${availableStock} ${item.name} available (you have ${item.quantity} in cart)`);
            }
        }
        
        if (stockIssues.length > 0) {
            showNotification('Stock issues found:\n' + stockIssues.join('\n'), 'error');
            return;
        }
        
        // Process order using Firebase data service
        const orderData = {
            userId: authManager.currentUser.uid, // Use Firebase user ID
            items: this.cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                quantity: item.quantity,
                isFlashSale: item.isFlashSale,
                image: item.image
            })),
            total: this.getTotal(),
            orderDate: new Date()
        };
        
        try {
            const newOrder = await dataManager.addOrder(orderData);
            
            if (newOrder) {
                this.clearCart();
                closeModal('cart-modal');
                showNotification('Order placed successfully!', 'success');
                
                // Show order confirmation
                this.showOrderConfirmation(newOrder);
                
                // Update product displays
                if (typeof productManager !== 'undefined') {
                    productManager.loadProducts();
                    productManager.loadFlashSaleProducts();
                }
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showNotification('Error placing order. Please try again.', 'error');
        }
    }
    
    showOrderConfirmation(order) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <div style="text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 4rem; color: #28a745; margin-bottom: 20px;"></i>
                    <h2>Order Confirmed!</h2>
                    <p><strong>Order ID:</strong> #${order.id}</p>
                    <p><strong>Total:</strong> ₹${order.total.toLocaleString()}</p>
                    <p><strong>Items:</strong> ${order.items.length}</p>
                    <div style="margin: 20px 0;">
                        <button class="btn btn-primary" onclick="showPage('orders'); this.closest('.modal').remove();">
                            View Order Details
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove();" style="margin-left: 10px;">
                            Continue Shopping
                        </button>
                    </div>
                    <p style="font-size: 0.9rem; color: #666; margin-top: 20px;">
                        You earned ${Math.floor(order.total / 100)} loyalty points!
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Create global cartManager instance
const cartManager = new CartManager();

// Make cartManager globally available
if (typeof window !== 'undefined') {
    window.cartManager = cartManager;
}

// Define cart interaction functions immediately after cartManager creation
async function addToCart(productId, isFlashSale = false, quantity = 1) {
    // Check if cartManager is available
    if (!cartManager) {
        console.error('cartManager not available in addToCart');
        showNotification('Cart service not ready. Please refresh the page.', 'error');
        return;
    }

    // For flash sale items, check queue status
    if (isFlashSale && authManager.currentUser) {
        const queuePosition = dataManager.getQueuePosition(authManager.currentUser.id, productId);
        if (queuePosition && queuePosition > 1) {
            // Add to queue instead
            queueManager.joinQueue(productId);
            return;
        }
    }

    await cartManager.addItem(productId, isFlashSale, quantity);
}

async function buyNow(productId, isFlashSale = false, quantity = 1) {
    // Check if cartManager is available
    if (!cartManager) {
        console.error('cartManager not available in buyNow');
        showNotification('Cart service not ready. Please refresh the page.', 'error');
        return;
    }

    // For flash sale items, check queue status
    if (isFlashSale && authManager.currentUser) {
        const queuePosition = dataManager.getQueuePosition(authManager.currentUser.id, productId);
        if (queuePosition && queuePosition > 1) {
            // Add to queue instead
            queueManager.joinQueue(productId);
            return;
        }
    }

    if (await cartManager.addItem(productId, isFlashSale, quantity)) {
        showModal('cart-modal');
    }
}

async function proceedToCheckout() {
    // Check if cartManager is available
    if (!cartManager) {
        console.error('cartManager not available in proceedToCheckout');
        showNotification('Cart service not ready. Please refresh the page.', 'error');
        return;
    }

    await cartManager.checkout();
}

// Make cart functions globally available immediately
if (typeof window !== 'undefined') {
    window.addToCart = addToCart;
    window.buyNow = buyNow;
    window.proceedToCheckout = proceedToCheckout;
}

// Modal utility functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('Modal opened:', modalId);
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        console.log('Modal closed:', modalId);
    } else {
        console.error('Modal not found:', modalId);
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}


// Cart modal event handlers
document.addEventListener('DOMContentLoaded', function() {
    const cartLink = document.getElementById('cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('cart-modal');
        });
    }

    // Update cart UI on load (check if cartManager is available)
    if (cartManager) {
        cartManager.updateCartUI();
    }
});