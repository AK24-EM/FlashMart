// Sample data and data management
class DataManager {
    constructor() {
        this.products = [];
        this.users = [];
        this.orders = [];
        this.flashSales = [];
        this.queue = [];
        this.currentUser = null;
        
        // Initialize with sample data
        this.initializeSampleData();
        
        // Load data from localStorage if available
        this.loadFromStorage();
    }
    
    initializeSampleData() {
        // Sample products
        const sampleProducts = [
            {
                id: 1,
                name: "Premium Wireless Headphones",
                category: "electronics",
                price: 15999,
                originalPrice: 25999,
                stock: 25,
                image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "High-quality wireless headphones with noise cancellation",
                isFlashSale: true,
                flashSalePrice: 12999,
                flashSaleStock: 10,
                flashSaleEnd: new Date(Date.now() + 3600000) // 1 hour from now
            },
            {
                id: 2,
                name: "Smart Fitness Watch",
                category: "electronics",
                price: 8999,
                originalPrice: 14999,
                stock: 50,
                image: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "Track your fitness goals with this smart watch",
                isFlashSale: true,
                flashSalePrice: 6999,
                flashSaleStock: 20,
                flashSaleEnd: new Date(Date.now() + 3600000)
            },
            {
                id: 3,
                name: "Casual Cotton T-Shirt",
                category: "clothing",
                price: 899,
                originalPrice: 1499,
                stock: 100,
                image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "Comfortable cotton t-shirt for daily wear",
                isFlashSale: false
            },
            {
                id: 4,
                name: "JavaScript: The Complete Guide",
                category: "books",
                price: 1299,
                originalPrice: 1999,
                stock: 30,
                image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "Learn JavaScript from basics to advanced concepts",
                isFlashSale: true,
                flashSalePrice: 999,
                flashSaleStock: 15,
                flashSaleEnd: new Date(Date.now() + 7200000) // 2 hours from now
            },
            {
                id: 5,
                name: "Non-Stick Cooking Pan Set",
                category: "home",
                price: 2499,
                originalPrice: 3999,
                stock: 40,
                image: "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "Professional grade non-stick cookware set",
                isFlashSale: true,
                flashSalePrice: 1999,
                flashSaleStock: 12,
                flashSaleEnd: new Date(Date.now() + 5400000) // 1.5 hours from now
            },
            {
                id: 6,
                name: "LED Desk Lamp",
                category: "electronics",
                price: 1899,
                originalPrice: 2999,
                stock: 60,
                image: "https://images.pexels.com/photos/1036641/pexels-photo-1036641.jpeg?auto=compress&cs=tinysrgb&w=400",
                description: "Adjustable LED desk lamp with multiple brightness levels",
                isFlashSale: false
            }
        ];
        
        // Only initialize if no products exist
        if (this.products.length === 0) {
            this.products = sampleProducts;
        }
        
        // Sample admin user
        const adminUser = {
            id: 1,
            name: "Admin User",
            email: "admin@flashmart.com",
            password: "admin123",
            role: "admin",
            loyaltyPoints: 0,
            tier: "bronze",
            orders: [],
            totalSpent: 0,
            joinDate: new Date('2023-01-01')
        };
        
        // Sample regular users
        const sampleUsers = [
            {
                id: 2,
                name: "John Doe",
                email: "john@example.com",
                password: "user123",
                role: "user",
                loyaltyPoints: 2500,
                tier: "silver",
                orders: [],
                totalSpent: 15000,
                joinDate: new Date('2023-06-15')
            },
            {
                id: 3,
                name: "Jane Smith",
                email: "jane@example.com",
                password: "user123",
                role: "user",
                loyaltyPoints: 7500,
                tier: "gold",
                orders: [],
                totalSpent: 45000,
                joinDate: new Date('2023-03-10')
            }
        ];
        
        if (this.users.length === 0) {
            this.users = [adminUser, ...sampleUsers];
        }
    }
    
    // Product methods
    addProduct(product) {
        const newProduct = {
            ...product,
            id: Date.now(),
            createdAt: new Date()
        };
        this.products.push(newProduct);
        this.saveToStorage();
        return newProduct;
    }
    
    updateProduct(productId, updates) {
        const index = this.products.findIndex(p => p.id == productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveToStorage();
            return this.products[index];
        }
        return null;
    }
    
    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id != productId);
        this.saveToStorage();
    }
    
    getProduct(productId) {
        return this.products.find(p => p.id == productId);
    }
    
    getProducts(filters = {}) {
        let filtered = [...this.products];
        
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        if (filters.flashSale) {
            filtered = filtered.filter(p => p.isFlashSale);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort products
        if (filters.sort) {
            switch (filters.sort) {
                case 'price-low':
                    filtered.sort((a, b) => (a.isFlashSale ? a.flashSalePrice : a.price) - (b.isFlashSale ? b.flashSalePrice : b.price));
                    break;
                case 'price-high':
                    filtered.sort((a, b) => (b.isFlashSale ? b.flashSalePrice : b.price) - (a.isFlashSale ? a.flashSalePrice : a.price));
                    break;
                case 'discount':
                    filtered.sort((a, b) => {
                        const aDiscount = ((a.originalPrice - (a.isFlashSale ? a.flashSalePrice : a.price)) / a.originalPrice) * 100;
                        const bDiscount = ((b.originalPrice - (b.isFlashSale ? b.flashSalePrice : b.price)) / b.originalPrice) * 100;
                        return bDiscount - aDiscount;
                    });
                    break;
                default:
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        
        return filtered;
    }
    
    // User methods
    addUser(user) {
        const newUser = {
            ...user,
            id: Date.now(),
            loyaltyPoints: 0,
            tier: "bronze",
            orders: [],
            totalSpent: 0,
            joinDate: new Date()
        };
        this.users.push(newUser);
        this.saveToStorage();
        return newUser;
    }
    
    updateUser(userId, updates) {
        const index = this.users.findIndex(u => u.id == userId);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updates };
            
            // Update tier based on points
            const user = this.users[index];
            if (user.loyaltyPoints >= 5000) {
                user.tier = "gold";
            } else if (user.loyaltyPoints >= 1000) {
                user.tier = "silver";
            } else {
                user.tier = "bronze";
            }
            
            this.saveToStorage();
            return this.users[index];
        }
        return null;
    }
    
    getUser(email) {
        return this.users.find(u => u.email === email);
    }
    
    getUserById(userId) {
        return this.users.find(u => u.id == userId);
    }
    
    // Order methods
    addOrder(order) {
        const newOrder = {
            ...order,
            id: Date.now(),
            createdAt: new Date(),
            status: 'completed'
        };
        this.orders.push(newOrder);
        
        // Update user's total spent and loyalty points
        const user = this.getUserById(order.userId);
        if (user) {
            user.totalSpent += order.total;
            
            // Award loyalty points (1 point per ₹100)
            const pointsToAdd = Math.floor(order.total / 100);
            const multiplier = user.tier === 'gold' ? 2 : user.tier === 'silver' ? 1.5 : 1;
            const finalPoints = Math.floor(pointsToAdd * multiplier);
            
            user.loyaltyPoints += finalPoints;
            user.orders.push(newOrder.id);
            
            this.updateUser(user.id, user);
        }
        
        // Update product stock
        order.items.forEach(item => {
            const product = this.getProduct(item.productId);
            if (product) {
                if (item.isFlashSale) {
                    product.flashSaleStock -= item.quantity;
                } else {
                    product.stock -= item.quantity;
                }
                this.updateProduct(product.id, product);
            }
        });
        
        this.saveToStorage();
        return newOrder;
    }
    
    getUserOrders(userId) {
        return this.orders.filter(order => order.userId == userId);
    }
    
    // Queue management
    addToQueue(userId, productId, queueType = 'fifo') {
        const queueItem = {
            id: Date.now(),
            userId,
            productId,
            position: this.queue.length + 1,
            joinTime: new Date(),
            queueType,
            processed: false
        };
        
        if (queueType === 'priority') {
            const user = this.getUserById(userId);
            if (user && (user.tier === 'gold' || user.tier === 'silver')) {
                // Priority users go to front
                this.queue.unshift(queueItem);
                // Reorder positions
                this.queue.forEach((item, index) => {
                    item.position = index + 1;
                });
            } else {
                this.queue.push(queueItem);
            }
        } else if (queueType === 'random') {
            // Random insertion (lottery system)
            const randomIndex = Math.floor(Math.random() * (this.queue.length + 1));
            this.queue.splice(randomIndex, 0, queueItem);
            // Reorder positions
            this.queue.forEach((item, index) => {
                item.position = index + 1;
            });
        } else {
            // FIFO - First In, First Out
            this.queue.push(queueItem);
        }
        
        this.saveToStorage();
        return queueItem;
    }
    
    processQueue() {
        if (this.queue.length > 0) {
            const nextItem = this.queue.shift();
            nextItem.processed = true;
            nextItem.processTime = new Date();
            
            // Reorder positions
            this.queue.forEach((item, index) => {
                item.position = index + 1;
            });
            
            this.saveToStorage();
            return nextItem;
        }
        return null;
    }
    
    getQueuePosition(userId, productId) {
        const queueItem = this.queue.find(item => 
            item.userId == userId && item.productId == productId && !item.processed
        );
        return queueItem ? queueItem.position : null;
    }
    
    // Analytics methods
    getAnalytics() {
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = this.orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const usersByTier = {
            bronze: this.users.filter(u => u.tier === 'bronze').length,
            silver: this.users.filter(u => u.tier === 'silver').length,
            gold: this.users.filter(u => u.tier === 'gold').length
        };
        
        const topProducts = this.products
            .map(product => {
                const sales = this.orders.reduce((total, order) => {
                    const item = order.items.find(i => i.productId == product.id);
                    return total + (item ? item.quantity : 0);
                }, 0);
                return { ...product, sales };
            })
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
        
        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            usersByTier,
            topProducts,
            activeFlashSales: this.products.filter(p => p.isFlashSale).length,
            queueLength: this.queue.length
        };
    }
    
    // Storage methods
    saveToStorage() {
        try {
            localStorage.setItem('flashmart_products', JSON.stringify(this.products));
            localStorage.setItem('flashmart_users', JSON.stringify(this.users));
            localStorage.setItem('flashmart_orders', JSON.stringify(this.orders));
            localStorage.setItem('flashmart_queue', JSON.stringify(this.queue));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const products = localStorage.getItem('flashmart_products');
            const users = localStorage.getItem('flashmart_users');
            const orders = localStorage.getItem('flashmart_orders');
            const queue = localStorage.getItem('flashmart_queue');
            
            if (products) {
                this.products = JSON.parse(products);
                // Convert date strings back to Date objects
                this.products.forEach(product => {
                    if (product.flashSaleEnd) {
                        product.flashSaleEnd = new Date(product.flashSaleEnd);
                    }
                });
            }
            
            if (users) {
                this.users = JSON.parse(users);
                this.users.forEach(user => {
                    if (user.joinDate) {
                        user.joinDate = new Date(user.joinDate);
                    }
                });
            }
            
            if (orders) {
                this.orders = JSON.parse(orders);
                this.orders.forEach(order => {
                    order.createdAt = new Date(order.createdAt);
                });
            }
            
            if (queue) {
                this.queue = JSON.parse(queue);
                this.queue.forEach(item => {
                    item.joinTime = new Date(item.joinTime);
                    if (item.processTime) {
                        item.processTime = new Date(item.processTime);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }
    
    // Utility methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    }
    
    formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Global data manager instance - Using Firebase Data Service instead
// const dataManager = new DataManager();