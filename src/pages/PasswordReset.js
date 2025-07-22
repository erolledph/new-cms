// Password Reset page component
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase.js';
import { toast } from '../utils/toast.js';

export class PasswordResetPage {
  constructor() {
    this.element = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'auth-container';
    this.element.innerHTML = `
      <div class="auth-card">
        <h1>Reset Password</h1>
        <p class="reset-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form id="reset-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
            <span class="error-message" id="email-error"></span>
          </div>
          
          <button type="submit" class="auth-button" id="reset-button">
            <span class="button-text">Send Reset Email</span>
            <span class="button-loading" style="display: none;">Sending...</span>
          </button>
          
          <div class="auth-links">
            <p>Remember your password? <a href="#/signin">Sign In</a></p>
            <p>Don't have an account? <a href="#/signup">Sign Up</a></p>
          </div>
        </form>
        
        <div id="reset-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    return this.element;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#reset-form');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordReset();
    });
  }

  async handlePasswordReset() {
    const email = this.element.querySelector('#email').value;
    
    const button = this.element.querySelector('#reset-button');
    const buttonText = button.querySelector('.button-text');
    const buttonLoading = button.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm(email)) {
      return;
    }

    // Show loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      await sendPasswordResetEmail(auth, email);
      
      // Show success message
      toast.success(
        'Password reset email sent! Please check your inbox and follow the instructions to reset your password.',
        6000
      );
      
      // Optionally redirect to sign in after a delay
      setTimeout(() => {
        window.location.hash = '#/signin';
      }, 3000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      this.handlePasswordResetError(error);
    } finally {
      // Reset button state
      button.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  validateForm(email) {
    let isValid = true;

    // Email validation
    if (!email) {
      this.showFieldError('email-error', 'Email is required');
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.showFieldError('email-error', 'Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handlePasswordResetError(error) {
    let message = 'An error occurred while sending the reset email. Please try again.';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address. Please check your email or sign up for a new account.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many reset attempts. Please wait a moment before trying again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
    }

    toast.error(message);
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
  }
}