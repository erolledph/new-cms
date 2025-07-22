// Test script to verify API endpoints locally
// Run with: node test-endpoints.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set environment variables)
if (!admin.apps.length) {
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

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function testContentAPI() {
  console.log('Testing Content API...');
  
  try {
    const db = admin.firestore();
    
    // Test query structure
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in database');
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userData = usersSnapshot.docs[0].data();
    
    console.log('Found user:', userId);
    console.log('Blog sites:', userData.blogSites?.length || 0);
    
    if (userData.blogSites && userData.blogSites.length > 0) {
      const blogSite = userData.blogSites[0];
      console.log('Testing with blog site:', blogSite.name, blogSite.id);
      
      // Test content collection structure
      const postsRef = db.collection('content')
        .doc(userId)
        .collection('blogs')
        .doc(blogSite.id)
        .collection('posts');
      
      const postsSnapshot = await postsRef.limit(5).get();
      console.log('Found posts:', postsSnapshot.size);
      
      postsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Post:', data.title, 'Status:', data.status);
      });
      
      // Test published posts query
      const publishedSnapshot = await postsRef
        .where('status', '==', 'published')
        .get();
      
      console.log('Published posts:', publishedSnapshot.size);
      
      // Generate test URL
      console.log(`\nTest URL: /${userId}/${blogSite.id}/api/content.json`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testProductsAPI() {
  console.log('\nTesting Products API...');
  
  try {
    const db = admin.firestore();
    
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in database');
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userData = usersSnapshot.docs[0].data();
    
    console.log('Product sites:', userData.productSites?.length || 0);
    
    if (userData.productSites && userData.productSites.length > 0) {
      const productSite = userData.productSites[0];
      console.log('Testing with product site:', productSite.name, productSite.id);
      
      // Test products collection structure
      const productsRef = db.collection('products')
        .doc(userId)
        .collection('sites')
        .doc(productSite.id)
        .collection('products');
      
      const productsSnapshot = await productsRef.limit(5).get();
      console.log('Found products:', productsSnapshot.size);
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Product:', data.name, 'Status:', data.status);
      });
      
      // Generate test URL
      console.log(`\nTest URL: /${userId}/${productSite.id}/api/products.json`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('Starting API endpoint tests...\n');
  
  await testContentAPI();
  await testProductsAPI();
  
  console.log('\nTests completed.');
  process.exit(0);
}

runTests();