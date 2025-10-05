/**
 * Firestore Database Setup Script
 *
 * This script initializes your Firestore database with the required collections
 * and sample data for the FlashMart application.
 *
 * Collections to be created:
 * - users: User profiles and loyalty information
 * - products: Product catalog with stock management
 * - flashSales: Flash sale sessions and configurations
 * - orders: Order history and transactions
 * - queue: Queue management for fair access
 * - feedback: Customer feedback and ratings
 *
 * Run this script once to set up your database structure.
 */

class FirestoreSetup {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure Firebase is initialized
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                this.db = firebaseService.db;
                this.initialized = true;
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Error initializing Firestore setup:', error);
            throw error;
        }
    }

    async setupDatabase() {
        try {
            await this.initialize();
            console.log('🔥 Setting up Firestore database...');
            console.log('📍 Firebase Project ID:', firebaseService.db.app.options.projectId);

            // Test write permissions first
            try {
                const testRef = this.db.collection('_test_permissions').doc('test');
                await testRef.set({ timestamp: new Date(), test: 'write_permission_check' });
                await testRef.delete();
                console.log('✅ Write permissions verified');
            } catch (permError) {
                console.error('❌ Write permissions failed:', permError.message);
                console.log('💡 Please check your Firestore security rules');
                throw new Error('Firestore write permissions denied. Please check security rules.');
            }

            // Create collections with sample data
            await this.createUsersCollection();
            await this.createProductsCollection();
            await this.createFlashSalesCollection();
            await this.createOrdersCollection();
            await this.createQueueCollection();
            await this.createFeedbackCollection();

            console.log('✅ Firestore database setup completed successfully!');
            console.log('📋 Summary of created collections:');
            console.log('   • users - User profiles and loyalty data');
            console.log('   • products - Product catalog with stock management');
            console.log('   • flashSales - Flash sale sessions');
            console.log('   • orders - Order history and transactions');
            console.log('   • queue - Queue management for fair access');
            console.log('   • feedback - Customer feedback and ratings');

        } catch (error) {
            console.error('❌ Error setting up database:', error);
            throw error;
        }
    }

    async createUsersCollection() {
        console.log('Creating users collection...');

        const sampleUsers = [
            {
                id: 'admin_user',
                name: 'Admin User',
                email: 'admin@flashmart.com',
                role: 'admin',
                loyaltyPoints: 0,
                tier: 'bronze',
                totalSpent: 0,
                joinDate: new Date('2023-01-01'),
                createdAt: new Date()
            },
            {
                id: 'john_doe',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                loyaltyPoints: 2500,
                tier: 'silver',
                totalSpent: 15000,
                joinDate: new Date('2023-06-15'),
                createdAt: new Date()
            },
            {
                id: 'jane_smith',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'user',
                loyaltyPoints: 7500,
                tier: 'gold',
                totalSpent: 45000,
                joinDate: new Date('2023-03-10'),
                createdAt: new Date()
            }
        ];

        const batch = this.db.batch();

        sampleUsers.forEach(user => {
            const userRef = this.db.collection('users').doc(user.id);
            batch.set(userRef, {
                ...user,
                joinDate: new Date(user.joinDate),
                createdAt: new Date()
            });
        });

        await batch.commit();
        console.log(`✅ Created ${sampleUsers.length} sample users`);
    }

    async createProductsCollection() {
        console.log('Creating products collection...');

        const sampleProducts = [
            {
                id: 'wireless_headphones',
                name: 'Premium Wireless Headphones',
                category: 'electronics',
                price: 15999,
                originalPrice: 25999,
                stock: 25,
                flashSaleStock: 10,
                image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'High-quality wireless headphones with noise cancellation',
                isFlashSale: true,
                flashSalePrice: 12999,
                flashSaleEnd: new Date(Date.now() + 3600000), // 1 hour from now
                createdAt: new Date()
            },
            {
                id: 'fitness_watch',
                name: 'Smart Fitness Watch',
                category: 'electronics',
                price: 8999,
                originalPrice: 14999,
                stock: 50,
                flashSaleStock: 20,
                image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Track your fitness goals with this smart watch',
                isFlashSale: true,
                flashSalePrice: 6999,
                flashSaleEnd: new Date(Date.now() + 3600000),
                createdAt: new Date()
            },
            {
                id: 'cotton_tshirt',
                name: 'Casual Cotton T-Shirt',
                category: 'clothing',
                price: 899,
                originalPrice: 1499,
                stock: 100,
                image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Comfortable cotton t-shirt for daily wear',
                isFlashSale: false,
                createdAt: new Date()
            },
            {
                id: 'javascript_book',
                name: 'JavaScript: The Complete Guide',
                category: 'books',
                price: 1299,
                originalPrice: 1999,
                stock: 30,
                flashSaleStock: 15,
                image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Learn JavaScript from basics to advanced concepts',
                isFlashSale: true,
                flashSalePrice: 999,
                flashSaleEnd: new Date(Date.now() + 7200000), // 2 hours from now
                createdAt: new Date()
            },
            {
                id: 'cooking_pan_set',
                name: 'Non-Stick Cooking Pan Set',
                category: 'home',
                price: 2499,
                originalPrice: 3999,
                stock: 40,
                flashSaleStock: 12,
                image: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Professional grade non-stick cookware set',
                isFlashSale: true,
                flashSalePrice: 1999,
                flashSaleEnd: new Date(Date.now() + 5400000), // 1.5 hours from now
                createdAt: new Date()
            },
            {
                id: 'led_desk_lamp',
                name: 'LED Desk Lamp',
                category: 'electronics',
                price: 1899,
                originalPrice: 2999,
                stock: 60,
                image: 'https://images.pexels.com/photos/1036641/pexels-photo-1036641.jpeg?auto=compress&cs=tinysrgb&w=400',
                description: 'Adjustable LED desk lamp with multiple brightness levels',
                isFlashSale: false,
                createdAt: new Date()
            }
        ];

        const batch = this.db.batch();

        sampleProducts.forEach(product => {
            const productRef = this.db.collection('products').doc(product.id);
            batch.set(productRef, {
                ...product,
                flashSaleEnd: product.flashSaleEnd ? new Date(product.flashSaleEnd) : null,
                createdAt: new Date()
            });
        });

        await batch.commit();
        console.log(`✅ Created ${sampleProducts.length} sample products`);
    }

    async createFlashSalesCollection() {
        console.log('Creating flashSales collection...');

        const sampleFlashSales = [
            {
                id: 'headphones_flash_sale',
                productId: 'wireless_headphones',
                startTime: new Date(Date.now() - 1800000), // 30 minutes ago
                endTime: new Date(Date.now() + 3600000), // 1 hour from now
                maxPerCustomer: 1,
                isActive: true,
                description: 'Limited time offer on premium headphones',
                createdAt: new Date()
            },
            {
                id: 'watch_flash_sale',
                productId: 'fitness_watch',
                startTime: new Date(Date.now() - 1800000),
                endTime: new Date(Date.now() + 3600000),
                maxPerCustomer: 1,
                isActive: true,
                description: 'Special discount on fitness watches',
                createdAt: new Date()
            },
            {
                id: 'book_flash_sale',
                productId: 'javascript_book',
                startTime: new Date(Date.now() - 900000), // 15 minutes ago
                endTime: new Date(Date.now() + 7200000), // 2 hours from now
                maxPerCustomer: 2,
                isActive: true,
                description: 'Programming books at unbeatable prices',
                createdAt: new Date()
            }
        ];

        const batch = this.db.batch();

        sampleFlashSales.forEach(sale => {
            const saleRef = this.db.collection('flashSales').doc(sale.id);
            batch.set(saleRef, {
                ...sale,
                startTime: new Date(sale.startTime),
                endTime: new Date(sale.endTime),
                createdAt: new Date()
            });
        });

        await batch.commit();
        console.log(`✅ Created ${sampleFlashSales.length} sample flash sales`);
    }

    async createOrdersCollection() {
        console.log('Creating orders collection...');

        const sampleOrders = [
            {
                id: 'order_001',
                userId: 'john_doe',
                productId: 'wireless_headphones',
                quantity: 1,
                price: 12999,
                total: 12999,
                status: 'confirmed',
                isFlashSale: true,
                createdAt: new Date(Date.now() - 86400000), // 1 day ago
                items: [{
                    productId: 'wireless_headphones',
                    name: 'Premium Wireless Headphones',
                    quantity: 1,
                    price: 12999,
                    isFlashSale: true
                }]
            },
            {
                id: 'order_002',
                userId: 'jane_smith',
                productId: 'fitness_watch',
                quantity: 1,
                price: 6999,
                total: 6999,
                status: 'confirmed',
                isFlashSale: true,
                createdAt: new Date(Date.now() - 172800000), // 2 days ago
                items: [{
                    productId: 'fitness_watch',
                    name: 'Smart Fitness Watch',
                    quantity: 1,
                    price: 6999,
                    isFlashSale: true
                }]
            }
        ];

        const batch = this.db.batch();

        sampleOrders.forEach(order => {
            const orderRef = this.db.collection('orders').doc(order.id);
            batch.set(orderRef, {
                ...order,
                createdAt: new Date(order.createdAt)
            });
        });

        await batch.commit();
        console.log(`✅ Created ${sampleOrders.length} sample orders`);
    }

    async createQueueCollection() {
        console.log('Creating queue collection...');
        // Queue collection is created dynamically when users join queues
        // No initial data needed
        console.log('✅ Queue collection ready (created on-demand)');
    }

    async createFeedbackCollection() {
        console.log('Creating feedback collection...');

        const sampleFeedback = [
            {
                id: 'feedback_001',
                userId: 'john_doe',
                orderId: 'order_001',
                productId: 'wireless_headphones',
                rating: 9,
                comment: 'Excellent sound quality and fast delivery!',
                category: 'product',
                createdAt: new Date(Date.now() - 43200000) // 12 hours ago
            },
            {
                id: 'feedback_002',
                userId: 'jane_smith',
                orderId: 'order_002',
                productId: 'fitness_watch',
                rating: 8,
                comment: 'Great fitness tracking features. Very satisfied.',
                category: 'product',
                createdAt: new Date(Date.now() - 86400000) // 1 day ago
            }
        ];

        const batch = this.db.batch();

        sampleFeedback.forEach(feedback => {
            const feedbackRef = this.db.collection('feedback').doc(feedback.id);
            batch.set(feedbackRef, {
                ...feedback,
                createdAt: new Date(feedback.createdAt)
            });
        });

        await batch.commit();
        console.log(`✅ Created ${sampleFeedback.length} sample feedback entries`);
    }

    async clearDatabase() {
        console.log('⚠️ Clearing existing data from Firestore...');

        try {
            const collections = ['users', 'products', 'flashSales', 'orders', 'queue', 'feedback'];

            for (const collectionName of collections) {
                const collectionRef = this.db.collection(collectionName);
                const snapshot = await collectionRef.get();

                if (!snapshot.empty) {
                    const batch = this.db.batch();
                    snapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}`);
                } else {
                    console.log(`✅ Collection ${collectionName} was already empty`);
                }
            }
        } catch (error) {
            console.error('❌ Error clearing database:', error);
            throw error;
        }
    }

    async checkAndSetupDatabase() {
        try {
            // Check if products collection exists and has data
            const productsSnapshot = await this.db.collection('products').limit(1).get();

            if (productsSnapshot.empty) {
                console.log('🔧 Products collection empty - setting up database with sample data...');
                await this.setupDatabase();
            } else {
                console.log('✅ Database already has data');
            }
        } catch (error) {
            console.warn('⚠️ Could not check database state:', error.message);
            // If we can't check, try to set up anyway
            try {
                await this.setupDatabase();
            } catch (setupError) {
                console.error('❌ Database setup failed:', setupError);
            }
        }
    }

    async exportCurrentData() {
        console.log('📤 Exporting current localStorage data to Firestore...');

        try {
            // Export products
            const products = JSON.parse(localStorage.getItem('flashmart_products') || '[]');
            if (products.length > 0) {
                const batch = this.db.batch();
                products.forEach(product => {
                    const productRef = this.db.collection('products').doc(product.id.toString());
                    batch.set(productRef, {
                        ...product,
                        flashSaleEnd: product.flashSaleEnd ? new Date(product.flashSaleEnd) : null,
                        createdAt: product.createdAt ? new Date(product.createdAt) : new Date()
                    });
                });
                await batch.commit();
                console.log(`✅ Exported ${products.length} products`);
            }

            // Export users
            const users = JSON.parse(localStorage.getItem('flashmart_users') || '[]');
            if (users.length > 0) {
                const batch = this.db.batch();
                users.forEach(user => {
                    const userRef = this.db.collection('users').doc(user.id.toString());
                    batch.set(userRef, {
                        ...user,
                        joinDate: user.joinDate ? new Date(user.joinDate) : new Date(),
                        createdAt: new Date()
                    });
                });
                await batch.commit();
                console.log(`✅ Exported ${users.length} users`);
            }

            // Export orders
            const orders = JSON.parse(localStorage.getItem('flashmart_orders') || '[]');
            if (orders.length > 0) {
                const batch = this.db.batch();
                orders.forEach(order => {
                    const orderRef = this.db.collection('orders').doc(order.id.toString());
                    batch.set(orderRef, {
                        ...order,
                        createdAt: new Date(order.createdAt)
                    });
                });
                await batch.commit();
                console.log(`✅ Exported ${orders.length} orders`);
            }

            console.log('✅ Data export completed');
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            throw error;
        }
    }
}

// Global function to run database setup
async function setupFirestoreDatabase() {
    try {
        const setup = new FirestoreSetup();
        await setup.setupDatabase();
        showNotification('Firestore database setup completed!', 'success');
        return true;
    } catch (error) {
        console.error('Setup failed:', error);
        showNotification('Database setup failed. Check console for details.', 'error');
        return false;
    }
}

// Global function to clear database
async function clearFirestoreDatabase() {
    try {
        const setup = new FirestoreSetup();
        await setup.clearDatabase();
        showNotification('Firestore database cleared!', 'success');
    } catch (error) {
        console.error('Clear failed:', error);
        showNotification('Database clear failed. Check console for details.', 'error');
    }
}

// Global function to export local data
async function exportLocalDataToFirestore() {
    try {
        const setup = new FirestoreSetup();
        await setup.exportCurrentData();
        showNotification('Local data exported to Firestore!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Data export failed. Check console for details.', 'error');
    }
}

// Auto-run setup if this script is loaded directly
if (typeof window !== 'undefined' && window.location.search.includes('setup=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 Auto-running database setup...');
        setupFirestoreDatabase();
    });
}
