/**
 * Firebase Configuration
 *
 * To set up Firebase for your FlashMart application:
 *
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select an existing one
 * 3. Go to Project Settings > General tab
 * 4. Scroll down to "Your apps" section
 * 5. Click "Add app" > Web app (</>) icon
 * 6. Register your app with a name (e.g., "FlashMart")
 * 7. Copy the config object and replace the values below
 *
 * Example config object from Firebase:
 * const firebaseConfig = {
 *   apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *   authDomain: "your-project-id.firebaseapp.com",
 *   projectId: "your-project-id",
 *   storageBucket: "your-project-id.appspot.com",
 *   messagingSenderId: "123456789012",
 *   appId: "1:123456789012:web:abcdefghijklmnop"
 * };
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB1hYkS2ucpOKdJWcOziJJ5kaT30b-eKow",
  authDomain: "flash-39282.firebaseapp.com",
  projectId: "flash-39282",
  storageBucket: "flash-39282.firebasestorage.app",
  messagingSenderId: "570627577471",
  appId: "1:570627577471:web:6e7a91ff2f62d6bda9d14a",
  measurementId: "G-SEHDJR5NSP"
};

/**
 * Firebase Initialization
 *
 * This will be automatically loaded by firebase.js
 * No need to modify this section unless you need custom initialization
 */

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIG };
}
