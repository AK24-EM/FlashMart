console.log('=== DEBUGGING ORDERS PAGE ===');
console.log('Available orders in localStorage:', localStorage.getItem('flashmart_orders'));
console.log('Available orders in dataManager cache:', window.dataManager?.cache?.has('orders_data') ? window.dataManager.cache.get('orders_data') : 'No orders_data cache');
console.log('dataManager.getUserOrders function exists:', typeof window.dataManager?.getUserOrders);
console.log('authManager.currentUser:', window.authManager?.currentUser);
console.log('Orders page element exists:', document.getElementById('orders-list'));
