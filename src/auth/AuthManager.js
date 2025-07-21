// Authentication state management and routing
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.init();
  }

  init() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // User is signed in, ensure user documents exist
        await this.ensureUserDocuments(user);
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(callback => callback(user));
      
      // Handle routing
      this.handleRouting(user);
    });
  }

  // Ensure user and userSettings documents exist
  async ensureUserDocuments(user) {
    try {
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: new Date(),
          blogSites: [],
          productSites: [],
          plan: 'free'
        });
      }

      // Check if userSettings document exists
      const userSettingsRef = doc(db, 'userSettings', user.uid);
      const userSettingsDoc = await getDoc(userSettingsRef);
      
      if (!userSettingsDoc.exists()) {
        // Create userSettings document with default currency
        await setDoc(userSettingsRef, {
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error ensuring user documents:', error);
    }
  }

  // Add authentication state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
  }

  // Handle routing based on authentication state
  handleRouting(user) {
    const currentPath = window.location.hash || '#/signin';
    
    if (user) {
      // User is authenticated
      if (currentPath === '#/signin' || currentPath === '#/signup' || currentPath === '#/reset') {
        window.location.hash = '#/dashboard';
      }
    } else {
      // User is not authenticated
      if (currentPath.startsWith('#/dashboard')) {
        window.location.hash = '#/signin';
      }
    }
  }

  // Logout function
  async logout() {
    try {
      await signOut(auth);
      window.location.hash = '#/signin';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }
}

// Create and export singleton instance
export const authManager = new AuthManager();