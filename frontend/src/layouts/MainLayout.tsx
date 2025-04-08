import React from 'react';
import { Box, Container, CssBaseline, useTheme } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  toggleTheme, 
  isDarkMode 
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: theme.palette.background.default,
      direction: 'rtl', // Set overall direction to RTL
      width: '100%',
      overflow: 'hidden' // Prevent horizontal scrollbars
    }}>
      <CssBaseline />
      
      {/* Header */}
      <Header 
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowX: 'hidden', // Prevent horizontal scroll within main
          overflowY: 'auto',   // Allow vertical scroll
          width: '100%', // Occupy remaining space
          pt: '64px',    // Adjust for header height
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)', // Full height minus header
        }}
      >
        {/* Content Container */}
        <Box 
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100vw',
            flex: 1, // Make this box take all available space
          }}
        >
          {/* Content Container */}
          <Container 
            maxWidth="xl" 
            sx={{ 
              flex: '1 0 auto',
              py: 3,
              px: { xs: 2, sm: 3 },
              width: '100%',
              mx: 'auto', // Center content
              boxSizing: 'border-box',
            }}
          >
            {children}
          </Container>
          
          {/* Footer */}
          <Container 
            maxWidth="xl" 
            sx={{ 
              width: '100%',
              px: { xs: 2, sm: 3 },
              boxSizing: 'border-box',
              mt: 'auto', // Push footer to the bottom
            }}
          >
            <Footer />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 