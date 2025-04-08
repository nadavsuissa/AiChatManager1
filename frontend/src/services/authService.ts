import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../utils/constants';
import { User } from '../types';

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  userData?: { firstName?: string; lastName?: string; username?: string }
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore with additional data
    await createUserDocument(user, userData);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      firstName: userData?.firstName || null,
      lastName: userData?.lastName || null,
      username: userData?.username || null,
      photoURL: user.photoURL,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Sign out
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Create a user document in Firestore
export const createUserDocument = async (
  user: FirebaseUser, 
  additionalData?: { firstName?: string; lastName?: string; username?: string }
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      firstName: additionalData?.firstName || null,
      lastName: additionalData?.lastName || null,
      username: additionalData?.username || null,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });
  }
}; 