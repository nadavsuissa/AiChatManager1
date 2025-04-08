const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Get service account path from environment variables or use default path
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.join(process.cwd(), '..', 'aichatmanager-d2999-firebase-adminsdk-fbsvc-96883bb483.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  console.warn('Falling back to mock implementation for development');
  
  // Initialize with minimal config for development
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  // Create mock implementations for development
  mockFirebase();
} else {
  // Initialize with service account for production
  try {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase initialized with service account credentials');
    
    // Use real Firebase services
    const db = admin.firestore();
    const storage = admin.storage();
    
    module.exports = { admin, db, storage };
  } catch (error) {
    console.error('Error initializing Firebase with service account:', error);
    console.warn('Falling back to mock implementation');
    
    // Initialize with minimal config
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
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