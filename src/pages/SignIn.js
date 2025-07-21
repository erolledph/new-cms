// Sign In page component
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export class SignInPage {
  constructor() {
    this.element = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'auth-container';
    this.element.innerHTML = `
      <div class="auth-card">
        <h1>Sign In</h1>
        <form id="signin-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
            <span class="error-message" id="email-error"></span>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
            <span class="error-message" id="password-error"></span>
          </div>
          
          <button type="submit" class="auth-button" id="signin-button">
            <span class="button-text">Sign In</span>
            <span class="button-loading" style="display: none;">Signing in...</span>
          </button>
          
          <div class="auth-links">
            <p><a href="#/reset">Forgot your password?</a></p>
            <p>Don't have an account? <a href="#/signup">Sign Up</a></p>
          </div>
        </form>
        
        <div id="signin-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    return this.element;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#signin-form');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignIn();
    });
  }

  async handleSignIn() {
    const email = this.element.querySelector('#email').value;
    const password = this.element.querySelector('#password').value;
    
    const button = this.element.querySelector('#signin-button');
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(email, password)) {
      return;
    }

    // Show loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Show success message
      this.showMessage('Signed in successfully! Redirecting...', 'success');
      
      // Redirect will be handled by AuthManager
    } catch (error) {
      console.error('Sign in error:', error);
      this.handleSignInError(error);
    } finally {
      // Reset button state
      button.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  validateForm(email, password) {
    let isValid = true;

    // Email validation
    if (!email) {
      this.showFieldError('email-error', 'Email is required');
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.showFieldError('email-error', 'Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password) {
      this.showFieldError('password-error', 'Password is required');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleSignInError(error) {
    let message = 'An error occurred during sign in. Please try again.';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address. Please sign up first.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password. Please check your credentials.';
        break;
    }

    this.showMessage(message, 'error');
  }

  showFieldError(fieldId, message) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  clearErrors() {
    const errorElements = this.element.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });

    const messageElement = this.element.querySelector('#signin-message');
    messageElement.style.display = 'none';
  }

  showMessage(message, type) {
    const messageElement = this.element.querySelector('#signin-message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
  }
}