// Site Settings component for managing individual blog and product sites
import { authManager } from '../auth/AuthManager.js';
import { db } from '../firebase.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from '../utils/toast.js';

export class SiteSettings {
  constructor(siteType, siteId) {
    this.siteType = siteType; // 'blog' or 'product'
    this.siteId = siteId;
    this.element = null;
    this.currentUser = null;
    this.siteData = null;
    this.allSites = [];
    this.isLoading = true;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'site-settings-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>${this.siteType === 'blog' ? 'Blog' : 'Product'} Site Settings</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to ${this.siteType === 'blog' ? 'Blog' : 'Product'} Site
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading site settings...</p>
        </div>
        
        <div id="settings-content" style="display: none;">
          <div class="settings-section">
            <h3>Site Information</h3>
            <form id="site-settings-form" class="create-site-form">
              <div class="form-group">
                <label for="site-name">Site Name *</label>
                <input 
                  type="text" 
                  id="site-name" 
                  name="site-name" 
                  required 
                  placeholder="Enter site name"
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
              
              <div class="form-group" id="description-group" style="display: none;">
                <label for="site-description">Description</label>
                <textarea 
                  id="site-description" 
                  name="site-description" 
                  placeholder="Site description"
                  maxlength="200"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group" id="currency-group" style="display: none;">
                <label for="default-currency">Default Currency</label>
                <select id="default-currency" name="default-currency">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              
              <div class="form-actions">
                <button type="button" class="cancel-button" id="cancel-button">
                  Cancel
                </button>
                <button type="submit" class="create-button" id="save-button">
                  <span class="button-text">Save Changes</span>
                  <span class="button-loading" style="display: none;">Saving...</span>
                </button>
              </div>
            </form>
          </div>
          
          <div class="settings-section">
            <h3>API Endpoints</h3>
            <p class="section-description">
              Use these endpoints to access your ${this.siteType === 'blog' ? 'blog content' : 'products'} from external applications.
            </p>
            
            <div class="api-endpoints-list" id="api-endpoints-list">
              <!-- API endpoints will be loaded here -->
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Site Statistics</h3>
            <div class="site-stats" id="site-stats">
              <!-- Site statistics will be loaded here -->
            </div>
          </div>
          
          <div class="settings-section danger-zone">
            <h3 style="color: #dc3545;">Danger Zone</h3>
            <p class="section-description" style="color: #666;">
              Permanently delete this site and all associated content. This action cannot be undone.
            </p>
            <button class="action-button delete-button" id="delete-site-button">
              <span class="action-icon">🗑️</span>
              Delete Site
            </button>
          </div>
        </div>
        
        <div id="settings-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadSiteData();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    const form = this.element.querySelector('#site-settings-form');
    const siteNameInput = this.element.querySelector('#site-name');
    const siteSlugInput = this.element.querySelector('#site-slug');
    const cancelButton = this.element.querySelector('#cancel-button');
    const deleteSiteButton = this.element.querySelector('#delete-site-button');

    // Navigation
    backButton.addEventListener('click', () => {
      const sectionName = this.siteType === 'blog' ? 
        `manage-blog-site-${this.siteId}` : 
        `manage-product-site-${this.siteId}`;
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: sectionName } 
      }));
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveSettings();
    });

    // Auto-generate slug from site name
    siteNameInput.addEventListener('input', (e) => {
      const siteName = e.target.value;
      const autoSlug = this.generateSlug(siteName);
      
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

    // Delete site button
    deleteSiteButton.addEventListener('click', () => {
      this.handleDeleteSite();
    });

    // Real-time validation
    siteNameInput.addEventListener('blur', () => {
      this.validateSiteName();
    });

    siteSlugInput.addEventListener('blur', () => {
      this.validateSiteSlug();
    });
  }

  async loadSiteData() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (this.siteType === 'blog') {
          this.allSites = userData.blogSites || [];
        } else {
          this.allSites = userData.productSites || [];
        }
        
        this.siteData = this.allSites.find(site => site.id === this.siteId);
        
        if (this.siteData) {
          this.populateForm();
          this.renderApiEndpoints();
          this.renderSiteStats();
          this.showSettingsContent();
        } else {
          this.showError(`${this.siteType === 'blog' ? 'Blog' : 'Product'} site not found`);
        }
      } else {
        this.showError('User data not found');
      }
    } catch (error) {
      console.error('Error loading site data:', error);
      this.showError('Error loading site settings');
    }
  }

  populateForm() {
    // Populate basic fields
    this.element.querySelector('#site-name').value = this.siteData.name || '';
    this.element.querySelector('#site-slug').value = this.siteData.slug || '';
    this.updateSlugPreview(this.siteData.slug || '');

    // Show/hide and populate type-specific fields
    if (this.siteType === 'product') {
      const descriptionGroup = this.element.querySelector('#description-group');
      const currencyGroup = this.element.querySelector('#currency-group');
      const siteDescription = this.element.querySelector('#site-description');
      const defaultCurrency = this.element.querySelector('#default-currency');
      
      descriptionGroup.style.display = 'block';
      currencyGroup.style.display = 'block';
      siteDescription.value = this.siteData.description || '';
      defaultCurrency.value = this.siteData.defaultCurrency || 'USD';
    }
  }

  renderApiEndpoints() {
    const endpointsContainer = this.element.querySelector('#api-endpoints-list');
    
    let endpoints = [];
    
    if (this.siteType === 'blog') {
      endpoints = [
        {
          label: 'All Posts',
          url: `/users/${this.currentUser.uid}/blogs/${this.siteId}/api/content.json`,
          description: 'Returns all published blog posts'
        },
        {
          label: 'Single Post',
          url: `/users/${this.currentUser.uid}/blogs/${this.siteId}/api/content/{slug}.json`,
          description: 'Returns a specific post by slug'
        }
      ];
    } else {
      endpoints = [
        {
          label: 'All Products',
          url: `/users/${this.currentUser.uid}/productSites/${this.siteId}/api/products.json`,
          description: 'Returns all published products'
        },
        {
          label: 'Single Product',
          url: `/users/${this.currentUser.uid}/productSites/${this.siteId}/api/products/{slug}.json`,
          description: 'Returns a specific product by slug'
        }
      ];
    }

    const endpointsHTML = endpoints.map(endpoint => `
      <div class="api-endpoint-item">
        <div class="endpoint-header">
          <h4>${endpoint.label}</h4>
          <button class="copy-button" onclick="navigator.clipboard.writeText('${endpoint.url}').then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy URL', 2000); })">
            Copy URL
          </button>
        </div>
        <div class="endpoint-url-container">
          <code class="endpoint-url">${endpoint.url}</code>
        </div>
        <p class="endpoint-description">${endpoint.description}</p>
      </div>
    `).join('');

    endpointsContainer.innerHTML = endpointsHTML;
  }

  renderSiteStats() {
    const statsContainer = this.element.querySelector('#site-stats');
    const createdDate = this.formatDate(this.siteData.createdAt);
    const updatedDate = this.siteData.updatedAt ? this.formatDate(this.siteData.updatedAt) : 'Never';
    
    let contentCount = 0;
    let contentLabel = '';
    
    if (this.siteType === 'blog') {
      contentCount = this.siteData.postCount || 0;
      contentLabel = 'Posts';
    } else {
      contentCount = this.siteData.productCount || 0;
      contentLabel = 'Products';
    }

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${contentCount}</div>
          <div class="stat-label">${contentLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${createdDate}</div>
          <div class="stat-label">Created</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${updatedDate}</div>
          <div class="stat-label">Last Updated</div>
        </div>
      </div>
    `;
  }

  showSettingsContent() {
    const loadingState = this.element.querySelector('#loading-state');
    const settingsContent = this.element.querySelector('#settings-content');
    
    loadingState.style.display = 'none';
    settingsContent.style.display = 'block';
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

  async handleSaveSettings() {
    const formData = this.getFormData();
    
    const saveButton = this.element.querySelector('#save-button');
    const buttonText = saveButton.querySelector('.button-text');
    const buttonLoading = saveButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(formData)) {
      return;
    }

    // Show loading state
    saveButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await this.updateSiteData(formData);
      
      toast.success('Site settings updated successfully!');
      
      // Trigger sidebar update
      const eventName = this.siteType === 'blog' ? 'blog-sites-updated' : 'product-sites-updated';
      window.dispatchEvent(new CustomEvent(eventName));

    } catch (error) {
      console.error('Error updating site settings:', error);
      this.handleUpdateError(error);
    } finally {
      // Reset button state
      saveButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async updateSiteData(formData) {
    // Create updated site object
    const updatedSite = {
      ...this.siteData,
      name: formData.name,
      slug: formData.slug,
      updatedAt: new Date()
    };

    // Add type-specific fields
    if (this.siteType === 'product') {
      updatedSite.description = formData.description || '';
      updatedSite.defaultCurrency = formData.defaultCurrency;
    }

    // Update the site in the array
    const updatedSites = this.allSites.map(site => 
      site.id === this.siteId ? updatedSite : site
    );

    // Update user document in Firestore
    const userDocRef = doc(db, 'users', this.currentUser.uid);
    const updateField = this.siteType === 'blog' ? 'blogSites' : 'productSites';
    
    await updateDoc(userDocRef, {
      [updateField]: updatedSites
    });

    // Update local data
    this.siteData = updatedSite;
    this.allSites = updatedSites;
    
    // Re-render API endpoints and stats with updated data
    this.renderApiEndpoints();
    this.renderSiteStats();
  }

  getFormData() {
    const data = {
      name: this.element.querySelector('#site-name').value.trim(),
      slug: this.element.querySelector('#site-slug').value.trim()
    };

    if (this.siteType === 'product') {
      data.description = this.element.querySelector('#site-description').value.trim();
      data.defaultCurrency = this.element.querySelector('#default-currency').value;
    }

    return data;
  }

  validateForm(formData) {
    let isValid = true;

    if (!this.validateSiteName(formData.name)) {
      isValid = false;
    }

    if (!this.validateSiteSlug(formData.slug)) {
      isValid = false;
    }

    return isValid;
  }

  validateSiteName(name = null) {
    const nameValue = name || this.element.querySelector('#site-name').value.trim();
    
    if (!nameValue) {
      this.showFieldError('site-name-error', 'Site name is required.');
      return false;
    }

    if (nameValue.length < 2) {
      this.showFieldError('site-name-error', 'Site name must be at least 2 characters long.');
      return false;
    }

    if (nameValue.length > 50) {
      this.showFieldError('site-name-error', 'Site name must be less than 50 characters.');
      return false;
    }

    // Check for duplicate name (excluding current site)
    if (this.isDuplicateName(nameValue)) {
      this.showFieldError('site-name-error', 'A site with this name already exists.');
      return false;
    }

    this.clearFieldError('site-name-error');
    return true;
  }

  validateSiteSlug(slug = null) {
    const slugValue = slug || this.element.querySelector('#site-slug').value.trim();
    
    if (!slugValue) {
      this.showFieldError('site-slug-error', 'URL slug is required.');
      return false;
    }

    if (slugValue.length < 2) {
      this.showFieldError('site-slug-error', 'URL slug must be at least 2 characters long.');
      return false;
    }

    if (slugValue.length > 50) {
      this.showFieldError('site-slug-error', 'URL slug must be less than 50 characters.');
      return false;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slugValue)) {
      this.showFieldError('site-slug-error', 'URL slug can only contain lowercase letters, numbers, and hyphens.');
      return false;
    }

    if (slugValue.startsWith('-') || slugValue.endsWith('-')) {
      this.showFieldError('site-slug-error', 'URL slug cannot start or end with a hyphen.');
      return false;
    }

    // Check for duplicate slug (excluding current site)
    if (this.isDuplicateSlug(slugValue)) {
      this.showFieldError('site-slug-error', 'This URL slug is already in use.');
      return false;
    }

    this.clearFieldError('site-slug-error');
    return true;
  }

  isDuplicateName(name) {
    return this.allSites.some(site => 
      site.id !== this.siteId && site.name.toLowerCase() === name.toLowerCase()
    );
  }

  isDuplicateSlug(slug) {
    return this.allSites.some(site => 
      site.id !== this.siteId && site.slug.toLowerCase() === slug.toLowerCase()
    );
  }

  handleCancel() {
    const confirmed = confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (confirmed) {
      const sectionName = this.siteType === 'blog' ? 
        `manage-blog-site-${this.siteId}` : 
        `manage-product-site-${this.siteId}`;
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: sectionName } 
      }));
    }
  }

  async handleDeleteSite() {
    const confirmed = confirm(
      `Are you sure you want to delete "${this.siteData.name}"?\n\n` +
      `This will permanently delete the ${this.siteType} site and all associated ${this.siteType === 'blog' ? 'posts' : 'products'}. ` +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      toast.warning(`Deleting ${this.siteType} site...`);

      // Import the appropriate management component to use its delete functionality
      if (this.siteType === 'blog') {
        const { ManageBlogSites } = await import('./blog/ManageBlogSites.js');
        const manager = new ManageBlogSites(this.siteId);
        await manager.deleteAllBlogPosts();
      } else {
        const { ManageProductSites } = await import('./product/ManageProductSites.js');
        const manager = new ManageProductSites(this.siteId);
        await manager.deleteAllProducts();
      }

      // Remove site from user's sites array
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const updateField = this.siteType === 'blog' ? 'blogSites' : 'productSites';
      const updatedSites = this.allSites.filter(site => site.id !== this.siteId);
      
      await updateDoc(userDocRef, {
        [updateField]: updatedSites
      });

      toast.success(`${this.siteType === 'blog' ? 'Blog' : 'Product'} site deleted successfully!`);

      // Trigger sidebar update
      const eventName = this.siteType === 'blog' ? 'blog-sites-updated' : 'product-sites-updated';
      window.dispatchEvent(new CustomEvent(eventName));

      // Navigate back to overview after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: 'overview' } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error(`Error deleting ${this.siteType} site. Please try again.`);
    }
  }

  handleUpdateError(error) {
    let message = 'An error occurred while updating the site settings. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    }

    toast.error(message);
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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

    const messageElement = this.element.querySelector('#settings-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }


}