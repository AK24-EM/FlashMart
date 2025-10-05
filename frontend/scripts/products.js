// Product display and management
class ProductManager {
    constructor() {
        this.currentFilters = {};
        this.init();
    }

    getTimeRemaining(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const timeLeft = end - now;

        if (timeLeft <= 0) {
            return 'Sale Ended';
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    init() {
        // Initialize filter handlers
        this.setupFilters();
        // Load products on page load
        this.loadProducts();
        this.loadFlashSaleProducts();
    }
    
    setupFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.loadProducts();
            });
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.loadProducts();
            });
        }
    }
    
    loadProducts() {
        console.log('Loading products...');
        firebaseService.getProducts(this.currentFilters).then(products => {
            console.log('Products loaded:', products, 'Type:', typeof products, 'Is Array:', Array.isArray(products));

            if (!Array.isArray(products)) {
                console.error('Products is not an array:', products);
                return;
            }

            const container = document.getElementById('all-products-grid');

            if (container) {
                container.innerHTML = products.map(product => this.renderProductCard(product)).join('');
            }
        }).catch(error => {
            console.error('Error loading products:', error);
        });
    }
    
    loadFlashSaleProducts() {
        console.log('Loading flash sale products...');
        firebaseService.getProducts({ flashSale: true }).then(flashSaleProducts => {
            console.log('Flash sale products loaded:', flashSaleProducts);

            if (!Array.isArray(flashSaleProducts)) {
                console.error('Flash sale products is not an array:', flashSaleProducts);
                return;
            }

            const container = document.getElementById('flash-products-grid');

            if (container) {
                container.innerHTML = flashSaleProducts.map(product => this.renderProductCard(product, true)).join('');
            }

            // Update countdown timer for the main banner
            this.updateMainCountdown();
        }).catch(error => {
            console.error('Error loading flash sale products:', error);
        });
    }
    
    renderProductCard(product, isFlashSale = false) {
        const currentPrice = product.isFlashSale ? product.flashSalePrice : product.price;
        const discountPercent = Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100);
        const currentStock = product.isFlashSale ? product.flashSaleStock : product.stock;
        
        let stockClass = 'stock-high';
        let stockText = `${currentStock} in stock`;
        
        if (currentStock === 0) {
            stockClass = 'stock-out';
            stockText = 'Out of Stock';
        } else if (currentStock <= 5) {
            stockClass = 'stock-low';
            stockText = `Only ${currentStock} left!`;
        } else if (currentStock <= 20) {
            stockClass = 'stock-medium';
        }
        
        const isExpired = product.isFlashSale && new Date() > new Date(product.flashSaleEnd);
        const canPurchase = currentStock > 0 && !isExpired;

        // Generate random rating for demo (3-5 stars)
        const rating = Math.floor(Math.random() * 3) + 3;
        const ratingStars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

        return `
            <div class="product-card ${product.isFlashSale ? 'flash-sale-card' : ''}" data-product-id="${product.id}">
                ${product.isFlashSale && !isExpired ? '<div class="flash-sale-badge">⚡ FLASH SALE</div>' : ''}

                <div class="product-image-container">
                    <!-- Category Badge -->
                    <div class="category-badge ${product.category}">
                        ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </div>

                    <!-- Discount Badge -->
                    ${discountPercent > 0 ? `<div class="discount-overlay">${discountPercent}% OFF</div>` : ''}

                    <!-- Product Image -->
                    <img src="${product.image}" alt="${product.name}" class="product-image" onclick="showProductDetails('${product.id}')">
                </div>

                <div class="product-info">
                    <h3 onclick="showProductDetails('${product.id}')" style="cursor: pointer;">${product.name}</h3>

                    <!-- Rating Stars -->
                    <div class="product-rating">
                        <span class="rating-stars">${ratingStars}</span>
                        <span class="rating-text">(${Math.floor(Math.random() * 50) + 10})</span>
                    </div>

                    <!-- Pricing Section -->
                    <div class="product-price">
                        <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
                        <span class="sale-price">₹${currentPrice.toLocaleString()}</span>
                        ${discountPercent > 0 ? `<span class="discount-badge">${discountPercent}% OFF</span>` : ''}
                    </div>

                    <!-- Stock Information -->
                    <div class="stock-container">
                        <div class="stock-info ${stockClass}">
                            <span class="stock-text">${stockText}</span>
                        </div>
                    </div>

                    <!-- Flash Sale Timer -->
                    ${product.isFlashSale && !isExpired ? `
                        <div class="flash-timer" data-end-time="${product.flashSaleEnd}">
                            <div class="timer-display">${this.getTimeRemaining(product.flashSaleEnd)}</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Floating Action Buttons (shown on hover) -->
                <div class="product-actions">
                    <button class="action-btn wishlist" onclick="toggleWishlist('${product.id}')" title="Add to Wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="action-btn compare" onclick="showNotification('Compare feature coming soon!', 'info')" title="Compare">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>

                <!-- Bottom Action Buttons -->
                <div class="product-bottom-actions">
                    ${canPurchase ? `
                        <button class="btn btn-secondary" onclick="addToCart('${product.id}', ${product.isFlashSale})">
                            Add to Cart
                        </button>
                        <button class="btn btn-primary" onclick="buyNow('${product.id}', ${product.isFlashSale})">
                            Buy Now
                        </button>
                    ` : `
                        <button class="btn btn-secondary" disabled style="width: 100%;">
                            ${isExpired ? 'Sale Ended' : 'Out of Stock'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    updateMainCountdown() {
        firebaseService.getProducts({ flashSale: true }).then(flashSaleProducts => {
            if (flashSaleProducts.length > 0) {
                // Use the earliest ending flash sale for main countdown
                const activeSales = flashSaleProducts.filter(p => new Date() <= new Date(p.flashSaleEnd));
                if (activeSales.length > 0) {
                    const earliestEnd = new Date(Math.min(...activeSales.map(p => new Date(p.flashSaleEnd).getTime())));
                    this.startCountdown(earliestEnd, 'main-countdown');
                } else {
                    // No active sales, hide countdown
                    const countdownEl = document.getElementById('main-countdown');
                    if (countdownEl) {
                        countdownEl.style.display = 'none';
                    }
                }
            } else {
                // No flash sales, hide countdown
                const countdownEl = document.getElementById('main-countdown');
                if (countdownEl) {
                    countdownEl.style.display = 'none';
                }
            }

            // Update individual product timers
            this.updateProductTimers();
        }).catch(error => {
            console.error('Error updating main countdown:', error);
        });
    }
    
    updateProductTimers() {
        const timers = document.querySelectorAll('.flash-timer');
        timers.forEach(timer => {
            const endTime = new Date(timer.dataset.endTime);
            const display = timer.querySelector('.timer-display');
            
            const updateTimer = () => {
                const now = new Date();
                const timeLeft = endTime - now;
                
                if (timeLeft <= 0) {
                    display.textContent = 'Sale Ended';
                    timer.style.color = '#dc3545';
                    // Refresh products to update UI
                    setTimeout(() => {
                        this.loadProducts();
                        this.loadFlashSaleProducts();
                    }, 1000);
                    return;
                }
                
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            };
            
            updateTimer();
            if (timer.updateInterval) clearInterval(timer.updateInterval);
            timer.updateInterval = setInterval(updateTimer, 1000);
        });
    }
    
    startCountdown(endTime, elementId) {
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (!hoursEl || !minutesEl || !secondsEl) return;
        
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = new Date(endTime) - now;
            
            if (timeLeft <= 0) {
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
                // Refresh products when countdown ends
                this.loadProducts();
                this.loadFlashSaleProducts();
                return;
            }
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        };
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    searchProducts(query) {
        this.currentFilters.search = query;
        this.loadProducts();
    }
    
    // Clean up all timers
    cleanupTimers() {
        const timers = document.querySelectorAll('.flash-timer');
        timers.forEach(timer => {
            if (timer.updateInterval) {
                clearInterval(timer.updateInterval);
                timer.updateInterval = null;
            }
        });
    }
}

// Global product manager
const productManager = new ProductManager();

// Make productManager globally available
if (typeof window !== 'undefined') {
    window.productManager = productManager;
}

// Product interaction functions
function showProductDetails(productId) {
    const product = firebaseService.getProduct(productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    const currentPrice = product.isFlashSale ? product.flashSalePrice : product.price;
    const discountPercent = Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100);
    const currentStock = product.isFlashSale ? product.flashSaleStock : product.stock;
    const isExpired = product.isFlashSale && new Date() > new Date(product.flashSaleEnd);

    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');

    details.innerHTML = `
        <div class="product-detail-content">
            <div class="product-detail-left">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 400px; border-radius: 8px;">
            </div>
            <div class="product-detail-right">
                <h2>${product.name}</h2>

                <div class="product-price" style="margin: 20px 0;">
                    <span style="color: #999; text-decoration: line-through; margin-right: 10px; font-size: 1.1rem;">
                        ₹${product.originalPrice.toLocaleString()}
                    </span>
                    <span style="color: #e47911; font-size: 1.5rem; font-weight: bold;">
                        ₹${currentPrice.toLocaleString()}
                    </span>
                    ${discountPercent > 0 ? `<span style="background: #e47911; color: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px; font-size: 0.9rem;">${discountPercent}% off</span>` : ''}
                </div>

                ${product.isFlashSale && !isExpired ? `
                    <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>⚡ FLASH SALE ACTIVE!</strong>
                        <div style="margin-top: 10px;">
                            Sale ends: ${new Date(product.flashSaleEnd).toLocaleString()}
                        </div>
                    </div>
                ` : ''}

                <div style="margin: 20px 0;">
                    <strong>Stock:</strong>
                    <span style="color: ${currentStock > 20 ? '#28a745' : currentStock > 5 ? '#ffc107' : '#dc3545'};">
                        ${currentStock > 0 ? `${currentStock} available` : 'Out of Stock'}
                    </span>
                </div>

                <div style="margin: 20px 0;">
                    <strong>Category:</strong> ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </div>

                <div style="margin: 20px 0;">
                    <strong>Description:</strong>
                    <p>${product.description}</p>
                </div>

                <div class="quantity-selector" style="margin: 20px 0;">
                    <label><strong>Quantity:</strong></label>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                        <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
                        <input type="number" id="product-quantity" value="1" min="1" max="${Math.min(currentStock, 10)}" style="width: 60px; text-align: center; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
                    </div>
                </div>

                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    ${currentStock > 0 && !isExpired ? `
                        <button class="btn btn-secondary" onclick="addToCartWithQuantity('${product.id}', ${product.isFlashSale})" style="flex: 1;">
                            Add to Cart
                        </button>
                        <button class="btn btn-primary" onclick="buyNowWithQuantity('${product.id}', ${product.isFlashSale})" style="flex: 1;">
                            Buy Now
                        </button>
                    ` : `
                        <button class="btn btn-secondary" disabled style="width: 100%;">
                            ${isExpired ? 'Flash Sale Ended' : 'Out of Stock'}
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;

    showModal('product-modal');
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('product-quantity');
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value);
    const newValue = currentValue + delta;
    const max = parseInt(quantityInput.max);
    const min = parseInt(quantityInput.min);

    if (newValue >= min && newValue <= max) {
        quantityInput.value = newValue;
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

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchField = document.querySelector('.nav-search-field');
    const searchSubmit = document.querySelector('.nav-search-submit');
    
    if (searchField && searchSubmit) {
        const performSearch = () => {
            const query = searchField.value.trim();
            if (query) {
                productManager.searchProducts(query);
                showPage('products');
            }
        };
        
        searchSubmit.addEventListener('click', performSearch);
        searchField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});