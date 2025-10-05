/**
 * Application Initialization Manager
 *
 * Centralizes the initialization of all services to prevent dependency issues
 * and ensure proper startup sequence.
 */

class AppInitializer {
    constructor() {
        this.initialized = false;
        this.services = {};
        this.initializationOrder = [
            'firebase',
            'dataService',
            'auth',
            'queue',
            'transaction',
            'analytics'
        ];
    }

    async initialize() {
        if (this.initialized) {
            console.log('App already initialized');
            return;
        }

        console.log('🚀 Starting FlashMart application initialization...');

        try {
            // Step 1: Initialize Firebase (core dependency)
            await this.initializeFirebase();

            // Step 2: Initialize Data Service
            await this.initializeDataService();

            // Step 3: Initialize Authentication
            await this.initializeAuth();

            // Step 4: Initialize supporting services
            await this.initializeSupportingServices();

            // Step 5: Load initial data
            await this.loadInitialData();

            // Step 6: Start periodic updates
            this.startPeriodicUpdates();

            this.initialized = true;
            console.log('✅ FlashMart application initialized successfully!');

            // Show welcome notification
            setTimeout(() => {
                showNotification('Welcome to FlashMart! 🛒', 'success');
            }, 1000);

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            showNotification('Failed to initialize application. Please refresh the page.', 'error');
            throw error;
        }
    }

    async initializeFirebase() {
        console.log('🔥 Initializing Firebase...');
        try {
            await firebaseService.initialize();
            this.services.firebase = firebaseService;
            console.log('✅ Firebase initialized');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            console.log('💡 Make sure your Firebase configuration is correct in firebase-config.js');
            throw error;
        }
    }

    async initializeDataService() {
        console.log('💾 Initializing Data Service...');
        try {
            await dataManager.initialize();
            this.services.dataService = dataManager;
            console.log('✅ Data Service initialized');
        } catch (error) {
            console.error('❌ Data Service initialization failed:', error);
            throw error;
        }
    }

    async initializeAuth() {
        console.log('🔐 Initializing Authentication...');
        try {
            // Ensure Firebase is ready first
            if (!this.services.firebase) {
                throw new Error('Firebase not initialized');
            }

            // Initialize auth manager
            await authManager.initializeAuth();

            // Load current user if available
            await authManager.loadCurrentUser();

            this.services.auth = authManager;
            console.log('✅ Authentication initialized');
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            throw error;
        }
    }

    async initializeSupportingServices() {
        console.log('🔧 Initializing supporting services...');

        try {
            // These services can be initialized in parallel
            const promises = [];

            // Initialize queue service
            if (typeof queueService !== 'undefined') {
                promises.push(
                    queueService.initialize().then(() => {
                        this.services.queue = queueService;
                        console.log('✅ Queue Service initialized');
                    }).catch(error => {
                        console.warn('⚠️ Queue Service initialization failed:', error);
                    })
                );
            }

            // Initialize transaction service
            if (typeof transactionService !== 'undefined') {
                promises.push(
                    transactionService.initialize().then(() => {
                        this.services.transaction = transactionService;
                        console.log('✅ Transaction Service initialized');
                    }).catch(error => {
                        console.warn('⚠️ Transaction Service initialization failed:', error);
                    })
                );
            }

            await Promise.allSettled(promises);

        } catch (error) {
            console.error('❌ Supporting services initialization failed:', error);
            // Don't throw here - these are not critical for basic functionality
        }
    }

    // Utility method to wait for dependencies to be loaded
    async waitForDependency(dependencyName, errorMessage, maxWaitTime = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            if (typeof window[dependencyName] !== 'undefined' && window[dependencyName] !== null) {
                console.log(`✅ ${dependencyName} is now available`);
                return;
            }

            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        throw new Error(`${errorMessage} (timeout after ${maxWaitTime}ms)`);
    }

    async loadInitialData() {
        console.log('📊 Loading initial data...');

        try {
            // Check if we need to set up the database
            await this.checkAndSetupDatabase();

            // Wait for productManager to be available
            await this.waitForDependency('productManager', 'ProductManager not loaded yet');

            // Load products
            if (typeof productManager !== 'undefined') {
                await productManager.loadProducts();
                await productManager.loadFlashSaleProducts();
            } else {
                console.warn('⚠️ ProductManager not loaded yet');
            }

            // Load cart data
            if (typeof cartManager !== 'undefined') {
                cartManager.loadCart();
                cartManager.updateCartUI();
            } else {
                console.warn('⚠️ CartManager not loaded yet');
            }

            // Load queue status
            if (typeof queueManager !== 'undefined') {
                queueManager.loadQueueStatus();
                queueManager.updateQueueUI();
            } else {
                console.warn('⚠️ QueueManager not loaded yet');
            }

            // Load admin data if user is admin
            if (authManager.currentUser && authManager.userProfile && authManager.userProfile.role === 'admin') {
                if (typeof adminManager !== 'undefined') {
                    adminManager.loadAdminData();
                } else {
                    console.warn('⚠️ AdminManager not loaded yet');
                }
            }

            console.log('✅ Initial data loaded');
        } catch (error) {
            console.error('❌ Initial data loading failed:', error);
            // Don't throw - app can still function with limited data
        }
    }

    async checkAndSetupDatabase() {
        try {
            console.log('🔍 Checking database state...');
            // Check if products collection exists and has data
            const productsSnapshot = await firebaseService.db.collection('products').limit(1).get();

            if (productsSnapshot.empty) {
                console.log('🔧 Products collection empty - setting up database with sample data...');
                try {
                    await setupFirestoreDatabase();
                    console.log('✅ Database setup completed successfully');
                } catch (setupError) {
                    console.error('❌ Database setup failed:', setupError.message);
                    console.log('💡 Try running: await setupFirestoreDatabase() manually in console');
                }
            } else {
                console.log('✅ Database already has data');
                const productsCount = (await firebaseService.db.collection('products').get()).size;
                console.log(`📊 Found ${productsCount} products in database`);
            }
        } catch (error) {
            console.warn('⚠️ Could not check database state:', error.message);
            console.log('💡 Database might not be accessible or Firebase not initialized');
            // If we can't check, try to set up anyway
            try {
                await setupFirestoreDatabase();
            } catch (setupError) {
                console.error('❌ Database setup failed:', setupError);
            }
        }
    }

    startPeriodicUpdates() {
        console.log('⏰ Starting periodic updates...');

        // Update flash sale timers every second
        setInterval(() => {
            if (window.flashMartApp && !window.flashMartApp.timersPaused) {
                window.flashMartApp.updateFlashSaleTimers();
            }
        }, 1000);

        // Update admin stats every 30 seconds (if admin is viewing)
        setInterval(() => {
            if (authManager.currentUser &&
                authManager.userProfile &&
                authManager.userProfile.role === 'admin' &&
                window.flashMartApp &&
                window.flashMartApp.currentPage === 'admin') {
                if (typeof adminManager !== 'undefined') {
                    adminManager.updateAdminStats();
                }
            }
        }, 30000);

        // Auto-save application state every 5 minutes
        setInterval(() => {
            if (window.flashMartApp) {
                window.flashMartApp.saveApplicationState();
            }
        }, 5 * 60 * 1000);

        // Check for flash sale updates every minute
        setInterval(() => {
            if (window.flashMartApp && !window.flashMartApp.timersPaused) {
                window.flashMartApp.checkFlashSaleUpdates();
            }
        }, 60000);

        console.log('✅ Periodic updates started');
    }

    // Health check method
    async healthCheck() {
        const health = {
            timestamp: new Date(),
            services: {}
        };

        // Check each service
        for (const [name, service] of Object.entries(this.services)) {
            health.services[name] = {
                initialized: service ? true : false,
                status: 'unknown'
            };

            if (service && typeof service.getHealth === 'function') {
                try {
                    const serviceHealth = await service.getHealth();
                    health.services[name].status = 'healthy';
                    health.services[name].details = serviceHealth;
                } catch (error) {
                    health.services[name].status = 'unhealthy';
                    health.services[name].error = error.message;
                }
            }
        }

        return health;
    }

    // Get service instance
    getService(name) {
        return this.services[name];
    }

    // Check if fully initialized
    isInitialized() {
        return this.initialized;
    }
}

// Global App Initializer instance
const appInitializer = new AppInitializer();

// Make setup functions globally available
if (typeof window !== 'undefined') {
    // These functions are defined in firestore-setup.js
    // They will be available after firestore-setup.js loads
    setTimeout(() => {
        if (typeof setupFirestoreDatabase !== 'undefined') {
            window.setupFirestoreDatabase = setupFirestoreDatabase;
        }
        if (typeof clearFirestoreDatabase !== 'undefined') {
            window.clearFirestoreDatabase = clearFirestoreDatabase;
        }
        if (typeof exportLocalDataToFirestore !== 'undefined') {
            window.exportLocalDataToFirestore = exportLocalDataToFirestore;
        }
        if (typeof testFirebaseConnection !== 'undefined') {
            window.testFirebaseConnection = testFirebaseConnection;
        }
    }, 100);
}
