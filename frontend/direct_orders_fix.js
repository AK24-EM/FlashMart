
// Direct orders page test
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DIRECT ORDERS PAGE TEST ===');
    
    // Check if we're on the orders page
    const ordersPage = document.getElementById('orders-page');
    const ordersList = document.getElementById('orders-list');
    
    console.log('Orders page visible:', ordersPage ? ordersPage.classList.contains('active') : 'No orders page');
    console.log('Orders list element:', ordersList ? 'Found' : 'Not found');
    
    if (ordersList && window.dataManager) {
        console.log('Loading orders directly...');
        
        // Try to load orders
        const orders = window.dataManager.getUserOrders('demo-user-1');
        console.log('Found orders:', orders.length);
        
        if (orders.length === 0) {
            console.log('No orders found, adding sample orders...');
            window.dataManager.addSampleOrders();
            
            // Try again
            const ordersAfter = window.dataManager.getUserOrders('demo-user-1');
            console.log('Orders after adding samples:', ordersAfter.length);
            
            if (ordersAfter.length > 0) {
                console.log('SUCCESS: Sample orders loaded!');
                // Display orders
                ordersList.innerHTML = ordersAfter.map(order => `
                    <div class='order-card'>
                        <h3>Order #${order.id}</h3>
                        <p>Total: ₹${order.total}</p>
                        <p>Items: ${order.items.length}</p>
                    </div>
                `).join('');
            }
        }
    }
});

