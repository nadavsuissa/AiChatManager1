import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, UserCredential } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  logoutUser,
  onAuthStateChangedListener
} from '../config/firebase';
import { User } from '../types';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string; username?: string }) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user: FirebaseUser | null) => {
      if (user) {
        // We're using a separate hook (useAuth in hooks folder) to populate additional user data
        // This just handles the auth state change
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          firstName: null, // Will be populated by useAuth hook
          lastName: null,  // Will be populated by useAuth hook
          username: null,  // Will be populated by useAuth hook
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Clean up subscription on unmount
    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (
    email: string, 
    password: string, 
    userData?: { firstName?: string; lastName?: string; username?: string }
  ) => {
    setError(null);
    try {
      return await signUpWithEmail(email, password, userData);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Log in with email and password
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      return await signInWithEmail(email, password);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Log in with Google
  const loginWithGoogle = async () => {
    setError(null);
    try {
      return await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Log out
  const logout = async () => {
    setError(null);
    try {
      await logoutUser();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    login,
    loginWithGoogle,
    logout,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 