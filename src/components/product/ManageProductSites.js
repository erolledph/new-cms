// Product Site Management component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { doc, updateDoc, getDoc, arrayRemove, collection, getDocs, writeBatch } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class ManageProductSites {
  constructor(productSiteId) {
    this.productSiteId = productSiteId;
    this.element = null;
    this.currentUser = null;
    this.productSite = null;
    this.allProductSites = [];
    this.isEditing = false;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'manage-product-sites-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Manage Product Site</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Overview
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading product site details...</p>
        </div>
        
        <div id="product-site-details" class="product-site-details" style="display: none;">
          <!-- Product site details will be loaded here -->
        </div>
        
        <div id="edit-form" class="edit-form" style="display: none;">
          <!-- Edit form will be loaded here -->
        </div>
        
        <div id="manage-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadProductSiteDetails();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    backButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: 'overview' } 
      }));
    });
  }

  async loadProductSiteDetails() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.allProductSites = userData.productSites || [];
        this.productSite = this.allProductSites.find(site => site.id === this.productSiteId);
        
        if (this.productSite) {
          this.renderProductSiteDetails();
        } else {
          this.showError('Product site not found');
        }
      } else {
        this.showError('User data not found');
      }
    } catch (error) {
      console.error('Error loading product site details:', error);
      this.showError('Error loading product site details');
    }
  }

  renderProductSiteDetails() {
    const loadingState = this.element.querySelector('#loading-state');
    const detailsContainer = this.element.querySelector('#product-site-details');
    
    loadingState.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    const createdDate = this.formatDate(this.productSite.createdAt);
    
    detailsContainer.innerHTML = `
      <div class="site-info-card">
        <div class="site-header">
          <h3>${this.productSite.name}</h3>
          <div class="site-actions">
            <button class="action-button edit-button" id="edit-site-button">
              <span class="action-icon">EDIT</span>
              Edit Site
            </button>
            <button class="action-button delete-button" id="delete-site-button">
              <span class="action-icon">DELETE</span>
              Delete Site
            </button>
          </div>
        </div>
        
        <div class="site-details">
          <div class="detail-row">
            <span class="detail-label">URL Slug:</span>
            <span class="detail-value">${this.productSite.slug}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${this.productSite.description || 'No description'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created:</span>
            <span class="detail-value">${createdDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Products:</span>
            <span class="detail-value">${this.productSite.productCount || 0} products</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Default Currency:</span>
            <span class="detail-value">${this.productSite.defaultCurrency || 'USD'}</span>
          </div>
        </div>
        
        <div class="site-preview">
          <h4>API Endpoints</h4>
          <div class="api-endpoints">
            <div class="endpoint">
              <span class="endpoint-label">Products API:</span>
              <code class="endpoint-url">/${this.currentUser.uid}/${this.productSite.id}/api/products.json</code>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h4>Quick Actions</h4>
          <div class="action-buttons">
            <button class="action-button" id="create-product-button">
              <span class="action-icon">ADD</span>
              Create Product
            </button>
            <button class="action-button" id="manage-products-button">
              <span class="action-icon">MANAGE</span>
              Manage Products
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Attach event listeners for action buttons
    const editButton = detailsContainer.querySelector('#edit-site-button');
    const deleteButton = detailsContainer.querySelector('#delete-site-button');
    const createProductButton = detailsContainer.querySelector('#create-product-button');
    const manageProductsButton = detailsContainer.querySelector('#manage-products-button');
    
    editButton.addEventListener('click', () => this.showEditForm());
    deleteButton.addEventListener('click', () => this.handleDeleteSite());
    createProductButton.addEventListener('click', () => this.navigateToCreateProduct());
    manageProductsButton.addEventListener('click', () => this.navigateToManageProducts());
  }

  navigateToCreateProduct() {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `create-product-${this.productSiteId}` } 
    }));
  }

  navigateToManageProducts() {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `manage-products-${this.productSiteId}` } 
    }));
  }

  showEditForm() {
    const detailsContainer = this.element.querySelector('#product-site-details');
    const editFormContainer = this.element.querySelector('#edit-form');
    
    detailsContainer.style.display = 'none';
    editFormContainer.style.display = 'block';
    this.isEditing = true;
    
    editFormContainer.innerHTML = `
      <div class="edit-site-form">
        <h3>Edit Product Site</h3>
        
        <form id="edit-site-form" class="create-site-form">
          <div class="form-group">
            <label for="edit-site-name">Site Name *</label>
            <input 
              type="text" 
              id="edit-site-name" 
              name="site-name" 
              required 
              value="${this.productSite.name}"
              maxlength="50"
            >
            <span class="error-message" id="edit-site-name-error"></span>
          </div>
          
          <div class="form-group">
            <label for="edit-site-slug">URL Slug *</label>
            <input 
              type="text" 
              id="edit-site-slug" 
              name="site-slug" 
              required 
              value="${this.productSite.slug}"
              maxlength="50"
            >
            <div class="slug-preview">
              <span class="slug-label">Preview URL:</span>
              <span class="slug-url" id="edit-slug-preview">${this.productSite.slug}</span>
            </div>
            <span class="error-message" id="edit-site-slug-error"></span>
          </div>
          
          <div class="form-group">
            <label for="edit-site-description">Description (Optional)</label>
            <textarea 
              id="edit-site-description" 
              name="site-description" 
              placeholder="Brief description of your product site"
              maxlength="200"
              rows="3"
            >${this.productSite.description || ''}</textarea>
            <small class="field-help">Optional description for your product catalog</small>
          </div>
          
          <div class="form-group">
            <label for="edit-default-currency">Default Currency</label>
            <select id="edit-default-currency" name="default-currency">
              <option value="USD" ${this.productSite.defaultCurrency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
              <option value="EUR" ${this.productSite.defaultCurrency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
              <option value="GBP" ${this.productSite.defaultCurrency === 'GBP' ? 'selected' : ''}>GBP - British Pound</option>
              <option value="JPY" ${this.productSite.defaultCurrency === 'JPY' ? 'selected' : ''}>JPY - Japanese Yen</option>
              <option value="CAD" ${this.productSite.defaultCurrency === 'CAD' ? 'selected' : ''}>CAD - Canadian Dollar</option>
              <option value="AUD" ${this.productSite.defaultCurrency === 'AUD' ? 'selected' : ''}>AUD - Australian Dollar</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-button" id="cancel-edit-button">
              Cancel
            </button>
            <button type="submit" class="create-button" id="save-changes-button">
              <span class="button-text">Save Changes</span>
              <span class="button-loading" style="display: none;">Saving...</span>
            </button>
          </div>
        </form>
      </div>
    `;
    
    this.attachEditFormListeners();
  }

  attachEditFormListeners() {
    const form = this.element.querySelector('#edit-site-form');
    const siteNameInput = this.element.querySelector('#edit-site-name');
    const siteSlugInput = this.element.querySelector('#edit-site-slug');
    const cancelButton = this.element.querySelector('#cancel-edit-button');

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUpdateSite();
    });

    // Auto-generate slug from site name (only if slug hasn't been manually edited)
    siteNameInput.addEventListener('input', (e) => {
      const siteName = e.target.value;
      const autoSlug = this.generateSlug(siteName);
      
      if (!siteSlugInput.dataset.manuallyEdited) {
        siteSlugInput.value = autoSlug;
        this.updateEditSlugPreview(autoSlug);
      }
    });

    // Manual slug editing
    siteSlugInput.addEventListener('input', (e) => {
      siteSlugInput.dataset.manuallyEdited = 'true';
      const slug = this.generateSlug(e.target.value);
      siteSlugInput.value = slug;
      this.updateEditSlugPreview(slug);
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      this.cancelEdit();
    });
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

  updateEditSlugPreview(slug) {
    const preview = this.element.querySelector('#edit-slug-preview');
    preview.textContent = slug || 'your-slug-here';
  }

  cancelEdit() {
    const detailsContainer = this.element.querySelector('#product-site-details');
    const editFormContainer = this.element.querySelector('#edit-form');
    
    editFormContainer.style.display = 'none';
    detailsContainer.style.display = 'block';
    this.isEditing = false;
    this.clearErrors();
  }

  async handleUpdateSite() {
    const siteName = this.element.querySelector('#edit-site-name').value.trim();
    const siteSlug = this.element.querySelector('#edit-site-slug').value.trim();
    const siteDescription = this.element.querySelector('#edit-site-description').value.trim();
    const defaultCurrency = this.element.querySelector('#edit-default-currency').value;
    
    const saveButton = this.element.querySelector('#save-changes-button');
    const buttonText = saveButton.querySelector('.button-text');
    const buttonLoading = saveButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateEditForm(siteName, siteSlug)) {
      return;
    }

    // Show loading state
    saveButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      // Create updated product site object
      const updatedProductSite = {
        ...this.productSite,
        name: siteName,
        slug: siteSlug,
        description: siteDescription,
        defaultCurrency: defaultCurrency,
        updatedAt: new Date()
      };

      // Update the product site in the array
      const updatedProductSites = this.allProductSites.map(site => 
        site.id === this.productSiteId ? updatedProductSite : site
      );

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        productSites: updatedProductSites
      });

      // Update local data
      this.productSite = updatedProductSite;
      this.allProductSites = updatedProductSites;

      // Show success message
      toast.success('Product site updated successfully!');
      
      // Return to details view
      this.cancelEdit();
      this.renderProductSiteDetails();

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('product-sites-updated'));

    } catch (error) {
      console.error('Error updating product site:', error);
      this.handleUpdateError(error);
    } finally {
      // Reset button state
      saveButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  validateEditForm(siteName, siteSlug) {
    let isValid = true;

    // Site name validation
    if (!siteName) {
      this.showFieldError('edit-site-name-error', 'Site name is required.');
      isValid = false;
    } else if (siteName.length < 2) {
      this.showFieldError('edit-site-name-error', 'Site name must be at least 2 characters long.');
      isValid = false;
    } else if (siteName.length > 50) {
      this.showFieldError('edit-site-name-error', 'Site name must be less than 50 characters.');
      isValid = false;
    } else if (this.isDuplicateName(siteName)) {
      this.showFieldError('edit-site-name-error', 'A product site with this name already exists.');
      isValid = false;
    }

    // Site slug validation
    if (!siteSlug) {
      this.showFieldError('edit-site-slug-error', 'URL slug is required.');
      isValid = false;
    } else if (siteSlug.length < 2) {
      this.showFieldError('edit-site-slug-error', 'URL slug must be at least 2 characters long.');
      isValid = false;
    } else if (siteSlug.length > 50) {
      this.showFieldError('edit-site-slug-error', 'URL slug must be less than 50 characters.');
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(siteSlug)) {
      this.showFieldError('edit-site-slug-error', 'URL slug can only contain lowercase letters, numbers, and hyphens.');
      isValid = false;
    } else if (siteSlug.startsWith('-') || siteSlug.endsWith('-')) {
      this.showFieldError('edit-site-slug-error', 'URL slug cannot start or end with a hyphen.');
      isValid = false;
    } else if (this.isDuplicateSlug(siteSlug)) {
      this.showFieldError('edit-site-slug-error', 'This URL slug is already in use. Please choose a different one.');
      isValid = false;
    }

    return isValid;
  }

  isDuplicateName(name) {
    return this.allProductSites.some(site => 
      site.id !== this.productSiteId && site.name.toLowerCase() === name.toLowerCase()
    );
  }

  isDuplicateSlug(slug) {
    return this.allProductSites.some(site => 
      site.id !== this.productSiteId && site.slug.toLowerCase() === slug.toLowerCase()
    );
  }

  async handleDeleteSite() {
    const confirmed = confirm(
      `Are you sure you want to delete "${this.productSite.name}"?\n\n` +
      'This will permanently delete the product site and all associated products. ' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      toast.warning('Deleting product site and associated products...');

      // Delete all associated products
      await this.deleteAllProducts();

      // Remove product site from user's productSites array
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        productSites: arrayRemove(this.productSite)
      });

      toast.success('Product site deleted successfully!');

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('product-sites-updated'));

      // Navigate back to overview after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: 'overview' } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error deleting product site:', error);
      toast.error('Error deleting product site. Please try again.');
    }
  }

  async deleteAllProducts() {
    try {
      // Get all products for this product site
      const productsCollectionRef = collection(db, 'users', this.currentUser.uid, 'productSites', this.productSiteId, 'products');
      const productsSnapshot = await getDocs(productsCollectionRef);

      if (productsSnapshot.empty) {
        console.log('No products to delete');
        return;
      }

      // Use batch delete for efficiency
      const batch = writeBatch(db);
      
      productsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${productsSnapshot.docs.length} products`);

    } catch (error) {
      console.error('Error deleting products:', error);
      throw error;
    }
  }

  handleUpdateError(error) {
    let message = 'An error occurred while updating the product site. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    }

    toast.error(message);
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
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

  showFieldError(fieldId, message) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearErrors() {
    const errorElements = this.element.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });

    const messageElement = this.element.querySelector('#manage-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }

}