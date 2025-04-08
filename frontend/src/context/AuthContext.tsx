import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, AuthContextType } from '../types';
import { signIn, signUp, signOut, signInWithGoogle } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { currentUser, loading, error } = useAuth();

  const login = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const register = async (email: string, password: string) => {
    return signUp(email, password);
  };

  const logout = async () => {
    await signOut();
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const value: AuthContextType = {
    user: currentUser,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 