// Analytics Tracking API Function - Handles analytics data collection
const { getFirestore, handleCORS, successResponse, errorResponse, validateParams } = require('./firebase-admin');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return errorResponse(405, 'Method not allowed. Use POST to track analytics.');
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return errorResponse(400, 'Invalid JSON in request body');
    }

    // Extract and validate required parameters
    const { uid, siteId, type, contentId } = requestBody;
    
    try {
      validateParams({ uid, siteId, type }, ['uid', 'siteId', 'type']);
    } catch (error) {
      return errorResponse(400, error.message);
    }

    // Validate event type
    const validTypes = ['view', 'interaction', 'click'];
    if (!validTypes.includes(type)) {
      return errorResponse(400, `Invalid event type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Extract optional parameters with defaults
    const userAgent = requestBody.userAgent || event.headers['user-agent'] || '';
    const referrer = requestBody.referrer || event.headers.referer || event.headers.referrer || '';
    
    // Get IP address from various possible headers (Netlify specific)
    const clientIP = event.headers['x-forwarded-for'] || 
                     event.headers['x-real-ip'] || 
                     event.headers['client-ip'] || 
                     context.clientContext?.ip || 
                     'unknown';

    // Hash IP address for privacy protection
    const hashedIP = hashIP(clientIP);

    // Generate session ID if not provided
    const sessionId = requestBody.sessionId || generateSessionId();

    // Prepare analytics event data
    const eventData = {
      type: type,
      contentId: contentId || '',
      timestamp: new Date(),
      userAgent: sanitizeString(userAgent, 500),
      referrer: sanitizeString(referrer, 500),
      ip: hashedIP,
      sessionId: sessionId,
      // Additional metadata
      metadata: {
        path: requestBody.path || '',
        title: sanitizeString(requestBody.title || '', 200),
        category: sanitizeString(requestBody.category || '', 100),
        tags: Array.isArray(requestBody.tags) ? requestBody.tags.slice(0, 10) : [],
        duration: requestBody.duration || null,
        scrollDepth: requestBody.scrollDepth || null,
        clickTarget: sanitizeString(requestBody.clickTarget || '', 100)
      },
      // Browser/device info
      browserInfo: {
        language: requestBody.language || '',
        screenResolution: requestBody.screenResolution || '',
        viewport: requestBody.viewport || '',
        timezone: requestBody.timezone || ''
      }
    };

    // Get Firestore instance
    const db = getFirestore();

    // Generate unique event ID
    const eventId = generateEventId();

    // Store analytics data in Firestore
    const analyticsRef = db.collection('users')
      .doc(uid)
      .collection('analytics')
      .doc(siteId)
      .collection('events')
      .doc(eventId);

    await analyticsRef.set(eventData);

    // Return successful response
    return successResponse({
      success: true,
      eventId: eventId,
      sessionId: sessionId,
      timestamp: eventData.timestamp.toISOString(),
      message: 'Analytics event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics Tracking Error:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      return errorResponse(403, 'Access denied to analytics data');
    }
    
    if (error.code === 'quota-exceeded') {
      return errorResponse(429, 'Analytics quota exceeded. Please try again later.');
    }
    
    return errorResponse(500, 'Internal server error while tracking analytics');
  }
};

// Helper function to hash IP addresses for privacy
function hashIP(ip) {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }
  
  // Use SHA-256 to hash the IP address
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

// Helper function to sanitize strings
function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Remove potentially harmful characters and limit length
  return str
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
    .trim()
    .substring(0, maxLength);
}

// Helper function to generate session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Helper function to generate event ID
function generateEventId() {
  return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}