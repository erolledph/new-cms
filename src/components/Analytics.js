// Analytics dashboard component
import { authManager } from '../auth/AuthManager.js';
import { db } from '../firebase.js';
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { toast } from '../utils/toast.js';

export class Analytics {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.isLoading = true;
    this.analyticsData = [];
    this.userSites = []; // Stores both blog and product sites
    this.selectedSiteId = 'all'; // 'all' or a specific site ID
    this.siteMap = new Map(); // Maps siteId to site name
  }

  render() {
    this.currentUser = authManager.getCurrentUser();

    this.element = document.createElement('div');
    this.element.className = 'analytics-container';
    this.element.innerHTML = `
      <div class="content-section">
        <h2>Analytics Dashboard</h2>
        <p class="section-description">
          Gain insights into your content and product performance.
        </p>

        <div id="loading-state" class="loading-message">
          <p>Loading analytics data...</p>
        </div>

        <div id="analytics-dashboard" style="display: none;">
          <div class="analytics-controls">
            <div class="controls-row">
              <div class="site-selector">
                <label for="site-select">Select Site:</label>
                <select id="site-select" class="filter-select">
                  <option value="all">All Sites</option>
                  <!-- Dynamic site options will be loaded here -->
                </select>
              </div>
              <!-- Date range selector can be added here in future -->
            </div>
          </div>

          <div class="analytics-overview">
            <div class="overview-grid">
              <div class="analytics-card">
                <h3>Total Views</h3>
                <div class="stat-number" id="total-views">0</div>
                <div class="stat-label">across all content</div>
              </div>
              
              <div class="analytics-card">
                <h3>Unique Visitors</h3>
                <div class="stat-number" id="unique-visitors">0</div>
                <div class="stat-label">based on session IDs</div>
              </div>
              
              <div class="analytics-card">
                <h3>Top Content Views</h3>
                <div class="stat-number" id="top-content-views">0</div>
                <div class="stat-label">for the most viewed item</div>
              </div>
            </div>
          </div>

          <div class="analytics-details">
            <div class="analytics-section">
              <h3>Top Content Performance</h3>
              <div class="performance-list" id="top-content-list">
                <div class="empty-state">No content data available.</div>
              </div>
            </div>

            <div class="analytics-section">
              <h3>Traffic Sources</h3>
              <div class="sources-list" id="traffic-sources-list">
                <div class="empty-state">No traffic source data available.</div>
              </div>
            </div>
          </div>

          <div class="analytics-charts">
            <div class="chart-section">
              <h3>Daily Views</h3>
              <div class="simple-bar-chart" id="daily-views-chart">
                <div class="empty-state">No daily view data available.</div>
              </div>
            </div>
          </div>
        </div>

        <div id="analytics-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadAnalyticsData();
    return this.element;
  }

  attachEventListeners() {
    const siteSelect = this.element.querySelector('#site-select');
    if (siteSelect) {
      siteSelect.addEventListener('change', (e) => {
        this.selectedSiteId = e.target.value;
        this.processAndDisplayAnalytics();
      });
    }
  }

  async loadAnalyticsData() {
    if (!this.currentUser) {
      this.showError('No user authenticated.');
      return;
    }

    try {
      // Fetch user's blog and product sites
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userSites = [
          ...(userData.blogSites || []),
          ...(userData.productSites || [])
        ];
        this.userSites.forEach(site => this.siteMap.set(site.id, site.name));
      }

      // Populate site selector
      this.populateSiteSelector();

      // Fetch all analytics events for the user
      const analyticsCollectionRef = collection(db, 'analytics', this.currentUser.uid, 'sites');
      const siteSnapshots = await getDocs(analyticsCollectionRef);

      let allEvents = [];
      for (const siteDoc of siteSnapshots.docs) {
        const eventsCollectionRef = collection(db, 'analytics', this.currentUser.uid, 'sites', siteDoc.id, 'events');
        const eventsSnapshot = await getDocs(eventsCollectionRef);
        eventsSnapshot.forEach(eventDoc => {
          allEvents.push({ siteId: siteDoc.id, ...eventDoc.data() });
        });
      }
      this.analyticsData = allEvents;
      
      this.processAndDisplayAnalytics();

    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.showError('Error loading analytics data. Please try again.');
    } finally {
      this.isLoading = false;
      this.element.querySelector('#loading-state').style.display = 'none';
      this.element.querySelector('#analytics-dashboard').style.display = 'block';
    }
  }

  populateSiteSelector() {
    const siteSelect = this.element.querySelector('#site-select');
    siteSelect.innerHTML = '<option value="all">All Sites</option>'; // Reset options

    this.userSites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.id;
      option.textContent = site.name;
      siteSelect.appendChild(option);
    });
  }

  processAndDisplayAnalytics() {
    let filteredEvents = this.analyticsData;

    if (this.selectedSiteId !== 'all') {
      filteredEvents = this.analyticsData.filter(event => event.siteId === this.selectedSiteId);
    }

    // Filter for 'view' events for most stats
    const viewEvents = filteredEvents.filter(event => event.type === 'view');

    // Calculate Total Views
    const totalViews = viewEvents.length;
    this.element.querySelector('#total-views').textContent = totalViews;

    // Calculate Unique Visitors (based on sessionId)
    const uniqueVisitors = new Set(viewEvents.map(event => event.sessionId)).size;
    this.element.querySelector('#unique-visitors').textContent = uniqueVisitors;

    // Calculate Top Content Performance
    const contentViews = {};
    viewEvents.forEach(event => {
      if (event.contentId) {
        contentViews[event.contentId] = (contentViews[event.contentId] || 0) + 1;
      }
    });

    const sortedContent = Object.entries(contentViews).sort(([, a], [, b]) => b - a);
    const topContentViews = sortedContent.length > 0 ? sortedContent : 0;
    this.element.querySelector('#top-content-views').textContent = topContentViews;

    this.renderTopContentList(sortedContent);
    this.renderTrafficSources(viewEvents);
    this.renderDailyViewsChart(viewEvents);
  }

  renderTopContentList(sortedContent) {
    const topContentList = this.element.querySelector('#top-content-list');
    topContentList.innerHTML = ''; // Clear previous list

    if (sortedContent.length === 0) {
      topContentList.innerHTML = '<div class="empty-state">No content data available.</div>';
      return;
    }

    // Display top 5 content items
    sortedContent.slice(0, 5).forEach(([contentId, views], index) => {
      const item = document.createElement('div');
      item.className = 'performance-item';
      item.innerHTML = `
        <span class="performance-rank">${index + 1}.</span>
        <div class="performance-details">
          <div class="performance-title">${contentId}</div>
          <div class="performance-id">ID: ${contentId}</div>
        </div>
        <div class="performance-stats">
          <span class="stat-value">${views}</span>
          <span class="stat-label">views</span>
        </div>
      `;
      topContentList.appendChild(item);
    });
  }

  renderTrafficSources(viewEvents) {
    const trafficSourcesList = this.element.querySelector('#traffic-sources-list');
    trafficSourcesList.innerHTML = ''; // Clear previous list

    const referrers = {};
    viewEvents.forEach(event => {
      const referrer = event.referrer || 'Direct / Unknown';
      const domain = referrer.includes('://') ? new URL(referrer).hostname : referrer;
      referrers[domain] = (referrers[domain] || 0) + 1;
    });

    const sortedReferrers = Object.entries(referrers).sort(([, a], [, b]) => b - a);

    if (sortedReferrers.length === 0) {
      trafficSourcesList.innerHTML = '<div class="empty-state">No traffic source data available.</div>';
      return;
    }

    // Display top 5 traffic sources
    sortedReferrers.slice(0, 5).forEach(([domain, count], index) => {
      const item = document.createElement('div');
      item.className = 'source-item';
      item.innerHTML = `
        <span class="source-rank">${index + 1}.</span>
        <div class="source-details">
          <div class="source-domain">${domain}</div>
        </div>
        <div class="source-stats">
          <span class="stat-value">${count}</span>
          <span class="stat-label">visits</span>
        </div>
      `;
      trafficSourcesList.appendChild(item);
    });
  }

  renderDailyViewsChart(viewEvents) {
    const dailyViewsChart = this.element.querySelector('#daily-views-chart');
    dailyViewsChart.innerHTML = ''; // Clear previous chart

    const dailyCounts = {};
    viewEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US'); // YYYY-MM-DD
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDates.length === 0) {
      dailyViewsChart.innerHTML = '<div class="empty-state">No daily view data available.</div>';
      return;
    }

    // Determine max views for scaling
    const maxViews = Math.max(...Object.values(dailyCounts));

    sortedDates.forEach(date => {
      const views = dailyCounts[date];
      const barHeight = (views / maxViews) * 100; // Scale to 100% height
      const item = document.createElement('div');
      item.className = 'chart-bar';
      item.innerHTML = `
        <div class="bar" style="height: ${barHeight}%;"></div>
        <div class="bar-label">${date.substring(0, date.lastIndexOf('/'))}</div>
      `;
      dailyViewsChart.appendChild(item);
    });
  }

  showError(message) {
    const loadingState = this.element.querySelector('#loading-state');
    loadingState.innerHTML = `
      <div class="error-state">
        <p style="color: #dc3545;">${message}</p>
        <button class="action-button" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'overview' } }))">
          Back to Overview
        </button>
      </div>
    `;
  }


}