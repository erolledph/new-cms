// Sign Up page component
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export class SignUpPage {
  constructor() {
    this.element = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'auth-container';
    this.element.innerHTML = `
      <div class="auth-card">
        <h1>Create Account</h1>
        <form id="signup-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
            <span class="error-message" id="email-error"></span>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6">
            <span class="error-message" id="password-error"></span>
          </div>
          
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm-password" required>
            <span class="error-message" id="confirm-password-error"></span>
          </div>
          
          <button type="submit" class="auth-button" id="signup-button">
            <span class="button-text">Create Account</span>
            <span class="button-loading" style="display: none;">Creating...</span>
          </button>
          
          <div class="auth-links">
            <p>Already have an account? <a href="#/signin">Sign In</a></p>
          </div>
        </form>
        
        <div id="signup-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    return this.element;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#signup-form');
    const emailInput = this.element.querySelector('#email');
    const passwordInput = this.element.querySelector('#password');
    const confirmPasswordInput = this.element.querySelector('#confirm-password');

    // Real-time validation
    confirmPasswordInput.addEventListener('input', () => {
      this.validatePasswordMatch();
    });

    passwordInput.addEventListener('input', () => {
      this.validatePasswordMatch();
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignUp();
    });
  }

  validatePasswordMatch() {
    const password = this.element.querySelector('#password').value;
    const confirmPassword = this.element.querySelector('#confirm-password').value;
    const errorElement = this.element.querySelector('#confirm-password-error');

    if (confirmPassword && password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match';
      errorElement.style.display = 'block';
      return false;
    } else {
      errorElement.style.display = 'none';
      return true;
    }
  }

  async handleSignUp() {
    const email = this.element.querySelector('#email').value;
    const password = this.element.querySelector('#password').value;
    const confirmPassword = this.element.querySelector('#confirm-password').value;
    
    const button = this.element.querySelector('#signup-button');
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');
    const messageElement = this.element.querySelector('#signup-message');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(email, password, confirmPassword)) {
      return;
    }

    // Show loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Show success message
      this.showMessage('Account created successfully! Redirecting...', 'success');
      
      // Redirect will be handled by AuthManager
    } catch (error) {
      console.error('Sign up error:', error);
      this.handleSignUpError(error);
    } finally {
      // Reset button state
      button.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  validateForm(email, password, confirmPassword) {
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
    } else if (password.length < 6) {
      this.showFieldError('password-error', 'Password must be at least 6 characters');
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      this.showFieldError('confirm-password-error', 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      this.showFieldError('confirm-password-error', 'Passwords do not match');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleSignUpError(error) {
    let message = 'An error occurred during sign up. Please try again.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
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

    const messageElement = this.element.querySelector('#signup-message');
    messageElement.style.display = 'none';
  }

  showMessage(message, type) {
    const messageElement = this.element.querySelector('#signup-message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
  }
}