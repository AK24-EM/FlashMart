/**
 * Business Dashboard JavaScript
 *
 * Handles the business metrics dashboard functionality including
 * data visualization, real-time updates, and user interactions.
 */

class BusinessDashboard {
    constructor() {
        this.businessMetricsService = null;
        this.charts = {};
        this.refreshInterval = null;
        this.isLoading = false;
    }

    updateActivityChart(data) {
        // Update activity chart with real-time data from Firebase
        const ctx = document.getElementById('activity-chart');
        if (ctx) {
            if (this.charts.activityChart) {
                this.charts.activityChart.destroy();
            }

            // Get recent orders data from Firebase (last 7 days)
            const last7Days = [];
            const now = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                // Filter orders for this day
                const dayOrders = data.recentOrders?.filter(order => {
                    const orderDate = order.createdAt;
                    return orderDate && orderDate >= dayStart && orderDate < dayEnd;
                }) || [];

                const orders = dayOrders.length;
                const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

                last7Days.push({
                    date: date.toISOString().split('T')[0],
                    orders: orders,
                    revenue: revenue
                });
            }

            // If no real data, show empty chart with message
            if (last7Days.every(day => day.orders === 0 && day.revenue === 0)) {
                this.charts.activityChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
                        datasets: [{
                            label: 'Orders',
                            data: last7Days.map(d => d.orders),
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: 'Revenue (₹)',
                            data: last7Days.map(d => d.revenue),
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(118, 75, 162, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1',
                            type: 'line'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Daily Activity (Last 7 Days) - No Data Available'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Orders'
                                }
                            },
                            y1: {
                                beginAtZero: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Revenue (₹)'
                                },
                                grid: {
                                    drawOnChartArea: false,
                                }
                            }
                        }
                    }
                });
            } else {
                this.charts.activityChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
                        datasets: [{
                            label: 'Orders',
                            data: last7Days.map(d => d.orders),
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: 'Revenue (₹)',
                            data: last7Days.map(d => d.revenue),
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(118, 75, 162, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1',
                            type: 'line'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Daily Activity (Last 7 Days)'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Orders'
                                }
                            },
                            y1: {
                                beginAtZero: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Revenue (₹)'
                                },
                                grid: {
                                    drawOnChartArea: false,
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    /**
     * Initialize the dashboard
     */
    async initialize() {
        console.log('📊 Initializing Business Dashboard...');

        try {
            // Show loading state
            this.showLoadingState();

            // Initialize Firebase first
            console.log('🔥 Initializing Firebase...');
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                console.log('✅ Firebase initialized');
            } else {
                console.error('❌ Firebase service not available');
                throw new Error('Firebase service not available');
            }

            // Wait a moment for Firebase to fully initialize
            console.log('⏳ Waiting for Firebase to initialize...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check Firebase database connection
            const db = firebaseService.db;
            console.log('🔍 Checking database connection...');
            console.log('🔍 Database instance:', !!db);
            if (!db) {
                console.error('❌ Firebase database not available');
                throw new Error('Firebase database not available');
            }

            console.log('✅ Database connection verified');

            await businessMetricsService.initialize(db);
            this.businessMetricsService = businessMetricsService;
            console.log('✅ Business Metrics Service initialized');

            // Load initial dashboard data
            await this.loadDashboardData();

            // Set up real-time updates
            this.setupRealTimeUpdates();

            // Set up event listeners
            this.setupEventListeners();

            console.log('✅ Business Dashboard initialized successfully');

        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showErrorMessage('Failed to initialize dashboard: ' + error.message);
        } finally {
            // Always hide loading state when initialization is complete
            this.hideLoadingState();
        }
    }

    /**
     * Load dashboard data with retry mechanism
     */
    async loadDashboardData() {
        if (this.isLoading) return;

        this.isLoading = true;

        const maxRetries = 2;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                console.log(`📊 Loading dashboard data... (attempt ${retryCount + 1}/${maxRetries + 1})`);
                console.log('🔍 Business metrics service available:', !!this.businessMetricsService);

                // Add timeout to prevent hanging (increased from 30s to 60s for better reliability)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Dashboard data loading timeout - please check Firebase connection and data size')), 60000)
                );

                console.log('⏱️ Starting dashboard data fetch with 60s timeout...');
                const startTime = Date.now();

                const dashboardData = await Promise.race([
                    this.businessMetricsService.getBusinessMetricsDashboard(),
                    timeoutPromise
                ]);

                const endTime = Date.now();
                console.log(`✅ Dashboard data loaded successfully in ${endTime - startTime}ms`);

                console.log('📊 Dashboard data received:', {
                    hasRevenue: !!dashboardData.revenue,
                    hasCustomers: !!dashboardData.customers,
                    hasNPS: !!dashboardData.nps,
                    hasRFM: !!dashboardData.rfm,
                    hasCustomerInsights: !!dashboardData.customerInsights,
                    revenueTotal: dashboardData.revenue?.totalRevenue,
                    customerCount: dashboardData.customers?.totalCustomers,
                    customerInsightsTiers: dashboardData.customerInsights?.tierDistribution,
                });

                // Update last updated timestamp
                this.updateLastUpdated(dashboardData.timestamp);

                // Update key metrics
                this.updateKeyMetrics(dashboardData);

                // Update charts and visualizations
                this.updateCharts(dashboardData);

                // Update mini charts for metrics
                this.updateMiniCharts();

                // Update detailed sections
                this.updateDetailedSections(dashboardData);

                console.log('✅ Dashboard data loaded successfully');
                break; // Success, exit retry loop

            } catch (error) {
                console.error(`❌ Error loading dashboard data (attempt ${retryCount + 1}):`, error);

                if (retryCount < maxRetries) {
                    console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    retryCount++;
                } else {
                    // All retries failed
                    // Provide more specific error messages based on error type
                    let errorMessage = 'Failed to load dashboard data: ' + error.message;
                    if (error.message.includes('timeout')) {
                        errorMessage += '\n\n💡 Troubleshooting tips:\n• Check Firebase connection\n• Verify data size (large datasets may need optimization)\n• Try refreshing the page\n• Check browser network tab for failed requests';
                    } else if (error.message.includes('network')) {
                        errorMessage += '\n\n💡 Network issues detected. Please check your internet connection and Firebase configuration.';
                    }

                    this.showErrorMessage(errorMessage);
                }
            } finally {
                this.isLoading = false;
            }
        }
    }

    /**
     * Format number with commas for better readability
     */
    formatNumber(num) {
        if (num === null || num === undefined || num === 0) return '0';
        return num.toLocaleString('en-IN');
    }

    /**
     * Update key metrics display
     */
    updateKeyMetrics(data) {
        console.log('📊 Updating key metrics display...');
        console.log('📊 Data received:', data);

        const { revenue, customers, nps, summary } = data;

        console.log('📊 Revenue data:', revenue);
        console.log('📊 Customer data:', customers);
        console.log('📊 NPS data:', nps);

        // Update revenue metrics
        const totalRevenueEl = document.getElementById('total-revenue');
        const monthlyRevenueEl = document.getElementById('monthly-revenue');
        const weeklyRevenueEl = document.getElementById('weekly-revenue');
        const avgOrderValueEl = document.getElementById('avg-order-value');
        const totalOrdersEl = document.getElementById('total-orders');

        console.log('📊 Revenue elements found:', {
            totalRevenue: !!totalRevenueEl,
            monthlyRevenue: !!monthlyRevenueEl,
            weeklyRevenue: !!weeklyRevenueEl,
            avgOrderValue: !!avgOrderValueEl,
            totalOrders: !!totalOrdersEl
        });

        if (totalRevenueEl) {
            totalRevenueEl.textContent = '₹' + this.formatNumber(revenue.totalRevenue);
            console.log('📊 Total revenue updated:', totalRevenueEl.textContent);
        }
        if (monthlyRevenueEl) {
            monthlyRevenueEl.textContent = '₹' + this.formatNumber(revenue.monthlyRevenue);
            console.log('📊 Monthly revenue updated:', monthlyRevenueEl.textContent);
        }
        if (weeklyRevenueEl) {
            weeklyRevenueEl.textContent = '₹' + this.formatNumber(revenue.weeklyRevenue);
            console.log('📊 Weekly revenue updated:', weeklyRevenueEl.textContent);
        }
        if (avgOrderValueEl) {
            avgOrderValueEl.textContent = '₹' + this.formatNumber(revenue.avgOrderValue);
            console.log('📊 Avg order value updated:', avgOrderValueEl.textContent);
        }
        if (totalOrdersEl) {
            totalOrdersEl.textContent = this.formatNumber(revenue.totalOrders);
            console.log('📊 Total orders updated:', totalOrdersEl.textContent);
        }

        // Update customer metrics
        const totalCustomersEl = document.getElementById('total-customers');
        const avgCLVEl = document.getElementById('avg-clv');

        console.log('📊 Customer elements found:', {
            totalCustomers: !!totalCustomersEl,
            avgCLV: !!avgCLVEl
        });

        if (totalCustomersEl) {
            totalCustomersEl.textContent = this.formatNumber(customers.totalCustomers);
            console.log('📊 Total customers updated:', totalCustomersEl.textContent);
        }
        if (avgCLVEl) {
            avgCLVEl.textContent = '₹' + this.formatNumber(customers.avgCLV);
            console.log('📊 Avg CLV updated:', avgCLVEl.textContent);
        }

        // Update NPS
        const npsScoreEl = document.getElementById('nps-score');
        console.log('📊 NPS element found:', !!npsScoreEl);

        if (npsScoreEl) {
            npsScoreEl.textContent = nps.npsScore;
            console.log('📊 NPS score updated:', npsScoreEl.textContent);
        }

        // Update change indicators
        this.updateChangeIndicators(revenue, customers, nps);

        // Show NPS prompt if user hasn't responded recently
        this.checkNPSPrompt();

        console.log('✅ Key metrics update completed');
    }

    /**
     * Update change indicators (growth/decline)
     */
    updateChangeIndicators(revenue, customers, nps) {
        // Revenue change
        const revenueChangeEl = document.getElementById('revenue-change');
        revenueChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${revenue.monthlyGrowth.toFixed(1)}% vs last month`;
        revenueChangeEl.className = revenue.monthlyGrowth >= 0 ? 'metric-change positive' : 'metric-change negative';

        // Customer change
        const customersChangeEl = document.getElementById('customers-change');
        customersChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${customers.customerGrowthRate.toFixed(1)}% growth`;
        customersChangeEl.className = customers.customerGrowthRate >= 0 ? 'metric-change positive' : 'metric-change negative';

        // CLV change (simplified - compare with previous calculation)
        const clvChangeEl = document.getElementById('clv-change');
        clvChangeEl.innerHTML = `<i class="fas fa-chart-line"></i> Calculated from orders`;
        clvChangeEl.className = 'metric-change neutral';

        // NPS change
        const npsChangeEl = document.getElementById('nps-change');
        const trendIcon = nps.trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const trendClass = nps.trend >= 0 ? 'positive' : 'negative';
        npsChangeEl.innerHTML = `<i class="fas ${trendIcon}"></i> ${Math.abs(nps.trend).toFixed(1)}% trend`;
        npsChangeEl.className = `metric-change ${trendClass}`;
    }

    /**
     * Update charts and visualizations
     */
    updateCharts(data) {
        // Update RFM segments
        this.updateRFMSegments(data.rfm);

        // Update CLV chart
        this.updateCLVChart(data);

        // Update NPS gauge
        this.updateNPSGauge(data.nps);

        // Update activity chart
        this.updateActivityChart(data);
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // Create or update error notification
        let errorDiv = document.getElementById('dashboard-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'dashboard-error';
            errorDiv.className = 'error-notification';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #e74c3c;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                max-width: 400px;
                word-wrap: break-word;
            `;
            document.body.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Update last updated timestamp
     */
    updateLastUpdated(timestamp) {
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            const date = new Date(timestamp);
            lastUpdatedEl.textContent = `Last updated: ${date.toLocaleString()}`;
        }
    }

    /**
     * Set up real-time updates
     */
    setupRealTimeUpdates() {
        // Set up periodic refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadDashboardData();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Hide error message
     */
    hideErrorMessage() {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorEl = document.getElementById('error-message');
        const errorTextEl = document.querySelector('.error-text');

        if (errorEl && errorTextEl) {
            errorTextEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Set up enhanced event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                if (!this.isLoading) {
                    this.loadDashboardData();
                }
            });
        }

        // Export buttons
        const exportButtons = document.querySelectorAll('[data-export]');
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const exportType = e.target.getAttribute('data-export');
                this.exportData(exportType);
            });
        });

        // View toggle buttons
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.toggleView(view);
            });
        });

        // Error close button
        const errorCloseBtn = document.querySelector('.error-close');
        if (errorCloseBtn) {
            errorCloseBtn.addEventListener('click', () => {
                this.hideErrorMessage();
            });
        }
    }

    /**
     * Toggle between dashboard views
     */
    toggleView(view) {
        // Update toggle button states
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-view="${view}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Show/hide sections based on view
        if (view === 'overview') {
            // Show key metrics and main charts
            const keyMetrics = document.getElementById('key-metrics');
            if (keyMetrics) keyMetrics.style.display = 'grid';
        } else if (view === 'detailed') {
            // Could implement detailed view logic here
            console.log('Detailed view selected');
        }
    }

    /**
     * Update RFM segments visualization
     */
    updateRFMSegments(rfmData) {
        console.log('📊 Updating RFM segments with data:', rfmData);

        // Update RFM segment counts if elements exist
        if (rfmData && rfmData.segments) {
            console.log('📊 RFM segments data:', rfmData.segments);

            Object.keys(rfmData.segments).forEach(segment => {
                const element = document.getElementById(`rfm-${segment}`);
                if (element) {
                    element.textContent = rfmData.segments[segment].length || 0;
                    console.log(`📊 Updated RFM segment ${segment}:`, element.textContent);
                } else {
                    console.warn(`📊 RFM element not found: rfm-${segment}`);
                }
            });
        } else {
            console.warn('📊 No RFM segments data available');
        }
    }

    /**
     * Update CLV chart
     */
    updateCLVChart(data) {
        console.log('📊 Updating CLV chart with data:', data);

        // Update CLV distribution chart with user tier data from Firebase
        const ctx = document.getElementById('clv-chart');
        if (ctx && data && data.customerInsights && data.customerInsights.tierDistribution) {
            console.log('📊 CLV chart canvas found, processing tier data...');
            if (this.charts.clvChart) {
                this.charts.clvChart.destroy();
            }

            const tierDistribution = data.customerInsights.tierDistribution;
            console.log('📊 Tier distribution for CLV chart:', tierDistribution);

            // Create tier ranges based on actual tier data
            const tierRanges = [
                { tier: 'Gold', count: tierDistribution.gold || 0, color: '#ffd700', description: 'Premium customers' },
                { tier: 'Silver', count: tierDistribution.silver || 0, color: '#c0c0c0', description: 'Valued customers' },
                { tier: 'Bronze', count: tierDistribution.bronze || 0, color: '#cd7f32', description: 'Regular customers' }
            ];

            console.log('📊 Tier ranges calculated:', tierRanges);

            // Filter out empty tiers
            const nonEmptyTiers = tierRanges.filter(tier => tier.count > 0);
            console.log('📊 Non-empty tiers:', nonEmptyTiers);

            if (nonEmptyTiers.length === 0) {
                // Show empty chart if no data
                this.charts.clvChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['No Data'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#ecf0f1']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: 'Customer Tier Distribution - No Data Available'
                            }
                        }
                    }
                });
            } else {
                this.charts.clvChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: nonEmptyTiers.map(t => `${t.tier} Tier (${t.count} customers)`),
                        datasets: [{
                            data: nonEmptyTiers.map(t => t.count),
                            backgroundColor: nonEmptyTiers.map(t => t.color),
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12,
                                        weight: '600'
                                    }
                                }
                            },
                            title: {
                                display: true,
                                text: 'Customer Tier Distribution Analysis',
                                font: {
                                    size: 16,
                                    weight: '700'
                                },
                                padding: 20
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const tier = nonEmptyTiers[context.dataIndex];
                                        return `${tier.tier} Tier: ${context.parsed} customers (${tier.description})`;
                                    }
                                }
                            }
                        },
                        cutout: '60%'
                    }
                });
            }
        } else {
            console.warn('📊 CLV chart update skipped - missing canvas, data, or tier data');
            console.log('📊 Available data check:', {
                hasCanvas: !!ctx,
                hasData: !!data,
                hasCustomerInsights: !!(data && data.customerInsights),
                hasTierDistribution: !!(data && data.customerInsights && data.customerInsights.tierDistribution)
            });
        }
    }

    /**
     * Update activity chart (revenue trends)
     */
    async updateActivityChart(data) {
        console.log('📊 Updating activity chart with data:', data);

        // Update activity/revenue trend chart
        const ctx = document.getElementById('activity-chart');
        if (ctx && data && data.revenue) {
            console.log('📊 Activity chart canvas found, processing revenue data...');
            if (this.charts.activityChart) {
                this.charts.activityChart.destroy();
            }

            // Get real daily activity data from Firebase
            const revenue = data.revenue;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            // Check if we have real daily data or need to generate demo data
            let trendData, isDemoData = false;

            if (revenue && revenue.dailyData && revenue.dailyData.length === 7) {
                // Use real daily data from Firebase
                trendData = revenue.dailyData.map(day => day.revenue || 0);
                isDemoData = false;
                console.log('📊 Using real Firebase daily data:', trendData);
            } else if (revenue && revenue.totalRevenue > 0) {
                // Generate demo data based on total revenue for visualization
                const baseDailyRevenue = Math.round(revenue.totalRevenue / 7);
                trendData = days.map((day, index) => {
                    // Add some variation (±20%) and weekend effect
                    const variation = (Math.random() - 0.5) * 0.4;
                    const weekendMultiplier = (index >= 5) ? 0.7 : 1; // Lower on weekends
                    return Math.round(baseDailyRevenue * (1 + variation) * weekendMultiplier);
                });
                isDemoData = true;
                console.log('📊 Using demo data pattern for visualization');
            } else {
                // Fallback: Generate completely sample data
                trendData = [45000, 52000, 48000, 61000, 55000, 38000, 42000];
                isDemoData = true;
                console.log('📊 Using fallback sample data');
            }

            this.charts.activityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Daily Revenue (₹)',
                        data: trendData,
                        borderColor: '#146eb4',
                        backgroundColor: 'rgba(20, 110, 180, 0.1)',
                        borderWidth: 4,
                        pointBackgroundColor: '#146eb4',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 7,
                        pointHoverRadius: 10,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 13,
                                    weight: '600',
                                    family: "'Amazon Ember', sans-serif"
                                },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        title: {
                            display: true,
                            text: `📈 Daily Activity Trend Analysis ${isDemoData ? '(Demo Data)' : '(Live Data)'}`,
                            font: {
                                size: 18,
                                weight: '700',
                                family: "'Amazon Ember', sans-serif"
                            },
                            padding: 25,
                            color: '#0f1111'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(15, 17, 17, 0.9)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#146eb4',
                            borderWidth: 2,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    return `Day: ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `💰 Revenue: ₹${context.parsed.y.toLocaleString()}`;
                                },
                                footer: function(context) {
                                    const value = context[0].parsed.y;
                                    const avg = trendData.reduce((a, b) => a + b, 0) / trendData.length;
                                    const change = ((value - avg) / avg * 100).toFixed(1);
                                    return `📊 ${change > 0 ? '+' : ''}${change}% from daily average`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '500',
                                    family: "'Amazon Ember', sans-serif"
                                },
                                color: '#565959'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.08)',
                                lineWidth: 1
                            },
                            ticks: {
                                font: {
                                    size: 11,
                                    weight: '500',
                                    family: "'Amazon Ember', sans-serif"
                                },
                                color: '#565959',
                                callback: function(value) {
                                    if (value >= 1000) {
                                        return '₹' + (value / 1000).toFixed(1) + 'k';
                                    }
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    },
                    elements: {
                        point: {
                            hoverBorderWidth: 4
                        }
                    }
                }
            });
        } else {
            console.warn('📊 Activity chart update skipped - missing canvas or revenue data');
        }
    }

    /**
     * Update NPS gauge
     */
    updateNPSGauge(npsData) {
        console.log('📊 Updating NPS gauge with data:', npsData);

        const npsScoreEl = document.getElementById('nps-score');
        const npsGaugeFillEl = document.getElementById('nps-gauge-fill');
        const npsGaugeTextEl = document.getElementById('nps-gauge-text');

        if (npsScoreEl && npsData) {
            const score = parseInt(npsData.npsScore);
            npsScoreEl.textContent = score;

            // Update visual gauge
            if (npsGaugeFillEl && npsGaugeTextEl) {
                let color = '#e74c3c'; // Red for low scores
                if (score >= 50) color = '#27ae60'; // Green for high scores
                else if (score >= 0) color = '#f39c12'; // Orange for medium scores

                npsGaugeFillEl.style.background = `linear-gradient(90deg, ${color}, ${color}dd)`;
                npsGaugeFillEl.style.width = `${Math.max(0, Math.min(100, score))}%`;
                npsGaugeTextEl.textContent = score;
            }
        }
    }

    /**
     * Update mini charts for metrics
     */
    updateMiniCharts() {
        // Create mini trend charts for each metric card
        const metrics = [
            { id: 'revenue-mini-chart', data: [65, 78, 66, 89, 75, 95, 87] },
            { id: 'customers-mini-chart', data: [45, 52, 48, 61, 55, 67, 73] },
            { id: 'clv-mini-chart', data: [1200, 1350, 1180, 1420, 1380, 1550, 1480] }
        ];

        metrics.forEach(metric => {
            const canvas = document.getElementById(metric.id);
            if (canvas && this.charts[metric.id]) {
                this.charts[metric.id].destroy();
            }

            if (canvas) {
                this.charts[metric.id] = new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: ['', '', '', '', '', '', ''],
                        datasets: [{
                            data: metric.data,
                            borderColor: '#146eb4',
                            backgroundColor: 'rgba(20, 110, 180, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: false
                            }
                        },
                        scales: {
                            x: {
                                display: false
                            },
                            y: {
                                display: false
                            }
                        },
                        elements: {
                            point: {
                                radius: 0
                            }
                        }
                    }
                });
            }
        });
    }

    /**
     * Update detailed sections
     */
    updateDetailedSections(data) {
        // Update recent orders section
        this.updateRecentOrders(data.recentOrders);

        // Update top products section
        this.updateTopProducts(data.topProducts);

        // Update customer insights
        this.updateCustomerInsights(data.customerInsights);
    }

    /**
     * Check if NPS prompt should be shown
     */
    checkNPSPrompt() {
        // Check if user has responded to NPS survey recently
        const lastNPSResponse = localStorage.getItem('lastNPSResponse');
        const now = new Date().getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

        if (!lastNPSResponse || (now - parseInt(lastNPSResponse)) > oneWeek) {
            // Show NPS prompt after a delay
            setTimeout(() => {
                this.showNPSPrompt();
            }, 10000); // Show after 10 seconds
        }
    }

    /**
     * Show NPS survey prompt
     */
    showNPSPrompt() {
        // Implementation for NPS survey modal
        const npsModal = document.getElementById('nps-survey-modal');
        if (npsModal) {
            npsModal.style.display = 'block';
        }
    }

    /**
     * Export dashboard data
     */
    exportData(type) {
        // Handle data export functionality
        console.log(`Exporting ${type} data...`);

        // This would implement actual export functionality
        // For now, just show a placeholder message
        this.showErrorMessage(`${type} export feature coming soon!`);
    }

    /**
     * Update recent orders section
     */
    updateRecentOrders(orders) {
        const ordersListEl = document.getElementById('recent-orders-list');
        if (ordersListEl && orders) {
            if (orders.length === 0) {
                ordersListEl.innerHTML = '<p class="no-data">No recent orders found</p>';
                return;
            }

            const ordersHTML = orders.slice(0, 5).map(order => {
                const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A';
                const total = order.total ? `₹${this.formatNumber(order.total)}` : 'N/A';

                return `
                    <div class="order-item">
                        <div class="order-header">
                            <span class="order-id">Order #${order.id?.slice(-8) || 'N/A'}</span>
                            <span class="order-date">${orderDate}</span>
                        </div>
                        <div class="order-details">
                            <span class="order-total">${total}</span>
                            <span class="order-status ${order.status || 'completed'}">${order.status || 'Completed'}</span>
                        </div>
                    </div>
                `;
            }).join('');

            ordersListEl.innerHTML = ordersHTML || '<p class="no-data">No recent orders available</p>';
        }
    }

    /**
     * Update top products section
     */
    updateTopProducts(products) {
        const productsListEl = document.getElementById('top-products-list');
        if (productsListEl && products) {
            if (products.length === 0) {
                productsListEl.innerHTML = '<p class="no-data">No products data found</p>';
                return;
            }

            const productsHTML = products.slice(0, 5).map(product => {
                const price = product.price ? `₹${this.formatNumber(product.price)}` : 'N/A';
                const sales = product.sales ? `${product.sales} sold` : '0 sold';

                return `
                    <div class="order-item">
                        <div class="order-header">
                            <span class="order-id">${product.name || product.title || 'Unknown Product'}</span>
                            <span class="order-date">${sales}</span>
                        </div>
                        <div class="order-details">
                            <span class="order-total">${price}</span>
                            <span class="order-status ${product.category || 'general'}">${product.category || 'General'}</span>
                        </div>
                    </div>
                `;
            }).join('');

            productsListEl.innerHTML = productsHTML || '<p class="no-data">No top products available</p>';
        }
    }

    /**
     * Update customer insights section
     */
    updateCustomerInsights(insights) {
        const insightsEl = document.getElementById('customer-insights');
        if (insightsEl && insights) {
            const { tierDistribution, avgOrdersPerCustomer, totalUsers, totalOrders } = insights;

            const insightsHTML = `
                <div class="insights-grid">
                    <div class="insight-card">
                        <h4>Total Customers</h4>
                        <p class="insight-value">${this.formatNumber(totalUsers || 0)}</p>
                    </div>
                    <div class="insight-card">
                        <h4>Total Orders</h4>
                        <p class="insight-value">${this.formatNumber(totalOrders || 0)}</p>
                    </div>
                    <div class="insight-card">
                        <h4>Avg Orders/Customer</h4>
                        <p class="insight-value">${avgOrdersPerCustomer ? avgOrdersPerCustomer.toFixed(1) : '0.0'}</p>
                    </div>
                    <div class="insight-card">
                        <h4>Tier Distribution</h4>
                        <div class="tier-breakdown">
                            <div class="tier-item">
                                <span class="tier-color bronze"></span>
                                <span>Bronze: ${tierDistribution?.bronze || 0}</span>
                            </div>
                            <div class="tier-item">
                                <span class="tier-color silver"></span>
                                <span>Silver: ${tierDistribution?.silver || 0}</span>
                            </div>
                            <div class="tier-item">
                                <span class="tier-color gold"></span>
                                <span>Gold: ${tierDistribution?.gold || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            insightsEl.innerHTML = insightsHTML;
        }
    }

    /**
     * Close modal helper
     */
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        // Show loading spinner
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }

        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-state');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Update refresh button to show loading state
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.disabled = true;
            refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        }

        // Update loading refresh button
        const loadingRefreshBtn = document.querySelector('.loading-refresh-btn');
        if (loadingRefreshBtn) {
            loadingRefreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loadingRefreshBtn.disabled = true;
        }

        this.isLoading = true;
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Hide loading spinner
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-state');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Re-enable refresh button
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }

        // Reset loading refresh button
        const loadingRefreshBtn = document.querySelector('.loading-refresh-btn');
        if (loadingRefreshBtn) {
            loadingRefreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Now';
            loadingRefreshBtn.disabled = false;
        }

        this.isLoading = false;
    }
}

// Global functions for HTML onclick handlers
window.refreshDashboard = function() {
    if (window.businessDashboard && !window.businessDashboard.isLoading) {
        window.businessDashboard.loadDashboardData();
    }
};

window.exportReport = function(format) {
    if (window.businessDashboard && window.businessDashboard.businessMetricsService) {
        window.businessDashboard.businessMetricsService.exportBusinessReport(format)
            .then(data => {
                if (format === 'csv') {
                    // Download CSV
                    const blob = new Blob([data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `business-report-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    // Show JSON data
                    console.log('Business Report JSON:', data);
                    alert('Report data logged to console. Check browser console for details.');
                }
            })
            .catch(error => {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            });
    }
};

window.showNPSSurvey = function() {
    if (window.businessDashboard) {
        window.businessDashboard.showNPSPrompt();
    }
};

window.submitNPSResponse = function() {
    // Handle NPS survey submission
    const score = document.querySelector('input[name="nps-score"]:checked');
    const comments = document.getElementById('nps-comments').value;

    if (score) {
        console.log('NPS Response:', {
            score: score.value,
            comments: comments,
            timestamp: new Date()
        });

        // Save to localStorage to avoid showing prompt again soon
        localStorage.setItem('lastNPSResponse', Date.now().toString());

        // Close modal
        window.closeModal('nps-modal');

        alert('Thank you for your feedback!');
    } else {
        alert('Please select a score before submitting.');
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new BusinessDashboard();
    dashboard.initialize();

    // Make dashboard globally available for debugging
    window.businessDashboard = dashboard;
});
