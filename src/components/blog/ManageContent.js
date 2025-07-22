// Blog Content Management component
import { authManager } from '../../auth/AuthManager.js';
import { db } from '../../firebase.js';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { toast } from '../../utils/toast.js';

export class ManageContent {
  constructor(blogSiteId) {
    this.blogSiteId = blogSiteId;
    this.element = null;
    this.currentUser = null;
    this.blogSite = null;
    this.posts = [];
    this.filteredPosts = [];
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.searchTerm = '';
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'manage-content-container';
    this.element.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Manage Blog Content</h2>
          <button class="back-button" id="back-button">
            <span class="nav-icon">←</span>
            Back to Blog Site
          </button>
        </div>
        
        <div id="loading-state" class="loading-message">
          <p>Loading blog content...</p>
        </div>
        
        <div id="content-management" class="content-management" style="display: none;">
          <div class="content-controls">
            <div class="controls-row">
              <div class="search-box">
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="Search posts by title or content..."
                  class="search-input"
                >
                <button class="search-button" id="search-button">SEARCH</button>
              </div>
              
              <div class="filter-controls">
                <select id="status-filter" class="filter-select">
                  <option value="all">All Posts</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                
                <select id="sort-select" class="filter-select">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>
            </div>
            
            <div class="bulk-actions" id="bulk-actions" style="display: none;">
              <span class="selected-count" id="selected-count">0 posts selected</span>
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
          
          <div class="posts-container">
            <div class="posts-header">
              <div class="posts-stats" id="posts-stats">
                <!-- Stats will be loaded here -->
              </div>
              
              <div class="posts-actions">
                <button class="action-button" id="create-new-post">
                  <span class="action-icon">ADD</span>
                  Create New Post
                </button>
              </div>
            </div>
            
            <div class="posts-list" id="posts-list">
              <!-- Posts will be loaded here -->
            </div>
          </div>
        </div>
        
        <div id="manage-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadBlogSiteAndContent();
    return this.element;
  }

  attachEventListeners() {
    const backButton = this.element.querySelector('#back-button');
    const searchInput = this.element.querySelector('#search-input');
    const searchButton = this.element.querySelector('#search-button');
    const statusFilter = this.element.querySelector('#status-filter');
    const sortSelect = this.element.querySelector('#sort-select');
    const createNewPostButton = this.element.querySelector('#create-new-post');
    const bulkPublishButton = this.element.querySelector('#bulk-publish');
    const bulkDraftButton = this.element.querySelector('#bulk-draft');
    const bulkDeleteButton = this.element.querySelector('#bulk-delete');

    // Navigation
    backButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `manage-blog-site-${this.blogSiteId}` } 
      }));
    });

    // Search
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterAndSortPosts();
    });

    searchButton.addEventListener('click', () => {
      this.filterAndSortPosts();
    });

    // Filters
    statusFilter.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.filterAndSortPosts();
    });

    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.filterAndSortPosts();
    });

    // Create new post
    createNewPostButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
        detail: { section: `create-content-${this.blogSiteId}` } 
      }));
    });

    // Bulk actions
    bulkPublishButton.addEventListener('click', () => this.handleBulkAction('publish'));
    bulkDraftButton.addEventListener('click', () => this.handleBulkAction('draft'));
    bulkDeleteButton.addEventListener('click', () => this.handleBulkAction('delete'));
  }

  async loadBlogSiteAndContent() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      // Load blog site details
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const blogSites = userData.blogSites || [];
        this.blogSite = blogSites.find(site => site.id === this.blogSiteId);
        
        if (!this.blogSite) {
          this.showError('Blog site not found');
          return;
        }
      } else {
        this.showError('User data not found');
        return;
      }

      // Load blog posts
      await this.loadBlogPosts();
      this.showContentManagement();

    } catch (error) {
      console.error('Error loading blog site and content:', error);
      this.showError('Error loading blog content');
    }
  }

  async loadBlogPosts() {
    try {
      const postsCollectionRef = collection(db, 'content', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts');
      const postsQuery = query(postsCollectionRef, orderBy('createdAt', 'desc'));
      const postsSnapshot = await getDocs(postsQuery);
      
      this.posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.filterAndSortPosts();
    } catch (error) {
      console.error('Error loading blog posts:', error);
      this.posts = [];
      this.filteredPosts = [];
    }
  }

  showContentManagement() {
    const loadingState = this.element.querySelector('#loading-state');
    const contentManagement = this.element.querySelector('#content-management');
    
    loadingState.style.display = 'none';
    contentManagement.style.display = 'block';
    
    this.updatePostsStats();
    this.renderPostsList();
  }

  filterAndSortPosts() {
    let filtered = [...this.posts];

    // Apply status filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(post => post.status === this.currentFilter);
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(this.searchTerm) ||
        post.content.toLowerCase().includes(this.searchTerm) ||
        (post.author && post.author.toLowerCase().includes(this.searchTerm))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    this.filteredPosts = filtered;
    this.renderPostsList();
    this.updatePostsStats();
  }

  updatePostsStats() {
    const statsContainer = this.element.querySelector('#posts-stats');
    const totalPosts = this.posts.length;
    const publishedPosts = this.posts.filter(post => post.status === 'published').length;
    const draftPosts = this.posts.filter(post => post.status === 'draft').length;
    const filteredCount = this.filteredPosts.length;

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-number">${totalPosts}</span>
        <span class="stat-label">Total Posts</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${publishedPosts}</span>
        <span class="stat-label">Published</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${draftPosts}</span>
        <span class="stat-label">Drafts</span>
      </div>
      ${filteredCount !== totalPosts ? `
        <div class="stat-item">
          <span class="stat-number">${filteredCount}</span>
          <span class="stat-label">Filtered Results</span>
        </div>
      ` : ''}
    `;
  }

  renderPostsList() {
    const postsListContainer = this.element.querySelector('#posts-list');
    
    if (this.filteredPosts.length === 0) {
      postsListContainer.innerHTML = `
        <div class="empty-state">
          <p>No posts found.</p>
          ${this.posts.length === 0 ? `
            <button class="action-button" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-content-${this.blogSiteId}' } }))">
              <span class="action-icon">ADD</span>
              Create Your First Post
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    const postsHTML = this.filteredPosts.map(post => this.renderPostItem(post)).join('');
    
    postsListContainer.innerHTML = `
      <div class="posts-table">
        <div class="posts-table-header">
          <div class="table-cell checkbox-cell">
            <div class="table-cell image-cell">Image</div>
            <input type="checkbox" id="select-all" class="post-checkbox">
          </div>
          <div class="table-cell image-cell">Image</div>
          <div class="table-cell title-cell">Title</div>
          <div class="table-cell status-cell">Status</div>
          <div class="table-cell author-cell">Author</div>
          <div class="table-cell date-cell">Date</div>
          <div class="table-cell actions-cell">Actions</div>
        </div>
        <div class="posts-table-body">
          ${postsHTML}
        </div>
      </div>
    `;

    this.attachPostEventListeners();
  }

  renderPostItem(post) {
    const createdDate = this.formatDate(post.createdAt);
    const statusClass = post.status === 'published' ? 'status-published' : 'status-draft';
    

    return `
      <div class="post-row" data-post-id="${post.id}">
        <div class="table-cell checkbox-cell">
          <input type="checkbox" class="post-checkbox" data-post-id="${post.id}">
        </div>
        <div class="table-cell image-cell">
          ${post.featuredImageUrl ? `
            <div class="post-image">
              <img src="${post.featuredImageUrl}" alt="${post.title}" loading="lazy" />
            </div>
          ` : '<div class="no-image">POST</div>'}
        </div>
        <div class="table-cell title-cell">
          <div class="post-title">
            <strong>${post.title}</strong>
            <div class="post-slug">/${post.slug}</div>
          </div>
        </div>
        <div class="table-cell status-cell">
          <span class="status-badge ${statusClass}">${post.status}</span>
        </div>
        <div class="table-cell author-cell">${post.author || 'Unknown'}</div>
        <div class="table-cell date-cell">${createdDate}</div>
        <div class="table-cell actions-cell">
          <div class="post-actions">
            <button class="post-action-button edit-button" data-post-id="${post.id}" title="Edit">
              EDIT
            </button>
            <button class="post-action-button ${post.status === 'published' ? 'draft-button' : 'publish-button'}" 
                    data-post-id="${post.id}" 
                    title="${post.status === 'published' ? 'Move to Draft' : 'Publish'}">
              ${post.status === 'published' ? 'DRAFT' : 'PUBLISH'}
            </button>
            <button class="post-action-button duplicate-button" data-post-id="${post.id}" title="Duplicate">
              COPY
            </button>
            <button class="post-action-button delete-button" data-post-id="${post.id}" title="Delete">
              DELETE
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachPostEventListeners() {
    const selectAllCheckbox = this.element.querySelector('#select-all');
    const postCheckboxes = this.element.querySelectorAll('.post-checkbox[data-post-id]');
    const editButtons = this.element.querySelectorAll('.edit-button');
    const publishDraftButtons = this.element.querySelectorAll('.publish-button, .draft-button');
    const duplicateButtons = this.element.querySelectorAll('.duplicate-button');
    const deleteButtons = this.element.querySelectorAll('.delete-button');

    // Select all functionality
    selectAllCheckbox.addEventListener('change', (e) => {
      postCheckboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
      this.updateBulkActions();
    });

    // Individual checkboxes
    postCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateBulkActions();
      });
    });

    // Post actions
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        this.handleEditPost(postId);
      });
    });

    publishDraftButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        this.handleTogglePostStatus(postId);
      });
    });

    duplicateButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        this.handleDuplicatePost(postId);
      });
    });

    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const postId = e.target.dataset.postId;
        this.handleDeletePost(postId);
      });
    });
  }

  updateBulkActions() {
    const selectedCheckboxes = this.element.querySelectorAll('.post-checkbox[data-post-id]:checked');
    const bulkActionsContainer = this.element.querySelector('#bulk-actions');
    const selectedCountElement = this.element.querySelector('#selected-count');

    if (selectedCheckboxes.length > 0) {
      bulkActionsContainer.style.display = 'flex';
      selectedCountElement.textContent = `${selectedCheckboxes.length} post${selectedCheckboxes.length > 1 ? 's' : ''} selected`;
    } else {
      bulkActionsContainer.style.display = 'none';
    }
  }

  async handleTogglePostStatus(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const newStatus = post.status === 'published' ? 'draft' : 'published';
    
    try {
      const postDocRef = doc(db, 'content', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts', postId);
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'published' && !post.publishDate) {
        updateData.publishDate = new Date();
      }

      await updateDoc(postDocRef, updateData);

      // Update local data
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        this.posts[postIndex] = { ...this.posts[postIndex], ...updateData };
      }

      this.filterAndSortPosts();
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'moved to draft'} successfully!`);

    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Error updating post status. Please try again.');
    }
  }

  async handleDeletePost(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const confirmed = confirm(`Are you sure you want to delete "${post.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const postDocRef = doc(db, 'content', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts', postId);
      await deleteDoc(postDocRef);

      // Remove from local data
      this.posts = this.posts.filter(p => p.id !== postId);
      this.filterAndSortPosts();

      toast.success('Post deleted successfully!');

    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post. Please try again.');
    }
  }

  handleEditPost(postId) {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { 
      detail: { section: `edit-content-${this.blogSiteId}-${postId}` } 
    }));
  }

  handleDuplicatePost(postId) {
    // For now, show a placeholder message
    // In a full implementation, this would create a copy of the post
    alert(`Duplicate functionality for post ${postId} will be implemented in a future update!`);
  }

  async handleBulkAction(action) {
    const selectedCheckboxes = this.element.querySelectorAll('.post-checkbox[data-post-id]:checked');
    const selectedPostIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.postId);

    if (selectedPostIds.length === 0) return;

    let confirmed = true;
    if (action === 'delete') {
      confirmed = confirm(`Are you sure you want to delete ${selectedPostIds.length} post${selectedPostIds.length > 1 ? 's' : ''}?\n\nThis action cannot be undone.`);
    }

    if (!confirmed) return;

    try {
      const promises = selectedPostIds.map(async (postId) => {
        const postDocRef = doc(db, 'content', this.currentUser.uid, 'blogs', this.blogSiteId, 'posts', postId);
        
        if (action === 'delete') {
          await deleteDoc(postDocRef);
        } else {
          const updateData = {
            status: action,
            updatedAt: new Date()
          };

          if (action === 'publish') {
            const post = this.posts.find(p => p.id === postId);
            if (post && !post.publishDate) {
              updateData.publishDate = new Date();
            }
          }

          await updateDoc(postDocRef, updateData);
        }
      });

      await Promise.all(promises);

      // Update local data
      if (action === 'delete') {
        this.posts = this.posts.filter(post => !selectedPostIds.includes(post.id));
      } else {
        this.posts = this.posts.map(post => {
          if (selectedPostIds.includes(post.id)) {
            const updateData = { status: action, updatedAt: new Date() };
            if (action === 'publish' && !post.publishDate) {
              updateData.publishDate = new Date();
            }
            return { ...post, ...updateData };
          }
          return post;
        });
      }

      this.filterAndSortPosts();
      this.updateBulkActions();

      const actionText = action === 'delete' ? 'deleted' : 
                        action === 'publish' ? 'published' : 'moved to draft';
      toast.success(`${selectedPostIds.length} post${selectedPostIds.length > 1 ? 's' : ''} ${actionText} successfully!`);

    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Error performing bulk ${action}. Please try again.`);
    }
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