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

module.exports = {
  initializeFirebaseAdmin,
  getFirestore,
  corsHeaders,
  handleCORS,
  errorResponse,
  successResponse,
  validateParams
};