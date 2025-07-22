// Product Site Creation component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class CreateProductSite {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.userProductSites = [];
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'create-product-site-container';
    this.element.innerHTML = `
      <div class="content-section">
        <h2>Create New Product Site</h2>
        <p class="section-description">
          Create a new product site to organize your e-commerce products. You can create up to 3 product sites.
        </p>
        
        <form id="create-product-site-form" class="create-site-form">
          <div class="form-group">
            <label for="site-name">Site Name *</label>
            <input 
              type="text" 
              id="site-name" 
              name="site-name" 
              required 
              placeholder="Enter your product site name"
              maxlength="50"
            >
            <span class="error-message" id="site-name-error"></span>
          </div>
          
          <div class="form-group">
            <label for="site-slug">URL Slug *</label>
            <input 
              type="text" 
              id="site-slug" 
              name="site-slug" 
              required 
              placeholder="url-friendly-slug"
              maxlength="50"
            >
            <div class="slug-preview">
              <span class="slug-label">Preview URL:</span>
              <span class="slug-url" id="slug-preview">your-slug-here</span>
            </div>
            <span class="error-message" id="site-slug-error"></span>
          </div>
          
          <div class="form-group">
            <label for="site-description">Description (Optional)</label>
            <textarea 
              id="site-description" 
              name="site-description" 
              placeholder="Brief description of your product site"
              maxlength="200"
              rows="3"
            ></textarea>
            <small class="field-help">Optional description for your product catalog</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-button" id="cancel-button">
              Cancel
            </button>
            <button type="submit" class="create-button" id="create-button">
              <span class="button-text">Create Product Site</span>
              <span class="button-loading" style="display: none;">Creating...</span>
            </button>
          </div>
        </form>
        
        <div id="create-message" class="message" style="display: none;"></div>
        
        <div class="usage-info">
          <div class="usage-card">
            <h4>Current Usage</h4>
            <div class="usage-stats" id="usage-stats">
              <span class="loading-text">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadUserProductSites();
    return this.element;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#create-product-site-form');
    const siteNameInput = this.element.querySelector('#site-name');
    const siteSlugInput = this.element.querySelector('#site-slug');
    const cancelButton = this.element.querySelector('#cancel-button');

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateSite();
    });

    // Auto-generate slug from site name
    siteNameInput.addEventListener('input', (e) => {
      const siteName = e.target.value;
      const autoSlug = this.generateSlug(siteName);
      
      // Only update if user hasn't manually modified the slug
      if (!siteSlugInput.dataset.manuallyEdited) {
        siteSlugInput.value = autoSlug;
        this.updateSlugPreview(autoSlug);
      }
    });

    // Manual slug editing
    siteSlugInput.addEventListener('input', (e) => {
      siteSlugInput.dataset.manuallyEdited = 'true';
      const slug = this.generateSlug(e.target.value);
      siteSlugInput.value = slug;
      this.updateSlugPreview(slug);
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      this.handleCancel();
    });

    // Real-time validation
    siteNameInput.addEventListener('blur', () => {
      this.validateSiteName();
    });

    siteSlugInput.addEventListener('blur', () => {
      this.validateSiteSlug();
    });
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  updateSlugPreview(slug) {
    const preview = this.element.querySelector('#slug-preview');
    preview.textContent = slug || 'your-slug-here';
  }

  async loadUserProductSites() {
    if (!this.currentUser) return;

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userProductSites = userData.productSites || [];
        this.updateUsageStats();
      }
    } catch (error) {
      console.error('Error loading user product sites:', error);
      this.userProductSites = [];
      this.updateUsageStats();
    }
  }

  updateUsageStats() {
    const usageStats = this.element.querySelector('#usage-stats');
    const currentCount = this.userProductSites.length;
    const maxCount = 3;
    const remaining = maxCount - currentCount;

    usageStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-number">${currentCount}</span>
        <span class="stat-label">of ${maxCount} product sites created</span>
      </div>
      <div class="stat-item">
        <span class="stat-number ${remaining === 0 ? 'limit-reached' : ''}">${remaining}</span>
        <span class="stat-label">remaining</span>
      </div>
    `;

    // Disable form if limit reached
    if (remaining === 0) {
      this.disableForm('You have reached the maximum limit of 3 product sites.');
    }
  }

  disableForm(message) {
    const form = this.element.querySelector('#create-product-site-form');
    const createButton = this.element.querySelector('#create-button');
    const inputs = form.querySelectorAll('input, textarea');

    inputs.forEach(input => input.disabled = true);
    createButton.disabled = true;
    
    toast.warning(message);
  }

  async handleCreateSite() {
    const siteName = this.element.querySelector('#site-name').value.trim();
    const siteSlug = this.element.querySelector('#site-slug').value.trim();
    const siteDescription = this.element.querySelector('#site-description').value.trim();
    
    const createButton = this.element.querySelector('#create-button');
    const buttonText = createButton.querySelector('.button-text');
    const buttonLoading = createButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(siteName, siteSlug)) {
      return;
    }

    // Check limits
    if (this.userProductSites.length >= 3) {
      this.showMessage('You have reached the maximum limit of 3 product sites.', 'error');
      return;
    }

    // Check for duplicate slug
    if (this.isDuplicateSlug(siteSlug)) {
      this.showFieldError('site-slug-error', 'This URL slug is already in use. Please choose a different one.');
      return;
    }

    // Show loading state
    createButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      // Create new product site object
      const newProductSite = {
        id: this.generateUniqueId(),
        name: siteName,
        slug: siteSlug,
        description: siteDescription || '',
        createdAt: new Date(),
        productCount: 0,
        defaultCurrency: 'USD',
        taxSettings: {
          enabled: false,
          rate: 0
        }
      };

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        productSites: arrayUnion(newProductSite)
      });

      // Update local data
      this.userProductSites.push(newProductSite);
      this.updateUsageStats();

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('product-sites-updated'));

      // Show success message
      toast.success(`Product site "${siteName}" created successfully!`);
      
      // Reset form
      this.resetForm();

      // Navigate back to dashboard after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: 'overview' } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error creating product site:', error);
      this.handleCreateError(error);
    } finally {
      // Reset button state
      createButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  generateUniqueId() {
    return 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  validateForm(siteName, siteSlug) {
    let isValid = true;

    if (!this.validateSiteName(siteName)) {
      isValid = false;
    }

    if (!this.validateSiteSlug(siteSlug)) {
      isValid = false;
    }

    return isValid;
  }

  validateSiteName(siteName = null) {
    const name = siteName || this.element.querySelector('#site-name').value.trim();
    
    if (!name) {
      this.showFieldError('site-name-error', 'Site name is required.');
      return false;
    }

    if (name.length < 2) {
      this.showFieldError('site-name-error', 'Site name must be at least 2 characters long.');
      return false;
    }

    if (name.length > 50) {
      this.showFieldError('site-name-error', 'Site name must be less than 50 characters.');
      return false;
    }

    // Check for duplicate name
    if (this.isDuplicateName(name)) {
      this.showFieldError('site-name-error', 'A product site with this name already exists.');
      return false;
    }

    this.clearFieldError('site-name-error');
    return true;
  }

  validateSiteSlug(siteSlug = null) {
    const slug = siteSlug || this.element.querySelector('#site-slug').value.trim();
    
    if (!slug) {
      this.showFieldError('site-slug-error', 'URL slug is required.');
      return false;
    }

    if (slug.length < 2) {
      this.showFieldError('site-slug-error', 'URL slug must be at least 2 characters long.');
      return false;
    }

    if (slug.length > 50) {
      this.showFieldError('site-slug-error', 'URL slug must be less than 50 characters.');
      return false;
    }

    // Check slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      this.showFieldError('site-slug-error', 'URL slug can only contain lowercase letters, numbers, and hyphens.');
      return false;
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      this.showFieldError('site-slug-error', 'URL slug cannot start or end with a hyphen.');
      return false;
    }

    this.clearFieldError('site-slug-error');
    return true;
  }

  isDuplicateName(name) {
    return this.userProductSites.some(site => 
      site.name.toLowerCase() === name.toLowerCase()
    );
  }

  isDuplicateSlug(slug) {
    return this.userProductSites.some(site => 
      site.slug.toLowerCase() === slug.toLowerCase()
    );
  }

  handleCreateError(error) {
    let message = 'An error occurred while creating the product site. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    }

    toast.error(message);
  }

  resetForm() {
    const form = this.element.querySelector('#create-product-site-form');
    form.reset();
    
    // Reset manual editing flag
    const siteSlugInput = this.element.querySelector('#site-slug');
    delete siteSlugInput.dataset.manuallyEdited;
    
    // Reset slug preview
    this.updateSlugPreview('');
    
    // Clear errors
    this.clearErrors();
  }

  handleCancel() {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: 'overview' } 
    }));
  }

  showFieldError(fieldId, message) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  clearFieldError(fieldId) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    errorElement.style.display = 'none';
    errorElement.textContent = '';
  }

  clearErrors() {
    const errorElements = this.element.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });

    const messageElement = this.element.querySelector('#create-message');
    messageElement.style.display = 'none';
  }

}