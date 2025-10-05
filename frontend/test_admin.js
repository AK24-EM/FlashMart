// Quick test to check admin functionality
console.log('Testing admin functionality...');

// Check if adminManager exists
if (typeof adminManager !== 'undefined') {
    console.log('✅ adminManager is defined');
    
    // Check if methods exist
    const methods = ['loadAdminProducts', 'editProduct', 'deleteProduct', 'toggleFlashSale'];
    methods.forEach(method => {
        if (typeof adminManager[method] === 'function') {
            console.log(`✅ adminManager.${method} is available`);
        } else {
            console.log(`❌ adminManager.${method} is missing`);
        }
    });
} else {
    console.log('❌ adminManager is not defined');
}

// Check if dataManager exists
if (typeof dataManager !== 'undefined') {
    console.log('✅ dataManager is defined');
    
    // Check if getProducts method exists
    if (typeof dataManager.getProducts === 'function') {
        console.log('✅ dataManager.getProducts is available');
    } else {
        console.log('❌ dataManager.getProducts is missing');
    }
} else {
    console.log('❌ dataManager is not defined');
}

console.log('Test completed');
