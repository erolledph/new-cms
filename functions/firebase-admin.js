// Firebase Admin SDK configuration for Netlify Functions
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let app;

function initializeFirebaseAdmin() {
  if (!app) {
    try {
      // Check if Firebase Admin is already initialized
      app = admin.app();
    } catch (error) {
      // Initialize Firebase Admin with service account credentials
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
  }
  return app;
}

// Get Firestore instance
function getFirestore() {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
}

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Handle CORS preflight requests
function handleCORS(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  return null;
}

// Error response helper
function errorResponse(statusCode, message, error = null) {
  console.error('API Error:', message, error);
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      error: message,
      timestamp: new Date().toISOString()
    })
  };
}

// Success response helper
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

// Validate required parameters
function validateParams(params, required) {
  const missing = required.filter(param => !params[param]);
  if (missing.length > 0) {
    const availableParams = Object.keys(params).filter(key => params[key]);
    throw new Error(`Missing required parameters: ${missing.join(', ')}. Available parameters: ${availableParams.join(', ') || 'none'}`);
  }
}

// Enhanced parameter extraction from event (query params or path)
function getParamsFromEvent(event, expectedParams) {
  console.log('=== PARAMETER EXTRACTION DEBUG ===');
  console.log('Event path:', event.path);
  console.log('Event queryStringParameters:', event.queryStringParameters);
  console.log('Expected parameters:', expectedParams);
  
  // First, try to get parameters from queryStringParameters
  const queryParams = event.queryStringParameters || {};
  console.log('Query parameters found:', queryParams);
  
  // Check if we have all expected parameters from query string
  const hasAllQueryParams = expectedParams.every(param => queryParams[param]);
  
  if (hasAllQueryParams) {
    console.log('Using parameters from queryStringParameters');
    console.log('=== PARAMETER EXTRACTION END ===');
    return queryParams;
  }
  
  // If query parameters are missing, parse from path
  console.log('Query parameters incomplete, parsing from path...');
  
  const pathParams = {};
  const path = event.path || '';
  
  // Remove leading slash and split by slash
  const pathSegments = path.replace(/^\//, '').split('/');
  console.log('Path segments:', pathSegments);
  
  // Determine API type and extract parameters accordingly
  if (path.includes('/api/content.json')) {
    // Format: /{uid}/{blogId}/api/content.json
    if (pathSegments.length >= 4 && pathSegments[2] === 'api' && pathSegments[3] === 'content.json') {
      pathParams.uid = pathSegments[0];
      pathParams.blogId = pathSegments[1];
      console.log('Extracted content API parameters from path:', pathParams);
    }
  } else if (path.includes('/api/content/') && path.endsWith('.json')) {
    // Format: /{uid}/{blogId}/api/content/{slug}.json
    if (pathSegments.length >= 5 && pathSegments[2] === 'api' && pathSegments[3] === 'content') {
      pathParams.uid = pathSegments[0];
      pathParams.blogId = pathSegments[1];
      pathParams.slug = pathSegments[4].replace('.json', '');
      console.log('Extracted content-slug API parameters from path:', pathParams);
    }
  } else if (path.includes('/api/products.json')) {
    // Format: /{uid}/{siteId}/api/products.json
    if (pathSegments.length >= 4 && pathSegments[2] === 'api' && pathSegments[3] === 'products.json') {
      pathParams.uid = pathSegments[0];
      pathParams.siteId = pathSegments[1];
      console.log('Extracted products API parameters from path:', pathParams);
    }
  } else if (path.includes('/api/products/') && path.endsWith('.json')) {
    // Format: /{uid}/{siteId}/api/products/{slug}.json
    if (pathSegments.length >= 5 && pathSegments[2] === 'api' && pathSegments[3] === 'products') {
      pathParams.uid = pathSegments[0];
      pathParams.siteId = pathSegments[1];
      pathParams.slug = pathSegments[4].replace('.json', '');
      console.log('Extracted products-slug API parameters from path:', pathParams);
    }
  }
  
  // Merge query params with path params (path params take precedence)
  const finalParams = { ...queryParams, ...pathParams };
  console.log('Final extracted parameters:', finalParams);
  console.log('=== PARAMETER EXTRACTION END ===');
  
  return finalParams;
}
module.exports = {
  initializeFirebaseAdmin,
  getFirestore,
  corsHeaders,
  handleCORS,
  errorResponse,
  successResponse,
  validateParams,
  getParamsFromEvent
};