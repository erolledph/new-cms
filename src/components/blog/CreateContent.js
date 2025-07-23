// Blog Content Creation component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class CreateContent {
  constructor(blogSiteId) {
    this.blogSiteId = blogSiteId;
    this.element = null;
    this.currentUser = null;
    this.blogSite = null;
    this.isPreviewMode = false;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'create-content-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Create New Blog Post</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Blog Site
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading blog site details...</p>
        </div>
        
        <div id="content-form" class="content-form" style="display: none;">
          <form id="create-content-form">
            <div class="form-row">
              <div class="form-group">
                <label for="post-title">Title *</label>
                <input 
                  type="text" 
                  id="post-title" 
                  name="title" 
                  required 
                  placeholder="Enter your blog post title"
                  maxlength="200"
                >
                <span class="error-message" id="post-title-error"></span>
              </div>
              
              <div class="form-group">
                <label for="post-slug">URL Slug *</label>
                <input 
                  type="text" 
                  id="post-slug" 
                  name="slug" 
                  required 
                  placeholder="url-friendly-slug"
                  maxlength="200"
                >
                <div class="slug-preview">
                  <span class="slug-label">Preview URL:</span>
                  <span class="slug-url" id="slug-preview">your-slug-here</span>
                </div>
                <span class="error-message" id="post-slug-error"></span>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="post-author">Author</label>
                <input 
                  type="text" 
                  id="post-author" 
                  name="author" 
                  placeholder="Author name"
                  maxlength="100"
                >
              </div>
              
              <div class="form-group">
                <label for="post-status">Status</label>
                <select id="post-status" name="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            
            <div class="content-editor-section">
              <div class="editor-header">
                <h3>Content</h3>
                <div class="editor-controls">
                  <button type="button" class="toggle-button" id="toggle-preview">
                    <span id="preview-text">Show Preview</span>
                  </button>
                </div>
              </div>
              
              <div class="editor-container">
                <div class="editor-pane" id="editor-pane">
                  <textarea 
                    id="post-content" 
                    name="content" 
                    placeholder="Write your blog post content here... (Markdown supported)"
                    rows="20"
                  ></textarea>
                </div>
                
                <div class="preview-pane" id="preview-pane" style="display: none;">
                  <div class="preview-content" id="preview-content">
                    <p class="preview-placeholder">Preview will appear here...</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="seo-section">
              <h3>SEO Settings</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="seo-title">SEO Title</label>
                  <input 
                    type="text" 
                    id="seo-title" 
                    name="seoTitle" 
                    placeholder="SEO optimized title (leave empty to use post title)"
                    maxlength="60"
                  >
                  <small class="field-help">Recommended: 50-60 characters</small>
                </div>
                
                <div class="form-group">
                  <label for="featured-image">Featured Image URL</label>
                  <input 
                    type="url" 
                    id="featured-image" 
                    name="featuredImage" 
                    placeholder="https://example.com/image.jpg"
                  >
                  <button type="button" class="file-select-button" id="select-image-button">
                    SELECT from Files
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label for="meta-description">Meta Description</label>
                <textarea 
                  id="meta-description" 
                  name="metaDescription" 
                  placeholder="Brief description for search engines"
                  maxlength="160"
                  rows="3"
                ></textarea>
                <small class="field-help">Recommended: 150-160 characters</small>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="categories">Categories</label>
                  <input 
                    type="text" 
                    id="categories" 
                    name="categories" 
                    placeholder="Technology, Web Development, Tutorial (comma separated)"
                  >
                </div>
                
                <div class="form-group">
                  <label for="tags">Tags</label>
                  <input 
                    type="text" 
                    id="tags" 
                    name="tags" 
                    placeholder="javascript, react, tutorial (comma separated)"
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label for="keywords">Keywords</label>
                <input 
                  type="text" 
                  id="keywords" 
                  name="keywords" 
                  placeholder="primary keyword, secondary keyword (comma separated)"
                >
                <small class="field-help">Focus on 1-3 primary keywords</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" id="cancel-button">
                Cancel
              </button>
              <button type="button" class="save-draft-button" id="save-draft-button">
                <span class="button-text">Save Draft</span>
                <span class="button-loading" style="display: none;">Saving...</span>
              </button>
              <button type="submit" class="create-button" id="create-button">
                <span class="button-text">Create Post</span>
                <span class="button-loading" style="display: none;">Creating...</span>
              </button>
            </div>
          </form>
        </div>
        
        <div id="create-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadBlogSiteDetails();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    const form = this.element.querySelector('#create-content-form');
    const titleInput = this.element.querySelector('#post-title');
    const slugInput = this.element.querySelector('#post-slug');
    const contentTextarea = this.element.querySelector('#post-content');
    const togglePreviewButton = this.element.querySelector('#toggle-preview');
    const cancelButton = this.element.querySelector('#cancel-button');
    const saveDraftButton = this.element.querySelector('#save-draft-button');
    const selectImageButton = this.element.querySelector('#select-image-button');

    // Navigation
    backButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-blog-site-${this.blogSiteId}` } 
      }));
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreatePost();
    });

    // Auto-generate slug from title
    titleInput.addEventListener('input', (e) => {
      const title = e.target.value;
      const autoSlug = this.generateSlug(title);
      
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

    // Preview toggle
    togglePreviewButton.addEventListener('click', () => {
      this.togglePreview();
    });

    // Content change for preview
    contentTextarea.addEventListener('input', () => {
      if (this.isPreviewMode) {
        this.updatePreview();
      }
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      this.handleCancel();
    });

    // Save draft button
    saveDraftButton.addEventListener('click', () => {
      this.handleSaveDraft();
    });

    // File selection (placeholder for now)
    selectImageButton.addEventListener('click', () => {
      this.openFileSelectionModal();
    });

    // Real-time validation
    titleInput.addEventListener('blur', () => {
      this.validateTitle();
    });

    slugInput.addEventListener('blur', () => {
      this.validateSlug();
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
        const blogSites = userData.blogSites || [];
        this.blogSite = blogSites.find(site => site.id === this.blogSiteId);
        
        if (this.blogSite) {
          this.showContentForm();
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

  showContentForm() {
    const loadingState = this.element.querySelector('#loading-state');
    const contentForm = this.element.querySelector('#content-form');
    
    loadingState.style.display = 'none';
    contentForm.style.display = 'block';
    
    // Set default author to user email
    const authorInput = this.element.querySelector('#post-author');
    authorInput.value = this.currentUser.email.split('@')[0];
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

  togglePreview() {
    const editorPane = this.element.querySelector('#editor-pane');
    const previewPane = this.element.querySelector('#preview-pane');
    const toggleButton = this.element.querySelector('#toggle-preview');
    const previewText = this.element.querySelector('#preview-text');

    if (this.isPreviewMode) {
      // Switch to editor
      editorPane.style.display = 'block';
      previewPane.style.display = 'none';
      previewText.textContent = 'Show Preview';
      this.isPreviewMode = false;
    } else {
      // Switch to preview
      editorPane.style.display = 'none';
      previewPane.style.display = 'block';
      previewText.textContent = 'Show Editor';
      this.isPreviewMode = true;
      this.updatePreview();
    }
  }

  updatePreview() {
    const content = this.element.querySelector('#post-content').value;
    const previewContent = this.element.querySelector('#preview-content');
    
    if (!content.trim()) {
      previewContent.innerHTML = '<p class="preview-placeholder">Preview will appear here...</p>';
      return;
    }

    // Simple markdown-like rendering (basic implementation)
    let html = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    previewContent.innerHTML = `<p>${html}</p>`;
  }

  async handleCreatePost() {
    const formData = this.getFormData();
    
    const createButton = this.element.querySelector('#create-button');
    const buttonText = createButton.querySelector('.button-text');
    const buttonLoading = createButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form

    if (!this.validateForm(formData)) {
      return;
    }

    // Show loading state
    createButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await this.savePost(formData);
      
      toast.success('Blog post created successfully!');
      
      // Navigate back to blog site management after delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-section', { 
          detail: { section: `manage-blog-site-${this.blogSiteId}` } 
        }));
      }, 2000);

    } catch (error) {
      console.error('Error creating blog post:', error);
      this.handleCreateError(error);
    } finally {
      // Reset button state
      createButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async handleSaveDraft() {
    const formData = this.getFormData();
    formData.status = 'draft'; // Force draft status
    
    const saveDraftButton = this.element.querySelector('#save-draft-button');
    const buttonText = saveDraftButton.querySelector('.button-text');
    const buttonLoading = saveDraftButton.querySelector('.button-loading');

    // Basic validation (less strict for drafts)
    if (!formData.title.trim()) {
      this.showFieldError('post-title-error', 'Title is required even for drafts.');
      return;
    }

    // Show loading state
    saveDraftButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      console.log('=== SAVING DRAFT ===');
      await this.savePost(formData);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      this.handleCreateError(error); // Use the enhanced error handler
    } finally {
      // Reset button state
      saveDraftButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async savePost(formData) {
    const postId = this.generateUniqueId();
    const now = new Date();
    
    const postData = {
      id: postId,
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      featuredImageUrl: formData.featuredImage || '',
      metaDescription: formData.metaDescription || '',
      seoTitle: formData.seoTitle || formData.title,
      keywords: this.parseCommaSeparated(formData.keywords),
      author: formData.author || this.currentUser.email.split('@')[0],
      categories: this.parseCommaSeparated(formData.categories),
      tags: this.parseCommaSeparated(formData.tags),
      status: formData.status,
      contentUrl: `/users/${this.currentUser.uid}/blogs/${this.blogSiteId}/api/content/${formData.slug}.json`,
      publishDate: formData.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now
    };

    // Enhanced logging for debugging
    console.log('=== BLOG POST CREATION DEBUG ===');
    console.log('User ID:', this.currentUser.uid);
    console.log('Blog Site ID:', this.blogSiteId);
    console.log('Post ID:', postId);
    console.log('Post Data:', postData);
    console.log('Firestore Path:', `content/${this.currentUser.uid}/blogs/${this.blogSiteId}/posts/${postId}`);
    console.log('================================');
    try {
      // Save post to Firestore
      const postDocRef = doc(db, 'users', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts', postId);
      console.log('🔍 Constructed Firestore Document Reference Path:', postDocRef.path);
      console.log('🔍 Document Reference ID:', postDocRef.id);
      console.log('🔍 Document Reference Parent Path:', postDocRef.parent.path);
      console.log('Attempting to save post to Firestore...');
      await setDoc(postDocRef, postData);
      console.log('✅ Post saved successfully to Firestore');
    } catch (firestoreError) {
      console.error('❌ FIRESTORE SAVE ERROR:', firestoreError);
      console.error('Error Code:', firestoreError.code);
      console.error('Error Message:', firestoreError.message);
      console.error('Full Error Object:', firestoreError);
      throw firestoreError; // Re-throw to be caught by the calling function
    }

    try {
      // Update blog site post count if published
      if (formData.status === 'published') {
        console.log('Updating blog site post count...');
        await this.updateBlogSitePostCount(1);
        console.log('✅ Blog site post count updated');
      }
    } catch (countError) {
      console.error('❌ POST COUNT UPDATE ERROR:', countError);
      // Don't throw this error as the post was saved successfully
    }
  }

  async updateBlogSitePostCount(increment_value) {
    try {
      // Update the post count in the user's blogSites array
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedBlogSites = userData.blogSites.map(site => {
          if (site.id === this.blogSiteId) {
            return {
              ...site,
              postCount: (site.postCount || 0) + increment_value
            };
          }
          return site;
        });

        await updateDoc(userDocRef, {
          blogSites: updatedBlogSites
        });
      }
    } catch (error) {
      console.error('Error updating post count:', error);
      // Don't throw error as post was created successfully
    }
  }

  generateUniqueId() {
    return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  parseCommaSeparated(value) {
    if (!value || !value.trim()) return [];
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  getFormData() {
    return {
      title: this.element.querySelector('#post-title').value.trim(),
      slug: this.element.querySelector('#post-slug').value.trim(),
      content: this.element.querySelector('#post-content').value.trim(),
      author: this.element.querySelector('#post-author').value.trim(),
      status: this.element.querySelector('#post-status').value,
      seoTitle: this.element.querySelector('#seo-title').value.trim(),
      featuredImage: this.element.querySelector('#featured-image').value.trim(),
      metaDescription: this.element.querySelector('#meta-description').value.trim(),
      categories: this.element.querySelector('#categories').value.trim(),
      tags: this.element.querySelector('#tags').value.trim(),
      keywords: this.element.querySelector('#keywords').value.trim()
    };
  }

  validateForm(formData) {
    let isValid = true;

    if (!this.validateTitle(formData.title)) {
      isValid = false;
    }

    if (!this.validateSlug(formData.slug)) {
      isValid = false;
    }

    return isValid;
  }

  validateTitle(title = null) {
    const titleValue = title || this.element.querySelector('#post-title').value.trim();
    
    if (!titleValue) {
      this.showFieldError('post-title-error', 'Title is required.');
      return false;
    }

    if (titleValue.length < 3) {
      this.showFieldError('post-title-error', 'Title must be at least 3 characters long.');
      return false;
    }

    if (titleValue.length > 200) {
      this.showFieldError('post-title-error', 'Title must be less than 200 characters.');
      return false;
    }

    this.clearFieldError('post-title-error');
    return true;
  }

  validateSlug(slug = null) {
    const slugValue = slug || this.element.querySelector('#post-slug').value.trim();
    
    if (!slugValue) {
      this.showFieldError('post-slug-error', 'URL slug is required.');
      return false;
    }

    if (slugValue.length < 3) {
      this.showFieldError('post-slug-error', 'URL slug must be at least 3 characters long.');
      return false;
    }

    if (slugValue.length > 200) {
      this.showFieldError('post-slug-error', 'URL slug must be less than 200 characters.');
      return false;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slugValue)) {
      this.showFieldError('post-slug-error', 'URL slug can only contain lowercase letters, numbers, and hyphens.');
      return false;
    }

    if (slugValue.startsWith('-') || slugValue.endsWith('-')) {
      this.showFieldError('post-slug-error', 'URL slug cannot start or end with a hyphen.');
      return false;
    }

    this.clearFieldError('post-slug-error');
    return true;
  }

  handleCancel() {
    const confirmed = confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (confirmed) {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-blog-site-${this.blogSiteId}` } 
      }));
    }
  }

  handleCreateError(error) {
    console.error('=== BLOG POST CREATION ERROR ===');
    console.error('Error Object:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('================================');

    let message = 'An error occurred while creating the blog post. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
      console.error('🔒 PERMISSION DENIED: Check Firestore security rules for content collection');
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'invalid-argument') {
      message = 'Invalid data provided. Please check your input and try again.';
      console.error('📝 INVALID ARGUMENT: Check data structure and required fields');
    } else if (error.code === 'not-found') {
      message = 'Blog site not found. Please refresh and try again.';
      console.error('🔍 NOT FOUND: Blog site or collection path may be incorrect');
    } else if (error.code === 'unauthenticated') {
      message = 'Authentication required. Please sign in again.';
      console.error('🔐 UNAUTHENTICATED: User authentication may have expired');
    } else {
      console.error('🚨 UNKNOWN ERROR:', error.code, error.message);
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
            <h3>Select Image File</h3>
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
        const featuredImageInput = this.element.querySelector('#featured-image');
        featuredImageInput.value = selectedFileUrl;
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
      if (e.target.classList.contains('modal-file-item')) {
        // Remove previous selection
        modal.querySelectorAll('.modal-file-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        e.target.classList.add('selected');
        selectedFileUrl = e.target.dataset.fileUrl;
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

    const messageElement = this.element.querySelector('#create-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }

}
