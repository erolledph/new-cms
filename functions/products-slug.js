// Specific Product API Function - Serves a single published product by slug
const { getFirestore, handleCORS, successResponse, errorResponse, validateParams, getParamsFromEvent } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
      return errorResponse(405, 'Method not allowed. Use GET to fetch product.');
    }

    // Extract parameters using enhanced parameter extraction
    const params = getParamsFromEvent(event, ['uid', 'siteId', 'slug']);
    const { uid, siteId, slug } = params;
    
    // Validate required parameters
    try {
      validateParams({ uid, siteId, slug }, ['uid', 'siteId', 'slug']);
    } catch (error) {
      return errorResponse(400, error.message);
    }

    // Get Firestore instance
    const db = getFirestore();

    // Query for the specific product by slug
    const productsRef = db.collection('users')
      .doc(uid)
      .collection('productSites')
      .doc(siteId)
      .collection('products');

    const snapshot = await productsRef
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    // If product not found, return 404
    if (snapshot.empty) {
      return errorResponse(404, `Product with slug "${slug}" not found or not published`);
    }

    // Get the product data
    const doc = snapshot.docs[0];
    const data = doc.data();

    // Transform product data
    const product = {
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
    };

    // Return successful response
    return successResponse({
      product: product,
      siteId: siteId,
      uid: uid,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Product Slug API Error:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      return errorResponse(403, 'Access denied to product data');
    }
    
    if (error.code === 'not-found') {
      return errorResponse(404, 'Product site not found');
    }
    
    return errorResponse(500, 'Internal server error while fetching product');
  }
};