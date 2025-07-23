// Product Edit component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class EditProduct {
  constructor(productSiteId, productId) {
    this.productSiteId = productSiteId;
    this.productId = productId;
    this.element = null;
    this.currentUser = null;
    this.productSite = null;
    this.productData = null;
    this.userSettings = null;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'edit-product-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Edit Product</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Manage Products
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading product...</p>
        </div>
        
        <div id="product-form" class="product-form" style="display: none;">
          <form id="edit-product-form">
            <div class="form-row">
              <div class="form-group">
                <label for="product-name">Product Name *</label>
                <input 
                  type="text" 
                  id="product-name" 
                  name="name" 
                  required 
                  placeholder="Enter product name"
                  maxlength="200"
                >
                <span class="error-message" id="product-name-error"></span>
              </div>
              
              <div class="form-group">
                <label for="product-slug">URL Slug *</label>
                <input 
                  type="text" 
                  id="product-slug" 
                  name="slug" 
                  required 
                  placeholder="url-friendly-slug"
                  maxlength="200"
                >
                <div class="slug-preview">
                  <span class="slug-label">Preview URL:</span>
                  <span class="slug-url" id="slug-preview">your-slug-here</span>
                </div>
                <span class="error-message" id="product-slug-error"></span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="product-description">Description</label>
              <textarea 
                id="product-description" 
                name="description" 
                placeholder="Detailed product description (Markdown supported)"
                rows="6"
              ></textarea>
            </div>
            
            <div class="pricing-section">
              <h3>Pricing Information</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="original-price">Original Price *</label>
                  <div class="price-input-group">
                    <span class="currency-symbol" id="currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="original-price" 
                      name="originalPrice" 
                      required 
                      min="0" 
                      step="0.01"
                      placeholder="0.00"
                    >
                  </div>
                  <span class="error-message" id="original-price-error"></span>
                </div>
                
                <div class="form-group">
                  <label for="discount-percent">Discount Percentage</label>
                  <div class="discount-input-group">
                    <input 
                      type="number" 
                      id="discount-percent" 
                      name="discountPercent" 
                      min="0" 
                      max="100" 
                      step="1"
                      placeholder="0"
                    >
                    <span class="percent-symbol">%</span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="currency-select">Currency</label>
                  <select id="currency-select" name="currency">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>
              
              <div class="pricing-preview" id="pricing-preview">
                <div class="price-calculation">
                  <div class="price-row">
                    <span class="price-label">Original Price:</span>
                    <span class="price-value" id="preview-original">$0.00</span>
                  </div>
                  <div class="price-row discount-row" id="discount-row" style="display: none;">
                    <span class="price-label">Discount:</span>
                    <span class="price-value discount" id="preview-discount">-$0.00 (0%)</span>
                  </div>
                  <div class="price-row final-row">
                    <span class="price-label">Final Price:</span>
                    <span class="price-value final" id="preview-final">$0.00</span>
                  </div>
                  <div class="price-row savings-row" id="savings-row" style="display: none;">
                    <span class="price-label">You Save:</span>
                    <span class="price-value savings" id="preview-savings">$0.00</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="images-section">
              <h3>Product Images</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="main-image">Main Image URL</label>
                  <input 
                    type="url" 
                    id="main-image" 
                    name="mainImage" 
                    placeholder="https://example.com/image.jpg"
                  >
                  <button type="button" class="file-select-button" id="select-main-image">
                    SELECT from Files
                  </button>
                </div>
                
                <div class="form-group">
                  <label for="gallery-images">Gallery Images (URLs)</label>
                  <textarea 
                    id="gallery-images" 
                    name="galleryImages" 
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                    rows="4"
                  ></textarea>
                  <small class="field-help">Enter one URL per line for additional product images</small>
                </div>
              </div>
            </div>
            
            <div class="product-details-section">
              <h3>Product Details</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="product-url">Product URL</label>
                  <input 
                    type="url" 
                    id="product-url" 
                    name="productUrl" 
                    placeholder="https://example.com/buy-product"
                  >
                  <small class="field-help">External link where customers can purchase this product</small>
                </div>
                
                <div class="form-group">
                  <label for="product-category">Category</label>
                  <input 
                    type="text" 
                    id="product-category" 
                    name="category" 
                    placeholder="Electronics, Clothing, Books, etc."
                    maxlength="100"
                  >
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="product-tags">Tags</label>
                  <input 
                    type="text" 
                    id="product-tags" 
                    name="tags" 
                    placeholder="tag1, tag2, tag3 (comma separated)"
                  >
                </div>
                
                <div class="form-group">
                  <label for="product-status">Status</label>
                  <select id="product-status" name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" id="cancel-button">
                Cancel
              </button>
              <button type="submit" class="create-button" id="update-button">
                <span class="button-text">Update Product</span>
                <span class="button-loading" style="display: none;">Updating...</span>
              </button>
            </div>
          </form>
        </div>
        
        <div id="edit-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadProductData();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    const form = this.element.querySelector('#edit-product-form');
    const nameInput = this.element.querySelector('#product-name');
    const slugInput = this.element.querySelector('#product-slug');
    const originalPriceInput = this.element.querySelector('#original-price');
    const discountPercentInput = this.element.querySelector('#discount-percent');
    const currencySelect = this.element.querySelector('#currency-select');
    const cancelButton = this.element.querySelector('#cancel-button');
    const selectMainImageButton = this.element.querySelector('#select-main-image');

    // Navigation
    backButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-products-${this.productSiteId}` } 
      }));
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUpdateProduct();
    });

    // Auto-generate slug from name
    nameInput.addEventListener('input', (e) => {
      const name = e.target.value;
      const autoSlug = this.generateSlug(name);
      
      if (!slugInput.dataset.manuallyEdited) {
        slugInput.value = autoSlug;
        this.updateSlugPreview(autoSlug);
      }
    });

    // Manual slug editing
    slugInput.addEventListener('input', (e) => {
      slugInput.dataset.manuallyEdited = 'true';
      const slug = this.generateSlug(e.target.value);
      slugInput.value = slug;
      this.updateSlugPreview(slug);
    });

    // Pricing calculations
    originalPriceInput.addEventListener('input', () => this.updatePricingPreview());
    discountPercentInput.addEventListener('input', () => this.updatePricingPreview());
    currencySelect.addEventListener('change', () => this.updatePricingPreview());

    // Cancel
    cancelButton.addEventListener('click', () => this.handleCancel());

    // File selection
    selectMainImageButton.addEventListener('click', () => this.openFileSelectionModal());

    // Real-time validation
    nameInput.addEventListener('blur', () => this.validateProductName());
    slugInput.addEventListener('blur', () => this.validateProductSlug());
    originalPriceInput.addEventListener('blur', () => this.validateOriginalPrice());
  }

  async loadProductData() {
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

      // Load user settings for default currency
      const userSettingsRef = doc(db, 'users', this.currentUser.uid, 'settings', 'userSettingsDoc');
      const userSettingsDoc = await getDoc(userSettingsRef);
      
      if (userSettingsDoc.exists()) {
        this.userSettings = userSettingsDoc.data();
      }

      // Load product data
      const productDocRef = doc(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products', this.productId);
      const productDoc = await getDoc(productDocRef);
      
      if (productDoc.exists()) {
        this.productData = productDoc.data();
        this.populateForm();
        this.showProductForm();
      } else {
        this.showError('Product not found');
      }

    } catch (error) {
      console.error('Error loading product data:', error);
      this.showError('Error loading product');
    }
  }

  populateForm() {
    // Populate form fields with existing data
    this.element.querySelector('#product-name').value = this.productData.name || '';
    this.element.querySelector('#product-slug').value = this.productData.slug || '';
    this.element.querySelector('#product-description').value = this.productData.description || '';
    this.element.querySelector('#original-price').value = this.productData.originalPrice || '';
    this.element.querySelector('#discount-percent').value = this.productData.percentOff || '';
    this.element.querySelector('#currency-select').value = this.productData.currency || 'USD';
    this.element.querySelector('#main-image').value = this.productData.imageUrl || '';
    this.element.querySelector('#gallery-images').value = (this.productData.imageUrls || []).join('\n');
    this.element.querySelector('#product-url').value = this.productData.productUrl || '';
    this.element.querySelector('#product-category').value = this.productData.category || '';
    this.element.querySelector('#product-tags').value = (this.productData.tags || []).join(', ');
    this.element.querySelector('#product-status').value = this.productData.status || 'draft';
    
    // Update slug preview and pricing
    this.updateSlugPreview(this.productData.slug || '');
    this.updateCurrencySymbol(this.productData.currency || 'USD');
    this.updatePricingPreview();
  }

  showProductForm() {
    const loadingState = this.element.querySelector('#loading-state');
    const productForm = this.element.querySelector('#product-form');
    
    loadingState.style.display = 'none';
    productForm.style.display = 'block';
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  updateSlugPreview(slug) {
    const preview = this.element.querySelector('#slug-preview');
    preview.textContent = slug || 'your-slug-here';
  }

  updateCurrencySymbol(currency) {
    const currencySymbol = this.element.querySelector('#currency-symbol');
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    currencySymbol.textContent = symbols[currency] || '$';
  }

  updatePricingPreview() {
    const originalPrice = parseFloat(this.element.querySelector('#original-price').value) || 0;
    const discountPercent = parseFloat(this.element.querySelector('#discount-percent').value) || 0;
    const currency = this.element.querySelector('#currency-select').value;
    
    this.updateCurrencySymbol(currency);
    
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    const symbol = symbols[currency] || '$';
    
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    // Update preview elements
    this.element.querySelector('#preview-original').textContent = `${symbol}${originalPrice.toFixed(2)}`;
    this.element.querySelector('#preview-final').textContent = `${symbol}${finalPrice.toFixed(2)}`;
    
    const discountRow = this.element.querySelector('#discount-row');
    const savingsRow = this.element.querySelector('#savings-row');
    
    if (discountPercent > 0) {
      this.element.querySelector('#preview-discount').textContent = `-${symbol}${discountAmount.toFixed(2)} (${discountPercent}%)`;
      this.element.querySelector('#preview-savings').textContent = `${symbol}${discountAmount.toFixed(2)}`;
      discountRow.style.display = 'flex';
      savingsRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
      savingsRow.style.display = 'none';
    }
  }

  async handleUpdateProduct() {
    const formData = this.getFormData();
    
    const updateButton = this.element.querySelector('#update-button');
    const buttonText = updateButton.querySelector('.button-text');
    const buttonLoading = updateButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(formData)) {
      return;
    }

    // Show loading state
    updateButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await this.updateProduct(formData);
      
      toast.success('Product updated successfully!');
      
      // Trigger sidebar update to refresh product counts
      window.dispatchEvent(new CustomEvent('product-sites-updated'));
      
      // Navigate back to product management after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: `manage-products-${this.productSiteId}` } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error updating product:', error);
      this.handleUpdateError(error);
    } finally {
      // Reset button state
      updateButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async updateProduct(formData) {
    const now = new Date();
    
    // Calculate pricing
    const originalPrice = parseFloat(formData.originalPrice) || 0;
    const discountPercent = parseFloat(formData.discountPercent) || 0;
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    // Parse gallery images
    const galleryImages = formData.galleryImages
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    // Parse tags
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const updateData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || '',
      price: finalPrice,
      originalPrice: originalPrice,
      percentOff: discountPercent,
      discountedPrice: finalPrice,
      savings: discountAmount,
      currency: formData.currency,
      imageUrl: formData.mainImage || '',
      imageUrls: galleryImages,
      productUrl: formData.productUrl || '',
      category: formData.category || '',
      tags: tags,
      status: formData.status,
      updatedAt: now
    };

    // Update product in Firestore
    const productDocRef = doc(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products', this.productId);
    await updateDoc(productDocRef, updateData);
  }

  getFormData() {
    return {
      name: this.element.querySelector('#product-name').value.trim(),
      slug: this.element.querySelector('#product-slug').value.trim(),
      description: this.element.querySelector('#product-description').value.trim(),
      originalPrice: this.element.querySelector('#original-price').value.trim(),
      discountPercent: this.element.querySelector('#discount-percent').value.trim(),
      currency: this.element.querySelector('#currency-select').value,
      mainImage: this.element.querySelector('#main-image').value.trim(),
      galleryImages: this.element.querySelector('#gallery-images').value.trim(),
      productUrl: this.element.querySelector('#product-url').value.trim(),
      category: this.element.querySelector('#product-category').value.trim(),
      tags: this.element.querySelector('#product-tags').value.trim(),
      status: this.element.querySelector('#product-status').value
    };
  }

  validateForm(formData) {
    let isValid = true;

    if (!this.validateProductName(formData.name)) {
      isValid = false;
    }

    if (!this.validateProductSlug(formData.slug)) {
      isValid = false;
    }

    if (!this.validateOriginalPrice(formData.originalPrice)) {
      isValid = false;
    }

    return isValid;
  }

  validateProductName(name = null) {
    const nameValue = name || this.element.querySelector('#product-name').value.trim();
    
    if (!nameValue) {
      this.showFieldError('product-name-error', 'Product name is required.');
      return false;
    }

    if (nameValue.length < 2) {
      this.showFieldError('product-name-error', 'Product name must be at least 2 characters long.');
      return false;
    }

    if (nameValue.length > 200) {
      this.showFieldError('product-name-error', 'Product name must be less than 200 characters.');
      return false;
    }

    this.clearFieldError('product-name-error');
    return true;
  }

  validateProductSlug(slug = null) {
    const slugValue = slug || this.element.querySelector('#product-slug').value.trim();
    
    if (!slugValue) {
      this.showFieldError('product-slug-error', 'URL slug is required.');
      return false;
    }

    if (slugValue.length < 2) {
      this.showFieldError('product-slug-error', 'URL slug must be at least 2 characters long.');
      return false;
    }

    if (slugValue.length > 200) {
      this.showFieldError('product-slug-error', 'URL slug must be less than 200 characters.');
      return false;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slugValue)) {
      this.showFieldError('product-slug-error', 'URL slug can only contain lowercase letters, numbers, and hyphens.');
      return false;
    }

    if (slugValue.startsWith('-') || slugValue.endsWith('-')) {
      this.showFieldError('product-slug-error', 'URL slug cannot start or end with a hyphen.');
      return false;
    }

    this.clearFieldError('product-slug-error');
    return true;
  }

  validateOriginalPrice(price = null) {
    const priceValue = price || this.element.querySelector('#original-price').value.trim();
    
    if (!priceValue) {
      this.showFieldError('original-price-error', 'Original price is required.');
      return false;
    }

    const numericPrice = parseFloat(priceValue);
    if (isNaN(numericPrice) || numericPrice < 0) {
      this.showFieldError('original-price-error', 'Please enter a valid price (0 or greater).');
      return false;
    }

    this.clearFieldError('original-price-error');
    return true;
  }

  handleCancel() {
    const confirmed = confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (confirmed) {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-products-${this.productSiteId}` } 
      }));
    }
  }

  handleUpdateError(error) {
    let message = 'An error occurred while updating the product. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    }

    toast.error(message);
  }

  openFileSelectionModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'file-selection-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Select Product Image</h3>
            <button class="modal-close-button" id="close-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-search">
              <input type="text" id="modal-search" placeholder="Search files..." class="search-input">
            </div>
            <div class="modal-files-grid" id="modal-files-grid">
              <div class="loading-message">Loading files...</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-button" id="modal-cancel">Cancel</button>
            <button class="create-button" id="modal-select" disabled>Select File</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal);
    this.loadModalFiles(modal);
  }

  attachModalListeners(modal) {
    const closeButton = modal.querySelector('#close-modal');
    const cancelButton = modal.querySelector('#modal-cancel');
    const selectButton = modal.querySelector('#modal-select');
    const searchInput = modal.querySelector('#modal-search');
    const overlay = modal.querySelector('.modal-overlay');
    
    let selectedFileUrl = null;

    // Close modal handlers
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Select file handler
    selectButton.addEventListener('click', () => {
      if (selectedFileUrl) {
        const mainImageInput = this.element.querySelector('#main-image');
        mainImageInput.value = selectedFileUrl;
        closeModal();
        toast.success('Image selected successfully!');
      }
    });

    // Search handler
    searchInput.addEventListener('input', (e) => {
      this.filterModalFiles(modal, e.target.value);
    });

    // File selection handler
    modal.addEventListener('click', (e) => {
      const fileItem = e.target.closest('.modal-file-item');
      if (fileItem) {
        // Remove previous selection
        modal.querySelectorAll('.modal-file-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        fileItem.classList.add('selected');
        selectedFileUrl = fileItem.dataset.fileUrl;
        selectButton.disabled = false;
      }
    });
  }

  async loadModalFiles(modal) {
    const filesGrid = modal.querySelector('#modal-files-grid');
    
    try {
      // Import Firebase modules
      const { collection, getDocs, query, orderBy, where } = await import('firebase/firestore');
      const { db } = await import('../../firebase.js');
      
      // Load only image files
      const filesCollectionRef = collection(db, 'users', this.currentUser.uid, 'files');
      const filesQuery = query(
        filesCollectionRef, 
        where('type', '>=', 'image/'),
        where('type', '<', 'image/\uf8ff'),
        orderBy('uploadedAt', 'desc')
      );
      const filesSnapshot = await getDocs(filesQuery);
      
      const imageFiles = filesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (imageFiles.length === 0) {
        filesGrid.innerHTML = `
          <div class="empty-modal-state">
            <p>No image files found. Upload some images first!</p>
          </div>
        `;
        return;
      }

      const filesHTML = imageFiles.map(file => `
        <div class="modal-file-item" data-file-url="${file.downloadURL}" data-filename="${file.filename}">
          <div class="modal-file-thumbnail">
            <img src="${file.downloadURL}" alt="${file.filename}" loading="lazy" />
          </div>
          <div class="modal-file-info">
            <div class="modal-file-name">${file.filename}</div>
            <div class="modal-file-details">
              ${file.dimensions ? `${file.dimensions.width} × ${file.dimensions.height}` : ''}
              ${file.dimensions ? ' • ' : ''}${this.formatFileSize(file.size || 0)}
            </div>
          </div>
        </div>
      `).join('');

      filesGrid.innerHTML = filesHTML;
      
    } catch (error) {
      console.error('Error loading files for modal:', error);
      filesGrid.innerHTML = `
        <div class="error-modal-state">
          <p style="color: #dc3545;">Error loading files. Please try again.</p>
        </div>
      `;
    }
  }

  filterModalFiles(modal, searchTerm) {
    const fileItems = modal.querySelectorAll('.modal-file-item');
    const term = searchTerm.toLowerCase();
    
    fileItems.forEach(item => {
      const filename = item.dataset.filename.toLowerCase();
      const shouldShow = !term || filename.includes(term);
      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  showFieldError(fieldId, message) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(fieldId) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }

  clearErrors() {
    const errorElements = this.element.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });

    const messageElement = this.element.querySelector('#edit-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }

}