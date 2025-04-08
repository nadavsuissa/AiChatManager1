const { db, admin } = require('../config/firebase');

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User info comes from auth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { uid, email, displayName, photoURL } = req.user;
    
    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      // Return user data from Firestore
      const userData = userDoc.data();
      res.status(200).json({
        uid,
        email,
        displayName: displayName || userData.displayName,
        photoURL: photoURL || userData.photoURL,
        ...userData
      });
    } else {
      // Create new user record
      const newUser = {
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        createdAt: new Date()
      };
      
      await db.collection('users').doc(uid).set(newUser);
      
      res.status(200).json({
        uid,
        ...newUser
      });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

/**
 * Lookup a user by email
 */
exports.findUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // First check if user exists in Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Check if user exists in Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (userDoc.exists) {
        // Return user data from Firestore
        const userData = userDoc.data();
        res.status(200).json({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userData.displayName,
          photoURL: userRecord.photoURL || userData.photoURL,
          ...userData
        });
      } else {
        // Return basic user data from Auth without creating Firestore record
        res.status(200).json({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || email.split('@')[0],
          photoURL: userRecord.photoURL || null
        });
      }
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw firebaseError;
    }
  } catch (error) {
    console.error('Error finding user by email:', error);
    res.status(500).json({ error: 'Failed to lookup user' });
  }
};

/**
 * Get all users (basic info)
 * This endpoint should be restricted to admins in production
 */
exports.getAllUsers = async (req, res) => {
  try {
    // For simplicity, we'll just return the first 100 users
    // In a real app, you'd add pagination
    const usersSnapshot = await db.collection('users').limit(100).get();
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      });
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

/**
 * Validate a user email
 * Internal utility function for other controllers
 */
exports.validateUserEmail = async (email) => {
  try {
    // Check if user exists in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Get or create user document in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      // Create basic user record in Firestore if it doesn't exist
      await userDocRef.set({
        email: userRecord.email,
        displayName: userRecord.displayName || email.split('@')[0],
        photoURL: userRecord.photoURL || null,
        createdAt: new Date()
      });
    }
    
    // Return user data
    return {
      userId: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || email.split('@')[0],
      photoURL: userRecord.photoURL || null
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('User not found');
    }
    throw error;
  }
}; 