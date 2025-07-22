// User Settings component
import { authManager } from '../auth/AuthManager.js';
import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '../utils/toast.js';

export class Settings {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.userSettings = null;
    this.isLoading = true;
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'settings-container';
    this.element.innerHTML = `
      <div class="content-section">
        <h2>Settings</h2>
        <p class="section-description">
          Manage your account preferences and CMS settings.
        </p>
        
        <div id="loading-state" class="loading-message">
          <p>Loading your settings...</p>
        </div>
        
        <div id="settings-form" class="settings-form" style="display: none;">
          <form id="user-settings-form">
            <div class="settings-section">
              <h3>Currency & Localization</h3>
              <p class="section-description">
                Set your preferred currency for product pricing and financial displays.
              </p>
              
              <div class="form-group">
                <label for="currency-select">Default Currency *</label>
                <select id="currency-select" name="currency" required>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="JPY">JPY - Japanese Yen (¥)</option>
                  <option value="CAD">CAD - Canadian Dollar (C$)</option>
                  <option value="AUD">AUD - Australian Dollar (A$)</option>
                  <option value="CHF">CHF - Swiss Franc (CHF)</option>
                  <option value="CNY">CNY - Chinese Yuan (¥)</option>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                  <option value="BRL">BRL - Brazilian Real (R$)</option>
                </select>
                <small class="field-help">This currency will be used as the default for new products and pricing displays</small>
                <span class="error-message" id="currency-error"></span>
              </div>
              
              <div class="form-group">
                <label for="timezone-select">Timezone</label>
                <select id="timezone-select" name="timezone">
                  <option value="UTC">UTC - Coordinated Universal Time</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Asia/Kolkata">Mumbai (IST)</option>
                  <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                </select>
                <small class="field-help">Used for scheduling and date displays</small>
              </div>
              
              <div class="form-group">
                <label for="date-format-select">Date Format</label>
                <select id="date-format-select" name="dateFormat">
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (European Format)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g., 15 Jan 2024)</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY (e.g., Jan 15, 2024)</option>
                </select>
                <small class="field-help">How dates are displayed throughout the CMS</small>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Content & Display</h3>
              <p class="section-description">
                Customize how content is displayed and managed in your CMS.
              </p>
              
              <div class="form-group">
                <label for="items-per-page">Items Per Page</label>
                <select id="items-per-page" name="itemsPerPage">
                  <option value="10">10 items</option>
                  <option value="25">25 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
                <small class="field-help">Number of items to display in content and product lists</small>
              </div>
              
              <div class="form-group">
                <label for="default-content-status">Default Content Status</label>
                <select id="default-content-status" name="defaultContentStatus">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <small class="field-help">Default status for new blog posts and products</small>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Notifications</h3>
              <p class="section-description">
                Control when and how you receive notifications about your CMS activity.
              </p>
              
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="email-notifications" name="emailNotifications">
                  <span class="checkbox-text">Email Notifications</span>
                </label>
                <small class="field-help">Receive email updates about important CMS activities</small>
              </div>
              
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="browser-notifications" name="browserNotifications">
                  <span class="checkbox-text">Browser Notifications</span>
                </label>
                <small class="field-help">Show browser notifications for real-time updates</small>
              </div>
              
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="weekly-summary" name="weeklySummary">
                  <span class="checkbox-text">Weekly Summary</span>
                </label>
                <small class="field-help">Receive a weekly summary of your CMS activity and analytics</small>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Account Information</h3>
              <p class="section-description">
                View your account details and usage information.
              </p>
              
              <div class="account-info">
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value" id="user-email">Loading...</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Plan:</span>
                  <span class="info-value" id="user-plan">Loading...</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Member Since:</span>
                  <span class="info-value" id="member-since">Loading...</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Blog Sites:</span>
                  <span class="info-value" id="blog-sites-count">Loading...</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Product Sites:</span>
                  <span class="info-value" id="product-sites-count">Loading...</span>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" id="reset-button">
                Reset to Defaults
              </button>
              <button type="submit" class="create-button" id="save-button">
                <span class="button-text">Save Settings</span>
                <span class="button-loading" style="display: none;">Saving...</span>
              </button>
            </div>
          </form>
        </div>
        
        <div id="settings-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadUserSettings();
    return this.element;
  }

  attachEventListeners() {
    const form = this.element.querySelector('#user-settings-form');
    const saveButton = this.element.querySelector('#save-button');
    const resetButton = this.element.querySelector('#reset-button');

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveSettings();
    });

    // Reset button
    resetButton.addEventListener('click', () => {
      this.handleResetSettings();
    });

    // Real-time validation
    const currencySelect = this.element.querySelector('#currency-select');
    currencySelect.addEventListener('change', () => {
      this.validateCurrency();
    });
  }

  async loadUserSettings() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      // Load user settings
      const userSettingsRef = doc(db, 'users', this.currentUser.uid, 'settings', 'userSettingsDoc');
      const userSettingsDoc = await getDoc(userSettingsRef);
      
      if (userSettingsDoc.exists()) {
        this.userSettings = userSettingsDoc.data();
      } else {
        // Create default settings if they don't exist
        this.userSettings = this.getDefaultSettings();
      }

      // Load user account info
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      let userData = {};
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      }

      this.populateForm(this.userSettings, userData);
      this.showSettingsForm();

    } catch (error) {
      console.error('Error loading user settings:', error);
      this.showError('Error loading settings. Please try again.');
    }
  }

  getDefaultSettings() {
    return {
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      itemsPerPage: 25,
      defaultContentStatus: 'draft',
      emailNotifications: true,
      browserNotifications: false,
      weeklySummary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  populateForm(settings, userData) {
    // Currency and localization
    this.element.querySelector('#currency-select').value = settings.currency || 'USD';
    this.element.querySelector('#timezone-select').value = settings.timezone || 'UTC';
    this.element.querySelector('#date-format-select').value = settings.dateFormat || 'MM/DD/YYYY';

    // Content and display
    this.element.querySelector('#items-per-page').value = settings.itemsPerPage || 25;
    this.element.querySelector('#default-content-status').value = settings.defaultContentStatus || 'draft';

    // Notifications
    this.element.querySelector('#email-notifications').checked = settings.emailNotifications !== false;
    this.element.querySelector('#browser-notifications').checked = settings.browserNotifications === true;
    this.element.querySelector('#weekly-summary').checked = settings.weeklySummary !== false;

    // Account information
    this.element.querySelector('#user-email').textContent = this.currentUser.email || 'Not available';
    this.element.querySelector('#user-plan').textContent = (userData.plan || 'free').charAt(0).toUpperCase() + (userData.plan || 'free').slice(1);
    this.element.querySelector('#member-since').textContent = this.formatDate(userData.createdAt);
    this.element.querySelector('#blog-sites-count').textContent = `${(userData.blogSites || []).length} of 3`;
    this.element.querySelector('#product-sites-count').textContent = `${(userData.productSites || []).length} of 3`;
  }

  showSettingsForm() {
    const loadingState = this.element.querySelector('#loading-state');
    const settingsForm = this.element.querySelector('#settings-form');
    
    loadingState.style.display = 'none';
    settingsForm.style.display = 'block';
  }

  async handleSaveSettings() {
    const saveButton = this.element.querySelector('#save-button');
    const buttonText = saveButton.querySelector('.button-text');
    const buttonLoading = saveButton.querySelector('.button-loading');

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateForm()) {
      return;
    }

    // Show loading state
    saveButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      const formData = this.getFormData();
      
      // Update user settings in Firestore
      const userSettingsRef = doc(db, 'users', this.currentUser.uid, 'settings', 'userSettingsDoc');
      await updateDoc(userSettingsRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      // Update local settings
      this.userSettings = { ...this.userSettings, ...formData };

      // Show success message
      toast.success('Settings saved successfully!');

      // Trigger any necessary updates in other components
      window.dispatchEvent(new CustomEvent('user-settings-updated', {
        detail: { settings: this.userSettings }
      }));

    } catch (error) {
      console.error('Error saving settings:', error);
      this.handleSaveError(error);
    } finally {
      // Reset button state
      saveButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async handleResetSettings() {
    const confirmed = confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const defaultSettings = this.getDefaultSettings();
      
      // Update user settings in Firestore
      const userSettingsRef = doc(db, 'users', this.currentUser.uid, 'settings', 'userSettingsDoc');
      await updateDoc(userSettingsRef, {
        ...defaultSettings,
        updatedAt: serverTimestamp()
      });

      // Update local settings
      this.userSettings = defaultSettings;

      // Repopulate form with default values
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      this.populateForm(defaultSettings, userData);

      // Show success message
      toast.success('Settings reset to defaults successfully!');

      // Trigger updates
      window.dispatchEvent(new CustomEvent('user-settings-updated', {
        detail: { settings: this.userSettings }
      }));

    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Error resetting settings. Please try again.');
    }
  }

  getFormData() {
    return {
      currency: this.element.querySelector('#currency-select').value,
      timezone: this.element.querySelector('#timezone-select').value,
      dateFormat: this.element.querySelector('#date-format-select').value,
      itemsPerPage: parseInt(this.element.querySelector('#items-per-page').value),
      defaultContentStatus: this.element.querySelector('#default-content-status').value,
      emailNotifications: this.element.querySelector('#email-notifications').checked,
      browserNotifications: this.element.querySelector('#browser-notifications').checked,
      weeklySummary: this.element.querySelector('#weekly-summary').checked
    };
  }

  validateForm() {
    let isValid = true;

    if (!this.validateCurrency()) {
      isValid = false;
    }

    return isValid;
  }

  validateCurrency() {
    const currency = this.element.querySelector('#currency-select').value;
    
    if (!currency) {
      this.showFieldError('currency-error', 'Please select a currency.');
      return false;
    }

    this.clearFieldError('currency-error');
    return true;
  }

  handleSaveError(error) {
    let message = 'An error occurred while saving settings. Please try again.';

    if (error.code === 'permission-denied') {
      message = 'Permission denied. Please check your account permissions.';
    } else if (error.code === 'network-request-failed') {
      message = 'Network error. Please check your connection and try again.';
    }

    toast.error(message);
  }

  formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    try {
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

  showError(message) {
    const loadingState = this.element.querySelector('#loading-state');
    loadingState.innerHTML = `
      <div class="error-state">
        <p style="color: #dc3545;">${message}</p>
        <button class="action-button" onclick="window.location.reload()">
          Reload Page
        </button>
      </div>
    `;
  }

  showFieldError(fieldId, message) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(fieldId) {
    const errorElement = this.element.querySelector(`#${fieldId}`);
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }

  clearErrors() {
    const errorElements = this.element.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
    });

    const messageElement = this.element.querySelector('#settings-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }


}