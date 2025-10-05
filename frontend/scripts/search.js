// Search functionality for FlashMart
class SearchManager {
    constructor() {
        this.searchTerm = '';
        this.selectedCategory = '';
        this.searchResults = [];
        this.isSearching = false;
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.setupSearchElements();
        this.setupEventListeners();
        console.log('Search Manager initialized');
    }

    setupSearchElements() {
        // Get search elements
        this.searchField = document.querySelector('.nav-search-field');
        this.searchButton = document.querySelector('.nav-search-submit');
        this.categoryDropdown = document.querySelector('.nav-search-dropdown');

        // Create search suggestions dropdown if it doesn't exist
        if (!document.querySelector('.search-suggestions-dropdown')) {
            this.createSearchSuggestionsDropdown();
        }
        this.suggestionsDropdown = document.querySelector('.search-suggestions-dropdown');
        this.suggestionItems = [];

        // Create search results modal if it doesn't exist
        if (!document.getElementById('search-modal')) {
            this.createSearchModal();
        }
        this.searchModal = document.getElementById('search-modal');
        this.searchResultsContainer = document.getElementById('search-results');
        this.searchTermDisplay = document.getElementById('search-term-display');
        this.searchCountDisplay = document.getElementById('search-count-display');

        // Search suggestions data
        this.suggestionsData = [
            { text: 'iPhone', category: 'Electronics', icon: 'fas fa-mobile-alt' },
            { text: 'Samsung Galaxy', category: 'Electronics', icon: 'fas fa-mobile-alt' },
            { text: 'Headphones', category: 'Electronics', icon: 'fas fa-headphones' },
            { text: 'Laptop', category: 'Electronics', icon: 'fas fa-laptop' },
            { text: 'Watch', category: 'Electronics', icon: 'fas fa-clock' },
            { text: 'Shoes', category: 'Clothing', icon: 'fas fa-shoe-prints' },
            { text: 'T-shirt', category: 'Clothing', icon: 'fas fa-tshirt' },
            { text: 'Jeans', category: 'Clothing', icon: 'fas fa-user-md' },
            { text: 'Books', category: 'Books', icon: 'fas fa-book' },
            { text: 'Novel', category: 'Books', icon: 'fas fa-book-open' },
            { text: 'Textbook', category: 'Books', icon: 'fas fa-book' },
            { text: 'Smart TV', category: 'Electronics', icon: 'fas fa-tv' },
            { text: 'Bluetooth Speaker', category: 'Electronics', icon: 'fas fa-volume-up' },
            { text: 'Wireless Charger', category: 'Electronics', icon: 'fas fa-charging-station' },
            { text: 'Gaming Mouse', category: 'Electronics', icon: 'fas fa-mouse' }
        ];
    }

    setupEventListeners() {
        // Search input handling with debouncing
        if (this.searchField) {
            this.searchField.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            // Handle Enter key in search field
            this.searchField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateSuggestions('down');
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateSuggestions('up');
                }
            });

            // Handle focus and blur for suggestions
            this.searchField.addEventListener('focus', () => {
                if (this.searchTerm.trim()) {
                    this.showSuggestions();
                }
            });

            this.searchField.addEventListener('blur', (e) => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => {
                    if (this.suggestionsDropdown) {
                        this.suggestionsDropdown.classList.remove('show');
                    }
                }, 200);
            });
        }

        // Search button click
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Category dropdown change
        if (this.categoryDropdown) {
            this.categoryDropdown.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                if (this.searchTerm.trim()) {
                    this.performSearch();
                }
            });
        }

        // Search modal close handlers
        if (this.searchModal) {
            const closeBtn = this.searchModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeSearchModal();
                });
            }

            this.searchModal.addEventListener('click', (e) => {
                if (e.target === this.searchModal) {
                    this.closeSearchModal();
                }
            });
        }

        // Handle escape key to close search modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchModal.style.display === 'block') {
                this.closeSearchModal();
            }
        });

        // Suggestion item click handlers
        if (this.suggestionsDropdown) {
            this.suggestionsDropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-item')) {
                    const suggestionText = e.target.querySelector('.suggestion-text').textContent;
                    this.searchField.value = suggestionText;
                    this.searchTerm = suggestionText;
                    this.performSearch();
                    this.suggestionsDropdown.classList.remove('show');
                }
            });
        }
    }

    handleSearchInput(value) {
        this.searchTerm = value;

        // Show suggestions if there's a search term
        if (this.searchTerm.trim()) {
            this.showSuggestions();
        } else {
            this.hideSuggestions();
        }

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search for better performance
        this.searchTimeout = setTimeout(() => {
            if (this.searchTerm.trim()) {
                this.performSearch();
            } else {
                this.clearSearch();
            }
        }, 300); // 300ms debounce
    }

    createSearchSuggestionsDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions-dropdown';
        dropdown.innerHTML = `
            <div class="suggestions-list"></div>
        `;

        // Insert after the search container
        const searchContainer = document.querySelector('.nav-search');
        if (searchContainer) {
            searchContainer.appendChild(dropdown);
        }
    }

    showSuggestions() {
        if (!this.suggestionsDropdown || !this.searchTerm.trim()) return;

        const filteredSuggestions = this.suggestionsData.filter(suggestion =>
            suggestion.text.toLowerCase().includes(this.searchTerm.toLowerCase())
        ).slice(0, 6); // Show max 6 suggestions

        const suggestionsList = this.suggestionsDropdown.querySelector('.suggestions-list');
        suggestionsList.innerHTML = filteredSuggestions.map(suggestion => `
            <div class="suggestion-item" data-text="${suggestion.text}">
                <div class="suggestion-icon">
                    <i class="${suggestion.icon}"></i>
                </div>
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-category">${suggestion.category}</div>
            </div>
        `).join('');

        if (filteredSuggestions.length > 0) {
            this.suggestionsDropdown.classList.add('show');
            this.suggestionItems = this.suggestionsDropdown.querySelectorAll('.suggestion-item');
            this.currentSuggestionIndex = -1;
        } else {
            this.hideSuggestions();
        }
    }

    hideSuggestions() {
        if (this.suggestionsDropdown) {
            this.suggestionsDropdown.classList.remove('show');
            this.currentSuggestionIndex = -1;
        }
    }

    navigateSuggestions(direction) {
        if (!this.suggestionItems || this.suggestionItems.length === 0) return;

        // Remove previous selection
        this.suggestionItems.forEach(item => item.classList.remove('selected'));

        if (direction === 'down') {
            this.currentSuggestionIndex = Math.min(this.currentSuggestionIndex + 1, this.suggestionItems.length - 1);
        } else if (direction === 'up') {
            this.currentSuggestionIndex = Math.max(this.currentSuggestionIndex - 1, -1);
        }

        if (this.currentSuggestionIndex >= 0) {
            this.suggestionItems[this.currentSuggestionIndex].classList.add('selected');
            const selectedText = this.suggestionItems[this.currentSuggestionIndex].querySelector('.suggestion-text').textContent;
            this.searchField.value = selectedText;
            this.searchTerm = selectedText;
        } else {
            this.searchField.value = this.searchTerm;
        }
    }

    async performSearch() {
        if (!this.searchTerm.trim() && !this.selectedCategory) {
            this.clearSearch();
            return;
        }

        this.isSearching = true;
        this.showSearchModal();

        try {
            // Get all products
            const allProducts = await dataManager.getProducts();

            // Filter products based on search term and category
            this.searchResults = allProducts.filter(product => {
                const matchesSearchTerm = !this.searchTerm.trim() ||
                    product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    product.category.toLowerCase().includes(this.searchTerm.toLowerCase());

                const matchesCategory = !this.selectedCategory ||
                    this.selectedCategory === '' ||
                    product.category === this.selectedCategory;

                return matchesSearchTerm && matchesCategory;
            });

            this.displaySearchResults();

        } catch (error) {
            console.error('Error performing search:', error);
            this.showSearchError('An error occurred while searching. Please try again.');
        } finally {
            this.isSearching = false;
        }
    }

    displaySearchResults() {
        if (!this.searchResultsContainer) return;

        // Update search term display
        if (this.searchTermDisplay) {
            this.searchTermDisplay.textContent = this.searchTerm || 'all products';
        }

        // Update results count
        if (this.searchCountDisplay) {
            const count = this.searchResults.length;
            this.searchCountDisplay.textContent = `${count} result${count !== 1 ? 's' : ''} found`;
        }

        if (this.searchResults.length === 0) {
            this.searchResultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No results found</h3>
                    <p>We couldn't find any products matching "${this.searchTerm}"${this.selectedCategory ? ` in ${this.selectedCategory}` : ''}.</p>
                    <div class="search-suggestions">
                        <h4>Try searching for:</h4>
                        <ul>
                            <li>Product names (e.g., "headphones", "watch")</li>
                            <li>Categories (e.g., "electronics", "clothing")</li>
                            <li>Brand names or keywords</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }

        // Display search results with enhanced styling
        this.searchResultsContainer.innerHTML = this.searchResults.map((product, index) => {
            const currentPrice = product.isFlashSale ? product.flashSalePrice : product.price;
            const discountPercent = Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100);
            const currentStock = product.isFlashSale ? product.flashSaleStock : product.stock;

            let stockClass = 'stock-high';
            let stockText = `${currentStock} in stock`;

            if (currentStock === 0) {
                stockClass = 'stock-out';
                stockText = 'Out of Stock';
            } else if (currentStock <= 5) {
                stockClass = 'stock-low';
                stockText = `Only ${currentStock} left!`;
            } else if (currentStock <= 20) {
                stockClass = 'stock-medium';
            }

            const isExpired = product.isFlashSale && new Date() > new Date(product.flashSaleEnd);
            const canPurchase = currentStock > 0 && !isExpired;

            return `
                <div class="search-result-item" data-product-id="${product.id}" style="animation-delay: ${index * 0.05}s">
                    <div class="result-image">
                        <img src="${product.image}" alt="${product.name}" onclick="showProductDetails('${product.id}')" loading="lazy">
                        ${product.isFlashSale && !isExpired ? '<div class="flash-badge">⚡</div>' : ''}
                    </div>
                    <div class="result-info">
                        <h4 onclick="showProductDetails('${product.id}')" style="cursor: pointer;">${product.name}</h4>
                        <div class="result-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                        <div class="result-description">${product.description}</div>
                        <div class="result-price">
                            <span class="sale-price">₹${currentPrice.toLocaleString()}</span>
                            ${discountPercent > 0 ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                            ${discountPercent > 0 ? `<span class="discount-badge">${discountPercent}% OFF</span>` : ''}
                        </div>
                        <div class="result-stock ${stockClass}">
                            <i class="fas fa-circle"></i>
                            ${stockText}
                        </div>
                    </div>
                    <div class="result-actions">
                        ${canPurchase ? `
                            <button class="btn btn-primary btn-small" onclick="addToCart('${product.id}', ${product.isFlashSale})">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-small" disabled>
                                <i class="fas fa-times-circle"></i>
                                Out of Stock
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    showSearchError(message) {
        if (this.searchResultsContainer) {
            this.searchResultsContainer.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary btn-small" onclick="searchManager.performSearch()">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showSearchModal() {
        if (this.searchModal) {
            this.searchModal.style.display = 'block';

            // Add backdrop if not exists
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop';
                backdrop.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                `;
                backdrop.onclick = () => this.closeSearchModal();
                document.body.appendChild(backdrop);
            }
            backdrop.style.display = 'block';

            // Focus on search field if empty
            if (!this.searchTerm.trim()) {
                this.searchField.focus();
            }
        }
    }

    closeSearchModal() {
        if (this.searchModal) {
            this.searchModal.style.display = 'none';
        }

        // Hide backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
        }

        // Clear search if empty
        if (!this.searchTerm.trim()) {
            this.clearSearch();
        }
    }

    clearSearch() {
        this.searchTerm = '';
        this.searchResults = [];
        this.isSearching = false;

        if (this.searchField) {
            this.searchField.value = '';
        }

        if (this.categoryDropdown) {
            this.categoryDropdown.value = '';
            this.selectedCategory = '';
        }

        this.hideSuggestions();
        this.closeSearchModal();
    }

    createSearchModal() {
        const modal = document.createElement('div');
        modal.id = 'search-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <span class="close">&times;</span>
                <div class="search-modal-header">
                    <div class="search-modal-title">
                        <h3>Search Results</h3>
                        <div class="search-info">
                            <span id="search-term-display" class="search-term">all products</span>
                            <span id="search-count-display" class="search-count">0 results found</span>
                        </div>
                    </div>
                    <div class="search-modal-actions">
                        <button class="btn btn-secondary btn-small" onclick="searchManager.clearSearch()">
                            <i class="fas fa-times"></i>
                            Clear
                        </button>
                    </div>
                </div>
                <div class="search-modal-body">
                    <div class="search-loading" id="search-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Searching...</p>
                    </div>
                    <div class="search-results" id="search-results">
                        <!-- Search results will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Utility methods for external use
    searchForTerm(term, category = '') {
        this.searchTerm = term;
        this.selectedCategory = category;
        this.performSearch();
    }

    getCurrentSearchState() {
        return {
            searchTerm: this.searchTerm,
            selectedCategory: this.selectedCategory,
            resultsCount: this.searchResults.length,
            isSearching: this.isSearching
        };
    }
}

// Global search functions for external use
function performGlobalSearch(term, category) {
    if (window.searchManager) {
        window.searchManager.searchForTerm(term, category);
    } else {
        console.error('Search manager not initialized');
    }
}

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search manager
    window.searchManager = new SearchManager();

    console.log('Search functionality initialized');
});
