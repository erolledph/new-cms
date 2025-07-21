// Dashboard page component
import { authManager } from '../auth/AuthManager.js';

export class DashboardPage {
  constructor() {
    this.element = null;
    this.currentUser = null;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'dashboard-container';
    this.element.innerHTML = `
      <div class="dashboard-header">
        <div class="header-left">
          <h1>Firebase CMS</h1>
        </div>
        <div class="header-right">
          <span class="user-email">${this.currentUser?.email || 'User'}</span>
          <button id="logout-button" class="logout-button">Logout</button>
        </div>
      </div>
      
      <div class="dashboard-body">
        <nav class="sidebar" id="sidebar">
          <div class="sidebar-content">
            <div class="nav-item" data-section="overview">
              <span class="nav-icon">📊</span>
              <span class="nav-text">Overview</span>
            </div>
            
            <div class="nav-item" data-section="analytics">
              <span class="nav-icon">📈</span>
              <span class="nav-text">Analytics</span>
            </div>
            
            <div class="nav-section">
              <div class="nav-item nav-section-header" data-section="products">
                <span class="nav-icon">🛍️</span>
                <span class="nav-text">Products</span>
                <span class="nav-arrow">▼</span>
              </div>
              <div class="nav-subsection" id="products-subsection">
                <div class="nav-subitem" data-section="create-product-site">
                  <span class="nav-icon">➕</span>
                  <span class="nav-text">Create Product Site</span>
                </div>
                <!-- Dynamic product sites will be added here -->
              </div>
            </div>
            
            <div class="nav-section">
              <div class="nav-item nav-section-header" data-section="blog">
                <span class="nav-icon">📝</span>
                <span class="nav-text">Blog</span>
                <span class="nav-arrow">▼</span>
              </div>
              <div class="nav-subsection" id="blog-subsection">
                <div class="nav-subitem" data-section="create-blog-site">
                  <span class="nav-icon">➕</span>
                  <span class="nav-text">Create Blog Site</span>
                </div>
                <!-- Dynamic blog sites will be added here -->
              </div>
            </div>
            
            <div class="nav-item" data-section="file-manager">
              <span class="nav-icon">📁</span>
              <span class="nav-text">File Manager</span>
            </div>
            
            <div class="nav-item" data-section="settings">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">Settings</span>
            </div>
          </div>
        </nav>
        
        <main class="main-content" id="main-content">
          <!-- Dynamic content will be loaded here -->
        </main>
      </div>
    `;

    this.attachEventListeners();
    this.loadSection('overview'); // Load overview by default
    return this.element;
  }

  attachEventListeners() {
    // Logout button
    const logoutButton = this.element.querySelector('#logout-button');
    logoutButton.addEventListener('click', () => {
      this.handleLogout();
    });

    // Navigation items
    const navItems = this.element.querySelectorAll('.nav-item, .nav-subitem');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        if (section) {
          this.loadSection(section);
          this.setActiveNavItem(e.currentTarget);
        }
      });
    });

    // Collapsible sections
    const sectionHeaders = this.element.querySelectorAll('.nav-section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSection(header);
      });
    });
  }

  toggleSection(header) {
    const section = header.parentElement;
    const subsection = section.querySelector('.nav-subsection');
    const arrow = header.querySelector('.nav-arrow');
    
    if (subsection.style.display === 'none' || !subsection.style.display) {
      subsection.style.display = 'block';
      arrow.textContent = '▼';
      section.classList.add('expanded');
    } else {
      subsection.style.display = 'none';
      arrow.textContent = '▶';
      section.classList.remove('expanded');
    }
  }

  setActiveNavItem(activeItem) {
    // Remove active class from all items
    const allItems = this.element.querySelectorAll('.nav-item, .nav-subitem');
    allItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked item
    activeItem.classList.add('active');
  }

  loadSection(sectionName) {
    const mainContent = this.element.querySelector('#main-content');
    
    switch (sectionName) {
      case 'overview':
        mainContent.innerHTML = this.renderOverview();
        break;
      case 'analytics':
        mainContent.innerHTML = this.renderPlaceholder('Analytics', 'Analytics dashboard coming soon...');
        break;
      case 'products':
      case 'create-product-site':
        mainContent.innerHTML = this.renderPlaceholder('Products', 'Product management coming soon...');
        break;
      case 'blog':
      case 'create-blog-site':
        mainContent.innerHTML = this.renderPlaceholder('Blog', 'Blog management coming soon...');
        break;
      case 'file-manager':
        mainContent.innerHTML = this.renderPlaceholder('File Manager', 'File management coming soon...');
        break;
      case 'settings':
        mainContent.innerHTML = this.renderPlaceholder('Settings', 'User settings coming soon...');
        break;
      default:
        mainContent.innerHTML = this.renderOverview();
    }
  }

  renderOverview() {
    return `
      <div class="content-section">
        <h2>Welcome to Firebase CMS</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <h3>Blog Sites</h3>
            <div class="stat-number">0</div>
            <div class="stat-label">of 3 sites created</div>
          </div>
          
          <div class="overview-card">
            <h3>Product Sites</h3>
            <div class="stat-number">0</div>
            <div class="stat-label">of 3 sites created</div>
          </div>
          
          <div class="overview-card">
            <h3>Total Content</h3>
            <div class="stat-number">0</div>
            <div class="stat-label">posts and products</div>
          </div>
          
          <div class="overview-card">
            <h3>Storage Used</h3>
            <div class="stat-number">0 MB</div>
            <div class="stat-label">of available storage</div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <button class="action-button" onclick="alert('Blog site creation coming soon!')">
              <span class="action-icon">📝</span>
              Create Blog Site
            </button>
            <button class="action-button" onclick="alert('Product site creation coming soon!')">
              <span class="action-icon">🛍️</span>
              Create Product Site
            </button>
            <button class="action-button" onclick="alert('File upload coming soon!')">
              <span class="action-icon">📁</span>
              Upload Files
            </button>
          </div>
        </div>
        
        <div class="user-info">
          <h3>Account Information</h3>
          <p><strong>Email:</strong> ${this.currentUser?.email || 'Not available'}</p>
          <p><strong>Plan:</strong> Free</p>
          <p><strong>Member since:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
  }

  renderPlaceholder(title, message) {
    return `
      <div class="content-section">
        <h2>${title}</h2>
        <div class="placeholder-content">
          <p>${message}</p>
        </div>
      </div>
    `;
  }

  async handleLogout() {
    try {
      await authManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  }
}