// Product Management component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class ManageProducts {
  constructor(productSiteId) {
    this.productSiteId = productSiteId;
    this.element = null;
    this.currentUser = null;
    this.productSite = null;
    this.products = [];
    this.filteredProducts = [];
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.searchTerm = '';
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'manage-products-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Manage Products</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Product Site
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading products...</p>
        </div>
        
        <div id="products-management" class="products-management" style="display: none;">
          <div class="content-controls">
            <div class="controls-row">
              <div class="search-box">
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="Search products by name or description..."
                  class="search-input"
                >
                <button class="search-button" id="search-button">SEARCH</button>
              </div>
              
              <div class="filter-controls">
                <select id="status-filter" class="filter-select">
                  <option value="all">All Products</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                
                <select id="category-filter" class="filter-select">
                  <option value="all">All Categories</option>
                </select>
                
                <select id="sort-select" class="filter-select">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-low">Price Low to High</option>
                  <option value="price-high">Price High to Low</option>
                </select>
              </div>
            </div>
            
            <div class="bulk-actions" id="bulk-actions" style="display: none;">
              <span class="selected-count" id="selected-count">0 products selected</span>
              <div class="bulk-buttons">
                <button class="bulk-button publish-button" id="bulk-publish">
                  PUBLISH Selected
                </button>
                <button class="bulk-button draft-button" id="bulk-draft">
                  DRAFT Selected
                </button>
                <button class="bulk-button delete-button" id="bulk-delete">
                  DELETE Selected
                </button>
              </div>
            </div>
          </div>
          
          <div class="products-container">
            <div class="products-header">
              <div class="products-stats" id="products-stats">
                <!-- Stats will be loaded here -->
              </div>
              
              <div class="products-actions">
                <button class="action-button" id="create-new-product">
                  <span class="action-icon">ADD</span>
                  Create New Product
                </button>
              </div>
            </div>
            
            <div class="products-list" id="products-list">
              <!-- Products will be loaded here -->
            </div>
          </div>
        </div>
        
        <div id="manage-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadProductSiteAndProducts();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    const searchInput = this.element.querySelector('#search-input');
    const searchButton = this.element.querySelector('#search-button');
    const statusFilter = this.element.querySelector('#status-filter');
    const categoryFilter = this.element.querySelector('#category-filter');
    const sortSelect = this.element.querySelector('#sort-select');
    const createNewProductButton = this.element.querySelector('#create-new-product');
    const bulkPublishButton = this.element.querySelector('#bulk-publish');
    const bulkDraftButton = this.element.querySelector('#bulk-draft');
    const bulkDeleteButton = this.element.querySelector('#bulk-delete');

    // Navigation
    backButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-product-site-${this.productSiteId}` } 
      }));
    });

    // Search
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterAndSortProducts();
    });

    searchButton.addEventListener('click', () => {
      this.filterAndSortProducts();
    });

    // Filters
    statusFilter.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.filterAndSortProducts();
    });

    categoryFilter.addEventListener('change', (e) => {
      this.currentCategoryFilter = e.target.value;
      this.filterAndSortProducts();
    });

    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.filterAndSortProducts();
    });

    // Create new product
    createNewProductButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `create-product-${this.productSiteId}` } 
      }));
    });

    // Bulk actions
    bulkPublishButton.addEventListener('click', () => this.handleBulkAction('publish'));
    bulkDraftButton.addEventListener('click', () => this.handleBulkAction('draft'));
    bulkDeleteButton.addEventListener('click', () => this.handleBulkAction('delete'));
  }

  async loadProductSiteAndProducts() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      // Load product site details
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const productSites = userData.productSites || [];
        this.productSite = productSites.find(site => site.id === this.productSiteId);
        
        if (!this.productSite) {
          this.showError('Product site not found');
          return;
        }
      } else {
        this.showError('User data not found');
        return;
      }

      // Load products
      await this.loadProducts();
      this.showProductsManagement();

    } catch (error) {
      console.error('Error loading product site and products:', error);
      this.showError('Error loading products');
    }
  }

  async loadProducts() {
    try {
      const productsCollectionRef = collection(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products');
      const productsQuery = query(productsCollectionRef, orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      this.products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.populateCategoryFilter();
      this.filterAndSortProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
      this.filteredProducts = [];
    }
  }

  populateCategoryFilter() {
    const categoryFilter = this.element.querySelector('#category-filter');
    const categories = [...new Set(this.products.map(product => product.category).filter(cat => cat))];
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  showProductsManagement() {
    const loadingState = this.element.querySelector('#loading-state');
    const productsManagement = this.element.querySelector('#products-management');
    
    loadingState.style.display = 'none';
    productsManagement.style.display = 'block';
    
    this.updateProductsStats();
    this.renderProductsList();
  }

  filterAndSortProducts() {
    let filtered = [...this.products];

    // Apply status filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(product => product.status === this.currentFilter);
    }

    // Apply category filter
    if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === this.currentCategoryFilter);
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(this.searchTerm) ||
        (product.description && product.description.toLowerCase().includes(this.searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(this.searchTerm))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    this.filteredProducts = filtered;
    this.renderProductsList();
    this.updateProductsStats();
  }

  updateProductsStats() {
    const statsContainer = this.element.querySelector('#products-stats');
    const totalProducts = this.products.length;
    const publishedProducts = this.products.filter(product => product.status === 'published').length;
    const draftProducts = this.products.filter(product => product.status === 'draft').length;
    const filteredCount = this.filteredProducts.length;

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-number">${totalProducts}</span>
        <span class="stat-label">Total Products</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${publishedProducts}</span>
        <span class="stat-label">Published</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${draftProducts}</span>
        <span class="stat-label">Drafts</span>
      </div>
      ${filteredCount !== totalProducts ? `
        <div class="stat-item">
          <span class="stat-number">${filteredCount}</span>
          <span class="stat-label">Filtered Results</span>
        </div>
      ` : ''}
    `;
  }

  renderProductsList() {
    const productsListContainer = this.element.querySelector('#products-list');
    
    if (this.filteredProducts.length === 0) {
      productsListContainer.innerHTML = `
        <div class="empty-state">
          <p>No products found.</p>
          ${this.products.length === 0 ? `
            <button class="action-button" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-product-${this.productSiteId}' } }))">
              <span class="action-icon">ADD</span>
              Create Your First Product
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    const productsHTML = this.filteredProducts.map(product => this.renderProductItem(product)).join('');
    
    productsListContainer.innerHTML = `
      <div class="products-table">
        <div class="products-table-header">
          <div class="table-cell checkbox-cell">
            <input type="checkbox" id="select-all" class="product-checkbox">
          </div>
          <div class="table-cell product-cell">Product</div>
          <div class="table-cell image-cell">Image</div>
          <div class="table-cell price-cell">Price</div>
          <div class="table-cell status-cell">Status</div>
          <div class="table-cell category-cell">Category</div>
          <div class="table-cell date-cell">Date</div>
          <div class="table-cell actions-cell">Actions</div>
        </div>
        <div class="products-table-body">
          ${productsHTML}
        </div>
      </div>
    `;

    this.attachProductEventListeners();
  }

  renderProductItem(product) {
    const createdDate = this.formatDate(product.createdAt);
    const statusClass = product.status === 'published' ? 'status-published' : 'status-draft';
    const price = this.formatPrice(product.price || 0, product.currency || 'USD');
    const originalPrice = product.originalPrice && product.originalPrice !== product.price ? 
      this.formatPrice(product.originalPrice, product.currency || 'USD') : null;
    
    return `
      <div class="product-row" data-product-id="${product.id}">
        <div class="table-cell checkbox-cell">
          <input type="checkbox" class="product-checkbox" data-product-id="${product.id}">
        </div>
        <div class="table-cell product-cell">
          <div class="product-details">
            <strong class="product-name">${product.name}</strong>
            <div class="product-slug">/${product.slug}</div>
          </div>
        </div>
        <div class="table-cell image-cell">
          ${product.imageUrl ? `
            <div class="product-image">
              <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
            </div>
          ` : '<div class="no-image">PRODUCT</div>'}
        </div>
        <div class="table-cell price-cell">
          <div class="price-info">
            <span class="current-price">${price}</span>
            ${originalPrice ? `<span class="original-price">${originalPrice}</span>` : ''}
            ${product.percentOff > 0 ? `<span class="discount-badge">-${product.percentOff}%</span>` : ''}
          </div>
        </div>
        <div class="table-cell status-cell">
          <span class="status-badge ${statusClass}">${product.status}</span>
        </div>
        <div class="table-cell category-cell">${product.category || 'Uncategorized'}</div>
        <div class="table-cell date-cell">${createdDate}</div>
        <div class="table-cell actions-cell">
          <div class="product-actions">
            <button class="product-action-button edit-button" data-product-id="${product.id}" title="Edit">
              EDIT
            </button>
            <button class="product-action-button ${product.status === 'published' ? 'draft-button' : 'publish-button'}" 
                    data-product-id="${product.id}" 
                    title="${product.status === 'published' ? 'Move to Draft' : 'Publish'}">
              ${product.status === 'published' ? 'DRAFT' : 'PUBLISH'}
            </button>
            <button class="product-action-button duplicate-button" data-product-id="${product.id}" title="Duplicate">
              COPY
            </button>
            <button class="product-action-button delete-button" data-product-id="${product.id}" title="Delete">
              DELETE
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachProductEventListeners() {
    const selectAllCheckbox = this.element.querySelector('#select-all');
    const productCheckboxes = this.element.querySelectorAll('.product-checkbox[data-product-id]');
    const editButtons = this.element.querySelectorAll('.edit-button');
    const publishDraftButtons = this.element.querySelectorAll('.publish-button, .draft-button');
    const duplicateButtons = this.element.querySelectorAll('.duplicate-button');
    const deleteButtons = this.element.querySelectorAll('.delete-button');

    // Select all functionality
    selectAllCheckbox.addEventListener('change', (e) => {
      productCheckboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
      this.updateBulkActions();
    });

    // Individual checkboxes
    productCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateBulkActions();
      });
    });

    // Product actions
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.handleEditProduct(productId);
      });
    });

    publishDraftButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.handleToggleProductStatus(productId);
      });
    });

    duplicateButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.handleDuplicateProduct(productId);
      });
    });

    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.handleDeleteProduct(productId);
      });
    });
  }

  updateBulkActions() {
    const selectedCheckboxes = this.element.querySelectorAll('.product-checkbox[data-product-id]:checked');
    const bulkActionsContainer = this.element.querySelector('#bulk-actions');
    const selectedCountElement = this.element.querySelector('#selected-count');

    if (selectedCheckboxes.length > 0) {
      bulkActionsContainer.style.display = 'flex';
      selectedCountElement.textContent = `${selectedCheckboxes.length} product${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else {
      bulkActionsContainer.style.display = 'none';
    }
  }

  async handleToggleProductStatus(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const newStatus = product.status === 'published' ? 'draft' : 'published';
    
    try {
      const productDocRef = doc(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products', productId);
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      await updateDoc(productDocRef, updateData);

      // Update local data
      const productIndex = this.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        this.products[productIndex] = { ...this.products[productIndex], ...updateData };
      }

      this.filterAndSortProducts();
      toast.success(`Product ${newStatus === 'published' ? 'published' : 'moved to draft'} successfully!`);

    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Error updating product status. Please try again.');
    }
  }

  async handleDeleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const confirmed = confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const productDocRef = doc(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products', productId);
      await deleteDoc(productDocRef);

      // Remove from local data
      this.products = this.products.filter(p => p.id !== productId);
      this.filterAndSortProducts();

      // Trigger sidebar update to refresh product counts
      window.dispatchEvent(new CustomEvent('product-sites-updated'));

      toast.success('Product deleted successfully!');

    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.');
    }
  }

  handleEditProduct(productId) {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `edit-product-${this.productSiteId}-${productId}` } 
    }));
  }

  handleDuplicateProduct(productId) {
    // For now, show a placeholder message
    // In a full implementation, this would create a copy of the product
    alert(`Duplicate functionality for product ${productId} will be implemented in a future update!`);
  }

  async handleBulkAction(action) {
    const selectedCheckboxes = this.element.querySelectorAll('.product-checkbox[data-product-id]:checked');
    const selectedProductIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.productId);

    if (selectedProductIds.length === 0) return;

    let confirmed = true;
    if (action === 'delete') {
      confirmed = confirm(`Are you sure you want to delete ${selectedProductIds.length} product${selectedProductIds.length > 1 ? 's' : ''}?\n\nThis action cannot be undone.`);
    }

    if (!confirmed) return;

    try {
      const promises = selectedProductIds.map(async (productId) => {
        const productDocRef = doc(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products', productId);
        
        if (action === 'delete') {
          await deleteDoc(productDocRef);
        } else {
          const updateData = {
            status: action,
            updatedAt: new Date()
          };
          await updateDoc(productDocRef, updateData);
        }
      });

      await Promise.all(promises);

      // Update local data
      if (action === 'delete') {
        this.products = this.products.filter(product => !selectedProductIds.includes(product.id));
      } else {
        this.products = this.products.map(product => {
          if (selectedProductIds.includes(product.id)) {
            return { ...product, status: action, updatedAt: new Date() };
          }
          return product;
        });
      }

      this.filterAndSortProducts();
      this.updateBulkActions();

      // Trigger sidebar update to refresh product counts if products were deleted
      if (action === 'delete') {
        window.dispatchEvent(new CustomEvent('product-sites-updated'));
      }

      const actionText = action === 'delete' ? 'deleted' : 
                        action === 'publish' ? 'published' : 'moved to draft';
      toast.success(`${selectedProductIds.length} product${selectedProductIds.length > 1 ? 's' : ''} ${actionText} successfully!`);

    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Error performing bulk ${action}. Please try again.`);
    }
  }

  formatPrice(price, currency) {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${parseFloat(price).toFixed(2)}`;
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  }

  showError(message) {
    const loadingState = this.element.querySelector('#loading-state');
    loadingState.innerHTML = `
      <div class="error-state">
        <p style="color: #dc3545;">${message}</p>
        <button class="action-button" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'overview' } }))">
          Back to Overview
        </button>
      </div>
    `;
  }
}