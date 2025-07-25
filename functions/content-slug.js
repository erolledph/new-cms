// Specific Content API Function - Serves a single published blog post by slug
const { getFirestore, handleCORS, successResponse, errorResponse, validateParams, getParamsFromEvent } = require('./firebase-admin');

exports.handler = async (event, context) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
      return errorResponse(405, 'Method not allowed. Use GET to fetch content.');
    }

    // Extract parameters using enhanced parameter extraction
    const params = getParamsFromEvent(event, ['uid', 'blogId', 'slug']);
    const { uid, blogId, slug } = params;
    
    // Validate required parameters
    try {
      validateParams({ uid, blogId, slug }, ['uid', 'blogId', 'slug']);
    } catch (error) {
      return errorResponse(400, error.message);
    }

    // Get Firestore instance
    const db = getFirestore();

    // Query for the specific post by slug
    const postsRef = db.collection('users')
      .doc(uid)
      .collection('blogs')
      .doc(blogId)
      .collection('posts');

    const snapshot = await postsRef
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    // If post not found, return 404
    if (snapshot.empty) {
      return errorResponse(404, `Blog post with slug "${slug}" not found or not published`);
    }

    // Get the post data
    const doc = snapshot.docs[0];
    const data = doc.data();

    // Transform post data
    const post = {
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
    };

    // Return successful response
    return successResponse({
      post: post,
      blogId: blogId,
      uid: uid,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content Slug API Error:', error);
    
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