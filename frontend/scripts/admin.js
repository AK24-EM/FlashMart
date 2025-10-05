// Admin panel functionality
class AdminManager {
    constructor() {
        this.currentTab = 'products';
        this.init();
    }
    
    init() {
        // Load admin data when admin page is shown
        this.loadAdminData();
    }
    
    showTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="showAdminTab('${tab}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`admin-${tab}`).classList.add('active');

        // Load specific data for the tab
        switch (tab) {
            case 'products':
                this.loadAdminProducts();
                break;
            case 'sales':
                this.loadFlashSales();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'analytics':
                this.updateAdminStats();
                break;
        }

        this.currentTab = tab;
    }
    
    loadAdminData() {
        if (!authManager.currentUser || authManager.currentUser.role !== 'admin') {
            return;
        }

        // Default to Analytics tab when Admin opens
        this.showTab('analytics');
        // Populate analytics immediately
        this.updateAdminStats();
    }
    
    async updateAdminStats() {
        try {
            // Support both sync (local) and async (Firebase) data sources
            const analytics = await Promise.resolve(
                typeof dataManager.getAnalytics === 'function' ? dataManager.getAnalytics() : null
            );
            
            // Ensure analytics is an object
            const analyticsData = analytics && typeof analytics === 'object' ? analytics : {};
            
            // Update basic stats
            const activeSalesElement = document.getElementById('active-sales');
            const totalRevenueElement = document.getElementById('total-revenue');
            const queueLengthElement = document.getElementById('queue-length');
            const goldUsersElement = document.getElementById('gold-users');
            const silverUsersElement = document.getElementById('silver-users');
            const bronzeUsersElement = document.getElementById('bronze-users');
            
            if (activeSalesElement) activeSalesElement.textContent = analyticsData.activeFlashSales || 0;
            if (totalRevenueElement) totalRevenueElement.textContent = `₹${(analyticsData.totalRevenue || 0).toLocaleString()}`;
            if (queueLengthElement) queueLengthElement.textContent = analyticsData.queueLength || 0;
            if (goldUsersElement) goldUsersElement.textContent = (analyticsData.usersByTier && analyticsData.usersByTier.gold) || 0;
            if (silverUsersElement) silverUsersElement.textContent = (analyticsData.usersByTier && analyticsData.usersByTier.silver) || 0;
            if (bronzeUsersElement) bronzeUsersElement.textContent = (analyticsData.usersByTier && analyticsData.usersByTier.bronze) || 0;
            
            // Update activity metrics if analyticsManager is available
            if (typeof analyticsManager !== 'undefined') {
                // Get recent activities
                const recentActivities = analyticsManager.getRecentActivities(10);
                this.updateRecentActivities(recentActivities);
                
                // Get activity metrics
                const metrics = analyticsManager.getActivityMetrics();
                this.updateActivityMetrics(metrics);
            }

            // Optional: render top products if placeholders exist
            const topProductsContainer = document.getElementById('top-products');
            if (topProductsContainer && Array.isArray(analyticsData.topProducts)) {
                topProductsContainer.innerHTML = analyticsData.topProducts
                    .map(p => `<li>${p.name || p.id} — ${p.sales || 0} sold</li>`)
                    .join('');
            }

            // Render sales chart and activity metrics
            if (typeof analyticsManager !== 'undefined') {
                analyticsManager.generateReports().then(reports => {
                    if (reports && reports.salesReport) {
                        analyticsManager.renderSalesChart(reports.salesReport);
                    }
                });
            }
        } catch (error) {
            console.error('Error updating admin stats:', error);
            // Do not show a disruptive notification, just log the error
        }
    }
    
    // Update recent activities in the UI
    updateRecentActivities(activities = []) {
        const container = document.getElementById('recent-activities');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-activities">No recent activities</div>';
            return;
        }
        
        const formatTime = (timestamp) => {
            const now = Date.now();
            const diffMs = now - timestamp;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
            return new Date(timestamp).toLocaleTimeString();
        };
        
        const getActivityIcon = (type) => {
            const icons = {
                'purchase': '🛒',
                'add_to_cart': '🛍️',
                'page_view': '👁️',
                'login': '🔑',
                'signup': '👋',
                'search': '🔍',
                'review': '⭐',
                'refund': '↩️',
                'default': '⚡'
            };
            return icons[type] || icons['default'];
        };
        
        const activitiesHtml = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${getActivityIcon(activity.type)}</span>
                <div class="activity-details">
                    <div class="activity-title">${this.formatActivityTitle(activity)}</div>
                    <div class="activity-time">${formatTime(new Date(activity.timestamp).getTime())}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = activitiesHtml;
    }
    
    // Format activity title based on type
    formatActivityTitle(activity) {
        const { type, productId, orderId, amount, page } = activity;
        
        switch (type) {
            case 'purchase':
                return `Order #${orderId || 'N/A'} placed for ₹${amount || '0'}`;
            case 'add_to_cart':
                return `Added ${productId ? 'a product' : 'items'} to cart`;
            case 'page_view':
                return `Viewed ${page || 'a page'}`;
            case 'login':
                return 'User logged in';
            case 'signup':
                return 'New user signed up';
            case 'search':
                return `Searched for products`;
            default:
                return type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
        }
    }
    
    // Update activity metrics in the UI
    updateActivityMetrics(metrics = {}) {
        // Update activity count
        const activityCountElement = document.getElementById('activity-count');
        if (activityCountElement) {
            activityCountElement.textContent = metrics.lastHourActivity || 0;
            
            // Update trend indicator
            const trendElement = document.getElementById('activity-trend');
            if (trendElement) {
                const trend = metrics.activityTrend || 0;
                trendElement.textContent = `${Math.abs(trend)}%`;
                trendElement.className = `trend-indicator ${trend >= 0 ? 'up' : 'down'}`;
            }
        }
        
        // Update activity distribution chart if available
        this.updateActivityDistribution(metrics.activityCounts || {});
    }
    
    // Update activity distribution chart
    updateActivityDistribution(counts) {
        const ctx = document.getElementById('activityDistributionChart');
        if (!ctx) return;
        
        const labels = Object.keys(counts);
        const data = Object.values(counts);
        
        // Only proceed if we have data to display
        if (data.length === 0) return;
        
        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Activity distribution chart will not be displayed.');
            return;
        }
        
        // Destroy existing chart if it exists
        if (window.activityDistributionChart) {
            window.activityDistributionChart.destroy();
        }
        
        try {
            // Create new chart
            window.activityDistributionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                            '#5a5c69', '#858796', '#3a3b45', '#1a1a1a', '#00bcd4'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                padding: 20
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        } catch (error) {
            console.error('Error creating activity distribution chart:', error);
        }
    }
    
    async loadAdminProducts() {
        console.log('AdminManager: loadAdminProducts called');
        const tbody = document.getElementById('admin-products-tbody');

        if (!tbody) {
            console.warn('Admin products table not found in DOM');
            return;
        }

        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <h3>Loading Products...</h3>
                </td>
            </tr>
        `;

        try {
            // Get products with proper async/await
            const products = await dataManager.getProducts();
            console.log('AdminManager: received products:', products);
            console.log('AdminManager: products type:', typeof products);
            console.log('AdminManager: products is array:', Array.isArray(products));

            const productsArray = Array.isArray(products) ? products : [];

            if (productsArray.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                            <h3>No Products Found</h3>
                            <p>Add your first product to get started!</p>
                            <button class="btn btn-primary" onclick="showAddProductModal()">
                                <i class="fas fa-plus"></i> Add Product
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            console.log('AdminManager: rendering', productsArray.length, 'products');
            tbody.innerHTML = productsArray.map(product => `
                <tr>
                    <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${product.name}</td>
                    <td>${product.id}</td>
                    <td>${product.category}</td>
                    <td>₹${product.price.toLocaleString()}</td>
                    <td>${product.stock}</td>
                    <td>
                        ${product.isFlashSale ?
                            `<span style="color: #28a745; font-weight: bold;">✓ Active</span><br>
                             <small>Price: ₹${product.flashSalePrice.toLocaleString()}</small><br>
                             <small>Stock: ${product.flashSaleStock}</small>` :
                            '<span style="color: #6c757d;">Not in sale</span>'
                        }
                    </td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="console.log('Edit button clicked for product:', '${product.id}'); adminManager.editProduct('${product.id}')" title="Edit Product">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="console.log('Toggle sale button clicked for product:', '${product.id}'); adminManager.toggleFlashSale('${product.id}')"
                                style="background-color: ${product.isFlashSale ? '#dc3545' : '#28a745'}; color: white;" title="${product.isFlashSale ? 'End Flash Sale' : 'Start Flash Sale'}">
                            ${product.isFlashSale ? '<i class="fas fa-stop"></i> End Sale' : '<i class="fas fa-bolt"></i> Start Sale'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="console.log('Delete button clicked for product:', '${product.id}'); adminManager.deleteProduct('${product.id}')"
                                style="background-color: #dc3545; color: white;" title="Delete Product">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
            console.log('AdminManager: products rendered successfully');
        } catch (error) {
            console.error('AdminManager: error loading products:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <h3>Error Loading Products</h3>
                        <p>${error.message || 'An error occurred while loading products.'}</p>
                        <button class="btn btn-secondary" onclick="adminManager.loadAdminProducts()">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }
    
    async loadFlashSales() {
        console.log('AdminManager: loadFlashSales called');
        const container = document.getElementById('flash-sales-list');

        if (!container) {
            console.warn('Flash sales container not found in DOM');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <h3>Loading Flash Sales...</h3>
            </div>
        `;

        try {
            // Get flash sale products with proper async/await
            const flashSaleProducts = await dataManager.getProducts({ flashSale: true });
            console.log('AdminManager: received flash sale products:', flashSaleProducts);

            // Ensure flashSaleProducts is an array
            const flashSalesArray = Array.isArray(flashSaleProducts) ? flashSaleProducts : [];

            if (flashSalesArray.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-bolt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <h3>No Active Flash Sales</h3>
                        <p>Create your first flash sale to get started!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = flashSalesArray.map(product => `
                <div class="flash-sale-item">
                    <div class="flash-sale-header">
                        <div>
                            <h4>${product.name}</h4>
                            <p>Flash Sale Price: ₹${product.flashSalePrice.toLocaleString()}
                               <small>(${Math.round(((product.originalPrice - product.flashSalePrice) / product.originalPrice) * 100)}% off)</small></p>
                        </div>
                        <div>
                            <span class="sale-status ${new Date() > new Date(product.flashSaleEnd) ? 'ended' : 'active'}">
                                ${new Date() > new Date(product.flashSaleEnd) ? 'Ended' : 'Active'}
                            </span>
                        </div>
                    </div>
                    <div class="flash-sale-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                            <div>
                                <strong>Original Price:</strong> ₹${product.originalPrice.toLocaleString()}<br>
                                <strong>Flash Sale Stock:</strong> ${product.flashSaleStock}<br>
                                <strong>Regular Stock:</strong> ${product.stock}
                            </div>
                            <div>
                                <strong>Sale End Time:</strong><br>
                                ${dataManager.formatDate(product.flashSaleEnd)}<br>
                                <small>${new Date() > new Date(product.flashSaleEnd) ? 'Ended' : 'Time left: ' + this.getTimeLeft(product.flashSaleEnd)}</small>
                            </div>
                            <div>
                                <strong>Sales Performance:</strong><br>
                                ${this.getSalesStats(product.id)}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-secondary" onclick="adminManager.editFlashSale('${product.id}')">
                                Edit Sale
                            </button>
                            <button class="btn btn-secondary" onclick="adminManager.endFlashSale('${product.id}')"
                                    style="background-color: #dc3545; color: white;">
                                End Sale
                            </button>
                            <button class="btn btn-secondary" onclick="adminManager.extendFlashSale('${product.id}')">
                                Extend Sale
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('AdminManager: error loading flash sales:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h3>Error Loading Flash Sales</h3>
                    <p>${error.message || 'An error occurred while loading flash sales.'}</p>
                    <button class="btn btn-secondary" onclick="adminManager.loadFlashSales()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }
    
    async loadUsers() {
        const tbody = document.getElementById('users-table-tbody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7" class="loading-state">Loading users...</td></tr>`;

        try {
            const users = await dataManager.getUsers();
            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No users found.</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${user.tier || 'bronze'}</td>
                    <td>${user.loyaltyPoints || 0}</td>
                    <td>${(user.orders || []).length}</td>
                    <td>₹${this.calculateCLV(user).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="adminManager.viewUserDetails('${user.id}')">Details</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="error-state">Error loading users.</td></tr>`;
        }
    }
    
    calculateCLV(user) {
        // Simple CLV calculation: total spent + (loyalty points * 0.1) + (tier bonus)
        const tierBonus = {
            'bronze': 0,
            'silver': 1000,
            'gold': 5000
        };
        
        return user.totalSpent + (user.loyaltyPoints * 0.1) + (tierBonus[user.tier] || 0);
    }
    
    getSalesStats(productId) {
        const orders = dataManager.orders;
        
        // Debug logging
        console.log('getSalesStats called for product:', productId);
        console.log('orders type:', typeof orders);
        console.log('orders value:', orders);
        
        // Ensure orders is an array
        const ordersArray = Array.isArray(orders) ? orders : [];
        
        let totalSold = 0;
        let revenue = 0;
        
        ordersArray.forEach(order => {
            order.items.forEach(item => {
                if (item.productId === productId && item.isFlashSale) {
                    totalSold += item.quantity;
                    revenue += item.price * item.quantity;
                }
            });
        });
        
        return `Sold: ${totalSold}<br>Revenue: ₹${revenue.toLocaleString()}`;
    }
    
    viewUserInsights() {
        showNotification('Customer insights feature coming soon!', 'info');
    }

    sendNotification(userId) {
        showNotification('Notification feature coming soon!', 'info');
    }

    editFlashSale(productId) {
        // Show edit flash sale modal
        this.createFlashSale(productId);
    }
    
    getTimeLeft(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const timeLeft = end - now;
        
        if (timeLeft <= 0) return 'Ended';
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    // Product Management
    async addProduct(productData) {
        try {
            const newProduct = await dataManager.addProduct(productData);
            this.loadAdminProducts();
            this.updateAdminStats();
            showNotification('Product added successfully!', 'success');
            return newProduct;
        } catch (error) {
            console.error('Error adding product:', error);
            showNotification('Failed to add product. Please try again.', 'error');
        }
    }
    
    editProduct(productId) {
        console.log('AdminManager: editProduct called with ID:', productId);
        const product = dataManager.getProduct(productId);
        if (!product) {
            console.warn('AdminManager: Product not found:', productId);
            showNotification('Product not found!', 'error');
            return;
        }

        console.log('AdminManager: Editing product:', product.name);
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h3>Edit Product</h3>
                <form id="edit-product-form">
                    <div class="form-group">
                        <label>Product Name</label>
                        <input type="text" id="edit-product-name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="edit-product-category" required>
                            <option value="electronics" ${product.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                            <option value="clothing" ${product.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                            <option value="books" ${product.category === 'books' ? 'selected' : ''}>Books</option>
                            <option value="home" ${product.category === 'home' ? 'selected' : ''}>Home & Kitchen</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Price (₹)</label>
                        <input type="number" id="edit-product-price" value="${product.price}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Original Price (₹)</label>
                        <input type="number" id="edit-product-original-price" value="${product.originalPrice}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Stock Quantity</label>
                        <input type="number" id="edit-product-stock" value="${product.stock}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="url" id="edit-product-image" value="${product.image}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="edit-product-description" rows="3">${product.description}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Product</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = document.getElementById('edit-product-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                name: document.getElementById('edit-product-name').value,
                category: document.getElementById('edit-product-category').value,
                price: parseInt(document.getElementById('edit-product-price').value),
                originalPrice: parseInt(document.getElementById('edit-product-original-price').value),
                stock: parseInt(document.getElementById('edit-product-stock').value),
                image: document.getElementById('edit-product-image').value,
                description: document.getElementById('edit-product-description').value
            };
            
            try {
                await dataManager.updateProduct(productId, updatedData);
                this.loadAdminProducts();
                modal.remove();
                showNotification('Product updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating product:', error);
                showNotification('Failed to update product. Please try again.', 'error');
            }
        });
    }
    
    async deleteProduct(productId) {
        console.log('AdminManager: deleteProduct called with ID:', productId);
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await dataManager.deleteProduct(productId);
                this.loadAdminProducts();
                this.updateAdminStats();
                showNotification('Product deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification('Failed to delete product. Please try again.', 'error');
            }
        }
    }
    
    async toggleFlashSale(productId) {
        console.log('AdminManager: toggleFlashSale called with ID:', productId);
        try {
            const product = await dataManager.getProduct(productId);
            if (!product) {
                console.warn('AdminManager: Product not found for flash sale toggle:', productId);
                showNotification('Product not found!', 'error');
                return;
            }

            console.log('AdminManager: Toggling flash sale for product:', product.name, 'isFlashSale:', product.isFlashSale);

            if (product.isFlashSale) {
                // End flash sale
                await this.endFlashSale(productId);
            } else {
                // Start flash sale
                this.createFlashSale(productId);
            }
        } catch (error) {
            console.error('Error toggling flash sale:', error);
            showNotification('Failed to toggle flash sale. Please try again.', 'error');
        }
    }
    
    async createFlashSale(productId = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        try {
            // Get available products for flash sale
            const availableProducts = productId ?
                [await dataManager.getProduct(productId)] :
                (await dataManager.getProducts()).filter(p => !p.isFlashSale);
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h3>Create Flash Sale</h3>
                    <form id="create-flash-sale-form">
                        <div class="form-group">
                            <label>Select Product</label>
                            <select id="flash-sale-product" required ${productId ? 'disabled' : ''}>
                                ${availableProducts.map(p => `
                                    <option value="${p.id}" ${productId === p.id ? 'selected' : ''}>
                                        ${p.name} (₹${p.price})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Flash Sale Price (₹)</label>
                            <input type="number" id="flash-sale-price" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Flash Sale Stock</label>
                            <input type="number" id="flash-sale-stock" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Sale Duration (hours)</label>
                            <select id="flash-sale-duration" required>
                                <option value="1">1 hour</option>
                                <option value="2" selected>2 hours</option>
                                <option value="6">6 hours</option>
                                <option value="12">12 hours</option>
                                <option value="24">24 hours</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Queue Type</label>
                            <select id="queue-type">
                                <option value="fifo">First Come, First Serve</option>
                                <option value="priority" selected>Priority (Loyalty Tier)</option>
                                <option value="random">Random/Lottery</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Create Flash Sale</button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Handle form submission
            const form = document.getElementById('create-flash-sale-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const selectedProductId = document.getElementById('flash-sale-product').value;
                const flashSalePrice = parseInt(document.getElementById('flash-sale-price').value);
                const flashSaleStock = parseInt(document.getElementById('flash-sale-stock').value);
                const duration = parseInt(document.getElementById('flash-sale-duration').value);
                
                const endTime = new Date();
                endTime.setTime(endTime.getTime() + (duration * 60 * 60 * 1000));
                
                const updates = {
                    isFlashSale: true,
                    flashSalePrice,
                    flashSaleStock,
                    flashSaleEnd: endTime
                };
                
                try {
                    await dataManager.updateProduct(selectedProductId, updates);
                    this.loadAdminProducts();
                    this.loadFlashSales();
                    this.updateAdminStats();
                    modal.remove();
                    showNotification('Flash sale created successfully!', 'success');
                    
                    // Refresh product displays
                    if (typeof productManager !== 'undefined') {
                        productManager.loadProducts();
                        productManager.loadFlashSaleProducts();
                    }
                } catch (error) {
                    console.error('Error creating flash sale:', error);
                    showNotification('Failed to create flash sale. Please try again.', 'error');
                }
            });
        } catch (error) {
            console.error('Error creating flash sale modal:', error);
            showNotification('Failed to load flash sale form. Please try again.', 'error');
        }
    }
    
    async endFlashSale(productId) {
        const updates = {
            isFlashSale: false,
            flashSalePrice: null,
            flashSaleStock: null,
            flashSaleEnd: null
        };
        
        try {
            await dataManager.updateProduct(productId, updates);
            this.loadAdminProducts();
            this.loadFlashSales();
            this.updateAdminStats();
            showNotification('Flash sale ended!', 'success');
            
            // Refresh product displays
            if (typeof productManager !== 'undefined') {
                productManager.loadProducts();
                productManager.loadFlashSaleProducts();
            }
        } catch (error) {
            console.error('Error ending flash sale:', error);
            showNotification('Failed to end flash sale. Please try again.', 'error');
        }
    }
    
    async extendFlashSale(productId) {
        const hours = prompt('Extend sale by how many hours?', '2');
        if (!hours || isNaN(hours)) return;
        
        try {
            const product = await dataManager.getProduct(productId);
            if (!product || !product.flashSaleEnd) {
                showNotification('Product not found or not on flash sale.', 'error');
                return;
            }
            
            const newEndTime = new Date(product.flashSaleEnd);
            newEndTime.setTime(newEndTime.getTime() + (parseInt(hours) * 60 * 60 * 1000));
            
            await dataManager.updateProduct(productId, { flashSaleEnd: newEndTime });
            this.loadFlashSales();
            showNotification(`Flash sale extended by ${hours} hours!`, 'success');
        } catch (error) {
            console.error('Error extending flash sale:', error);
            showNotification('Failed to extend flash sale. Please try again.', 'error');
        }
    }
    
    async viewUserDetails(userId) {
        try {
            const user = await dataManager.getUser(userId);
            const userOrders = await dataManager.getUserOrders(userId);
            
            if (!user) return;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content modal-large">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h3>User Details: ${user.name}</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 20px 0;">
                        <div>
                            <h4>Profile Information</h4>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Join Date:</strong> ${dataManager.formatDate(user.joinDate)}</p>
                            <p><strong>Loyalty Tier:</strong> 
                               <span style="color: ${user.tier === 'gold' ? '#ffd700' : user.tier === 'silver' ? '#c0c0c0' : '#cd7f32'}; font-weight: bold;">
                                   ${user.tier.toUpperCase()}
                               </span>
                            </p>
                            <p><strong>Loyalty Points:</strong> ${user.loyaltyPoints}</p>
                            <p><strong>Total Spent:</strong> ₹${user.totalSpent.toLocaleString()}</p>
                            <p><strong>CLV:</strong> ₹${this.calculateCLV(user).toLocaleString()}</p>
                        </div>
                        
                        <div>
                            <h4>Order Statistics</h4>
                            <p><strong>Total Orders:</strong> ${userOrders.length}</p>
                            <p><strong>Average Order Value:</strong> 
                               ₹${userOrders.length > 0 ? Math.round(user.totalSpent / userOrders.length).toLocaleString() : '0'}</p>
                            <p><strong>Last Order:</strong> 
                               ${userOrders.length > 0 ? dataManager.formatDate(userOrders[userOrders.length - 1].createdAt) : 'Never'}</p>
                        </div>
                    </div>
                    
                    <h4>Recent Orders</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${userOrders.slice(-5).reverse().map(order => `
                            <div style="border: 1px solid #ddd; border-radius: 8px; margin: 10px 0; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <strong>Order #${order.id}</strong>
                                    <span>${dataManager.formatDate(order.createdAt)}</span>
                                </div>
                                <p><strong>Total:</strong> ₹${order.total.toLocaleString()}</p>
                                <p><strong>Items:</strong> ${order.items.length} item(s)</p>
                            </div>
                        `).join('') || '<p>No orders found.</p>'}
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button class="btn btn-primary" onclick="adminManager.sendPersonalizedOffer('${userId}')">
                            Send Personalized Offer
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error loading user details:', error);
            showNotification('Failed to load user details. Please try again.', 'error');
        }
    }
    
    async sendPersonalizedOffer(userId) {
        try {
            const user = await dataManager.getUser(userId);
            if (!user) return;
            
            // Simulate sending a personalized offer based on user tier and purchase history
            let offerMessage = '';
            let discountPercent = 0;
            
            switch (user.tier) {
                case 'gold':
                    offerMessage = 'Exclusive VIP offer with early access to flash sales!';
                    discountPercent = 25;
                    break;
                case 'silver':
                    offerMessage = 'Special loyalty member discount!';
                    discountPercent = 15;
                    break;
                default:
                    offerMessage = 'Welcome back! Here\'s a special offer for you!';
                    discountPercent = 10;
            }
            
            // In a real system, this would send an email/notification
            showNotification(`Personalized offer sent to ${user.name}: ${discountPercent}% discount!`, 'success');
            
            // Award some bonus points
            const bonusPoints = user.tier === 'gold' ? 500 : user.tier === 'silver' ? 300 : 100;
            user.loyaltyPoints += bonusPoints;
            await dataManager.updateUser(userId, user);
            
            showNotification(`${bonusPoints} bonus loyalty points awarded to ${user.name}!`, 'success');
        } catch (error) {
            console.error('Error sending personalized offer:', error);
            showNotification('Failed to send personalized offer. Please try again.', 'error');
        }
    }
}

// Global admin manager
const adminManager = new AdminManager();

// Make sure adminManager is available globally
if (typeof window !== 'undefined') {
    window.adminManager = adminManager;
}

// Admin tab management
async function showAdminTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showAdminTab('${tab}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`admin-${tab}`).classList.add('active');

    // Load specific data for the tab
    switch (tab) {
        case 'products':
            await adminManager.loadAdminProducts();
            break;
        case 'sales':
            await adminManager.loadFlashSales();
            break;
        case 'users':
            adminManager.loadUsers();
            break;
        case 'analytics':
            adminManager.updateAdminStats();
            break;
    }

    adminManager.currentTab = tab;
}

function showAddProductModal() {
    showModal('add-product-modal');
}

function showCreateSaleModal() {
    adminManager.createFlashSale();
}

// Add product form handler
document.addEventListener('DOMContentLoaded', function() {
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                price: parseInt(document.getElementById('product-price').value),
                originalPrice: parseInt(document.getElementById('product-price').value), // Same as price initially
                stock: parseInt(document.getElementById('product-stock').value),
                image: document.getElementById('product-image').value || 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: document.getElementById('product-description').value,
                isFlashSale: false
            };
            
            adminManager.addProduct(productData);
            closeModal('add-product-modal');
            addProductForm.reset();
        });
    }
});