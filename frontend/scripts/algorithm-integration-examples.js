/**
 * Integration Examples for Advanced Algorithms in FlashMart
 *
 * This file demonstrates how to use the enhanced algorithms in your application
 */

// Example 1: Using Product Recommendation Heap
function demonstrateProductRecommendations() {
    const { ProductRecommendationHeap } = window.HeapUtils;

    // Create recommendation engine with hybrid scoring
    const recommender = new ProductRecommendationHeap('hybrid');

    // Sample products data
    const products = [
        { id: '1', name: 'iPhone 15', price: 999, category: 'electronics', views: 150, purchases: 45, rating: 4.5 },
        { id: '2', name: 'Samsung TV', price: 799, category: 'electronics', views: 89, purchases: 23, rating: 4.2 },
        { id: '3', name: 'Nike Shoes', price: 129, category: 'fashion', views: 200, purchases: 78, rating: 4.7 }
    ];

    // Add products with user preferences
    const userPreferences = {
        categories: ['electronics'],
        budgetPreference: 'medium',
        budget: 1000
    };

    products.forEach(product => {
        recommender.addProduct(product, userPreferences);
    });

    // Get top 5 recommendations
    const recommendations = recommender.getTopProducts(2, userPreferences);
    console.log('Top recommendations:', recommendations);

    return recommender;
}

// Example 2: Using Sliding Window Manager for Activity Tracking
function demonstrateSlidingWindowAnalytics() {
    const { createSlidingWindowManager } = window;

    // Create sliding window manager
    const activityTracker = createSlidingWindowManager({
        maxWindowSize: 500,
        timeWindows: [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000], // 5min, 1hr, 24hrs
        enablePersistence: true
    });

    // Simulate user activities
    const activities = [
        { type: 'page_view', data: { page: 'home' } },
        { type: 'product_view', data: { productId: '1' } },
        { type: 'add_to_cart', data: { productId: '1', quantity: 1 } },
        { type: 'purchase', data: { orderId: '123', amount: 999 } }
    ];

    activities.forEach(activity => {
        activityTracker.trackActivity(activity.type, activity.data);
    });

    // Get activity insights
    const insights = activityTracker.getActivityInsights();
    console.log('Activity insights:', insights);

    // Get recent activities
    const recent = activityTracker.getRecentActivities(10, 'purchase');
    console.log('Recent purchases:', recent);

    return activityTracker;
}

// Example 3: Using Graph Algorithms for Referral Network
function demonstrateReferralNetwork() {
    const { createReferralNetwork } = window;

    // Create referral network
    const referralNetwork = createReferralNetwork();

    // Add users
    referralNetwork.addUser('user1', { name: 'Alice', email: 'alice@example.com' });
    referralNetwork.addUser('user2', { name: 'Bob', email: 'bob@example.com' });
    referralNetwork.addUser('user3', { name: 'Charlie', email: 'charlie@example.com' });

    // Create referral relationships
    const referralCode1 = referralNetwork.generateReferralCode('user1');
    const referralCode2 = referralNetwork.generateReferralCode('user2');

    referralNetwork.createReferral('user1', 'user2', referralCode1);
    referralNetwork.createReferral('user2', 'user3', referralCode2);

    // Mark referrals as successful
    referralNetwork.markReferralSuccessful('user1', 'user2', 50);
    referralNetwork.markReferralSuccessful('user2', 'user3', 25);

    // Get referral statistics
    const user1Stats = referralNetwork.getUserReferralStats('user1');
    console.log('User1 referral stats:', user1Stats);

    // Find referral chain
    const chain = referralNetwork.findReferralChain('user3');
    console.log('Referral chain for user3:', chain);

    // Get top influencers
    const influencers = referralNetwork.getTopInfluencers(3);
    console.log('Top influencers:', influencers);

    // Get network analytics
    const analytics = referralNetwork.getNetworkAnalytics();
    console.log('Network analytics:', analytics);

    return referralNetwork;
}

// Example 4: Integrating Heap with Product Management
function integrateHeapWithProducts() {
    const { ProductRecommendationHeap } = window.HeapUtils;

    // This would typically be called when products are loaded
    function setupProductRecommendations(products, userPreferences) {
        const recommender = new ProductRecommendationHeap('hybrid');

        // Add all products to the recommendation engine
        products.forEach(product => {
            recommender.addProduct(product, userPreferences);
        });

        // Set up periodic score refresh
        setInterval(() => {
            recommender.refreshScores(userPreferences);
        }, 30000); // Refresh every 30 seconds

        return recommender;
    }

    // Get personalized recommendations for a user
    function getPersonalizedRecommendations(recommender, userPreferences, limit = 10) {
        return recommender.getTopProducts(limit, userPreferences);
    }

    return { setupProductRecommendations, getPersonalizedRecommendations };
}

// Example 5: Integrating Sliding Window with Activity Dashboard
function integrateSlidingWindowWithDashboard() {
    const { createSlidingWindowManager } = window;

    // Initialize activity tracker for dashboard
    function initializeActivityDashboard() {
        const activityTracker = createSlidingWindowManager({
            maxWindowSize: 1000,
            timeWindows: [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000],
            enablePersistence: true
        });

        // Set up event listeners for real-time updates
        activityTracker.addEventListener('*', (type, activity) => {
            console.log(`New ${type} activity:`, activity);
            updateDashboardMetrics(activityTracker);
        });

        // Load persisted activities
        activityTracker.loadPersistedActivities();

        return activityTracker;
    }

    // Update dashboard with current metrics
    function updateDashboardMetrics(activityTracker) {
        const metrics = {
            insights: activityTracker.getActivityInsights(),
            counts: activityTracker.getActivityCounts(),
            trends: activityTracker.getActivityTrends(),
            memory: activityTracker.getMemoryStats()
        };

        // Update UI elements with new metrics
        console.log('Dashboard metrics updated:', metrics);
        return metrics;
    }

    return { initializeActivityDashboard, updateDashboardMetrics };
}

// Example 6: Integrating Graph with User Management
function integrateGraphWithUsers() {
    const { createReferralNetwork } = window;

    // Initialize referral network
    function initializeReferralSystem() {
        const referralNetwork = createReferralNetwork();

        // This would typically load existing users and relationships
        // For now, we'll add some sample data
        const users = [
            { id: 'admin', name: 'Admin User' },
            { id: 'influencer1', name: 'Top Influencer' },
            { id: 'user1', name: 'Regular User 1' },
            { id: 'user2', name: 'Regular User 2' }
        ];

        users.forEach(user => {
            referralNetwork.addUser(user.id, user);
        });

        return referralNetwork;
    }

    // Handle new user registration with referral
    function handleNewUserRegistration(newUserId, referrerCode = null) {
        const referralNetwork = window.referralNetwork; // Assuming it's stored globally

        // Add the new user
        referralNetwork.addUser(newUserId, { joinedAt: Date.now() });

        // If there's a referrer code, create the referral relationship
        if (referrerCode && referralNetwork.referralCodes.has(referrerCode)) {
            const referrerInfo = referralNetwork.referralCodes.get(referrerCode);
            referralNetwork.createReferral(referrerInfo.userId, newUserId, referrerCode);

            // Update referral code usage
            referrerInfo.uses++;

            return { success: true, referrerId: referrerInfo.userId };
        }

        return { success: true, referrerId: null };
    }

    return { initializeReferralSystem, handleNewUserRegistration };
}

// Example 7: Real-time Analytics Dashboard
function createRealTimeAnalyticsDashboard() {
    // Combine all three algorithms for comprehensive analytics
    const analytics = {
        activityTracker: null,
        recommender: null,
        referralNetwork: null,

        initialize() {
            // Initialize all three systems
            this.activityTracker = demonstrateSlidingWindowAnalytics();
            this.recommender = demonstrateProductRecommendations();
            this.referralNetwork = demonstrateReferralNetwork();

            // Set up periodic updates
            setInterval(() => {
                this.updateAllMetrics();
            }, 10000); // Update every 10 seconds

            return this;
        },

        updateAllMetrics() {
            const metrics = {
                activity: this.activityTracker.getActivityInsights(),
                recommendations: this.recommender.getTopProducts(5),
                network: this.referralNetwork.getNetworkAnalytics(),
                timestamp: Date.now()
            };

            console.log('Real-time metrics:', metrics);

            // Trigger dashboard updates
            if (window.dashboardUpdateCallback) {
                window.dashboardUpdateCallback(metrics);
            }

            return metrics;
        },

        // Simulate real-time activity
        simulateActivity() {
            const activities = ['page_view', 'product_view', 'add_to_cart', 'purchase'];
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];

            this.activityTracker.trackActivity(randomActivity, {
                userId: `user${Math.floor(Math.random() * 100)}`,
                timestamp: Date.now()
            });
        }
    };

    return analytics;
}

// Export examples for use in other files
window.AlgorithmExamples = {
    demonstrateProductRecommendations,
    demonstrateSlidingWindowAnalytics,
    demonstrateReferralNetwork,
    integrateHeapWithProducts,
    integrateSlidingWindowWithDashboard,
    integrateGraphWithUsers,
    createRealTimeAnalyticsDashboard
};
