// /**
//  * Business Dashboard JavaScript
//  *
//  * Handles the business metrics dashboard functionality including
//  * data visualization, real-time updates, and user interactions.
//  */

// class BusinessDashboard {
//     constructor() {
//         this.businessMetricsService = null;
//         this.charts = {};
//         this.refreshInterval = null;
//         this.isLoading = false;
//     }

//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Initialize the dashboard
//      */
//     async initialize() {
//         console.log('📊 Initializing Business Dashboard...');

//         try {
//             // Show loading state
//             this.showLoadingState();

//             // Initialize Firebase first
//             if (typeof firebaseService !== 'undefined') {
//                 await firebaseService.initialize();
//                 console.log('✅ Firebase initialized');
//             }
//                 throw new Error('Firebase service not available');

//             // Wait a moment for Firebase to fully initialize
//             await new Promise(resolve => setTimeout(resolve, 500));

//             // Initialize business metrics service
//             const db = firebaseService.db;
//             if (!db) {
//                 throw new Error('Firebase database not available');

//             await businessMetricsService.initialize(db);
//             this.businessMetricsService = businessMetricsService;
//             console.log('✅ Business Metrics Service initialized');

//             // Load initial dashboard data
//             await this.loadDashboardData();

//             // Set up real-time updates
//             this.setupRealTimeUpdates();

//             // Set up event listeners
//             this.setupEventListeners();

//             // Hide loading state
//             this.hideLoadingState();

//             console.log('✅ Business Dashboard initialized successfully');

//         } catch (error) {
//             console.error('❌ Dashboard initialization failed:', error);
//             this.showErrorMessage('Failed to initialize dashboard: ' + error.message);
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Load dashboard data
//      */
//     async loadDashboardData() {
//         if (this.isLoading) return;

//         this.isLoading = true;
//         this.showLoadingState();

//         try {
//             console.log('📊 Loading dashboard data...');
//             const dashboardData = await this.businessMetricsService.getBusinessMetricsDashboard();

//             // Update last updated timestamp
//             this.updateLastUpdated(dashboardData.timestamp);

//             // Update key metrics
//             this.updateKeyMetrics(dashboardData);

//             // Update charts and visualizations
//             this.updateCharts(dashboardData);

//             // Update detailed sections
//             this.updateDetailedSections(dashboardData);

//             console.log('✅ Dashboard data loaded successfully');

//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } catch (error) {
//             console.error('❌ Error loading dashboard data:', error);
//             this.showErrorMessage('Failed to load dashboard data: ' + error.message);
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } finally {
//             this.isLoading = false;
//             this.hideLoadingState();
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update key metrics display
//      */
//     updateKeyMetrics(data) {
//         const { revenue, customers, nps, summary } = data;

//         // Update revenue metrics
//         document.getElementById('total-revenue').textContent = '₹' + this.formatNumber(revenue.totalRevenue);
//         document.getElementById('monthly-revenue').textContent = '₹' + this.formatNumber(revenue.monthlyRevenue);
//         document.getElementById('weekly-revenue').textContent = '₹' + this.formatNumber(revenue.weeklyRevenue);
//         document.getElementById('avg-order-value').textContent = '₹' + this.formatNumber(revenue.avgOrderValue);
//         document.getElementById('total-orders').textContent = this.formatNumber(revenue.totalOrders);

//         // Update customer metrics
//         document.getElementById('total-customers').textContent = this.formatNumber(customers.totalCustomers);
//         document.getElementById('avg-clv').textContent = '₹' + this.formatNumber(customers.avgCLV);

//         // Update NPS
//         document.getElementById('nps-score').textContent = nps.npsScore;

//         // Update change indicators
//         this.updateChangeIndicators(revenue, customers, nps);

//         // Show NPS prompt if user hasn't responded recently
//         this.checkNPSPrompt();
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update change indicators (growth/decline)
//      */
//     updateChangeIndicators(revenue, customers, nps) {
//         // Revenue change
//         const revenueChangeEl = document.getElementById('revenue-change');
//         revenueChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${revenue.monthlyGrowth.toFixed(1)}% vs last month`;
//         revenueChangeEl.className = revenue.monthlyGrowth >= 0 ? 'metric-change positive' : 'metric-change negative';

//         // Customer change
//         const customersChangeEl = document.getElementById('customers-change');
//         customersChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${customers.customerGrowthRate.toFixed(1)}% growth`;
//         customersChangeEl.className = customers.customerGrowthRate >= 0 ? 'metric-change positive' : 'metric-change negative';

//         // CLV change (simplified - compare with previous calculation)
//         const clvChangeEl = document.getElementById('clv-change');
//         clvChangeEl.innerHTML = `<i class="fas fa-chart-line"></i> Calculated from orders`;
//         clvChangeEl.className = 'metric-change neutral';

//         // NPS change
//         const npsChangeEl = document.getElementById('nps-change');
//         const trendIcon = nps.trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
//         const trendClass = nps.trend >= 0 ? 'positive' : 'negative';
//         npsChangeEl.innerHTML = `<i class="fas ${trendIcon}"></i> ${Math.abs(nps.trend).toFixed(1)}% trend`;
//         npsChangeEl.className = `metric-change ${trendClass}`;
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update charts and visualizations
//      */
//     updateCharts(data) {
//         // Update RFM segments
//         this.updateRFMSegments(data.rfm);

//         // Update CLV chart
//         this.updateCLVChart(data.customers);

//         // Update NPS gauge
//         this.updateNPSGauge(data.nps);

//         // Update activity chart
//         this.updateActivityChart(data);
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update RFM segments display
//      */
//     updateRFMSegments(rfmData) {
//         const segmentsGrid = document.getElementById('rfm-segments');
//         segmentsGrid.innerHTML = '';

//         const segments = [
//             { key: 'champions', label: 'Champions', icon: '👑' },
//             { key: 'loyalCustomers', label: 'Loyal Customers', icon: '💝' },
//             { key: 'potentialLoyalists', label: 'Potential Loyalists', icon: '🌟' },
//             { key: 'cantLoseThem', label: "Can't Lose Them", icon: '🚨' },
//             { key: 'atRisk', label: 'At Risk', icon: '⚠️' },
//             { key: 'newCustomers', label: 'New Customers', icon: '🆕' },
//             { key: 'others', label: 'Others', icon: '📊' }
//         ];

//         segments.forEach(segment => {
//             const count = rfmData.segments[segment.key].length;
//             const percentage = rfmData.segmentDistribution[segment.label] || 0;

//             const segmentCard = document.createElement('div');
//             segmentCard.className = `segment-card ${segment.key.replace('Customers', '').toLowerCase()}`;
//             segmentCard.innerHTML = `
//                 <div class="segment-name">${segment.icon} ${segment.label}</div>
//                 <div class="segment-count">${count}</div>
//                 <div class="segment-percentage">${percentage.toFixed(1)}%</div>
//             `;

//             segmentsGrid.appendChild(segmentCard);
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update CLV chart and top customers list
//      */
//     updateCLVChart(customersData) {
//         // Update top customers list
//         const topCustomersList = document.getElementById('top-clv-customers');
//         topCustomersList.innerHTML = '';

//         customersData.topCustomers.slice(0, 10).forEach(customer => {
//             const customerItem = document.createElement('div');
//             customerItem.className = 'clv-item';
//             customerItem.innerHTML = `
//                 <div class="clv-customer">${customer.name}</div>
//                 <div class="clv-value">₹${this.formatNumber(customer.clv)}</div>
//             `;
//             topCustomersList.appendChild(customerItem);
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });

//         // Update CLV distribution chart
//         const ctx = document.getElementById('clv-chart');
//         if (ctx) {
//             if (this.charts.clvChart) {
//                 this.charts.clvChart.destroy();
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//             const tierData = ['Bronze', 'Silver', 'Gold'].map(tier => {
//                 const tierCustomers = customersData.topCustomers.filter(c => c.tier === tier.toLowerCase());
//                 return tierCustomers.length;
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });

//             this.charts.clvChart = new Chart(ctx, {
//                 type: 'doughnut',
//                 data: {
//                     labels: ['Bronze', 'Silver', 'Gold'],
//                     datasets: [{
//                         data: tierData,
//                         backgroundColor: ['#CD7F32', '#C0C0C0', '#FFD700'],
//                         borderWidth: 0
//                     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }]
//                 updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'bottom'
//                         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     },
//                         title: {
//                             display: true,
//                             text: 'Customer Tier Distribution'
//                         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//                     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//                 updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update NPS gauge visualization
//      */
//     updateNPSGauge(npsData) {
//         // Update gauge value
//         document.getElementById('nps-gauge-value').textContent = npsData.npsScore;

//         // Update breakdown numbers
//         document.getElementById('nps-promoters').textContent = npsData.promoters;
//         document.getElementById('nps-passives').textContent = npsData.passives;
//         document.getElementById('nps-detractors').textContent = npsData.detractors;

//         // Update gauge colors based on score
//         const gaugeMeter = document.querySelector('.nps-gauge-meter');
//         const score = npsData.npsScore;

//         let color;
//         if (score >= 50) color = '#28a745'; // Green
//         else if (score >= 0) color = '#ffc107'; // Yellow
//         else color = '#dc3545'; // Red

//         gaugeMeter.style.background = `conic-gradient(from 180deg, ${color} 0deg 180deg)`;
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update detailed sections
//      */
//     updateDetailedSections(data) {
//         // Update product metrics
//         const { products } = data;
//         document.getElementById('total-products').textContent = products.totalProducts;
//         document.getElementById('out-of-stock').textContent = products.outOfStockProducts;
//         document.getElementById('low-stock').textContent = products.lowStockProducts;
//         document.getElementById('avg-price').textContent = '₹' + this.formatNumber(products.avgProductPrice);

//         // Update top products list
//         this.updateTopProductsList(products.topProducts);
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update top products list
//      */
//     updateTopProductsList(topProducts) {
//         const topProductsList = document.getElementById('top-products-list');
//         topProductsList.innerHTML = '';

//         if (topProducts.length === 0) {
//             topProductsList.innerHTML = '<p>No product data available</p>';
//             return;
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//         topProducts.forEach(product => {
//             const productItem = document.createElement('div');
//             productItem.className = 'clv-item';
//             productItem.innerHTML = `
//                 <div>
//                     <div class="clv-customer">${product.name}</div>
//                     <div style="font-size: 0.8rem; color: #6c757d;">${product.sales} sales</div>
//                 </div>
//                 <div class="clv-value">₹${this.formatNumber(product.revenue)}</div>
//             `;
//             topProductsList.appendChild(productItem);
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Set up real-time updates
//      */
//     setupRealTimeUpdates() {
//         // Listen for business metrics updates
//         window.addEventListener('businessMetricsUpdated', (event) => {
//             const data = event.detail;
//             this.updateLastUpdated(new Date());
//             this.updateKeyMetrics(data);
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });

//         // Set up periodic refresh (every 5 minutes)
//         this.refreshInterval = setInterval(() => {
//             this.loadDashboardData();
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }, 5 * 60 * 1000);

//         console.log('✅ Real-time updates setup completed');
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Set up event listeners
//      */
//     setupEventListeners() {
//         // NPS survey functionality
//         this.setupNPSSurvey();

//         // Export functionality
//         window.exportReport = (format) => this.exportReport(format);

//         // Refresh functionality
//         window.refreshDashboard = () => this.loadDashboardData();
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Set up NPS survey functionality
//      */
//     setupNPSSurvey() {
//         // Generate NPS buttons
//         const npsButtonsContainer = document.querySelector('.nps-buttons');
//         if (npsButtonsContainer) {
//             npsButtonsContainer.innerHTML = '';

//             for (let i = 0; i <= 10; i++) {
//                 const button = document.createElement('button');
//                 button.className = 'nps-button';
//                 button.textContent = i;
//                 button.onclick = () => this.selectNPSScore(i);
//                 npsButtonsContainer.appendChild(button);
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//         // Set up NPS form submission
//         window.submitNPSResponse = () => this.submitNPSResponse();
//         window.showNPSSurvey = () => this.showNPSSurvey();
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Handle NPS score selection
//      */
//     selectNPSScore(score) {
//         // Update button states
//         document.querySelectorAll('.nps-button').forEach(btn => {
//             btn.classList.remove('selected');
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });
//         event.target.classList.add('selected');

//         // Show feedback form
//         document.getElementById('nps-feedback').style.display = 'block';

//         // Store selected score
//         window.selectedNPSScore = score;
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Show NPS survey modal
//      */
//     showNPSSurvey() {
//         const modal = document.getElementById('nps-modal');
//         if (modal) {
//             modal.style.display = 'block';

//             // Reset form
//             document.querySelectorAll('.nps-button').forEach(btn => {
//                 btn.classList.remove('selected');
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     });
//             document.getElementById('nps-feedback').style.display = 'none';
//             document.getElementById('nps-comments').value = '';

//             delete window.selectedNPSScore;
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Submit NPS response
//      */
//     async submitNPSResponse() {
//         if (!window.selectedNPSScore) {
//             alert('Please select a score first');
//             return;
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//         const comments = document.getElementById('nps-comments').value;

//         try {
//             await this.businessMetricsService.submitNPSResponse(
//                 firebaseService.currentUser?.uid || 'anonymous',
//                 window.selectedNPSScore,
//                 comments
//             );

//             // Close modal and show success message
//             this.closeModal('nps-modal');
//             showNotification('Thank you for your feedback!', 'success');

//             // Hide NPS prompt for a while
//             this.hideNPSPrompt();

//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } catch (error) {
//             console.error('❌ Error submitting NPS response:', error);
//             showNotification('Failed to submit feedback. Please try again.', 'error');
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Check if we should show NPS prompt
//      */
//     checkNPSPrompt() {
//         // Check if user has responded recently (within last 30 days)
//         const lastResponse = localStorage.getItem('nps_last_response');
//         const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

//         if (!lastResponse || parseInt(lastResponse) < thirtyDaysAgo) {
//             document.getElementById('nps-prompt').style.display = 'block';
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } else {
//             document.getElementById('nps-prompt').style.display = 'none';
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Hide NPS prompt after response
//      */
//     hideNPSPrompt() {
//         localStorage.setItem('nps_last_response', Date.now().toString());
//         document.getElementById('nps-prompt').style.display = 'none';
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Export dashboard report
//      */
//     async exportReport(format) {
//         try {
//             const data = await this.businessMetricsService.exportBusinessReport(format);

//             if (format === 'json') {
//                 this.downloadFile(JSON.stringify(data, null, 2), 'business-metrics-report.json', 'application/json');
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } else if (format === 'csv') {
//                 this.downloadFile(data, 'business-metrics-report.csv', 'text/csv');
//             updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//             showNotification(`Report exported successfully!`, 'success');
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } catch (error) {
//             console.error('❌ Error exporting report:', error);
//             showNotification('Failed to export report. Please try again.', 'error');
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Download file helper
//      */
//     downloadFile(content, filename, contentType) {
//         const blob = new Blob([content], { type: contentType });
//         const url = window.URL.createObjectURL(blob);

//         const link = document.createElement('a');
//         link.href = url;
//         link.download = filename;
//         link.click();

//         window.URL.revokeObjectURL(url);
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Update last updated timestamp
//      */
//     updateLastUpdated(timestamp) {
//         const lastUpdatedEl = document.getElementById('last-updated');
//         if (lastUpdatedEl) {
//             lastUpdatedEl.textContent = `Last updated: ${new Date(timestamp).toLocaleString()}`;
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Show loading state
//      */
//     showLoadingState() {
//         document.getElementById('loading-state').style.display = 'block';
//         document.getElementById('key-metrics').style.display = 'none';
//         document.getElementById('error-message').style.display = 'none';
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Hide loading state
//      */
//     hideLoadingState() {
//         document.getElementById('loading-state').style.display = 'none';
//         document.getElementById('key-metrics').style.display = 'grid';
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Show error message
//      */
//     showErrorMessage(message) {
//         const errorEl = document.getElementById('error-message');
//         errorEl.textContent = message;
//         errorEl.style.display = 'block';
//         document.getElementById('loading-state').style.display = 'none';
//         document.getElementById('key-metrics').style.display = 'none';
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Format number for display
//      */
//     formatNumber(num) {
//         if (num >= 1000000) {
//             return (num / 1000000).toFixed(1) + 'M';
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } else if (num >= 1000) {
//             return (num / 1000).toFixed(1) + 'K';
//         updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
//         return Math.round(num).toString();
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }

//     /**
//      * Close modal helper
//      */
//     closeModal(modalId) {
//         document.getElementById(modalId).style.display = 'none';
//     updateActivityChart(data) {
//         // Update activity chart with real-time data
//         const ctx = document.getElementById('activity-chart');
//         if (ctx) {
//             if (this.charts.activityChart) {
//                 this.charts.activityChart.destroy();
//             }

//             // Generate activity data for the last 7 days
//             const last7Days = Array.from({length: 7}, (_, i) => {
//                 const date = new Date();
//                 date.setDate(date.getDate() - (6 - i));
//                 return {
//                     date: date.toISOString().split('T')[0],
//                     orders: Math.floor(Math.random() * 20) + 5, // Simulated data
//                     revenue: Math.floor(Math.random() * 50000) + 10000
//                 };
//             });

//             this.charts.activityChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
//                     datasets: [{
//                         label: 'Orders',
//                         data: last7Days.map(d => d.orders),
//                         borderColor: '#667eea',
//                         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }, {
//                         label: 'Revenue (₹)',
//                         data: last7Days.map(d => d.revenue),
//                         borderColor: '#764ba2',
//                         backgroundColor: 'rgba(118, 75, 162, 0.1)',
//                         tension: 0.4,
//                         yAxisID: 'y1',
//                         type: 'line'
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Daily Activity (Last 7 Days)'
//                         }
//                     },
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Orders'
//                             }
//                         },
//                         y1: {
//                             beginAtZero: true,
//                             position: 'right',
//                             title: {
//                                 display: true,
//                                 text: 'Revenue (₹)'
//                             },
//                             grid: {
//                                 drawOnChartArea: false,
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     }
// }

// // Global functions for modal management
// window.closeModal = function(modalId) {
//     document.getElementById(modalId).style.display = 'none';
// };

// // Initialize dashboard when DOM is loaded
// document.addEventListener('DOMContentLoaded', function() {
//     const dashboard = new BusinessDashboard();
//     dashboard.initialize();

//     // Make dashboard globally available for debugging
//     window.businessDashboard = dashboard;
// });
