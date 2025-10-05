/**
 * Cart Debug Functions
 * Use these in browser console to test cart functionality
 */

function debugCartFunctions() {
    console.log('🔍 Debugging Cart Functions...');

    console.log('1. Checking if functions are defined:');
    console.log('addToCart:', typeof addToCart);
    console.log('buyNow:', typeof buyNow);
    console.log('cartManager:', typeof cartManager);
    console.log('showNotification:', typeof showNotification);

    console.log('\n2. Checking managers:');
    console.log('dataManager:', typeof dataManager);
    console.log('authManager:', typeof authManager);
    console.log('productManager:', typeof window.productManager);
    console.log('queueManager:', typeof window.queueManager);
    console.log('transactionService:', typeof window.transactionService);

    console.log('\n3. Testing cart manager methods:');
    if (cartManager) {
        console.log('Cart items:', cartManager?.cart?.length ?? 'N/A');
        console.log('Cart total:', cartManager.getTotal ? cartManager.getTotal() : 'N/A');
        console.log('Cart count:', cartManager.getItemCount ? cartManager.getItemCount() : 'N/A');
    }

    console.log('\n4. Testing data manager:');
    if (dataManager) {
        dataManager.getProducts().then(products => {
            console.log('Products loaded:', products?.length ?? 'No products');
            console.log('Sample product:', products?.[0]?.name ?? 'None');
        }).catch(error => {
            console.error('Error loading products:', error.message);
        });
    }

    console.log('\n5. Testing authentication:');
    if (authManager) {
        console.log('Current user:', authManager.currentUser ? 'Logged in' : 'Not logged in');
        console.log('User profile:', authManager.userProfile ? 'Available' : 'Not available');
    }

    console.log('\n✅ Debug complete. Check console for results.');
}

// Test adding a product to cart
function testAddToCart(productId = 'cotton_tshirt') {
    console.log('🛒 Testing addToCart with product:', productId);

    if (typeof addToCart === 'function') {
        try {
            if (dataManager) {
                dataManager.getProduct(productId).then(product => {
                    if (product) {
                        console.log('✅ Product found:', product.name);
                        addToCart(productId, false, 1);
                    } else {
                        console.error('❌ Product not found:', productId);
                    }
                }).catch(error => {
                    console.error('❌ Error checking product:', error.message);
                });
            } else {
                addToCart(productId, false, 1);
            }
        } catch (error) {
            console.error('❌ Error calling addToCart:', error);
        }
    } else {
        console.error('❌ addToCart function not found');
    }
}

// Test buying a product
function testBuyNow(productId = 'wireless_headphones') {
    console.log('🛍️ Testing buyNow with product:', productId);

    if (typeof buyNow === 'function') {
        try {
            if (dataManager) {
                dataManager.getProduct(productId).then(product => {
                    if (product) {
                        console.log('✅ Product found:', product.name);
                        buyNow(productId, product.isFlashSale || false, 1);
                    } else {
                        console.error('❌ Product not found:', productId);
                    }
                }).catch(error => {
                    console.error('❌ Error checking product:', error.message);
                });
            } else {
                buyNow(productId, false, 1);
            }
        } catch (error) {
            console.error('❌ Error calling buyNow:', error);
        }
    } else {
        console.error('❌ buyNow function not found');
    }
}

// Test cart contents
function testCartContents() {
    console.log('📦 Current cart contents:');
    if (cartManager) {
        console.log('Cart object:', cartManager);
        console.log('Cart items:', cartManager.cart ?? 'Not available');
        if (cartManager.cart) {
            console.log('Number of items:', cartManager.cart.length);
            console.log('Cart total:', cartManager.getTotal ? cartManager.getTotal() : 'Method not available');
            console.log('Item count:', cartManager.getItemCount ? cartManager.getItemCount() : 'Method not available');
            console.table(cartManager.cart); // prettier output
        }
    } else {
        console.error('❌ Cart manager not available');
    }
}

// Test product loading
function testProductLoading() {
    console.log('🔍 Testing product loading...');

    if (dataManager) {
        dataManager.getProducts().then(products => {
            console.log('✅ Products loaded successfully:', products?.length ?? 0);
            if (products?.length > 0) {
                console.log('Sample products:');
                products.slice(0, 3).forEach((product, index) => {
                    console.log(`${index + 1}. ${product.name} (${product.id}) - ₹${product.price}`);
                });
            }
        }).catch(error => {
            console.error('❌ Error loading products:', error.message);
        });
    } else {
        console.error('❌ Data manager not available');
    }
}

// Test database connectivity and data
function testDatabaseConnection() {
    console.log('🔗 Testing database connection...');

    if (typeof firebaseService !== 'undefined') {
        console.log('✅ Firebase service available');

        (firebaseService.initialize ? firebaseService.initialize() : Promise.resolve())
            .then(() => {
                console.log('✅ Firebase initialized successfully');
                return firebaseService.db.collection('products').limit(1).get();
            })
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('⚠️ Products collection is empty');
                    console.log('💡 Run: setupFirestoreDatabase() to populate with sample data');
                } else {
                    console.log('✅ Products collection has data');
                    console.log('📊 Document count:', snapshot.size);
                }
            })
            .catch(error => {
                console.error('❌ Database connection error:', error.message);
            });
    } else {
        console.error('❌ Firebase service not available');
    }
}

// Run all tests at once
function runAllTests() {
    debugCartFunctions();
    testCartContents();
    testProductLoading();
    testDatabaseConnection();
    console.log('\n🚀 All tests executed. Check console for details.');
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.debugCartFunctions = debugCartFunctions;
    window.testAddToCart = testAddToCart;
    window.testBuyNow = testBuyNow;
    window.testCartContents = testCartContents;
    window.testProductLoading = testProductLoading;
    window.testDatabaseConnection = testDatabaseConnection;
    window.runAllTests = runAllTests;
}