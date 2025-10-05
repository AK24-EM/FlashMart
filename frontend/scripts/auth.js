// Firebase Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authInitialized = false;
        this.authStateListener = null;
        this.initializationPromise = null;
    }

    async initializeAuth() {
        if (this.authInitialized) return;

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initializeAuth();
        return this.initializationPromise;
    }

    async _initializeAuth() {
        try {
            // Ensure Firebase is initialized first
            if (typeof firebaseService === 'undefined') {
                throw new Error('Firebase service not available');
            }

            await firebaseService.initialize();
            this.authInitialized = true;
            console.log('Firebase Auth initialized');

            // Set up auth state listener
            this.authStateListener = firebaseService.auth.onAuthStateChanged(async (user) => {
                await this.handleAuthStateChange(user);
            });

        } catch (error) {
            console.error('Error initializing Firebase Auth:', error);
            this.authInitialized = false;
            throw error;
        }
    }

    async handleAuthStateChange(user) {
        try {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile(user.uid);
                this.updateUI();
            } else {
                this.currentUser = null;
                this.userProfile = null;
                localStorage.removeItem('flashmart_current_user');
                this.updateUI();
            }
        } catch (error) {
            console.error('Error handling auth state change:', error);
        }
    }

    async loadUserProfile(userId) {
        try {
            if (!firebaseService.db) {
                throw new Error('Firebase not initialized');
            }

            const userDoc = await firebaseService.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userProfile = {
                    id: userId,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role || 'user',
                    loyaltyPoints: userData.loyaltyPoints || 0,
                    tier: userData.tier || 'bronze',
                    totalSpent: userData.totalSpent || 0,
                    joinDate: userData.joinDate?.toDate() || new Date()
                };

                // Update local storage
                localStorage.setItem('flashmart_current_user', JSON.stringify(this.userProfile));
            } else {
                // Create user profile if it doesn't exist
                await this.createUserProfile(userId);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Don't throw - auth can still work without profile
        }
    }

    async createUserProfile(userId) {
        try {
            const user = firebaseService.auth.currentUser;
            if (!user) return;

            const userProfile = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                role: 'user',
                loyaltyPoints: 0,
                tier: 'bronze',
                totalSpent: 0,
                joinDate: new Date(),
                createdAt: new Date()
            };

            await firebaseService.db.collection('users').doc(userId).set(userProfile);
            this.userProfile = userProfile;

            // Update local storage
            localStorage.setItem('flashmart_current_user', JSON.stringify(this.userProfile));
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async login(email, password) {
        try {
            if (!this.authInitialized) {
                console.log('AuthManager: Initializing auth before login...');
                await this.initializeAuth();
            }

            console.log('AuthManager: Attempting login for email:', email);
            const userCredential = await firebaseService.signIn(email, password);
            const user = userCredential.user;

            console.log('AuthManager: Login successful for user:', user.email);
            // User profile will be loaded automatically by auth state listener
            // Just update UI immediately
            this.updateUI();
            closeModal('auth-modal');
            showNotification('Login successful!', 'success');
            return true;
        } catch (error) {
            console.error('AuthManager: Login error:', error);
            let errorMessage = 'Invalid email or password!';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No user found with this email address.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Firebase configuration error. Please check your Firebase project settings.';
                console.error('🔧 Firebase Configuration Issue Detected');
                console.error('Please run testFirebaseConnection() in the browser console to diagnose the issue.');
            } else if (error.message && error.message.includes('Firebase')) {
                errorMessage = 'Firebase service error. Please try again later.';
            }

            showNotification(errorMessage, 'error');
            return false;
        }
    }

    async register(userData) {
        try {
            if (!this.authInitialized) {
                console.log('AuthManager: Initializing auth before registration...');
                await this.initializeAuth();
            }

            console.log('AuthManager: Attempting registration for email:', userData.email);
            const userCredential = await firebaseService.signUp(userData.email, userData.password, {
                name: userData.name,
                role: userData.role || 'user'
            });

            const user = userCredential.user;
            console.log('AuthManager: Registration successful for user:', user.email);

            // User profile will be created automatically by Firebase service
            // and loaded by auth state listener
            closeModal('auth-modal');
            showNotification('Registration successful!', 'success');
            return true;
        } catch (error) {
            console.error('AuthManager: Registration error:', error);
            let errorMessage = 'Registration failed!';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/password accounts are not enabled.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message && error.message.includes('Firebase')) {
                errorMessage = 'Firebase service error. Please try again later.';
            }

            showNotification(errorMessage, 'error');
            return false;
        }
    }

    async logout() {
        try {
            if (!this.authInitialized) {
                await this.initializeAuth();
            }

            await firebaseService.signOut();
            this.currentUser = null;
            this.userProfile = null;

            // Clear local storage
            localStorage.removeItem('flashmart_current_user');

            this.updateUI();
            showNotification('Logged out successfully!', 'success');
            showPage('home'); // Redirect to home page
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Error logging out!', 'error');
        }
    }

    async loadUserProfile(userId) {
        try {
            const userDoc = await firebaseService.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                this.userProfile = {
                    id: userId,
                    ...userDoc.data(),
                    joinDate: userDoc.data().joinDate?.toDate(),
                    createdAt: userDoc.data().createdAt?.toDate()
                };

                // Update local storage
                localStorage.setItem('flashmart_current_user', JSON.stringify(this.userProfile));
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async loadCurrentUser() {
        // This method is now handled by the auth state listener
        // Keeping for backward compatibility
        try {
            if (!this.authInitialized) {
                await this.initializeAuth();
            }
            // Auth state is automatically managed by the listener
            return this.currentUser !== null;
        } catch (error) {
            console.error('Error loading current user:', error);
            return false;
        }
    }
    
    updateUI() {
        const authLink = document.getElementById('auth-link');
        const adminNavLink = document.getElementById('admin-nav-link');
        const dashboardNavItem = document.getElementById('dashboard-nav-item');
        const userPointsElement = document.getElementById('user-points');
        
        if (this.currentUser && this.userProfile) {
            // Update auth link
            authLink.innerHTML = `
                <span class="nav-line-1">Hello, ${this.userProfile.name}</span>
                <span class="nav-line-2">Account & Lists</span>
            `;
            authLink.onclick = () => this.showAccountMenu();
            
            // Show admin link if user is admin
            if (this.userProfile.role === 'admin') {
                adminNavLink.style.display = 'block';
            } else {
                adminNavLink.style.display = 'none';
            }

            // Show dashboard link for admin users
            if (this.userProfile.role === 'admin') {
                dashboardNavItem.style.display = 'block';
            } else {
                dashboardNavItem.style.display = 'none';
            }
            
            // Update loyalty points if element exists
            if (userPointsElement) {
                userPointsElement.textContent = this.userProfile.loyaltyPoints || 0;
            }
        } else {
            authLink.innerHTML = `
                <span class="nav-line-1">Hello, Sign in</span>
                <span class="nav-line-2">Account & Lists</span>
            `;
            authLink.onclick = () => showModal('auth-modal');
            adminNavLink.style.display = 'none';
            dashboardNavItem.style.display = 'none';
            
            if (userPointsElement) {
                userPointsElement.textContent = '0';
            }
        }
    }
    
    showAccountMenu() {
        // Create a simple account menu
        const menu = document.createElement('div');
        menu.className = 'account-menu';
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 200px;
            padding: 10px 0;
        `;
        
        if (!this.userProfile) return;
        
        menu.innerHTML = `
            <div style="padding: 10px 15px; border-bottom: 1px solid #eee;">
                <strong>${this.userProfile.name}</strong><br>
                <small>${this.currentUser.email}</small><br>
                <small>Points: ${this.userProfile.loyaltyPoints}</small><br>
                <small style="color: #666;">Tier: ${this.userProfile.tier}</small>
            </div>
            <a href="#" onclick="showPage('orders')" style="display: block; padding: 10px 15px; color: #333; text-decoration: none;">My Orders</a>
            <a href="#" onclick="showPage('loyalty')" style="display: block; padding: 10px 15px; color: #333; text-decoration: none;">Loyalty Points</a>
            <hr style="margin: 5px 0;">
            <a href="#" onclick="authManager.logout()" style="display: block; padding: 10px 15px; color: #333; text-decoration: none;">Sign Out</a>
        `;
        
        // Position menu relative to auth link
        const authLinkElement = document.getElementById('auth-link');
        authLinkElement.style.position = 'relative';
        authLinkElement.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !authLinkElement.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    requireAuth() {
        if (!this.currentUser) {
            showModal('auth-modal');
            return false;
        }
        return true;
    }
    
    requireAdmin() {
        if (!this.currentUser || !this.userProfile || this.userProfile.role !== 'admin') {
            showNotification('Admin access required!', 'error');
            return false;
        }
        return true;
    }
    
    canAccessEarlyFlashSale() {
        if (!this.userProfile) return false;
        return this.userProfile.tier === 'gold' || this.userProfile.tier === 'silver';
    }
    
    getEarlyAccessTime() {
        if (!this.userProfile) return 0;
        switch (this.userProfile.tier) {
            case 'gold': return 10 * 60 * 1000; // 10 minutes
            case 'silver': return 5 * 60 * 1000; // 5 minutes
            default: return 0;
        }
    }

    // Update user loyalty points and tier
    async updateLoyaltyPoints(pointsToAdd) {
        try {
            if (!this.userProfile || !this.currentUser) return;

            const currentPoints = this.userProfile.loyaltyPoints || 0;
            const newPoints = currentPoints + pointsToAdd;

            // Update in Firestore
            await firebaseService.db.collection('users').doc(this.currentUser.uid).update({
                loyaltyPoints: newPoints,
                totalSpent: firebaseService.db.firestore.FieldValue.increment(0) // Keep existing totalSpent
            });

            // Update local profile
            this.userProfile.loyaltyPoints = newPoints;

            // Update tier based on points
            let newTier = 'bronze';
            if (newPoints >= 5000) {
                newTier = 'gold';
            } else if (newPoints >= 1000) {
                newTier = 'silver';
            }

            if (newTier !== this.userProfile.tier) {
                await firebaseService.db.collection('users').doc(this.currentUser.uid).update({
                    tier: newTier
                });
                this.userProfile.tier = newTier;
                showNotification(`Congratulations! You've reached ${newTier} tier!`, 'success');
            }

            // Update local storage
            localStorage.setItem('flashmart_current_user', JSON.stringify(this.userProfile));
            this.updateUI();

        } catch (error) {
            console.error('Error updating loyalty points:', error);
            showNotification('Error updating loyalty points. Please try again later.', 'error');
        }
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Auth form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            authManager.login(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const isAdmin = document.getElementById('admin-checkbox').checked;
            
            const userData = {
                name,
                email,
                password,
                role: isAdmin ? 'admin' : 'user'
            };
            
            authManager.register(userData);
        });
    }
    
    // Update UI on load
    authManager.updateUI();
});

// Auth tab switching
function showAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="showAuthTab('${tab}')"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.backgroundColor = '#007bff';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}