const { admin } = require('../config/firebase');

/**
 * Firebase Authentication Middleware
 * Verifies the Firebase ID token from the request header and adds user info to req.user
 */
const authMiddleware = async (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development/testing purposes, we'll create a mock user if no auth token
    if (process.env.NODE_ENV === 'development') {
      console.warn('No auth token provided. Using mock user for development.');
      req.user = {
        uid: 'mock-user-id',
        email: 'mock@example.com',
        displayName: 'Mock User',
        role: 'admin'
      };
      return next();
    }
    
    return res.status(401).json({
      error: 'Unauthorized: No authentication token provided'
    });
  }
  
  // Extract the token
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add the user information to the request
    req.user = decodedToken;
    
    // Get additional user data from Firestore if needed
    try {
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        // Merge Firestore user data with auth data
        req.user = { ...req.user, ...userDoc.data() };
      }
    } catch (error) {
      console.warn('Error getting additional user data:', error);
      // Continue anyway with just the auth data
    }
    
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // For development/testing purposes, fall back to mock user if token verification fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Auth token verification failed. Using mock user for development.');
      req.user = {
        uid: 'mock-user-id',
        email: 'mock@example.com',
        displayName: 'Mock User',
        role: 'admin'
      };
      return next();
    }
    
    return res.status(401).json({
      error: 'Unauthorized: Invalid authentication token'
    });
  }
};

module.exports = authMiddleware; 