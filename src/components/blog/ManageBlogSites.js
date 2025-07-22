// Blog Site Management component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { doc, updateDoc, getDoc, arrayRemove, collection, getDocs, writeBatch } from 'firebase/firestore';
import { CreateContent } from './CreateContent.js';
import { toast } from '../../utils/toast.js';

export class ManageBlogSites {
  constructor(blogSiteId) {
    this.blogSiteId = blogSiteId;
    this.element = null;
    this.currentUser = null;
    this.blogSite = null;
    this.allBlogSites = [];
    this.isEditing = false;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'manage-blog-sites-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Manage Blog Site</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Overview
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading blog site details...</p>
        </div>
        
        <div id="blog-site-details" class="blog-site-details" style="display: none;">
          <!-- Blog site details will be loaded here -->
        </div>
        
        <div id="edit-form" class="edit-form" style="display: none;">
          <!-- Edit form will be loaded here -->
        </div>
        
        <div id="manage-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadBlogSiteDetails();
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

  async loadBlogSiteDetails() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.allBlogSites = userData.blogSites || [];
        this.blogSite = this.allBlogSites.find(site => site.id === this.blogSiteId);
        
        if (this.blogSite) {
          this.renderBlogSiteDetails();
        } else {
          this.showError('Blog site not found');
        }
      } else {
        this.showError('User data not found');
      }
    } catch (error) {
      console.error('Error loading blog site details:', error);
      this.showError('Error loading blog site details');
    }
  }

  renderBlogSiteDetails() {
    const loadingState = this.element.querySelector('#loading-state');
    const detailsContainer = this.element.querySelector('#blog-site-details');
    
    loadingState.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    const createdDate = this.formatDate(this.blogSite.createdAt);
    
    detailsContainer.innerHTML = `
      <div class="site-info-card">
        <div class="site-header">
          <h3>${this.blogSite.name}</h3>
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
            <span class="detail-value">${this.blogSite.slug}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created:</span>
            <span class="detail-value">${createdDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Posts:</span>
            <span class="detail-value">${this.blogSite.postCount || 0} posts</span>
          </div>
        </div>
        
        <div class="site-preview">
          <h4>API Endpoints</h4>
          <div class="api-endpoints">
            <div class="endpoint">
              <span class="endpoint-label">Content API:</span>
              <code class="endpoint-url">/${this.currentUser.uid}/${this.blogSite.id}/api/content.json</code>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h4>Quick Actions</h4>
          <div class="action-buttons">
            <button class="action-button" id="create-content-button">
              <span class="action-icon">ADD</span>
              Create Content
            </button>
            <button class="action-button" id="manage-content-button">
              <span class="action-icon">MANAGE</span>
              Manage Content
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Attach event listeners for edit and delete buttons
    const editButton = detailsContainer.querySelector('#edit-site-button');
    const deleteButton = detailsContainer.querySelector('#delete-site-button');
    const createContentButton = detailsContainer.querySelector('#create-content-button');
    const manageContentButton = detailsContainer.querySelector('#manage-content-button');
    
    editButton.addEventListener('click', () => this.showEditForm());
    deleteButton.addEventListener('click', () => this.handleDeleteSite());
    createContentButton.addEventListener('click', () => this.navigateToCreateContent());
    manageContentButton.addEventListener('click', () => this.navigateToManageContent());
  }

  navigateToCreateContent() {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `create-content-${this.blogSiteId}` } 
    }));
  }

  navigateToManageContent() {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `manage-content-${this.blogSiteId}` } 
    }));
  }

  showEditForm() {
    const detailsContainer = this.element.querySelector('#blog-site-details');
    const editFormContainer = this.element.querySelector('#edit-form');
    
    detailsContainer.style.display = 'none';
    editFormContainer.style.display = 'block';
    this.isEditing = true;
    
    editFormContainer.innerHTML = `
      <div class="edit-site-form">
        <h3>Edit Blog Site</h3>
        
        <form id="edit-site-form" class="create-site-form">
          <div class="form-group">
            <label for="edit-site-name">Site Name *</label>
            <input 
              type="text" 
              id="edit-site-name" 
              name="site-name" 
              required 
              value="${this.blogSite.name}"
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
              value="${this.blogSite.slug}"
              maxlength="50"
            >
            <div class="slug-preview">
              <span class="slug-label">Preview URL:</span>
              <span class="slug-url" id="edit-slug-preview">${this.blogSite.slug}</span>
            </div>
            <span class="error-message" id="edit-site-slug-error"></span>
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
    const detailsContainer = this.element.querySelector('#blog-site-details');
    const editFormContainer = this.element.querySelector('#edit-form');
    
    editFormContainer.style.display = 'none';
    detailsContainer.style.display = 'block';
    this.isEditing = false;
    this.clearErrors();
  }

  async handleUpdateSite() {
    const siteName = this.element.querySelector('#edit-site-name').value.trim();
    const siteSlug = this.element.querySelector('#edit-site-slug').value.trim();
    
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
      // Create updated blog site object
      const updatedBlogSite = {
        ...this.blogSite,
        name: siteName,
        slug: siteSlug,
        updatedAt: new Date()
      };

      // Update the blog site in the array
      const updatedBlogSites = this.allBlogSites.map(site => 
        site.id === this.blogSiteId ? updatedBlogSite : site
      );

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        blogSites: updatedBlogSites
      });

      // Update local data
      this.blogSite = updatedBlogSite;
      this.allBlogSites = updatedBlogSites;

      // Show success message
      toast.success('Blog site updated successfully!');
      
      // Return to details view
      this.cancelEdit();
      this.renderBlogSiteDetails();

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('blog-sites-updated'));

    } catch (error) {
      console.error('Error updating blog site:', error);
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
      this.showFieldError('edit-site-name-error', 'A blog site with this name already exists.');
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
    return this.allBlogSites.some(site => 
      site.id !== this.blogSiteId && site.name.toLowerCase() === name.toLowerCase()
    );
  }

  isDuplicateSlug(slug) {
    return this.allBlogSites.some(site => 
      site.id !== this.blogSiteId && site.slug.toLowerCase() === slug.toLowerCase()
    );
  }

  async handleDeleteSite() {
    const confirmed = confirm(
      `Are you sure you want to delete "${this.blogSite.name}"?\n\n` +
      'This will permanently delete the blog site and all associated content. ' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      toast.warning('Deleting blog site and associated content...');

      // Delete all associated blog posts
      await this.deleteAllBlogPosts();

      // Remove blog site from user's blogSites array
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        blogSites: arrayRemove(this.blogSite)
      });

      toast.success('Blog site deleted successfully!');

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('blog-sites-updated'));

      // Navigate back to overview after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: 'overview' } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error deleting blog site:', error);
      toast.error('Error deleting blog site. Please try again.');
    }
  }

  async deleteAllBlogPosts() {
    try {
      // Get all posts for this blog site
      const postsCollectionRef = collection(db, 'users', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts');
      const postsSnapshot = await getDocs(postsCollectionRef);

      if (postsSnapshot.empty) {
        console.log('No posts to delete');
        return;
      }

      // Use batch delete for efficiency
      const batch = writeBatch(db);
      
      postsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${postsSnapshot.docs.length} blog posts`);

    } catch (error) {
      console.error('Error deleting blog posts:', error);
      throw error;
    }
  }

  handleUpdateError(error) {
    let message = 'An error occurred while updating the blog site. Please try again.';

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