
// Quick test to add sample orders for current user
if (window.dataManager && window.authManager && window.authManager.currentUser) {
    console.log('Adding sample orders for user:', window.authManager.currentUser.id || window.authManager.currentUser.uid);
    window.dataManager.addSampleOrders();
    console.log('Sample orders added. Check localStorage for flashmart_orders');
} else {
    console.log('Cannot add sample orders - managers not ready');
}

