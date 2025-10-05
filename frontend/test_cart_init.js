
// Test that cartManager is properly initialized
console.log('=== TESTING CART INITIALIZATION ===');
console.log('cartManager available:', typeof window.cartManager);
console.log('cartManager instance:', window.cartManager ? 'CartManager instance exists' : 'No instance');
console.log('cartManager.addItem available:', typeof window.cartManager?.addItem);
console.log('cartManager.cart array:', window.cartManager?.cart ? 'Cart array exists' : 'No cart array');

// Test that functions can access cartManager
console.log('addToCart function available:', typeof window.addToCart);
console.log('buyNow function available:', typeof window.buyNow);
console.log('proceedToCheckout function available:', typeof window.proceedToCheckout);

