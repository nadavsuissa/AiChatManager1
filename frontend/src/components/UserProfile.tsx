import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { currentUser, logout, error } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>You are not logged in.</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Log In
        </Button>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        borderRadius: 2
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={currentUser.photoURL || undefined}
          sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}
        >
          {!currentUser.photoURL && <AccountCircleIcon sx={{ fontSize: 40 }} />}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser.displayName || 'User'}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem>
          <ListItemIcon>
            <PersonIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="User ID"
            secondary={currentUser.uid}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <EmailIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Email"
            secondary={currentUser.email}
          />
        </ListItem>
      </List>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={isLoggingOut ? <CircularProgress size={20} /> : <LogoutIcon />}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </Button>
      </Box>
    </Paper>
  );
};

export default UserProfile; 