import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkRrX58d03NeyEx9qYx1byQgluQkhoJTM",
  authDomain: "aichatmanager-d2999.firebaseapp.com",
  projectId: "aichatmanager-d2999",
  storageBucket: "aichatmanager-d2999.firebasestorage.app",
  messagingSenderId: "415885956285",
  appId: "1:415885956285:web:ef6e00e5a61955c76cd3d4",
  measurementId: "G-YWSN06FP9H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enhance Google sign-in experience
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData?: { firstName?: string; lastName?: string; username?: string }
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user document with additional data
  if (userCredential.user) {
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: user.displayName,
      firstName: userData?.firstName || null,
      lastName: userData?.lastName || null,
      username: userData?.username || null,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });
  }
  
  return userCredential;
};

export const signInWithEmail = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const onAuthStateChangedListener = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback);

export { auth, db };
export default app; 