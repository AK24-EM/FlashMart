/**
 * Heap Data Structure Utilities for FlashMart
 *
 * Provides efficient min-heap and max-heap implementations for:
 * - Product recommendations (price-based, popularity-based)
 * - Priority queues for flash sales
 * - Top-K selections for analytics
 */

class Heap {
    constructor(compareFn = (a, b) => a - b) {
        this.heap = [];
        this.compare = compareFn; // For min-heap, use (a, b) => a - b
                                   // For max-heap, use (a, b) => b - a
    }

    get size() {
        return this.heap.length;
    }

    get isEmpty() {
        return this.size === 0;
    }

    // Get parent, left child, and right child indices
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Swap elements
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // Maintain heap property by bubbling up
    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = this.parent(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
                break;
            }
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    // Maintain heap property by sinking down
    sinkDown(index) {
        const length = this.size;
        while (true) {
            const leftIndex = this.left(index);
            const rightIndex = this.right(index);
            let smallest = index;

            if (leftIndex < length && this.compare(this.heap[leftIndex], this.heap[smallest]) < 0) {
                smallest = leftIndex;
            }

            if (rightIndex < length && this.compare(this.heap[rightIndex], this.heap[smallest]) < 0) {
                smallest = rightIndex;
            }

            if (smallest === index) break;

            this.swap(index, smallest);
            index = smallest;
        }
    }

    // Insert element into heap
    push(value) {
        this.heap.push(value);
        this.bubbleUp(this.size - 1);
        return this.size;
    }

    // Remove and return root element
    pop() {
        if (this.isEmpty) return null;
        if (this.size === 1) return this.heap.pop();

        const root = this.heap[0];
        const last = this.heap.pop();
        this.heap[0] = last;
        this.sinkDown(0);

        return root;
    }

    // Peek at root element without removing
    peek() {
        return this.isEmpty ? null : this.heap[0];
    }

    // Get top K elements
    getTopK(k) {
        const result = [];
        const tempHeap = new Heap(this.compare);

        // Copy heap elements
        tempHeap.heap = [...this.heap];

        for (let i = 0; i < Math.min(k, this.size); i++) {
            if (!tempHeap.isEmpty) {
                result.push(tempHeap.pop());
            }
        }

        return result;
    }

    // Check if heap contains value based on comparison
    contains(value) {
        return this.heap.some(item => this.compare(item, value) === 0);
    }
}

// Min Heap (default) - smaller values have higher priority
class MinHeap extends Heap {
    constructor() {
        super((a, b) => a - b);
    }
}

// Max Heap - larger values have higher priority
class MaxHeap extends Heap {
    constructor() {
        super((a, b) => b - a);
    }
}

// Priority Queue implementation using Heap
class PriorityQueue extends Heap {
    constructor(compareFn = (a, b) => a.priority - b.priority) {
        super(compareFn);
    }

    push(item) {
        return super.push(item);
    }

    pop() {
        return super.pop();
    }
}

/**
 * Enhanced Heap Data Structure Utilities for FlashMart
 *
 * Provides efficient min-heap and max-heap implementations for:
 * - Product recommendations (price-based, popularity-based, recency-based)
 * - Priority queues for flash sales with time-based prioritization
 * - Top-K selections for analytics
 * - Real-time recommendation scoring
 */

// Product Recommendation Score Calculator
class ProductScoreCalculator {
    static calculatePopularityScore(product, userPreferences = {}) {
        let score = 0;

        // Base popularity (views, purchases, ratings)
        score += (product.views || 0) * 0.3;
        score += (product.purchases || 0) * 0.5;
        score += (product.rating || 0) * 10;

        // Category preference bonus
        if (userPreferences.categories && userPreferences.categories.includes(product.category)) {
            score *= 1.2;
        }

        // Price preference (lower price = higher score for budget-conscious users)
        if (userPreferences.budgetPreference === 'low') {
            score += (1000 - (product.price || 0)) * 0.1;
        }

        // Recency bonus (newer products get slight boost)
        const daysSinceAdded = product.dateAdded ? (Date.now() - new Date(product.dateAdded).getTime()) / (1000 * 60 * 60 * 24) : 0;
        if (daysSinceAdded < 30) {
            score *= 1.1;
        }

        return Math.round(score * 100) / 100;
    }

    static calculateRecencyScore(product, currentTime = Date.now()) {
        const productTime = new Date(product.lastUpdated || product.dateAdded || 0).getTime();
        const hoursDiff = (currentTime - productTime) / (1000 * 60 * 60);

        // Exponential decay: newer products get much higher scores
        return Math.exp(-hoursDiff / 24) * 100; // 24 hours half-life
    }

    static calculatePriceScore(product, userBudget = null) {
        const price = product.price || 0;
        if (!userBudget) return 100 - Math.min(price / 10, 90); // Simple inverse scoring

        // If user has budget preference, score based on affordability
        const affordability = userBudget / price;
        return Math.min(affordability * 50, 100);
    }
}

class Heap {
    constructor(compareFn = (a, b) => a - b) {
        this.heap = [];
        this.compare = compareFn; // For min-heap, use (a, b) => a - b
                                   // For max-heap, use (a, b) => b - a
    }

    get size() {
        return this.heap.length;
    }

    get isEmpty() {
        return this.size === 0;
    }

    // Get parent, left child, and right child indices
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Swap elements
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // Maintain heap property by bubbling up
    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = this.parent(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
                break;
            }
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    // Maintain heap property by sinking down
    sinkDown(index) {
        const length = this.size;
        while (true) {
            const leftIndex = this.left(index);
            const rightIndex = this.right(index);
            let smallest = index;

            if (leftIndex < length && this.compare(this.heap[leftIndex], this.heap[smallest]) < 0) {
                smallest = leftIndex;
            }

            if (rightIndex < length && this.compare(this.heap[rightIndex], this.heap[smallest]) < 0) {
                smallest = rightIndex;
            }

            if (smallest === index) break;

            this.swap(index, smallest);
            index = smallest;
        }
    }

    // Insert element into heap
    push(value) {
        this.heap.push(value);
        this.bubbleUp(this.size - 1);
        return this.size;
    }

    // Remove and return root element
    pop() {
        if (this.isEmpty) return null;
        if (this.size === 1) return this.heap.pop();

        const root = this.heap[0];
        const last = this.heap.pop();
        this.heap[0] = last;
        this.sinkDown(0);

        return root;
    }

    // Peek at root element without removing
    peek() {
        return this.isEmpty ? null : this.heap[0];
    }

    // Get top K elements efficiently
    getTopK(k) {
        if (k >= this.size) {
            return [...this.heap].sort(this.compare);
        }

        const result = [];
        const tempHeap = new Heap(this.compare);
        tempHeap.heap = [...this.heap];

        for (let i = 0; i < Math.min(k, this.size); i++) {
            if (!tempHeap.isEmpty) {
                result.push(tempHeap.pop());
            }
        }

        return result;
    }

    // Get all elements sorted (destructive)
    getSorted() {
        const result = [];
        while (!this.isEmpty) {
            result.push(this.pop());
        }
        return result;
    }

    // Batch insert for efficiency
    batchPush(items) {
        const originalSize = this.size;
        this.heap.push(...items);
        // Heapify from bottom up for efficiency
        for (let i = Math.floor(this.size / 2) - 1; i >= 0; i--) {
            this.sinkDown(i);
        }
        return this.size - originalSize;
    }

    // Check if heap contains value based on comparison
    contains(value) {
        return this.heap.some(item => this.compare(item, value) === 0);
    }

    // Update value if it exists (for priority updates)
    update(oldValue, newValue) {
        const index = this.heap.findIndex(item => this.compare(item, oldValue) === 0);
        if (index === -1) return false;

        this.heap[index] = newValue;

        // Restore heap property
        if (this.compare(newValue, oldValue) < 0) {
            this.bubbleUp(index);
        } else {
            this.sinkDown(index);
        }

        return true;
    }
}

// Min Heap (default) - smaller values have higher priority
class MinHeap extends Heap {
    constructor() {
        super((a, b) => a - b);
    }
}

// Max Heap - larger values have higher priority
class MaxHeap extends Heap {
    constructor() {
        super((a, b) => b - a);
    }
}

// Priority Queue implementation using Heap
class PriorityQueue extends Heap {
    constructor(compareFn = (a, b) => a.priority - b.priority) {
        super(compareFn);
    }

    push(item) {
        return super.push(item);
    }

    pop() {
        return super.pop();
    }
}

// Product Recommendation Heap - scores products for recommendations
class ProductRecommendationHeap extends MaxHeap {
    constructor(scoringStrategy = 'popularity') {
        super();
        this.scoringStrategy = scoringStrategy;
        this.productMap = new Map(); // For efficient updates
    }

    // Add or update product with calculated score
    addProduct(product, userPreferences = {}) {
        const score = this.calculateScore(product, userPreferences);
        const scoredProduct = { ...product, recommendationScore: score };

        // Check if product already exists for update
        if (this.productMap.has(product.id)) {
            const existingScore = this.productMap.get(product.id);
            this.update(existingScore, scoredProduct);
        } else {
            this.push(scoredProduct);
        }

        this.productMap.set(product.id, scoredProduct);
        return scoredProduct;
    }

    // Remove product from recommendations
    removeProduct(productId) {
        const product = this.productMap.get(productId);
        if (!product) return false;

        this.productMap.delete(productId);
        // Note: Full removal from heap is complex, we'd need to rebuild
        // For now, we'll mark as removed and filter in getTopProducts
        return true;
    }

    // Get top K product recommendations
    getTopProducts(k = 10, userPreferences = {}) {
        const candidates = this.heap
            .filter(product => product.id) // Filter out removed products
            .map(product => ({
                ...product,
                score: this.calculateScore(product, userPreferences)
            }))
            .sort((a, b) => b.score - a.score);

        return candidates.slice(0, k);
    }

    // Recalculate scores for existing products
    refreshScores(userPreferences = {}) {
        this.heap.forEach((product, index) => {
            if (product.id) {
                const newScore = this.calculateScore(product, userPreferences);
                this.heap[index] = { ...product, recommendationScore: newScore };
            }
        });

        // Re-heapify
        for (let i = Math.floor(this.size / 2) - 1; i >= 0; i--) {
            this.sinkDown(i);
        }
    }

    calculateScore(product, userPreferences) {
        switch (this.scoringStrategy) {
            case 'popularity':
                return ProductScoreCalculator.calculatePopularityScore(product, userPreferences);
            case 'recency':
                return ProductScoreCalculator.calculateRecencyScore(product);
            case 'price':
                return ProductScoreCalculator.calculatePriceScore(product, userPreferences.budget);
            case 'hybrid':
                return (
                    ProductScoreCalculator.calculatePopularityScore(product, userPreferences) * 0.4 +
                    ProductScoreCalculator.calculateRecencyScore(product) * 0.3 +
                    ProductScoreCalculator.calculatePriceScore(product, userPreferences.budget) * 0.3
                );
            default:
                return ProductScoreCalculator.calculatePopularityScore(product, userPreferences);
        }
    }
}

// Flash Sale Priority Queue - prioritizes by end time and discount
class FlashSalePriorityQueue extends PriorityQueue {
    constructor() {
        super((a, b) => {
            // Primary: sooner end time gets higher priority
            const timeCompare = a.endTime - b.endTime;
            if (timeCompare !== 0) return timeCompare;

            // Secondary: higher discount gets higher priority
            const discountA = ((a.originalPrice - a.salePrice) / a.originalPrice) * 100;
            const discountB = ((b.originalPrice - b.salePrice) / b.originalPrice) * 100;
            return discountB - discountA;
        });
    }

    // Add flash sale with calculated priority
    addFlashSale(product, originalPrice, salePrice, endTime) {
        const discount = ((originalPrice - salePrice) / originalPrice) * 100;
        const saleItem = {
            ...product,
            originalPrice,
            salePrice,
            endTime: new Date(endTime).getTime(),
            discount,
            priority: discount // Higher discount = higher priority
        };

        return this.push(saleItem);
    }

    // Get next X flash sales
    getNextSales(count = 5) {
        const sales = [];
        for (let i = 0; i < count && !this.isEmpty; i++) {
            const sale = this.pop();
            if (sale && sale.endTime > Date.now()) {
                sales.push(sale);
            }
        }

        // Put back the items we popped (except expired ones)
        sales.forEach(sale => this.push(sale));

        return sales;
    }
}

window.HeapUtils = {
    Heap,
    MinHeap,
    MaxHeap,
    PriorityQueue,
    ProductRecommendationHeap,
    FlashSalePriorityQueue,
    ProductScoreCalculator
};
