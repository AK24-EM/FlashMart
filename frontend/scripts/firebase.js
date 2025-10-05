// Firebase configuration and initialization
// Configuration is loaded from firebase-config.js or global FIREBASE_CONFIG

// Initialize Firebase
let firebaseInitialized = false;

// Function to load Firebase scripts
function loadFirebaseScript() {
    return new Promise((resolve, reject) => {
        // Check if Firebase is already loaded and initialized
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            resolve();
            return;
        }

        // Check if Firebase SDK is loaded but not initialized
        if (typeof firebase !== 'undefined' && !window.firebase) {
            // Initialize Firebase with config
            try {
                window.firebase = firebase.initializeApp(window.FIREBASE_CONFIG);
                firebaseInitialized = true;
                resolve();
                return;
            } catch (error) {
                console.error('Error initializing Firebase:', error);
                reject(error);
                return;
            }
        }

        // If Firebase is not loaded at all, load it
        if (typeof firebase === 'undefined') {
            console.log('Firebase not loaded, loading SDK scripts...');

            // Load Firebase App
            const appScript = document.createElement('script');
            appScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';

            appScript.onload = () => {
                // Load other Firebase services
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';

                authScript.onload = () => {
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';

                    firestoreScript.onload = () => {
                        // Initialize Firebase
                        try {
                            window.firebase = firebase.initializeApp(window.FIREBASE_CONFIG);
                            firebaseInitialized = true;
                            resolve();
                        } catch (error) {
                            console.error('Error initializing Firebase:', error);
                            reject(error);
                        }
                    };

                    firestoreScript.onerror = (error) => {
                        console.error('Error loading Firestore:', error);
                        reject(error);
                    };

                    document.head.appendChild(firestoreScript);
                };

                authScript.onerror = (error) => {
                    console.error('Error loading Firebase Auth:', error);
                    reject(error);
                };

                document.head.appendChild(authScript);
            };

            appScript.onerror = (error) => {
                console.error('Error loading Firebase App:', error);
                reject(error);
            };

            document.head.appendChild(appScript);
        } else {
            // Firebase SDK is loaded but not initialized
            resolve();
        }
    });
}

// Make loadFirebase available globally
window.loadFirebase = loadFirebaseScript;

// Firebase service class for managing all Firebase operations
class FirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Load Firebase if not already loaded
            if (!firebaseInitialized) {
                await window.loadFirebase();
            }

            if (!window.firebase) {
                throw new Error('Firebase not available after loading');
            }

            // Check if Firebase is already initialized
            if (window.firebase.apps && window.firebase.apps.length > 0) {
                // Use existing Firebase app
                const app = window.firebase.apps[0];
                this.db = app.firestore();
                this.auth = app.auth();
            } else {
                // Initialize services
                this.db = window.firebase.firestore();
                this.auth = window.firebase.auth();
            }

            this.initialized = true;

            console.log('Firebase initialized successfully');

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.syncUserData(user);
                }
            });

            // Add sample products to Firestore if collection is empty
            await this.ensureSampleProducts();

        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    }

    async ensureSampleProducts() {
        try {
            console.log('ensureSampleProducts: checking if products exist in Firestore...');
            const snapshot = await this.db.collection('products').get();
            console.log('ensureSampleProducts: products collection size:', snapshot.size);

            if (snapshot.empty) {
                console.log('ensureSampleProducts: no products found, adding sample products...');
                await this.addSampleProductsToFirestore();
            } else {
                console.log('ensureSampleProducts: products already exist in Firestore');
            }
        } catch (error) {
            console.error('ensureSampleProducts: error checking products:', error);
        }
    }

    async addSampleProductsToFirestore() {
        const sampleProducts = [
            {
                id: 'wireless-bluetooth-hea-123456',
                name: 'Wireless Bluetooth Headphones',
                category: 'electronics',
                price: 2999,
                originalPrice: 3999,
                stock: 25,
                image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'High-quality wireless headphones with noise cancellation',
                isFlashSale: false,
                createdAt: new Date()
            },
            {
                id: 'smart-fitness-watch-789012',
                name: 'Smart Fitness Watch',
                category: 'electronics',
                price: 4999,
                originalPrice: 6999,
                stock: 15,
                image: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Track your fitness goals with this advanced smartwatch',
                isFlashSale: true,
                flashSalePrice: 3999,
                flashSaleStock: 10,
                flashSaleEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date()
            },
            {
                id: 'cotton-t-shirt-345678',
                name: 'Cotton T-Shirt',
                category: 'clothing',
                price: 999,
                originalPrice: 1499,
                stock: 50,
                image: 'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Comfortable cotton t-shirt in multiple colors',
                isFlashSale: false,
                createdAt: new Date()
            }
        ];

        for (const product of sampleProducts) {
            try {
                await this.db.collection('products').doc(product.id).set(product);
                console.log('addSampleProductsToFirestore: added product:', product.name, 'with ID:', product.id);
            } catch (error) {
                console.error('addSampleProductsToFirestore: error adding product:', error);
            }
        }
    }

    async syncUserData(user) {
        try {
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Update local storage with Firebase data
                const userProfile = {
                    id: user.uid,
                    name: user.displayName || userData.name,
                    email: user.email,
                    role: userData.role || 'user',
                    loyaltyPoints: userData.loyaltyPoints || 0,
                    tier: userData.tier || 'bronze',
                    totalSpent: userData.totalSpent || 0,
                    joinDate: userData.joinDate?.toDate() || new Date()
                };

                localStorage.setItem('flashmart_current_user', JSON.stringify(userProfile));

                // Update auth manager if available
                if (typeof authManager !== 'undefined' && authManager.userProfile !== userProfile) {
                    authManager.userProfile = userProfile;
                    authManager.updateUI();
                }
            } else {
                // Create new user document
                await this.createUserProfile(user);
            }
        } catch (error) {
            console.error('Error syncing user data:', error);
        }
    }

    async createUserProfile(user) {
        try {
            const userProfile = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                role: 'user',
                loyaltyPoints: 0,
                tier: 'bronze',
                totalSpent: 0,
                joinDate: new Date(),
                createdAt: new Date()
            };

            await this.db.collection('users').doc(user.uid).set(userProfile);
            return userProfile;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    // Authentication methods
    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signUp(email, password, additionalData = {}) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user profile
            const userProfile = {
                name: additionalData.name || email.split('@')[0],
                email: email,
                role: additionalData.role || 'user',
                loyaltyPoints: 0,
                tier: 'bronze',
                totalSpent: 0,
                joinDate: new Date(),
                createdAt: new Date()
            };

            await this.db.collection('users').doc(user.uid).set(userProfile);
            return user;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    // Product methods
    async getProducts(filters = {}) {
        try {
            console.log('FirebaseService: getProducts called with filters:', filters);
            console.log('FirebaseService: db initialized?', this.db ? 'yes' : 'no');

            let query = this.db.collection('products');
            console.log('FirebaseService: initial query created');

            if (filters.category) {
                query = query.where('category', '==', filters.category);
                console.log('FirebaseService: applied category filter:', filters.category);
            }

            if (filters.flashSale) {
                query = query.where('isFlashSale', '==', true);
                console.log('FirebaseService: applied flashSale filter');
            }

            console.log('FirebaseService: executing query...');
            const snapshot = await query.get();
            console.log('FirebaseService: query executed, snapshot size:', snapshot.size);

            let products = [];

            snapshot.forEach(doc => {
                console.log('FirebaseService: processing doc:', doc.id, doc.data());
                products.push({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamps to Date objects
                    flashSaleEnd: doc.data().flashSaleEnd?.toDate(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            console.log('FirebaseService: products before client-side filtering:', products.length);

            // Apply client-side filtering and sorting
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const beforeFilter = products.length;
                products = products.filter(p =>
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.description.toLowerCase().includes(searchTerm)
                );
                console.log(`FirebaseService: search filter applied, reduced from ${beforeFilter} to ${products.length}`);
            }

            if (filters.sort) {
                console.log('FirebaseService: applying sort:', filters.sort);
                products.sort((a, b) => {
                    switch (filters.sort) {
                        case 'price-low':
                            return (a.isFlashSale ? a.flashSalePrice : a.price) - (b.isFlashSale ? b.flashSalePrice : b.price);
                        case 'price-high':
                            return (b.isFlashSale ? b.flashSalePrice : b.price) - (a.isFlashSale ? a.flashSalePrice : a.price);
                        case 'discount':
                            const aDiscount = ((a.originalPrice - (a.isFlashSale ? a.flashSalePrice : a.price)) / a.originalPrice) * 100;
                            const bDiscount = ((b.originalPrice - (b.isFlashSale ? b.flashSalePrice : b.price)) / b.originalPrice) * 100;
                            return bDiscount - aDiscount;
                        default:
                            return a.name.localeCompare(b.name);
                    }
                });
            }

            console.log('FirebaseService: returning products:', products.length);
            return products;
        } catch (error) {
            console.error('Error getting products:', error);
            throw error;
        }
    }

    async getProduct(productId) {
        try {
            const doc = await this.db.collection('products').doc(productId).get();
            if (doc.exists) {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    flashSaleEnd: data.flashSaleEnd?.toDate(),
                    createdAt: data.createdAt?.toDate()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    }

    async addProduct(productData) {
        try {
            // Generate custom string ID if not provided
            const customId = productData.id || this.generateProductId(productData);

            const product = {
                id: customId,
                ...productData,
                createdAt: new Date(),
                flashSaleEnd: productData.flashSaleEnd ? new Date(productData.flashSaleEnd) : null
            };

            // Use the custom ID when adding to Firebase
            await this.db.collection('products').doc(customId).set(product);
            return product;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    // Generate custom string ID for products
    generateProductId(productData) {
        // Create a readable ID from product name and timestamp
        const nameSlug = productData.name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .substring(0, 20); // Limit length

        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        return `${nameSlug}-${timestamp}`;
    }

    async updateProduct(productId, updates) {
        try {
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            if (updates.flashSaleEnd) {
                updateData.flashSaleEnd = new Date(updates.flashSaleEnd);
            }

            await this.db.collection('products').doc(productId).update(updateData);
            return { id: productId, ...updates };
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await this.db.collection('products').doc(productId).delete();
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Flash sale methods
    async getActiveFlashSales() {
        try {
            const now = new Date();
            const snapshot = await this.db.collection('flashSales')
                .where('isActive', '==', true)
                .where('startTime', '<=', now)
                .where('endTime', '>', now)
                .get();

            const flashSales = [];
            snapshot.forEach(doc => {
                flashSales.push({
                    id: doc.id,
                    ...doc.data(),
                    startTime: doc.data().startTime?.toDate(),
                    endTime: doc.data().endTime?.toDate(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            return flashSales;
        } catch (error) {
            console.error('Error getting active flash sales:', error);
            throw error;
        }
    }

    async createFlashSale(flashSaleData) {
        try {
            const flashSale = {
                ...flashSaleData,
                isActive: true,
                createdAt: new Date(),
                startTime: new Date(flashSaleData.startTime),
                endTime: new Date(flashSaleData.endTime)
            };

            const docRef = await this.db.collection('flashSales').add(flashSale);
            return { id: docRef.id, ...flashSale };
        } catch (error) {
            console.error('Error creating flash sale:', error);
            throw error;
        }
    }

    // Order methods with transaction support
    async placeOrder(orderData) {
        try {
            const productRef = this.db.collection('products').doc(orderData.productId);
            const orderRef = this.db.collection('orders').doc();

            return await this.db.runTransaction(async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists) {
                    throw new Error('Product not found');
                }

                const product = productDoc.data();
                let stock = product.stock;
                const isFlashSale = orderData.isFlashSale;

                if (isFlashSale && product.flashSaleStock !== undefined) {
                    stock = product.flashSaleStock;
                }

                if (stock < orderData.quantity) {
                    throw new Error('Insufficient stock');
                }

                // Update product stock
                const stockUpdate = {};
                if (isFlashSale && product.flashSaleStock !== undefined) {
                    stockUpdate.flashSaleStock = stock - orderData.quantity;
                } else {
                    stockUpdate.stock = stock - orderData.quantity;
                }

                transaction.update(productRef, stockUpdate);

                // Create order
                const order = {
                    ...orderData,
                    id: orderRef.id,
                    userId: this.currentUser.uid,
                    status: 'confirmed',
                    createdAt: new Date(),
                    total: orderData.price * orderData.quantity
                };

                transaction.set(orderRef, order);

                return order;
            });
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    async getUserOrders(userId) {
        try {
            const snapshot = await this.db.collection('orders')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            return orders;
        } catch (error) {
            console.error('Error getting user orders:', error);
            throw error;
        }
    }

    // Queue management for fair access
    async joinQueue(productId, queueType = 'fifo') {
        try {
            if (!this.currentUser) {
                throw new Error('User must be authenticated to join queue');
            }

            const queueItem = {
                userId: this.currentUser.uid,
                productId,
                queueType,
                position: 0, // Will be calculated
                joinTime: new Date(),
                processed: false,
                status: 'waiting'
            };

            // Get current queue for this product
            const queueSnapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('processed', '==', false)
                .get();

            let position = 1;
            if (queueType === 'priority') {
                // Priority queue based on user tier
                const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
                const userData = userDoc.data();
                const userTier = userData.tier || 'bronze';

                if (userTier === 'gold' || userTier === 'silver') {
                    // Priority users go first
                    position = 1;
                } else {
                    position = queueSnapshot.size + 1;
                }
            } else if (queueType === 'random') {
                // Random lottery system
                position = Math.floor(Math.random() * (queueSnapshot.size + 2));
            } else {
                // FIFO
                position = queueSnapshot.size + 1;
            }

            queueItem.position = position;

            const docRef = await this.db.collection('queue').add(queueItem);
            return { id: docRef.id, ...queueItem };
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    }

    async getQueuePosition(productId) {
        try {
            if (!this.currentUser) return null;

            const snapshot = await this.db.collection('queue')
                .where('productId', '==', productId)
                .where('userId', '==', this.currentUser.uid)
                .where('processed', '==', false)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    joinTime: doc.data().joinTime?.toDate()
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting queue position:', error);
            throw error;
        }
    }

    // Analytics and reporting
    async getAnalytics(timeRange = '30d') {
        try {
            const now = new Date();
            let startDate = new Date();

            switch (timeRange) {
                case '7d':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(now.getDate() - 90);
                    break;
            }

            // Get orders in time range
            const ordersSnapshot = await this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .get();

            const orders = [];
            ordersSnapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            // Calculate analytics
            const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Get user tier distribution
            const usersSnapshot = await this.db.collection('users').get();
            const usersByTier = { bronze: 0, silver: 0, gold: 0 };

            usersSnapshot.forEach(doc => {
                const tier = doc.data().tier || 'bronze';
                usersByTier[tier]++;
            });

            // Get top products
            const productSales = {};
            orders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                    });
                } else {
                    // Single product order
                    productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
                }
            });

            const topProducts = await Promise.all(
                Object.entries(productSales)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(async ([productId, sales]) => {
                        const product = await this.getProduct(productId);
                        return { ...product, sales };
                    })
            );

            return {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                usersByTier,
                topProducts,
                timeRange,
                activeFlashSales: 0, // Will be calculated separately
                queueLength: 0 // Will be calculated separately
            };
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }

    // Utility methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Global Firebase service instance
const firebaseService = new FirebaseService();
