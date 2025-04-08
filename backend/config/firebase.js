const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Get service account JSON string from environment variables
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

// Check if service account JSON is provided in environment variables
if (!serviceAccountJson) {
  console.error('Firebase service account JSON not found in environment variables (FIREBASE_SERVICE_ACCOUNT).');
  console.warn('Falling back to mock implementation for development/testing.');

  // Initialize with minimal config for development (or if you have a specific mock setup)
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // You might need a databaseURL or other minimal config here depending on mockFirebase
    // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });

  // Create mock implementations for development
  mockFirebase();
} else {
  // Initialize with service account JSON from environment variable
  try {
    // Parse the JSON string from the environment variable
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add projectId if needed, though cert usually handles it
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('Firebase initialized with service account credentials from environment variable');

    // Use real Firebase services
    const db = admin.firestore();
    const storage = admin.storage();

    module.exports = { admin, db, storage };
  } catch (error) {
    console.error('Error parsing service account JSON or initializing Firebase:', error);
    console.warn('Falling back to mock implementation');

    // Initialize with minimal config
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });

    // Create mock implementations
    mockFirebase();
  }
}

// Function to create mock Firebase implementations
function mockFirebase() {
  console.log('[DEV] Using mock Firebase implementations for development');
  
  // Mock Firestore implementation
  const db = {
    collection: (name) => ({
      add: async (data) => {
        console.log(`[DEV] Would add to ${name}:`, data);
        // Return a mock document reference with an auto-generated ID
        const id = `mock-${Date.now()}`;
        return { id };
      },
      doc: (id) => {
        // Store mock data for this document
        let mockData = {};
        
        return {
          get: async () => ({
            exists: true,
            id,
            data: () => ({ id, ...mockData })
          }),
          update: async (updates) => {
            console.log(`[DEV] Would update ${name}/${id}:`, updates);
            mockData = { ...mockData, ...updates };
            return true;
          }
        };
      }
    })
  };

  // Mock storage implementation
  const storage = {
    bucket: () => ({
      upload: async (file, options) => {
        console.log('[DEV] Would upload file:', options);
        return [{ name: options.destination }];
      },
      file: (name) => ({
        getSignedUrl: async () => {
          return [`https://mock-storage.example.com/${name}`];
        }
      })
    })
  };
  
  module.exports = { admin, db, storage };
} 