// Main application entry point
import './firebase.js';
import { router } from './router/Router.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Firebase CMS Application Started');
  
  // Router is already initialized in its constructor
  // The app will start with the appropriate page based on auth state
});