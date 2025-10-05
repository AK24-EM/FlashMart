/**
 * Operations Dashboard Controller
 *
 * Main controller for the operations dashboard, integrating all services
 * and providing real-time updates for the omnichannel view.
 */

class OperationsDashboard {
    constructor() {
        this.operationsService = null;
        this.inventoryManager = null;
        this.orderTracker = null;
        this.channelAnalytics = null;

        this.isInitialized = false;
        this.refreshInterval = null;
        this.currentTab = 'overview';

        // Cache for dashboard data
        this.cache = {
            overview: null,
            orders: null,
            inventory: null,
            channels: null,
            insights: null,
            lastUpdated: null
        };
    }

    /**
     * Initialize the operations dashboard
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Operations Dashboard...');

            // Initialize Firebase first
            if (typeof window.FIREBASE_CONFIG !== 'undefined') {
                await this.initializeFirebase();
            }

            // Initialize core services
            await this.initializeServices();

            // Setup UI event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadDashboardData();

            // Setup real-time updates
            this.setupRealTimeUpdates();

            this.isInitialized = true;
            console.log('✅ Operations Dashboard initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Operations Dashboard:', error);
            this.showError('Failed to load dashboard: ' + error.message);
        }
    }

    /**
     * Initialize Firebase connection
     */
    async initializeFirebase() {
        if (window.firebase) {
            const { initializeApp } = window.firebase;
            const app = initializeApp(window.FIREBASE_CONFIG);

            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            this.db = getFirestore(app);
        }
    }

    /**
     * Initialize all core services
     */
    async initializeServices() {
        // Initialize Operations Service
        if (window.OperationsService) {
            this.operationsService = new OperationsService(this.db);
            await this.operationsService.initialize();
        }

        // Initialize Inventory Manager
        if (window.InventoryManager) {
            this.inventoryManager = new InventoryManager(this.operationsService);
            await this.inventoryManager.initialize();
        }

        // Initialize Order Tracker
        if (window.OrderTracker) {
            this.orderTracker = new OrderTracker(this.operationsService, this.inventoryManager);
            await this.orderTracker.initialize();
        }

        // Initialize Channel Analytics
        if (window.ChannelAnalyticsService) {
            this.channelAnalytics = new ChannelAnalyticsService(this.operationsService, this.orderTracker);
            await this.channelAnalytics.initialize();
        }
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase();
                this.showTab(tabName);
            });
        });

        // Refresh button (if exists)
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Export buttons (if exist)
        const exportButtons = document.querySelectorAll('.btn-export');
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const format = e.target.textContent.includes('CSV') ? 'csv' : 'json';
                this.exportData(format);
            });
        });
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        this.showLoading();

        try {
            // Load data in parallel for better performance
            const [overviewData, ordersData, inventoryData, channelsData, insightsData] = await Promise.all([
                this.loadOverviewData(),
                this.loadOrdersData(),
                this.loadInventoryData(),
                this.loadChannelsData(),
                this.loadInsightsData()
            ]);

            // Update cache
            this.cache = {
                overview: overviewData,
                orders: ordersData,
                inventory: inventoryData,
                channels: channelsData,
                insights: insightsData,
                lastUpdated: new Date()
            };

            // Render data based on current tab
            this.renderCurrentTab();

            this.hideLoading();

        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showError('Failed to load data: ' + error.message);
        }
    }

    /**
     * Load overview data
     */
    async loadOverviewData() {
        if (!this.orderTracker || !this.inventoryManager || !this.channelAnalytics) {
            return null;
        }

        const orderStats = this.orderTracker.getProcessingStats();
        const inventoryStats = {
            totalItems: this.inventoryManager.getAllInventory().length,
            lowStockItems: this.inventoryManager.getLowStockItems().length,
            outOfStockItems: this.inventoryManager.getOutOfStockItems().length,
            totalValue: this.inventoryManager.getInventoryValue()
        };

        const omnichannelData = this.channelAnalytics.getOmnichannelOverview('30d');

        return {
            orderStats,
            inventoryStats,
            omnichannelData,
            lastUpdated: new Date()
        };
    }

    /**
     * Load orders data
     */
    async loadOrdersData() {
        if (!this.orderTracker) return null;

        const orders = this.orderTracker.getOrders({
            sortBy: 'date',
            sortOrder: 'desc'
        }).slice(0, 50); // Show latest 50 orders

        const queueStats = this.orderTracker.getProcessingStats();

        return {
            orders,
            queueStats,
            lastUpdated: new Date()
        };
    }

    /**
     * Load inventory data
     */
    async loadInventoryData() {
        if (!this.inventoryManager) return null;

        const allInventory = this.inventoryManager.getAllInventory();
        const lowStockItems = this.inventoryManager.getLowStockItems();
        const outOfStockItems = this.inventoryManager.getOutOfStockItems();
        const alerts = this.inventoryManager.getActiveAlerts();

        return {
            allInventory,
            lowStockItems,
            outOfStockItems,
            alerts,
            summary: this.inventoryManager.generateInventoryReport(),
            lastUpdated: new Date()
        };
    }

    /**
     * Load channels data
     */
    async loadChannelsData() {
        if (!this.channelAnalytics) return null;

        const omnichannelOverview = this.channelAnalytics.getOmnichannelOverview('30d');
        const realtimeDashboard = this.channelAnalytics.getRealTimeDashboard();

        return {
            omnichannelOverview,
            realtimeDashboard,
            lastUpdated: new Date()
        };
    }

    /**
     * Load insights data
     */
    async loadInsightsData() {
        if (!this.channelAnalytics) return null;

        const omnichannelOverview = this.channelAnalytics.getOmnichannelOverview('30d');
        const insights = omnichannelOverview.insights || [];

        // Add additional insights based on current data
        if (this.inventoryManager) {
            const lowStockCount = this.inventoryManager.getLowStockItems().length;
            if (lowStockCount > 0) {
                insights.push({
                    type: 'inventory_alert',
                    priority: 'high',
                    title: 'Inventory Attention Required',
                    message: `${lowStockCount} items are running low on stock and need reordering.`,
                    actionable: true
                });
            }
        }

        if (this.orderTracker) {
            const stuckOrders = await this.orderTracker.checkStuckOrders();
            if (stuckOrders.length > 0) {
                insights.push({
                    type: 'order_alert',
                    priority: 'medium',
                    title: 'Stuck Orders Detected',
                    message: `${stuckOrders.length} orders appear to be stuck in processing.`,
                    actionable: true
                });
            }
        }

        return {
            insights,
            lastUpdated: new Date()
        };
    }

    /**
     * Render current tab content
     */
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'overview':
                this.renderOverviewTab();
                break;
            case 'orders':
                this.renderOrdersTab();
                break;
            case 'inventory':
                this.renderInventoryTab();
                break;
            case 'channels':
                this.renderChannelsTab();
                break;
            case 'insights':
                this.renderInsightsTab();
                break;
        }
    }

    /**
     * Render overview tab
     */
    renderOverviewTab() {
        const data = this.cache.overview;
        if (!data) return;

        // Update metrics cards
        this.updateMetricsCards(data);

        // Render channel overview
        this.renderChannelOverview(data.omnichannelData);

        // Update alerts
        this.renderAlerts(data.inventoryStats.alerts || []);
    }

    /**
     * Render orders tab
     */
    renderOrdersTab() {
        const data = this.cache.orders;
        if (!data) return;

        this.renderOrdersQueue(data.orders);
        this.renderQueueStats(data.queueStats);
    }

    /**
     * Render inventory tab
     */
    renderInventoryTab() {
        const data = this.cache.inventory;
        if (!data) return;

        this.renderInventoryOverview(data);
        this.renderInventoryAlerts(data.alerts);
    }

    /**
     * Render channels tab
     */
    renderChannelsTab() {
        const data = this.cache.channels;
        if (!data) return;

        this.renderOmnichannelAnalytics(data.omnichannelOverview);
        this.renderRealtimeDashboard(data.realtimeDashboard);
    }

    /**
     * Render insights tab
     */
    renderInsightsTab() {
        const data = this.cache.insights;
        if (!data) return;

        this.renderInsights(data.insights);
    }

    /**
     * Update metrics cards in overview
     */
    updateMetricsCards(data) {
        // Active orders
        document.getElementById('active-orders-count').textContent =
            data.orderStats.totalOrders || 0;
        document.getElementById('processing-count').textContent =
            data.orderStats.processingOrders || 0;

        // Revenue
        document.getElementById('total-revenue').textContent =
            `₹${this.formatNumber(data.omnichannelData?.summary?.totalRevenue || 0)}`;
        document.getElementById('avg-order-value').textContent =
            this.formatNumber(data.omnichannelData?.summary?.averageOrderValue || 0);

        // Inventory
        document.getElementById('inventory-count').textContent =
            data.inventoryStats.totalItems || 0;
        document.getElementById('low-stock-count').textContent =
            data.inventoryStats.lowStockItems || 0;

        // Update low stock alert color
        const lowStockChange = document.getElementById('low-stock-change');
        if (data.inventoryStats.lowStockItems > 0) {
            lowStockChange.className = 'metric-change negative';
        } else {
            lowStockChange.className = 'metric-change positive';
        }

        // Channels
        document.getElementById('active-channels-count').textContent =
            data.omnichannelData?.summary?.channelCount || 0;

        // Top channel
        const topChannel = this.getTopPerformingChannel(data.omnichannelData);
        document.getElementById('top-channel').textContent = topChannel || 'Loading...';
    }

    /**
     * Render channel overview cards
     */
    renderChannelOverview(omnichannelData) {
        const container = document.getElementById('channel-overview');
        if (!container || !omnichannelData?.channels) return;

        container.innerHTML = '';

        Object.entries(omnichannelData.channels).forEach(([channelId, channelData]) => {
            const channelCard = this.createChannelCard(channelData);
            container.appendChild(channelCard);
        });
    }

    /**
     * Create channel performance card
     */
    createChannelCard(channelData) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-header">
                <div class="channel-icon">
                    <i class="fas ${this.getChannelIcon(channelData.channelType)}"></i>
                </div>
                <div class="channel-name">${channelData.channelName}</div>
            </div>
            <div class="channel-metrics">
                <div class="channel-metric">
                    <div class="channel-metric-value">₹${this.formatNumber(channelData.metrics.totalRevenue)}</div>
                    <div class="channel-metric-label">Revenue</div>
                </div>
                <div class="channel-metric">
                    <div class="channel-metric-value">${channelData.metrics.totalOrders}</div>
                    <div class="channel-metric-label">Orders</div>
                </div>
                <div class="channel-metric">
                    <div class="channel-metric-value">₹${this.formatNumber(channelData.metrics.averageOrderValue)}</div>
                    <div class="channel-metric-label">Avg Order</div>
                </div>
                <div class="channel-metric">
                    <div class="channel-metric-value">${channelData.metrics.successRate.toFixed(1)}%</div>
                    <div class="channel-metric-label">Success Rate</div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Render orders queue
     */
    renderOrdersQueue(orders) {
        const container = document.getElementById('orders-queue');
        if (!container) return;

        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>No orders in queue</p>
                </div>
            `;
            return;
        }

        orders.forEach(order => {
            const orderItem = this.createOrderQueueItem(order);
            container.appendChild(orderItem);
        });
    }

    /**
     * Create order queue item
     */
    createOrderQueueItem(order) {
        const item = document.createElement('div');
        item.className = 'queue-item';

        const priorityClass = order.priority >= 8 ? 'high' : order.priority >= 5 ? 'medium' : 'low';

        item.innerHTML = `
            <div class="queue-priority">${order.priority}</div>
            <div style="flex: 1;">
                <div class="queue-order-id">${order.id}</div>
                <div style="font-size: 0.8rem; color: #64748b;">${order.channel} • ${order.status}</div>
            </div>
            <div class="queue-channel">${order.channel}</div>
            <div class="queue-amount">₹${this.formatNumber(order.totalAmount)}</div>
        `;

        return item;
    }

    /**
     * Render inventory overview
     */
    renderInventoryOverview(data) {
        const container = document.getElementById('inventory-management');
        if (!container) return;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: rgba(103, 126, 234, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #667eea;">${data.allInventory.length}</div>
                    <div style="color: #64748b;">Total Items</div>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #ef4444;">${data.lowStockItems.length}</div>
                    <div style="color: #64748b;">Low Stock</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #f59e0b;">${data.outOfStockItems.length}</div>
                    <div style="color: #64748b;">Out of Stock</div>
                </div>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: #10b981;">₹${this.formatNumber(data.summary?.summary?.totalValue || 0)}</div>
                    <div style="color: #64748b;">Total Value</div>
                </div>
            </div>
        `;
    }

    /**
     * Render inventory alerts
     */
    renderInventoryAlerts(alerts) {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alert-item" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #059669;">
                    <i class="fas fa-check-circle alert-icon"></i>
                    <div class="alert-content">
                        <div class="alert-title">All Clear</div>
                        <div class="alert-message">No inventory alerts at this time.</div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <i class="fas fa-exclamation-triangle alert-icon"></i>
                <div class="alert-content">
                    <div class="alert-title">${alert.productName}</div>
                    <div class="alert-message">Current stock: ${alert.currentStock} (Reorder at: ${alert.reorderPoint})</div>
                </div>
            `;
            container.appendChild(alertItem);
        });
    }

    /**
     * Render omnichannel analytics
     */
    renderOmnichannelAnalytics(data) {
        const container = document.getElementById('omnichannel-analytics');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom: 30px;">
                <h4>Channel Performance Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    ${Object.entries(data.channels).map(([channelId, channelData]) => `
                        <div style="background: rgba(103, 126, 234, 0.1); padding: 20px; border-radius: 12px;">
                            <div style="font-size: 1.2rem; font-weight: 700; color: #667eea;">${channelData.channelName}</div>
                            <div style="margin-top: 10px;">
                                <div>Revenue: ₹${this.formatNumber(channelData.metrics.totalRevenue)}</div>
                                <div>Orders: ${channelData.metrics.totalOrders}</div>
                                <div>Avg Order: ₹${this.formatNumber(channelData.metrics.averageOrderValue)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render real-time dashboard
     */
    renderRealtimeDashboard(data) {
        // This would contain real-time charts and metrics
        // For now, just show a summary
        const container = document.getElementById('omnichannel-analytics');
        if (!container) return;

        const realtimeSection = document.createElement('div');
        realtimeSection.innerHTML = `
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(0,0,0,0.1);">
                <h4>Real-time Activity (Last Hour)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: #667eea;">${data.lastHour.totalOrders}</div>
                        <div style="color: #64748b;">Orders</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: #10b981;">₹${this.formatNumber(data.lastHour.totalRevenue)}</div>
                        <div style="color: #64748b;">Revenue</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: #f59e0b;">${data.activeChannels}</div>
                        <div style="color: #64748b;">Active Channels</div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(realtimeSection);
    }

    /**
     * Render insights
     */
    renderInsights(insights) {
        const container = document.getElementById('insights-container');
        if (!container) return;

        container.innerHTML = '';

        if (insights.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 40px; color: #64748b;">
                    <i class="fas fa-lightbulb" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No insights available</h3>
                    <p>Insights will appear here as the system gathers more data.</p>
                </div>
            `;
            return;
        }

        insights.forEach(insight => {
            const insightCard = this.createInsightCard(insight);
            container.appendChild(insightCard);
        });
    }

    /**
     * Create insight card
     */
    createInsightCard(insight) {
        const card = document.createElement('div');
        card.className = 'insight-card';

        const priorityColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#3b82f6'
        };

        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon" style="background: ${priorityColors[insight.priority] || '#667eea'}">
                    <i class="fas ${this.getInsightIcon(insight.type)}"></i>
                </div>
                <div class="insight-title">${insight.title}</div>
            </div>
            <div class="insight-message">${insight.message}</div>
            ${insight.actionable ? `<button class="insight-action">Take Action</button>` : ''}
        `;

        return card;
    }

    /**
     * Render alerts
     */
    renderAlerts(alerts) {
        // This is handled in the overview tab, but could be expanded
    }

    /**
     * Show tab content
     */
    showTab(tabName) {
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.style.display = 'none');

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => button.classList.remove('active'));

        // Show selected tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.style.display = 'block';
        }

        // Add active class to clicked button
        event.target.classList.add('active');

        this.currentTab = tabName;
        this.renderCurrentTab();
    }

    /**
     * Setup real-time updates
     */
    setupRealTimeUpdates() {
        // Update every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 30000);

        // Setup service event listeners for real-time updates
        this.setupServiceEventListeners();
    }

    /**
     * Setup event listeners for real-time updates from services
     */
    setupServiceEventListeners() {
        if (this.inventoryManager) {
            this.inventoryManager.on('stockChange', (data) => {
                this.handleRealtimeUpdate('inventory', data);
            });

            this.inventoryManager.on('lowStock', (data) => {
                this.handleRealtimeUpdate('alert', data);
            });
        }

        if (this.orderTracker) {
            this.orderTracker.on('orderUpdated', (data) => {
                this.handleRealtimeUpdate('order', data);
            });
        }
    }

    /**
     * Handle real-time updates
     */
    handleRealtimeUpdate(type, data) {
        switch (type) {
            case 'inventory':
                this.refreshInventoryData();
                break;
            case 'order':
                this.refreshOrdersData();
                break;
            case 'alert':
                this.refreshAlerts();
                break;
        }
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        if (!this.isInitialized) return;

        await this.loadDashboardData();
    }

    /**
     * Refresh specific data sections
     */
    async refreshInventoryData() {
        const data = await this.loadInventoryData();
        this.cache.inventory = data;
        if (this.currentTab === 'inventory') {
            this.renderInventoryTab();
        }
    }

    async refreshOrdersData() {
        const data = await this.loadOrdersData();
        this.cache.orders = data;
        if (this.currentTab === 'orders') {
            this.renderOrdersTab();
        }
    }

    async refreshAlerts() {
        // Refresh alerts across all relevant sections
        await this.refreshInventoryData();
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'block';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideLoading();

        // Create error element if it doesn't exist
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.style.cssText = `
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #dc2626;
                padding: 16px 24px;
                border-radius: 8px;
                margin: 30px;
                font-weight: 500;
            `;
            document.querySelector('.dashboard-content').prepend(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Export dashboard data
     */
    exportData(format = 'json') {
        const exportData = {
            overview: this.cache.overview,
            orders: this.cache.orders,
            inventory: this.cache.inventory,
            channels: this.cache.channels,
            insights: this.cache.insights,
            exportedAt: new Date(),
            format
        };

        if (format === 'csv') {
            // Convert to CSV format
            return this.convertToCSV(exportData);
        }

        // Download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operations-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Convert data to CSV format (simplified)
     */
    convertToCSV(data) {
        // This would be a more comprehensive CSV conversion
        // For now, just return JSON as CSV representation
        return 'CSV export functionality would be implemented here for: ' +
               Object.keys(data).join(', ');
    }

    /**
     * Utility functions
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    getChannelIcon(channelType) {
        const icons = {
            online: 'fa-desktop',
            mobile_app: 'fa-mobile-alt',
            in_store: 'fa-store',
            wholesale: 'fa-truck',
            marketplace: 'fa-shopping-bag',
            phone_order: 'fa-phone',
            social_commerce: 'fa-share-alt'
        };
        return icons[channelType] || 'fa-network-wired';
    }

    getInsightIcon(insightType) {
        const icons = {
            revenue: 'fa-rupee-sign',
            top_channel: 'fa-trophy',
            growth_opportunity: 'fa-chart-line',
            channel_balance: 'fa-balance-scale',
            inventory_alert: 'fa-exclamation-triangle',
            order_alert: 'fa-clipboard-list'
        };
        return icons[insightType] || 'fa-lightbulb';
    }

    getTopPerformingChannel(data) {
        if (!data?.channels) return null;

        const sorted = Object.values(data.channels)
            .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);

        return sorted[0]?.channelName || null;
    }

    /**
     * Cleanup when dashboard is destroyed
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Remove event listeners
        if (this.inventoryManager) {
            this.inventoryManager.off('stockChange');
            this.inventoryManager.off('lowStock');
        }

        if (this.orderTracker) {
            this.orderTracker.off('orderUpdated');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.operationsDashboard = new OperationsDashboard();
    window.operationsDashboard.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OperationsDashboard
    };
}
