
// Test cart functionality with event delegation
console.log('=== TESTING CART WITH EVENT DELEGATION ===');

// Check if cartManager is properly initialized
console.log('CartManager class available:', typeof CartManager);
console.log('window.cartManager available:', typeof window.cartManager);
console.log('addToCart function available:', typeof addToCart);
console.log('buyNow function available:', typeof buyNow);

// Check if product button handlers are set up
console.log('Product button event listeners attached:', document.eventListeners ? 'Event delegation active' : 'Check console for events');

// Test that functions can access cartManager
if (typeof addToCart === 'function') {
    console.log('✅ addToCart function is properly defined');
} else {
    console.log('❌ addToCart function is not defined');
}

if (typeof buyNow === 'function') {
    console.log('✅ buyNow function is properly defined');
} else {
    console.log('❌ buyNow function is not defined');
}

console.log('=== CART EVENT DELEGATION TEST COMPLETE ===');

