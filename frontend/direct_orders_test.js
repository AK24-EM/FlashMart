
// Simple test to verify orders page functionality
console.log('=== DIRECT ORDERS TEST ===');

// Check if managers are available
console.log('dataManager:', typeof window.dataManager);
console.log('authManager:', typeof window.authManager);

// Check localStorage directly
const ordersData = localStorage.getItem('flashmart_orders');
console.log('Orders in localStorage:', ordersData ? JSON.parse(ordersData).length : 0);

// Try to add sample orders directly
if (window.dataManager && window.dataManager.addSampleOrders) {
    console.log('Adding sample orders...');
    window.dataManager.addSampleOrders();
    
    // Check again
    const ordersAfter = localStorage.getItem('flashmart_orders');
    console.log('Orders after adding samples:', ordersAfter ? JSON.parse(ordersAfter).length : 0);
}

