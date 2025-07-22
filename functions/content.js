// Content API Function - Serves all published blog posts for a blog site
const { getFirestore, handleCORS, successResponse, errorResponse, validateParams } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
      return errorResponse(405, 'Method not allowed. Use GET to fetch content.');
    }

    // Extract parameters from query string or path
    const { uid, blogId } = event.queryStringParameters || {};
    
    // Log parameters for debugging
    console.log('Content API - Query parameters:', event.queryStringParameters);
    console.log('Content API - Path:', event.path);
    console.log('Content API - Headers:', event.headers);
    
    // Validate required parameters
    try {
      validateParams({ uid, blogId }, ['uid', 'blogId']);
    } catch (error) {
      console.error('Content API - Parameter validation failed:', error.message);
      return errorResponse(400, error.message);
    }

    // Get Firestore instance
    const db = getFirestore();

    // Query published blog posts
    const postsRef = db.collection('content')
      .doc(uid)
      .collection('blogs')
      .doc(blogId)
      .collection('posts');

    const snapshot = await postsRef
      .where('status', '==', 'published')
      .orderBy('publishDate', 'desc')
      .get();

    // If no posts found, return empty array
    if (snapshot.empty) {
      return successResponse({
        posts: [],
        total: 0,
        blogId: blogId,
        uid: uid,
        generatedAt: new Date().toISOString()
      });
    }

    // Transform posts data
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        featuredImageUrl: data.featuredImageUrl || '',
        metaDescription: data.metaDescription || '',
        seoTitle: data.seoTitle || data.title,
        keywords: data.keywords || [],
        author: data.author || '',
        categories: data.categories || [],
        tags: data.tags || [],
        contentUrl: data.contentUrl || '',
        publishDate: data.publishDate ? data.publishDate.toDate().toISOString() : null,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
      });
    });

    // Return successful response
    return successResponse({
      posts: posts,
      total: posts.length,
      blogId: blogId,
      uid: uid,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content API Error:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      return errorResponse(403, 'Access denied to blog content');
    }
    
    if (error.code === 'not-found') {
      return errorResponse(404, 'Blog site not found');
    }
    
    return errorResponse(500, 'Internal server error while fetching content');
  }
};