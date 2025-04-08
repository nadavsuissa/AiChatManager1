import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { theme, darkTheme, cacheRtl } from './utils/theme';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectPage from './pages/ProjectPage';
import ProjectsPage from './pages/ProjectsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './utils/ScrollToTop';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize the current theme to prevent unnecessary re-renders
  const currentTheme = useMemo(
    () => mode === 'light' ? theme : darkTheme,
    [mode]
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage toggleTheme={toggleTheme} isDarkMode={mode === 'dark'} />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/create" element={<CreateProjectPage />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="/team" element={<HomePage toggleTheme={toggleTheme} isDarkMode={mode === 'dark'} />} />
                <Route path="/chat" element={<HomePage toggleTheme={toggleTheme} isDarkMode={mode === 'dark'} />} />
              </Route>
              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
