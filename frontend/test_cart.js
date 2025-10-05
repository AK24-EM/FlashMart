
// Test cart functionality
console.log('=== TESTING CART FUNCTIONALITY ===');

// Check if cartManager is available
console.log('cartManager available:', typeof window.cartManager);
console.log('cartManager.addItem available:', typeof window.cartManager?.addItem);

// Check if dataManager is available
console.log('dataManager available:', typeof window.dataManager);
console.log('dataManager.getProduct available:', typeof window.dataManager?.getProduct);

// Check if products are loaded
if (window.dataManager && window.dataManager.getProducts) {
    try {
        const products = window.dataManager.getProducts();
        console.log('Available products:', products.length);
        if (products.length > 0) {
            console.log('Sample product:', products[0]);
        }
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

