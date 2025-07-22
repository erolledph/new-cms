// Products API Function - Serves all published products for a product site
const { getFirestore, handleCORS, successResponse, errorResponse, validateParams } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
      return errorResponse(405, 'Method not allowed. Use GET to fetch products.');
    }

    // Extract parameters from query string or path
    const { uid, siteId } = event.queryStringParameters || {};
    
    // Log parameters for debugging
    console.log('Products API - Query parameters:', event.queryStringParameters);
    console.log('Products API - Path:', event.path);
    
    // Validate required parameters
    try {
      validateParams({ uid, siteId }, ['uid', 'siteId']);
    } catch (error) {
      console.error('Products API - Parameter validation failed:', error.message);
      return errorResponse(400, error.message);
    }

    // Get Firestore instance
    const db = getFirestore();

    // Query published products
    const productsRef = db.collection('products')
      .doc(uid)
      .collection('sites')
      .doc(siteId)
      .collection('products');

    const snapshot = await productsRef
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get();

    // If no products found, return empty array
    if (snapshot.empty) {
      return successResponse({
        products: [],
        total: 0,
        siteId: siteId,
        uid: uid,
        generatedAt: new Date().toISOString()
      });
    }

    // Transform products data
    const products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.originalPrice || data.price || 0,
        percentOff: data.percentOff || 0,
        discountedPrice: data.discountedPrice || data.price || 0,
        savings: data.savings || 0,
        currency: data.currency || 'USD',
        imageUrl: data.imageUrl || '',
        imageUrls: data.imageUrls || [],
        productUrl: data.productUrl || '',
        category: data.category || '',
        tags: data.tags || [],
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
      });
    });

    // Return successful response
    return successResponse({
      products: products,
      total: products.length,
      siteId: siteId,
      uid: uid,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Products API Error:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      return errorResponse(403, 'Access denied to product data');
    }
    
    if (error.code === 'not-found') {
      return errorResponse(404, 'Product site not found');
    }
    
    return errorResponse(500, 'Internal server error while fetching products');
  }
};