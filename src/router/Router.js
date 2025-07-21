// Simple client-side router
import { SignInPage } from '../pages/SignIn.js';
import { SignUpPage } from '../pages/SignUp.js';
import { PasswordResetPage } from '../pages/PasswordReset.js';
import { DashboardPage } from '../pages/Dashboard.js';
import { authManager } from '../auth/AuthManager.js';

export class Router {
  constructor() {
    this.routes = {
      'signin': SignInPage,
      'signup': SignUpPage,
      'reset': PasswordResetPage,
      'dashboard': DashboardPage
    };
    
    this.currentPage = null;
    this.init();
  }

  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // Listen for auth state changes
    authManager.onAuthStateChange((user) => {
      // Router will be handled by AuthManager
      this.handleRoute();
    });

    // Handle initial route
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1); // Remove #
    const route = hash.split('/')[1] || 'signin'; // Default to signin
    
    // Check if user is authenticated for protected routes
    const isAuthenticated = authManager.isAuthenticated();
    const protectedRoutes = ['dashboard'];
    const authRoutes = ['signin', 'signup', 'reset'];

    if (protectedRoutes.includes(route) && !isAuthenticated) {
      // Redirect to signin if trying to access protected route without auth
      window.location.hash = '#/signin';
      return;
    }

    if (authRoutes.includes(route) && isAuthenticated) {
      // Redirect to dashboard if trying to access auth routes while authenticated
      window.location.hash = '#/dashboard';
      return;
    }

    this.loadPage(route);
  }

  loadPage(route) {
    const PageClass = this.routes[route];
    
    if (!PageClass) {
      // Default to signin for unknown routes
      this.loadPage('signin');
      return;
    }

    // Clean up current page
    if (this.currentPage && this.currentPage.cleanup) {
      this.currentPage.cleanup();
    }

    // Create new page instance
    this.currentPage = new PageClass();
    
    // Render page
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = '';
    appContainer.appendChild(this.currentPage.render());
  }

  navigate(route) {
    window.location.hash = `#/${route}`;
  }
}

// Create and export singleton instance
export const router = new Router();