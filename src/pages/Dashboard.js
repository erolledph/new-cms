// Dashboard page component
import { authManager } from '../auth/AuthManager.js';
import { db } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { CreateBlogSite } from '../components/blog/CreateBlogSite.js';
import { ManageBlogSites } from '../components/blog/ManageBlogSites.js';
import { CreateContent } from '../components/blog/CreateContent.js';
import { ManageContent } from '../components/blog/ManageContent.js';
import { FileManager } from '../components/FileManager.js';
import { CreateProductSite } from '../components/product/CreateProductSite.js';
import { ManageProductSites } from '../components/product/ManageProductSites.js';
import { CreateProduct } from '../components/product/CreateProduct.js';
import { ManageProducts } from '../components/product/ManageProducts.js';
import { EditContent } from '../components/blog/EditContent.js';
import { EditProduct } from '../components/product/EditProduct.js';
import { Settings } from '../components/Settings.js';
import { Analytics } from '../components/Analytics.js';
import { Documentation } from '../components/Documentation.js';
import { SiteSettings } from '../components/SiteSettings.js';
import { toast } from '../utils/toast.js';

export class DashboardPage {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.userData = null;
    this.isLoading = true;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'dashboard-container';
    this.element.innerHTML = `
      <div class="dashboard-body">
        <button class="hamburger-menu" id="hamburger-menu" aria-expanded="false" aria-controls="sidebar" aria-label="Toggle navigation menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        
        <nav class="sidebar" id="sidebar">
          <div class="sidebar-content">
            <div class="sidebar-header">
              <h1 class="cms-title">Firebase CMS</h1>
            </div>
            
            <div class="sidebar-nav">
              <div class="nav-item" data-section="overview">
                <i class="nav-icon fas fa-tachometer-alt"></i>
                <span class="nav-text">Overview</span>
              </div>
              
              <div class="nav-item" data-section="analytics">
                <i class="nav-icon fas fa-chart-line"></i>
                <span class="nav-text">Analytics</span>
              </div>
              
              <div class="nav-section">
                <div class="nav-item nav-section-header" data-section="products">
                  <i class="nav-icon fas fa-shopping-cart"></i>
                  <span class="nav-text">Products</span>
                  <i class="nav-arrow fas fa-chevron-right"></i>
                </div>
                <div class="nav-subsection" id="products-subsection" style="display: none;">
                  <div class="nav-subitem" data-section="create-product-site">
                    <i class="nav-icon fas fa-plus"></i>
                    <span class="nav-text">Create Product Site</span>
                  </div>
                  <!-- Dynamic product sites will be added here -->
                </div>
              </div>
              
              <div class="nav-section">
                <div class="nav-item nav-section-header" data-section="blog">
                  <i class="nav-icon fas fa-blog"></i>
                  <span class="nav-text">Blog</span>
                  <i class="nav-arrow fas fa-chevron-right"></i>
                </div>
                <div class="nav-subsection" id="blog-subsection" style="display: none;">
                  <div class="nav-subitem" data-section="create-blog-site">
                    <i class="nav-icon fas fa-plus"></i>
                    <span class="nav-text">Create Blog Site</span>
                  </div>
                  <!-- Dynamic blog sites will be added here -->
                </div>
              </div>
              
              <div class="nav-item" data-section="file-manager">
                <i class="nav-icon fas fa-folder"></i>
                <span class="nav-text">File Manager</span>
              </div>
              
              <div class="nav-item" data-section="documentation">
                <i class="nav-icon fas fa-book"></i>
                <span class="nav-text">Documentation</span>
              </div>
              
              <div class="nav-item" data-section="settings">
                <i class="nav-icon fas fa-cog"></i>
                <span class="nav-text">Settings</span>
              </div>
            </div>
            
            <div class="sidebar-footer">
              <button id="logout-button" class="logout-button">
                <i class="nav-icon fas fa-sign-out-alt"></i>
                <span class="nav-text">Logout</span>
              </button>
            </div>
          </div>
        </nav>
        
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <main class="main-content" id="main-content">
          <!-- Dynamic content will be loaded here -->
        </main>
      </div>
    `;

    this.attachEventListeners();
    this.loadUserData(); // Load user data from Firestore
    this.loadSection('overview'); // Load overview by default
    return this.element;
  }

  async loadUserData() {
    if (!this.currentUser) {
      console.error('No current user found');
      this.isLoading = false;
      return;
    }

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        this.userData = userDoc.data();
        console.log('User data loaded:', this.userData);
      } else {
        console.error('User document does not exist');
        this.userData = {
          blogSites: [],
          productSites: [],
          plan: 'free',
          createdAt: null
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.userData = {
        blogSites: [],
        productSites: [],
        plan: 'free',
        createdAt: null
      };
    } finally {
      this.isLoading = false;
      this.updateBlogSitesInSidebar();
      this.updateProductSitesInSidebar();
      // Refresh overview if it's currently displayed
      const mainContent = this.element.querySelector('#main-content');
      if (mainContent && mainContent.innerHTML.includes('Welcome to Firebase CMS')) {
        this.loadSection('overview');
      }
    }
  }

  updateBlogSitesInSidebar() {
    const blogSubsection = this.element.querySelector('#blog-subsection');
    if (!blogSubsection) return;

    // Remove existing dynamic blog sites (keep the "Create Blog Site" item)
    const existingBlogSites = blogSubsection.querySelectorAll('[data-blog-site-id]');
    existingBlogSites.forEach(item => item.remove());

    // Add current blog sites
    if (this.userData && this.userData.blogSites) {
      this.userData.blogSites.forEach(blogSite => {
        // Create blog site section with nested items
        const blogSiteSection = document.createElement('div');
        blogSiteSection.className = 'nav-subsection-item';
        blogSiteSection.dataset.blogSiteId = blogSite.id;
        
        blogSiteSection.innerHTML = `
          <div class="nav-subitem nav-section-header" data-section="manage-blog-site-${blogSite.id}">
            <i class="nav-icon fas fa-globe"></i>
            <span class="nav-text">${blogSite.name}</span>
            <i class="nav-arrow fas fa-chevron-right"></i>
          </div>
          <div class="nav-sub-subsection" style="display: none;">
            <div class="nav-sub-subitem" data-section="create-content-${blogSite.id}">
              <i class="nav-icon fas fa-plus"></i>
              <span class="nav-text">Create Content</span>
            </div>
            <div class="nav-sub-subitem" data-section="manage-content-${blogSite.id}">
              <i class="nav-icon fas fa-edit"></i>
              <span class="nav-text">Manage Content</span>
            </div>
            <div class="nav-sub-subitem" data-section="site-settings-blog-${blogSite.id}">
              <i class="nav-icon fas fa-cog"></i>
              <span class="nav-text">Settings</span>
            </div>
          </div>
        `;
        
        blogSubsection.appendChild(blogSiteSection);
        
        // Add event listeners for the blog site section
        const sectionHeader = blogSiteSection.querySelector('.nav-section-header');
        const subItems = blogSiteSection.querySelectorAll('.nav-sub-subitem');
        
        // Toggle subsection
        sectionHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          // Only handle the click if it's on the section header itself
          if (e.target === sectionHeader || sectionHeader.contains(e.target)) {
            this.toggleSubSection(sectionHeader);
          }
        });
        
        // Handle sub-item clicks
        subItems.forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = e.currentTarget.dataset.section;
            this.loadSection(section);
            this.setActiveNavItem(e.currentTarget);
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
              this.closeSidebar();
            }
          });
        });
      });
    }
    
    // Re-attach section toggle listeners after updating sidebar
    this.attachSectionToggleListeners();
  }

  updateProductSitesInSidebar() {
    const productSubsection = this.element.querySelector('#products-subsection');
    if (!productSubsection) return;

    // Remove existing dynamic product sites (keep the "Create Product Site" item)
    const existingProductSites = productSubsection.querySelectorAll('[data-product-site-id]');
    existingProductSites.forEach(item => item.remove());

    // Add current product sites
    if (this.userData && this.userData.productSites) {
      this.userData.productSites.forEach(productSite => {
        // Create product site section with nested items
        const productSiteSection = document.createElement('div');
        productSiteSection.className = 'nav-subsection-item';
        productSiteSection.dataset.productSiteId = productSite.id;
        
        productSiteSection.innerHTML = `
          <div class="nav-subitem nav-section-header" data-section="manage-product-site-${productSite.id}">
            <i class="nav-icon fas fa-store"></i>
            <span class="nav-text">${productSite.name}</span>
            <i class="nav-arrow fas fa-chevron-right"></i>
          </div>
          <div class="nav-sub-subsection" style="display: none;">
            <div class="nav-sub-subitem" data-section="create-product-${productSite.id}">
              <i class="nav-icon fas fa-plus"></i>
              <span class="nav-text">Create Product</span>
            </div>
            <div class="nav-sub-subitem" data-section="manage-products-${productSite.id}">
              <i class="nav-icon fas fa-boxes"></i>
              <span class="nav-text">Manage Products</span>
            </div>
            <div class="nav-sub-subitem" data-section="site-settings-product-${productSite.id}">
              <i class="nav-icon fas fa-cog"></i>
              <span class="nav-text">Settings</span>
            </div>
          </div>
        `;
        
        productSubsection.appendChild(productSiteSection);
        
        // Add event listeners for the product site section
        const sectionHeader = productSiteSection.querySelector('.nav-section-header');
        const subItems = productSiteSection.querySelectorAll('.nav-sub-subitem');
        
        // Toggle subsection
        sectionHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          // Only handle the click if it's on the section header itself
          if (e.target === sectionHeader || sectionHeader.contains(e.target)) {
            this.toggleSubSection(sectionHeader);
          }
        });
        
        // Handle sub-item clicks
        subItems.forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = e.currentTarget.dataset.section;
            this.loadSection(section);
            this.setActiveNavItem(e.currentTarget);
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
              this.closeSidebar();
            }
          });
        });
      });
    }
    
    // Re-attach section toggle listeners after updating sidebar
    this.attachSectionToggleListeners();
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    try {
      // Handle Firestore Timestamp
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

  attachEventListeners() {
    // Logout button
    const logoutButton = this.element.querySelector('#logout-button');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebar = this.element.querySelector('#sidebar');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    const mainContent = this.element.querySelector('#main-content');

    logoutButton.addEventListener('click', () => {
      this.handleLogout();
    });

    // Hamburger menu toggle
    hamburgerMenu.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
      this.closeSidebar();
    });


    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Navigation items
    const navItems = this.element.querySelectorAll('.nav-item, .nav-subitem, .nav-sub-subitem');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't handle clicks on section headers that have arrows (they toggle sections)
        if (e.currentTarget.classList.contains('nav-section-header') && e.currentTarget.querySelector('.nav-arrow')) {
          return;
        }
        
        const section = e.currentTarget.dataset.section;
        if (section) {
          this.loadSection(section);
          this.setActiveNavItem(e.currentTarget);
          // Close sidebar on mobile after navigation
          if (window.innerWidth <= 768) {
            this.closeSidebar();
          }
        }
      });
    });

    // Listen for custom navigation events
    window.addEventListener('navigate-to-section', (e) => {
      const section = e.detail.section;
      this.loadSection(section);
      
      // Find and activate the corresponding nav item
      const navItem = this.element.querySelector(`[data-section="${section}"]`);
      if (navItem) {
        this.setActiveNavItem(navItem);
      }
    });

    // Listen for product sites updates
    window.addEventListener('product-sites-updated', () => {
      this.loadUserData();
    });

    // Listen for blog sites updates
    window.addEventListener('blog-sites-updated', () => {
      this.loadUserData();
    });

    // Collapsible sections - attach after DOM is ready
    this.attachSectionToggleListeners();
  }

  attachSectionToggleListeners() {
    const sectionHeaders = this.element.querySelectorAll('.nav-section-header');
    sectionHeaders.forEach(header => {
      // Remove existing listeners to prevent duplicates
      header.removeEventListener('click', this.handleSectionToggle);
      
      // Add new listener
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSection(header);
      });
    });
  }

  toggleSidebar() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    
    // Only handle mobile toggle behavior
    if (window.innerWidth <= 768) {
      const isOpen = sidebar.classList.toggle('sidebar-open');
      sidebarOverlay.classList.toggle('show', isOpen);
      
      // Update ARIA attributes for accessibility
      hamburgerMenu.setAttribute('aria-expanded', isOpen.toString());
      hamburgerMenu.classList.toggle('active', isOpen);
    }
  }

  closeSidebar() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    
    // Only handle mobile close behavior
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('sidebar-open');
      sidebarOverlay.classList.remove('show');
      
      // Update ARIA attributes for accessibility
      hamburgerMenu.setAttribute('aria-expanded', 'false');
      hamburgerMenu.classList.remove('active');
    }
  }

  // Handle window resize to ensure proper behavior
  handleWindowResize() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    
    if (window.innerWidth > 768) {
      // Desktop: Remove mobile classes and reset state
      sidebar.classList.remove('sidebar-open');
      sidebarOverlay.classList.remove('show');
      hamburgerMenu.setAttribute('aria-expanded', 'false');
      hamburgerMenu.classList.remove('active');
    }
  }

  toggleSection(header) {
    const section = header.parentElement;
    const subsection = section.querySelector('.nav-subsection');
    const arrow = header.querySelector('.nav-arrow');
    
    if (subsection) {
      const isExpanded = section.classList.contains('expanded');
      
      if (isExpanded) {
        subsection.style.display = 'none';
        if (arrow) {
          arrow.className = 'nav-arrow fas fa-chevron-right';
        }
        section.classList.remove('expanded');
      } else {
        subsection.style.display = 'block';
        if (arrow) {
          arrow.className = 'nav-arrow fas fa-chevron-down';
        }
        section.classList.add('expanded');
      }
    }
  }

  toggleSubSection(header) {
    const section = header.parentElement;
    const subsection = section.querySelector('.nav-sub-subsection');
    const arrow = header.querySelector('.nav-arrow');
    
    if (subsection) {
      const isExpanded = section.classList.contains('expanded');
      
      if (isExpanded) {
        subsection.style.display = 'none';
        if (arrow) {
          arrow.className = 'nav-arrow fas fa-chevron-right';
        }
        section.classList.remove('expanded');
      } else {
        subsection.style.display = 'block';
        if (arrow) {
          arrow.className = 'nav-arrow fas fa-chevron-down';
        }
        section.classList.add('expanded');
      }
    }
  }

  setActiveNavItem(activeItem) {
    // Remove active class from all items
    const allItems = this.element.querySelectorAll('.nav-item, .nav-subitem, .nav-sub-subitem');
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
        const analytics = new Analytics();
        mainContent.innerHTML = '';
        mainContent.appendChild(analytics.render());
        break;
      case 'create-product-site':
        const createProductSite = new CreateProductSite();
        mainContent.innerHTML = '';
        mainContent.appendChild(createProductSite.render());
        break;
      case 'create-blog-site':
        const createBlogSite = new CreateBlogSite();
        mainContent.innerHTML = '';
        mainContent.appendChild(createBlogSite.render());
        break;
      default:
        // Handle dynamic sections
        if (sectionName === 'create-product-site') {
          const createProductSite = new CreateProductSite();
          mainContent.innerHTML = '';
          mainContent.appendChild(createProductSite.render());
        } else if (sectionName === 'create-blog-site') {
          const createBlogSite = new CreateBlogSite();
          mainContent.innerHTML = '';
          mainContent.appendChild(createBlogSite.render());
        } else if (sectionName.startsWith('manage-product-site-')) {
          const productSiteId = sectionName.replace('manage-product-site-', '');
          const manageProductSites = new ManageProductSites(productSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(manageProductSites.render());
        } else if (sectionName.startsWith('create-product-')) {
          const productSiteId = sectionName.replace('create-product-', '');
          const createProduct = new CreateProduct(productSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(createProduct.render());
        } else if (sectionName.startsWith('manage-products-')) {
          const productSiteId = sectionName.replace('manage-products-', '');
          const manageProducts = new ManageProducts(productSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(manageProducts.render());
        } else if (sectionName.startsWith('edit-product-')) {
          const parts = sectionName.replace('edit-product-', '').split('-');
          const productSiteId = parts[0];
          const productId = parts.slice(1).join('-');
          const editProduct = new EditProduct(productSiteId, productId);
          mainContent.innerHTML = '';
          mainContent.appendChild(editProduct.render());
        } else if (sectionName.startsWith('manage-blog-site-')) {
          const blogSiteId = sectionName.replace('manage-blog-site-', '');
          const manageBlogSites = new ManageBlogSites(blogSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(manageBlogSites.render());
        } else if (sectionName.startsWith('create-content-')) {
          const blogSiteId = sectionName.replace('create-content-', '');
          const createContent = new CreateContent(blogSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(createContent.render());
        } else if (sectionName.startsWith('manage-content-')) {
          const blogSiteId = sectionName.replace('manage-content-', '');
          const manageContent = new ManageContent(blogSiteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(manageContent.render());
        } else if (sectionName.startsWith('edit-content-')) {
          const parts = sectionName.replace('edit-content-', '').split('-');
          const blogSiteId = parts[0];
          const postId = parts.slice(1).join('-');
          const editContent = new EditContent(blogSiteId, postId);
          mainContent.innerHTML = '';
          mainContent.appendChild(editContent.render());
        } else if (sectionName === 'file-manager') {
          const fileManager = new FileManager();
          mainContent.innerHTML = '';
          mainContent.appendChild(fileManager.render());
        } else if (sectionName === 'documentation') {
          const documentation = new Documentation();
          mainContent.innerHTML = '';
          mainContent.appendChild(documentation.render());
        } else if (sectionName === 'settings') {
          const settings = new Settings();
          mainContent.innerHTML = '';
          mainContent.appendChild(settings.render());
        } else if (sectionName.startsWith('site-settings-')) {
          const parts = sectionName.replace('site-settings-', '').split('-');
          const siteType = parts[0]; // 'blog' or 'product'
          const siteId = parts.slice(1).join('-');
          const siteSettings = new SiteSettings(siteType, siteId);
          mainContent.innerHTML = '';
          mainContent.appendChild(siteSettings.render());
        } else {
          // Default to overview for unknown sections
          mainContent.innerHTML = this.renderOverview();
        }
        break;
    }
  }

  renderOverview() {
    if (this.isLoading) {
      return `
        <div class="content-section">
          <h2>Welcome to Firebase CMS</h2>
          <div class="loading-message">
            <p>Loading your dashboard data...</p>
          </div>
        </div>
      `;
    }

    const blogSitesCount = this.userData?.blogSites?.length || 0;
    const productSitesCount = this.userData?.productSites?.length || 0;
    const totalContent = blogSitesCount + productSitesCount;
    const userPlan = this.userData?.plan || 'free';
    const memberSince = this.formatDate(this.userData?.createdAt);

    return `
      <div class="content-section">
        <h2>Welcome to Firebase CMS</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <h3>Blog Sites</h3>
            <div class="stat-number">${blogSitesCount}</div>
            <div class="stat-label">of 3 sites created</div>
          </div>
          
          <div class="overview-card">
            <h3>Product Sites</h3>
            <div class="stat-number">${productSitesCount}</div>
            <div class="stat-label">of 3 sites created</div>
          </div>
          
          <div class="overview-card">
            <h3>Total Content</h3>
            <div class="stat-number">${totalContent}</div>
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
            <button class="action-button" ${blogSitesCount >= 3 ? 'disabled' : ''} onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-blog-site' } }))">
              <i class="action-icon fas fa-blog"></i>
              Create Blog Site ${blogSitesCount >= 3 ? '(Limit Reached)' : ''}
            </button>
            <button class="action-button" ${productSitesCount >= 3 ? 'disabled' : ''} onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-product-site' } }))">
              <i class="action-icon fas fa-shopping-cart"></i>
              Create Product Site ${productSitesCount >= 3 ? '(Limit Reached)' : ''}
            </button>
            <button class="action-button" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'file-manager' } }))">
              <i class="action-icon fas fa-folder"></i>
              Upload Files
            </button>
          </div>
        </div>
        
        <div class="user-info">
          <h3>Account Information</h3>
          <p><strong>Email:</strong> ${this.currentUser?.email || 'Not available'}</p>
          <p><strong>Plan:</strong> ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}</p>
          <p><strong>Member since:</strong> ${memberSince}</p>
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
