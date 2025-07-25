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
import CreateProduct from '../components/product/CreateProduct.js';
import { ManageProducts } from '../components/product/ManageProducts.js';
import EditContent from '../components/blog/EditContent.js';
import EditProduct from '../components/product/EditProduct.js';
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
    this.fileSelectionModal = null;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'dashboard-container';
    this.element.innerHTML = `
      <div class="dashboard-body">
        <button class="hamburger-menu" id="hamburger-menu" aria-expanded="false" aria-controls="sidebar" aria-label="Toggle navigation menu">
          <i class="hamburger-icon fas fa-bars"></i>
        </button>
        
        <nav class="sidebar" id="sidebar">
          <div class="sidebar-content">
            <div class="sidebar-header">
              <h1 class="cms-title">Firebase CMS</h1>
              <button class="sidebar-close-button" id="sidebar-close-button" aria-label="Close navigation menu">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="sidebar-nav">
              <div class="nav-group">
                <div class="nav-group-title">Dashboard</div>
                <div class="nav-item" data-section="overview">
                  <i class="nav-icon fas fa-home"></i>
                  <span class="nav-text">Overview</span>
                </div>
                <div class="nav-item" data-section="analytics">
                  <i class="nav-icon fas fa-chart-line"></i>
                  <span class="nav-text">Analytics</span>
                </div>
              </div>
              
              <div class="nav-group">
                <div class="nav-group-title">Content</div>
                <div class="nav-expandable" id="blog-expandable">
                  <div class="nav-expandable-header">
                    <i class="nav-expandable-icon fas fa-blog"></i>
                    <span class="nav-expandable-text">Blog Sites</span>
                    <i class="nav-expandable-arrow fas fa-chevron-right"></i>
                  </div>
                  <div class="nav-expandable-content" id="blog-content">
                    <div class="nav-subitem" data-section="create-blog-site">
                      <i class="nav-subitem-icon fas fa-plus"></i>
                      <span class="nav-text">Create Blog Site</span>
                    </div>
                    <!-- Dynamic blog sites will be added here -->
                  </div>
                </div>
                
                <div class="nav-expandable" id="products-expandable">
                  <div class="nav-expandable-header">
                    <i class="nav-expandable-icon fas fa-shopping-cart"></i>
                    <span class="nav-expandable-text">Product Sites</span>
                    <i class="nav-expandable-arrow fas fa-chevron-right"></i>
                  </div>
                  <div class="nav-expandable-content" id="products-content">
                    <div class="nav-subitem" data-section="create-product-site">
                      <i class="nav-subitem-icon fas fa-plus"></i>
                      <span class="nav-text">Create Product Site</span>
                    </div>
                    <!-- Dynamic product sites will be added here -->
                  </div>
                </div>
              </div>
              
              <div class="nav-group">
                <div class="nav-group-title">Tools</div>
                <div class="nav-item" data-section="file-manager">
                  <i class="nav-icon fas fa-folder"></i>
                  <span class="nav-text">File Manager</span>
                </div>
                <div class="nav-item" data-section="documentation">
                  <i class="nav-icon fas fa-book"></i>
                  <span class="nav-text">API Docs</span>
                </div>
                <div class="nav-item" data-section="settings">
                  <i class="nav-icon fas fa-cog"></i>
                  <span class="nav-text">Settings</span>
                </div>
              </div>
            </div>
            
            <div class="sidebar-footer">
              <button id="logout-button" class="logout-button">
                <i class="nav-icon fas fa-sign-out-alt"></i>
                <span class="nav-text">Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
        
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <main class="main-content" id="main-content">
          <!-- Dynamic content will be loaded here -->
        </main>
        
        <!-- Global File Selection Modal -->
        <div class="file-selection-modal" id="global-file-modal" style="display: none;">
          <div class="modal-overlay">
            <div class="modal-content">
              <div class="modal-header">
                <h3 id="modal-title">Select Files</h3>
                <p class="modal-subtitle" id="modal-subtitle"></p>
                <button class="modal-close-button" id="close-global-modal">×</button>
              </div>
              <div class="modal-body">
                <div class="modal-search">
                  <input type="text" id="global-modal-search" placeholder="Search files..." class="search-input">
                </div>
                <div class="modal-files-grid" id="global-modal-files-grid">
                  <div class="loading-message">Loading files...</div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="cancel-button" id="global-modal-cancel">Cancel</button>
                <button class="create-button" id="global-modal-select" disabled>Select Files</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.initializeGlobalFileModal();
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
    const blogContent = this.element.querySelector('#blog-content');
    if (!blogContent) return;

    // Get existing blog site elements
    const existingBlogSites = blogContent.querySelectorAll('[data-blog-site-id]');
    const existingSiteIds = Array.from(existingBlogSites).map(item => item.dataset.blogSiteId);
    const currentSiteIds = this.userData?.blogSites?.map(site => site.id) || [];
    
    // Remove sites that no longer exist
    existingBlogSites.forEach(item => {
      if (!currentSiteIds.includes(item.dataset.blogSiteId)) {
        item.remove();
      }
    });

    // Add or update current blog sites
    if (this.userData && this.userData.blogSites) {
      this.userData.blogSites.forEach(blogSite => {
        // Skip if site already exists and hasn't changed
        const existingSite = blogContent.querySelector(`[data-blog-site-id="${blogSite.id}"]`);
        if (existingSite) {
          // Update site name if changed
          const nameElement = existingSite.querySelector('.nav-expandable-text');
          if (nameElement && nameElement.textContent !== blogSite.name) {
            nameElement.textContent = blogSite.name;
          }
          return;
        }
        
        // Create expandable blog site section
        const blogSiteExpandable = document.createElement('div');
        blogSiteExpandable.className = 'nav-expandable';
        blogSiteExpandable.dataset.blogSiteId = blogSite.id;
        
        blogSiteExpandable.innerHTML = `
          <div class="nav-expandable-header">
            <i class="nav-expandable-icon fas fa-globe"></i>
            <span class="nav-expandable-text">${blogSite.name}</span>
            <i class="nav-expandable-arrow fas fa-chevron-right"></i>
          </div>
          <div class="nav-expandable-content">
            <div class="nav-subitem" data-section="create-content-${blogSite.id}">
              <i class="nav-subitem-icon fas fa-plus"></i>
              <span class="nav-text">Create Content</span>
            </div>
            <div class="nav-subitem" data-section="manage-content-${blogSite.id}">
              <i class="nav-subitem-icon fas fa-edit"></i>
              <span class="nav-text">Manage Content</span>
            </div>
            <div class="nav-subitem" data-section="site-settings-blog-${blogSite.id}">
              <i class="nav-subitem-icon fas fa-cog"></i>
              <span class="nav-text">Settings</span>
            </div>
          </div>
        `;
        
        blogContent.appendChild(blogSiteExpandable);
        
        // Add event listeners
        const expandableHeader = blogSiteExpandable.querySelector('.nav-expandable-header');
        const subItems = blogSiteExpandable.querySelectorAll('.nav-subitem');
        
        // Toggle expandable
        expandableHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpandable(blogSiteExpandable);
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
    
    // Re-attach expandable toggle listeners after updating sidebar
    this.attachExpandableToggleListeners();
  }

  updateProductSitesInSidebar() {
    const productsContent = this.element.querySelector('#products-content');
    if (!productsContent) return;

    // Get existing product site elements
    const existingProductSites = productsContent.querySelectorAll('[data-product-site-id]');
    const existingSiteIds = Array.from(existingProductSites).map(item => item.dataset.productSiteId);
    const currentSiteIds = this.userData?.productSites?.map(site => site.id) || [];
    
    // Remove sites that no longer exist
    existingProductSites.forEach(item => {
      if (!currentSiteIds.includes(item.dataset.productSiteId)) {
        item.remove();
      }
    });

    // Add or update current product sites
    if (this.userData && this.userData.productSites) {
      this.userData.productSites.forEach(productSite => {
        // Skip if site already exists and hasn't changed
        const existingSite = productsContent.querySelector(`[data-product-site-id="${productSite.id}"]`);
        if (existingSite) {
          // Update site name if changed
          const nameElement = existingSite.querySelector('.nav-expandable-text');
          if (nameElement && nameElement.textContent !== productSite.name) {
            nameElement.textContent = productSite.name;
          }
          return;
        }
        
        // Create expandable product site section
        const productSiteExpandable = document.createElement('div');
        productSiteExpandable.className = 'nav-expandable';
        productSiteExpandable.dataset.productSiteId = productSite.id;
        
        productSiteExpandable.innerHTML = `
          <div class="nav-expandable-header">
            <i class="nav-expandable-icon fas fa-store"></i>
            <span class="nav-expandable-text">${productSite.name}</span>
            <i class="nav-expandable-arrow fas fa-chevron-right"></i>
          </div>
          <div class="nav-expandable-content">
            <div class="nav-subitem" data-section="create-product-${productSite.id}">
              <i class="nav-subitem-icon fas fa-plus"></i>
              <span class="nav-text">Create Product</span>
            </div>
            <div class="nav-subitem" data-section="manage-products-${productSite.id}">
              <i class="nav-subitem-icon fas fa-boxes"></i>
              <span class="nav-text">Manage Products</span>
            </div>
            <div class="nav-subitem" data-section="site-settings-product-${productSite.id}">
              <i class="nav-subitem-icon fas fa-cog"></i>
              <span class="nav-text">Settings</span>
            </div>
          </div>
        `;
        
        productsContent.appendChild(productSiteExpandable);
        
        // Add event listeners
        const expandableHeader = productSiteExpandable.querySelector('.nav-expandable-header');
        const subItems = productSiteExpandable.querySelectorAll('.nav-subitem');
        
        // Toggle expandable
        expandableHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpandable(productSiteExpandable);
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
    
    // Re-attach expandable toggle listeners after updating sidebar
    this.attachExpandableToggleListeners();
  }

  initializeGlobalFileModal() {
    this.fileSelectionModal = this.element.querySelector('#global-file-modal');
    const closeButton = this.fileSelectionModal.querySelector('#close-global-modal');
    const cancelButton = this.fileSelectionModal.querySelector('#global-modal-cancel');
    const overlay = this.fileSelectionModal.querySelector('.modal-overlay');
    
    // Close modal handlers
    const closeModal = () => {
      this.fileSelectionModal.style.display = 'none';
      document.body.style.overflow = '';
    };

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Listen for global file selection requests
    window.addEventListener('open-file-modal', (e) => {
      this.openGlobalFileModal(e.detail);
    });
  }

  async openGlobalFileModal(options = {}) {
    const {
      title = 'Select Files',
      subtitle = '',
      maxFiles = 1,
      fileType = 'image',
      onSelect = null
    } = options;

    const modal = this.fileSelectionModal;
    const titleElement = modal.querySelector('#modal-title');
    const subtitleElement = modal.querySelector('#modal-subtitle');
    const filesGrid = modal.querySelector('#global-modal-files-grid');
    const selectButton = modal.querySelector('#global-modal-select');
    const searchInput = modal.querySelector('#global-modal-search');
    
    // Set modal content
    titleElement.textContent = title;
    subtitleElement.textContent = subtitle;
    selectButton.textContent = maxFiles === 1 ? 'Select File' : 'Select Files';
    selectButton.disabled = true;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Load files
    await this.loadGlobalModalFiles(fileType, maxFiles, onSelect);
  }

  async loadGlobalModalFiles(fileType, maxFiles, onSelect) {
    const filesGrid = this.fileSelectionModal.querySelector('#global-modal-files-grid');
    const selectButton = this.fileSelectionModal.querySelector('#global-modal-select');
    const searchInput = this.fileSelectionModal.querySelector('#global-modal-search');
    
    let selectedFiles = [];
    
    try {
      // Import Firebase modules
      const { collection, getDocs, query, orderBy, where } = await import('firebase/firestore');
      const { db } = await import('../firebase.js');
      
      // Load files based on type
      const filesCollectionRef = collection(db, 'users', this.currentUser.uid, 'files');
      let filesQuery;
      
      if (fileType === 'image') {
        filesQuery = query(
          filesCollectionRef, 
          where('type', '>=', 'image/'),
          where('type', '<', 'image/\uf8ff'),
          orderBy('uploadedAt', 'desc')
        );
      } else {
        filesQuery = query(filesCollectionRef, orderBy('uploadedAt', 'desc'));
      }
      
      const filesSnapshot = await getDocs(filesQuery);
      const files = filesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (files.length === 0) {
        filesGrid.innerHTML = `
          <div class="empty-modal-state">
            <p>No ${fileType} files found. Upload some files first!</p>
          </div>
        `;
        return;
      }

      const filesHTML = files.map(file => `
        <div class="modal-file-item" data-file-url="${file.downloadURL}" data-filename="${file.filename}" data-file-id="${file.id}">
          <div class="modal-file-thumbnail">
            ${file.type && file.type.startsWith('image/') ? 
              `<img src="${file.downloadURL}" alt="${file.filename}" loading="lazy" />` :
              `<div class="document-icon">${this.getDocumentIcon(file.type)}</div>`
            }
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
      
      // Attach file selection handlers
      filesGrid.addEventListener('click', (e) => {
        const fileItem = e.target.closest('.modal-file-item');
        if (fileItem) {
          const fileData = {
            id: fileItem.dataset.fileId,
            filename: fileItem.dataset.filename,
            downloadURL: fileItem.dataset.fileUrl
          };
          
          if (fileItem.classList.contains('selected')) {
            // Remove from selection
            fileItem.classList.remove('selected');
            selectedFiles = selectedFiles.filter(f => f.id !== fileData.id);
          } else {
            // Add to selection if under limit
            if (selectedFiles.length < maxFiles) {
              fileItem.classList.add('selected');
              selectedFiles.push(fileData);
            } else {
              toast.warning(`You can only select ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`);
            }
          }
          
          selectButton.disabled = selectedFiles.length === 0;
          selectButton.textContent = selectedFiles.length > 0 ? 
            `Select ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 
            (maxFiles === 1 ? 'Select File' : 'Select Files');
        }
      });
      
      // Search functionality
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const fileItems = filesGrid.querySelectorAll('.modal-file-item');
        
        fileItems.forEach(item => {
          const filename = item.dataset.filename.toLowerCase();
          const shouldShow = !term || filename.includes(term);
          item.style.display = shouldShow ? 'block' : 'none';
        });
      });
      
      // Select button handler
      selectButton.onclick = () => {
        if (selectedFiles.length > 0 && onSelect) {
          onSelect(selectedFiles);
          this.fileSelectionModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      };
      
    } catch (error) {
      console.error('Error loading files for modal:', error);
      filesGrid.innerHTML = `
        <div class="error-modal-state">
          <p style="color: #dc3545;">Error loading files. Please try again.</p>
        </div>
      `;
    }
  }

  getDocumentIcon(mimeType) {
    switch (mimeType) {
      case 'application/pdf':
        return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'DOC';
      case 'text/plain':
        return 'TXT';
      default:
        return 'FILE';
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const sidebarCloseButton = this.element.querySelector('#sidebar-close-button');
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

    // Sidebar close button
    sidebarCloseButton.addEventListener('click', () => {
      this.closeSidebar();
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
    const navItems = this.element.querySelectorAll('.nav-item, .nav-subitem');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't handle clicks on expandable headers
        if (e.currentTarget.classList.contains('nav-expandable-header')) {
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

    // Expandable sections - attach after DOM is ready
    this.attachExpandableToggleListeners();
  }

  attachExpandableToggleListeners() {
    const expandableHeaders = this.element.querySelectorAll('.nav-expandable-header');
    expandableHeaders.forEach(header => {
      // Remove existing listeners to prevent duplicates
      const existingHandler = header._expandableHandler;
      if (existingHandler) {
        header.removeEventListener('click', existingHandler);
      }
      
      // Create and store new listener
      const newHandler = (e) => {
        e.stopPropagation();
        // Only toggle on desktop, mobile shows all sections expanded
        if (window.innerWidth > 768) {
          const expandable = header.closest('.nav-expandable');
          this.toggleExpandable(expandable);
        }
      };
      
      header._expandableHandler = newHandler;
      header.addEventListener('click', newHandler);
    });
  }

  toggleSidebar() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    const hamburgerIcon = hamburgerMenu.querySelector('.hamburger-icon');
    
    // Only handle mobile toggle behavior
    if (window.innerWidth <= 768) {
      const isOpen = sidebar.classList.toggle('sidebar-open');
      sidebarOverlay.classList.toggle('show', isOpen);
      
      // Update ARIA attributes for accessibility
      hamburgerMenu.setAttribute('aria-expanded', isOpen.toString());
      hamburgerMenu.classList.toggle('active', isOpen);
      
      // Update hamburger icon
      if (isOpen) {
        hamburgerIcon.className = 'hamburger-icon fas fa-times';
      } else {
        hamburgerIcon.className = 'hamburger-icon fas fa-bars';
      }
    }
  }

  closeSidebar() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    const hamburgerIcon = hamburgerMenu.querySelector('.hamburger-icon');
    
    // Only handle mobile close behavior
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('sidebar-open');
      sidebarOverlay.classList.remove('show');
      
      // Update ARIA attributes for accessibility
      hamburgerMenu.setAttribute('aria-expanded', 'false');
      hamburgerMenu.classList.remove('active');
      
      // Reset hamburger icon
      hamburgerIcon.className = 'hamburger-icon fas fa-bars';
    }
  }

  // Handle window resize to ensure proper behavior
  handleWindowResize() {
    const sidebar = this.element.querySelector('#sidebar');
    const hamburgerMenu = this.element.querySelector('#hamburger-menu');
    const sidebarOverlay = this.element.querySelector('#sidebar-overlay');
    const hamburgerIcon = hamburgerMenu.querySelector('.hamburger-icon');
    
    if (window.innerWidth > 768) {
      // Desktop: Remove mobile classes and reset state
      sidebar.classList.remove('sidebar-open');
      sidebarOverlay.classList.remove('show');
      hamburgerMenu.setAttribute('aria-expanded', 'false');
      hamburgerMenu.classList.remove('active');
      hamburgerIcon.className = 'hamburger-icon fas fa-bars';
      
      // Re-enable section toggling on desktop
      this.attachExpandableToggleListeners();
    } else {
      // Mobile: Ensure all expandables are expanded
      const expandables = this.element.querySelectorAll('.nav-expandable');
      expandables.forEach(expandable => {
        expandable.classList.add('expanded');
      });
    }
  }

  toggleExpandable(expandable) {
    const content = expandable.querySelector('.nav-expandable-content');
    const arrow = expandable.querySelector('.nav-expandable-arrow');
    
    if (content) {
      const isExpanded = expandable.classList.contains('expanded');
      
      if (isExpanded) {
        expandable.classList.remove('expanded');
      } else {
        expandable.classList.add('expanded');
      }
    }
  }

  setActiveNavItem(activeItem) {
    // Remove active class from all items
    const allItems = this.element.querySelectorAll('.nav-item, .nav-subitem, .nav-expandable-header');
    allItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked item
    activeItem.classList.add('active');
    
    // If it's a subitem, also mark its parent expandable header as active
    if (activeItem.classList.contains('nav-subitem')) {
      const parentExpandable = activeItem.closest('.nav-expandable');
      if (parentExpandable) {
        const parentHeader = parentExpandable.querySelector('.nav-expandable-header');
        if (parentHeader) {
          parentHeader.classList.add('active');
        }
      }
    }
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