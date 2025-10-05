/**
 * Firebase Connection Test
 *
 * Run this to verify your Firebase configuration is working correctly
 */

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase connection...');

    try {
        // Test 1: Firebase initialization
        console.log('1️⃣ Testing Firebase initialization...');
        await firebaseService.initialize();
        console.log('✅ Firebase initialized successfully');

        // Test 2: Firestore connection
        console.log('2️⃣ Testing Firestore connection...');
        const testDoc = await firebaseService.db.collection('_test').doc('connection').get();
        console.log('✅ Firestore connection successful');

        // Test 3: Write permissions
        console.log('3️⃣ Testing write permissions...');
        const testRef = firebaseService.db.collection('_test_permissions').doc('test');
        await testRef.set({
            timestamp: new Date(),
            test: 'write_test',
            projectId: firebaseService.db.app.options.projectId
        });
        console.log('✅ Write permissions verified');

        // Test 4: Read permissions
        console.log('4️⃣ Testing read permissions...');
        const readTest = await testRef.get();
        if (readTest.exists) {
            console.log('✅ Read permissions verified');
        } else {
            throw new Error('Read test failed');
        }

        // Test 5: Authentication
        console.log('5️⃣ Testing authentication...');
        const authTest = firebaseService.auth;
        if (authTest) {
            console.log('✅ Authentication service available');
        } else {
            throw new Error('Authentication service not available');
        }

        // Clean up test data
        await testRef.delete();
        await firebaseService.db.collection('_test').doc('connection').delete();

        console.log('🎉 All Firebase tests passed!');
        console.log('📋 Your Firebase configuration is working correctly');
        console.log('💡 You can now run setupFirestoreDatabase() to populate your database');

        showNotification('Firebase connection test passed!', 'success');
        return true;

    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);

        if (error.message.includes('permission-denied')) {
            console.log('💡 Issue: Firestore security rules are blocking access');
            console.log('🔧 Solution: Update your Firestore security rules to allow read/write access');
        } else if (error.message.includes('not-found')) {
            console.log('💡 Issue: Firebase project or configuration not found');
            console.log('🔧 Solution: Check your Firebase project configuration');
        } else if (error.message.includes('network')) {
            console.log('💡 Issue: Network connectivity problem');
            console.log('🔧 Solution: Check your internet connection');
        }

        showNotification('Firebase connection test failed. Check console for details.', 'error');
        return false;
    }
}

// Make test function globally available
if (typeof window !== 'undefined') {
    window.testFirebaseConnection = testFirebaseConnection;
}
