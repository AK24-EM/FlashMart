
// Test cart functionality after fixes
console.log('=== TESTING CART FUNCTIONALITY ===');

// Check if cartManager is properly initialized
console.log('CartManager class available:', typeof CartManager);
console.log('cartManager instance available:', typeof cartManager);
console.log('addToCart function available:', typeof addToCart);
console.log('buyNow function available:', typeof buyNow);

// Test that cartManager has required methods
if (cartManager && typeof cartManager.addItem === 'function') {
    console.log('✅ cartManager.addItem method is available');
} else {
    console.log('❌ cartManager.addItem method is not available');
}

console.log('=== CART TEST COMPLETE ===');

