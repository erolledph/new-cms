// Documentation component for API usage
import { authManager } from '../auth/AuthManager.js';
import { db } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export class Documentation {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.userSites = {
      blogSites: [],
      productSites: []
    };
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'documentation-container';
    this.element.innerHTML = `
      <div class="content-section">
        <h2>API Documentation</h2>
        <p class="section-description">
          Learn how to use your Firebase CMS API endpoints to integrate your content and products into external applications.
        </p>
        
        <div id="loading-sites" class="loading-message">
          <p>Loading your sites...</p>
        </div>
        
        <div id="documentation-content" style="display: none;">
          <div class="doc-section">
            <h3>🌐 Overview</h3>
            <p>Your Firebase CMS provides JSON API endpoints that allow you to access your published content and products from any external application, website, or service. All endpoints are publicly accessible and return data in JSON format with CORS enabled.</p>
          </div>

          <div class="doc-section">
            <h3>📝 Blog Content API</h3>
            <p>Access your published blog posts through these endpoints:</p>
            
            <div class="api-endpoint">
              <h4>Get All Posts</h4>
              <div class="endpoint-url">
                <code>GET /users/{uid}/blogs/{blogId}/api/content.json</code>
              </div>
              <p><strong>Description:</strong> Returns all published blog posts for a specific blog site, ordered by publication date (newest first).</p>
              
              <div class="response-example">
                <h5>Response Format:</h5>
                <pre><code>{
  "posts": [
    {
      "id": "post_123456789_abc123",
      "title": "My Blog Post Title",
      "slug": "my-blog-post-title",
      "content": "Full blog post content in markdown...",
      "featuredImageUrl": "https://example.com/image.jpg",
      "metaDescription": "SEO description",
      "seoTitle": "SEO optimized title",
      "keywords": ["keyword1", "keyword2"],
      "author": "Author Name",
      "categories": ["Technology", "Web Development"],
      "tags": ["javascript", "tutorial"],
      "contentUrl": "/users/{uid}/blogs/{blogId}/api/content/my-blog-post-title.json",
      "publishDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "blogId": "{blogId}",
  "uid": "{uid}",
  "generatedAt": "2024-01-15T12:00:00.000Z"
}</code></pre>
              </div>
            </div>

            <div class="api-endpoint">
              <h4>Get Single Post</h4>
              <div class="endpoint-url">
                <code>GET /users/{uid}/blogs/{blogId}/api/content/{slug}.json</code>
              </div>
              <p><strong>Description:</strong> Returns a specific published blog post by its slug.</p>
              
              <div class="response-example">
                <h5>Response Format:</h5>
                <pre><code>{
  "post": {
    "id": "post_123456789_abc123",
    "title": "My Blog Post Title",
    "slug": "my-blog-post-title",
    "content": "Full blog post content...",
    "featuredImageUrl": "https://example.com/image.jpg",
    "metaDescription": "SEO description",
    "seoTitle": "SEO optimized title",
    "keywords": ["keyword1", "keyword2"],
    "author": "Author Name",
    "categories": ["Technology"],
    "tags": ["javascript"],
    "contentUrl": "/users/{uid}/blogs/{blogId}/api/content/my-blog-post-title.json",
    "publishDate": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "blogId": "{blogId}",
  "uid": "{uid}",
  "generatedAt": "2024-01-15T12:00:00.000Z"
}</code></pre>
              </div>
            </div>

            <div id="blog-examples" class="examples-section">
              <!-- Dynamic blog examples will be loaded here -->
            </div>
          </div>

          <div class="doc-section">
            <h3>🛍️ Products API</h3>
            <p>Access your published products through these endpoints:</p>
            
            <div class="api-endpoint">
              <h4>Get All Products</h4>
              <div class="endpoint-url">
                <code>GET /users/{uid}/productSites/{siteId}/api/products.json</code>
              </div>
              <p><strong>Description:</strong> Returns all published products for a specific product site, ordered by creation date (newest first).</p>
              
              <div class="response-example">
                <h5>Response Format:</h5>
                <pre><code>{
  "products": [
    {
      "id": "product_123456789_xyz789",
      "name": "Amazing Product",
      "slug": "amazing-product",
      "description": "Product description in markdown...",
      "price": 29.99,
      "originalPrice": 39.99,
      "percentOff": 25,
      "discountedPrice": 29.99,
      "savings": 10.00,
      "currency": "USD",
      "imageUrl": "https://example.com/product-image.jpg",
      "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "productUrl": "https://store.example.com/amazing-product",
      "category": "Electronics",
      "tags": ["gadget", "tech"],
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "siteId": "{siteId}",
  "uid": "{uid}",
  "generatedAt": "2024-01-15T12:00:00.000Z"
}</code></pre>
              </div>
            </div>

            <div class="api-endpoint">
              <h4>Get Single Product</h4>
              <div class="endpoint-url">
                <code>GET /users/{uid}/productSites/{siteId}/api/products/{slug}.json</code>
              </div>
              <p><strong>Description:</strong> Returns a specific published product by its slug.</p>
              
              <div class="response-example">
                <h5>Response Format:</h5>
                <pre><code>{
  "product": {
    "id": "product_123456789_xyz789",
    "name": "Amazing Product",
    "slug": "amazing-product",
    "description": "Product description...",
    "price": 29.99,
    "originalPrice": 39.99,
    "percentOff": 25,
    "discountedPrice": 29.99,
    "savings": 10.00,
    "currency": "USD",
    "imageUrl": "https://example.com/product-image.jpg",
    "imageUrls": ["https://example.com/image1.jpg"],
    "productUrl": "https://store.example.com/amazing-product",
    "category": "Electronics",
    "tags": ["gadget", "tech"],
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "siteId": "{siteId}",
  "uid": "{uid}",
  "generatedAt": "2024-01-15T12:00:00.000Z"
}</code></pre>
              </div>
            </div>

            <div id="product-examples" class="examples-section">
              <!-- Dynamic product examples will be loaded here -->
            </div>
          </div>

          <div class="doc-section">
            <h3>📊 Analytics Tracking API</h3>
            <p>Track user interactions with your content and products:</p>
            
            <div class="api-endpoint">
              <h4>Track Event</h4>
              <div class="endpoint-url">
                <code>POST /api/analytics/track</code>
              </div>
              <p><strong>Description:</strong> Track page views, interactions, and clicks on your content and products.</p>
              
              <div class="request-example">
                <h5>Request Body:</h5>
                <pre><code>{
  "uid": "{your-uid}",
  "siteId": "{blog-or-product-site-id}",
  "type": "view",
  "contentId": "post-or-product-id",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://example.com",
  "sessionId": "session_123456789",
  "path": "/blog/my-post",
  "title": "My Blog Post",
  "category": "Technology",
  "tags": ["javascript", "tutorial"]
}</code></pre>
              </div>
              
              <div class="response-example">
                <h5>Response Format:</h5>
                <pre><code>{
  "success": true,
  "eventId": "event_123456789_abc123",
  "sessionId": "session_123456789",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "message": "Analytics event tracked successfully"
}</code></pre>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3>💻 Usage Examples</h3>
            
            <div class="usage-example">
              <h4>JavaScript/Fetch API</h4>
              <pre><code>// Fetch all blog posts
// Replace {uid} and {blogId} with actual values
const uid = 'your-actual-uid';
const blogId = 'your-actual-blog-id';

fetch('/users/' + uid + '/blogs/' + blogId + '/api/content.json')
  .then(response => response.json())
  .then(data => {
    console.log('Blog posts:', data.posts);
    data.posts.forEach(post => {
      console.log(post.title, post.publishDate);
    });
  })
  .catch(error => console.error('Error:', error));

// Fetch all products
// Replace {uid} and {siteId} with actual values
const productSiteId = 'your-actual-site-id';

fetch('/users/' + uid + '/productSites/' + productSiteId + '/api/products.json')
  .then(response => response.json())
  .then(data => {
    console.log('Products:', data.products);
    data.products.forEach(product => {
      console.log(product.name, product.price, product.currency);
    });
  })
  .catch(error => console.error('Error:', error));

// Track a page view
fetch('/api/analytics/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    uid: uid, // Use actual uid
    siteId: blogId, // Use actual site id
    type: 'view',
    contentId: 'post-123',
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer
  })
})
.then(response => response.json())
.then(data => console.log('Analytics tracked:', data))
.catch(error => console.error('Error:', error));</code></pre>
            </div>

            <div class="usage-example">
              <h4>React/Next.js Example</h4>
              <pre><code>import { useEffect, useState } from 'react';

function BlogPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with your actual values
  const uid = 'your-actual-uid';
  const blogId = 'your-actual-blog-id';

  useEffect(() => {
    fetch('/users/' + uid + '/blogs/' + blogId + '/api/content.json')
      .then(response => response.json())
      .then(data => {
        setPosts(data.posts);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return &lt;div&gt;Loading...&lt;/div&gt;;

  return (
    &lt;div&gt;
      {posts.map(post =&gt; (
        &lt;article key={post.id}&gt;
          &lt;h2&gt;{post.title}&lt;/h2&gt;
          &lt;p&gt;{post.metaDescription}&lt;/p&gt;
          &lt;small&gt;By {post.author} on {new Date(post.publishDate).toLocaleDateString()}&lt;/small&gt;
        &lt;/article&gt;
      ))}
    &lt;/div&gt;
  );
}</code></pre>
            </div>

            <div class="usage-example">
              <h4>PHP Example</h4>
              <pre><code>&lt;?php
// Replace with your actual values
$uid = 'your-actual-uid';
$blogId = 'your-actual-blog-id';

// Fetch blog posts
$url = "/users/" . $uid . "/blogs/" . $blogId . "/api/content.json";
$response = file_get_contents($url);
$data = json_decode($response, true);

if ($data && isset($data['posts'])) {
    foreach ($data['posts'] as $post) {
        echo "&lt;h2&gt;" . htmlspecialchars($post['title']) . "&lt;/h2&gt;";
        echo "&lt;p&gt;" . htmlspecialchars($post['metaDescription']) . "&lt;/p&gt;";
        echo "&lt;small&gt;By " . htmlspecialchars($post['author']) . "&lt;/small&gt;";
    }
} else {
    echo "No posts found.";
}
?&gt;</code></pre>
            </div>

            <div class="usage-example">
              <h4>Python Example</h4>
              <pre><code>import requests
import json

# Replace with your actual values
uid = 'your-actual-uid'
site_id = 'your-actual-site-id'

# Fetch products
url = '/users/' + uid + '/productSites/' + site_id + '/api/products.json'
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    products = data.get('products', [])
    
    for product in products:
        print(f"Product: {product['name']}")
        print(f"Price: {product['currency']} {product['price']}")
        if product['percentOff'] > 0:
            print(f"Discount: {product['percentOff']}% off")
        print(f"Category: {product['category']}")
        print("---")
else:
    print(f"Error: {response.status_code}")

# Track analytics
analytics_data = {
    'uid': uid,
    'siteId': site_id,
    'type': 'view',
    'contentId': 'product-123',
    'userAgent': 'Python Script',
    'referrer': 'https://example.com'
}

analytics_response = requests.post('/api/analytics/track', json=analytics_data)
print(f"Analytics tracked: {analytics_response.json()}")</code></pre>
            </div>
          </div>

          <div class="doc-section">
            <h3>🔧 Integration Tips</h3>
            <div class="tips-grid">
              <div class="tip-card">
                <h4>🚀 Performance</h4>
                <ul>
                  <li>Cache API responses to reduce load times</li>
                  <li>Use pagination for large datasets</li>
                  <li>Implement error handling and retry logic</li>
                  <li>Consider using a CDN for better global performance</li>
                </ul>
              </div>
              
              <div class="tip-card">
                <h4>🔒 Security</h4>
                <ul>
                  <li>API endpoints are public - only published content is accessible</li>
                  <li>No authentication required for reading data</li>
                  <li>Analytics tracking accepts POST requests from any origin</li>
                  <li>Validate and sanitize data on your end</li>
                </ul>
              </div>
              
              <div class="tip-card">
                <h4>📱 Mobile Apps</h4>
                <ul>
                  <li>Perfect for React Native, Flutter, or native apps</li>
                  <li>Use HTTPS for all requests</li>
                  <li>Implement offline caching for better UX</li>
                  <li>Track user interactions with analytics API</li>
                </ul>
              </div>
              
              <div class="tip-card">
                <h4>🌐 Websites</h4>
                <ul>
                  <li>Great for static sites, WordPress, or any CMS</li>
                  <li>Use for headless CMS implementations</li>
                  <li>Perfect for JAMstack architectures</li>
                  <li>SEO-friendly with proper meta data</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3>❓ FAQ</h3>
            <div class="faq-item">
              <h4>Q: Are the API endpoints free to use?</h4>
              <p>A: Yes, the API endpoints are included with your Firebase CMS account at no additional cost.</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: Is there a rate limit?</h4>
              <p>A: The endpoints are subject to Netlify Functions limits. For high-traffic applications, consider implementing caching.</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: Can I access draft content?</h4>
              <p>A: No, only published content and products are accessible through the API endpoints.</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: How do I get my UID and site IDs?</h4>
              <p>A: Your UID and site IDs are shown in the examples below, specific to your account and sites.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadUserSites();
    return this.element;
  }

  async loadUserSites() {
    if (!this.currentUser) {
      this.showError('No user authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userSites.blogSites = userData.blogSites || [];
        this.userSites.productSites = userData.productSites || [];
        
        this.renderUserSpecificExamples();
        this.showDocumentation();
      } else {
        this.showError('User data not found');
      }
    } catch (error) {
      console.error('Error loading user sites:', error);
      this.showError('Error loading your sites');
    }
  }

  renderUserSpecificExamples() {
    const blogExamplesContainer = this.element.querySelector('#blog-examples');
    const productExamplesContainer = this.element.querySelector('#product-examples');

    // Render blog site examples
    if (this.userSites.blogSites.length > 0) {
      blogExamplesContainer.innerHTML = `
        <h4>Your Blog Sites</h4>
        <p>Here are the API endpoints for your blog sites:</p>
        ${this.userSites.blogSites.map(site => `
          <div class="user-example">
            <h5>${site.name}</h5>
            <div class="example-urls">
              <div class="example-url">
                <strong>All Posts:</strong>
                <code class="copyable" data-url="${'/users/' + this.currentUser.uid + '/blogs/' + site.id + '/api/content.json'}">
                  ${'/users/' + this.currentUser.uid + '/blogs/' + site.id + '/api/content.json'}
                </code>
                <button class="copy-button" onclick="this.parentElement.querySelector('.copyable').select(); document.execCommand('copy'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">Copy</button>
              </div>
              <div class="example-url">
                <strong>Single Post:</strong>
                <code class="copyable" data-url="${'/users/' + this.currentUser.uid + '/blogs/' + site.id + '/api/content/{slug}.json'}">
                  ${'/users/' + this.currentUser.uid + '/blogs/' + site.id + '/api/content/{slug}.json'}
                </code>
                <button class="copy-button" onclick="this.parentElement.querySelector('.copyable').select(); document.execCommand('copy'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">Copy</button>
              </div>
            </div>
          </div>
        `).join('')}
      `;
    } else {
      blogExamplesContainer.innerHTML = `
        <div class="no-sites-message">
          <p>You haven't created any blog sites yet. <a href="#" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-blog-site' } }))">Create your first blog site</a> to get API endpoints.</p>
        </div>
      `;
    }

    // Render product site examples
    if (this.userSites.productSites.length > 0) {
      productExamplesContainer.innerHTML = `
        <h4>Your Product Sites</h4>
        <p>Here are the API endpoints for your product sites:</p>
        ${this.userSites.productSites.map(site => `
          <div class="user-example">
            <h5>${site.name}</h5>
            <div class="example-urls">
              <div class="example-url">
                <strong>All Products:</strong>
                <code class="copyable" data-url="${'/users/' + this.currentUser.uid + '/productSites/' + site.id + '/api/products.json'}">
                  ${'/users/' + this.currentUser.uid + '/productSites/' + site.id + '/api/products.json'}
                </code>
                <button class="copy-button" onclick="this.parentElement.querySelector('.copyable').select(); document.execCommand('copy'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">Copy</button>
              </div>
              <div class="example-url">
                <strong>Single Product:</strong>
                <code class="copyable" data-url="${'/users/' + this.currentUser.uid + '/productSites/' + site.id + '/api/products/{slug}.json'}">
                  ${'/users/' + this.currentUser.uid + '/productSites/' + site.id + '/api/products/{slug}.json'}
                </code>
                <button class="copy-button" onclick="this.parentElement.querySelector('.copyable').select(); document.execCommand('copy'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">Copy</button>
              </div>
            </div>
          </div>
        `).join('')}
      `;
    } else {
      productExamplesContainer.innerHTML = `
        <div class="no-sites-message">
          <p>You haven't created any product sites yet. <a href="#" onclick="window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { section: 'create-product-site' } }))">Create your first product site</a> to get API endpoints.</p>
        </div>
      `;
    }
  }

  showDocumentation() {
    const loadingState = this.element.querySelector('#loading-sites');
    const documentationContent = this.element.querySelector('#documentation-content');
    
    loadingState.style.display = 'none';
    documentationContent.style.display = 'block';
  }

  showError(message) {
    const loadingState = this.element.querySelector('#loading-sites');
    loadingState.innerHTML = `
      <div class="error-state">
        <p style="color: #dc3545;">${message}</p>
        <button class="action-button" onclick="window.location.reload()">
          Reload Page
        </button>
      </div>
    `;
  }
}