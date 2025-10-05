
// Quick test to check if orders functionality works
console.log('=== TESTING ORDERS PAGE ===');
console.log('dataManager available:', typeof window.dataManager);
console.log('authManager available:', typeof window.authManager);
console.log('authManager.currentUser:', window.authManager?.currentUser);
console.log('Orders in localStorage:', localStorage.getItem('flashmart_orders'));

// Try to get orders
if (window.dataManager && window.authManager?.currentUser) {
    const orders = window.dataManager.getUserOrders(window.authManager.currentUser.id);
    console.log('Orders found:', orders.length);
    orders.forEach(order => {
        console.log('Order:', order.id, 'Total:', order.total, 'Items:', order.items.length);
    });
}

