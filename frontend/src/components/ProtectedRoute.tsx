import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // If authentication is still loading, you might want to show a loading indicator
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, redirect to login page
  if (!currentUser) {
    // Save the path they were trying to access for after login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 