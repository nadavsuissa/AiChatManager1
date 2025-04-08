import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Badge, 
  Tooltip,
  alpha,
  Button,
  AppBarProps as MuiAppBarProps,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  MoreVert as MoreVertIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  ViewList as ProjectsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '@mui/material/styles';

interface HeaderProps {
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

// Modified StyledAppBar to remove drawer-related props
const StyledAppBar = styled(AppBar)(({ theme }: { theme: Theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.default, 0.9),
}));

const Header: React.FC<HeaderProps> = ({ 
  toggleTheme, 
  isDarkMode
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const navigateToProjects = () => {
    navigate('/projects');
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 2,
          minWidth: 180,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
        }
      }}
    >
      <Box sx={{ pt: 1, px: 2, pb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
          {currentUser?.displayName || currentUser?.email}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 0.5 }} />
      
      <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
        <PersonIcon sx={{ marginLeft: 1.5, color: theme.palette.primary.main, fontSize: 20 }} />
        הפרופיל שלי
      </MenuItem>
      <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
        <SettingsIcon sx={{ marginLeft: 1.5, color: theme.palette.info.main, fontSize: 20 }} />
        הגדרות
      </MenuItem>
      
      <Divider sx={{ my: 0.5 }} />
      
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <LogoutIcon sx={{ marginLeft: 1.5, color: theme.palette.error.main, fontSize: 20 }} />
        התנתק
      </MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 2,
          minWidth: 180,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
        }
      }}
    >
      {toggleTheme && (
        <MenuItem onClick={() => { handleMobileMenuClose(); toggleTheme(); }} sx={{ py: 1.5 }}>
          <IconButton size="small" aria-label="toggle theme" color="inherit">
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {isDarkMode ? 'מצב בהיר' : 'מצב כהה'}
          </Typography>
        </MenuItem>
      )}
      
      <MenuItem onClick={() => { handleMobileMenuClose(); navigateToProjects(); }} sx={{ py: 1.5 }}>
        <IconButton size="small" aria-label="projects" color="inherit">
          <ProjectsIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ mr: 1 }}>פרויקטים</Typography>
      </MenuItem>
      
      {currentUser && (
        <MenuItem sx={{ py: 1.5 }}>
          <IconButton size="small" aria-label="show new notifications" color="inherit">
            <Badge badgeContent={5} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '10px' } }}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>התראות</Typography>
        </MenuItem>
      )}
      
      {currentUser ? (
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
          <IconButton size="small" color="inherit">
            <Avatar 
              sx={{ width: 28, height: 28 }}
              src={currentUser.photoURL || undefined}
            >
              {!currentUser.photoURL && currentUser.displayName 
                ? currentUser.displayName.charAt(0).toUpperCase() 
                : <AccountCircleIcon fontSize="small" />}
            </Avatar>
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>הפרופיל</Typography>
        </MenuItem>
      ) : (
        <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/login'); }} sx={{ py: 1.5 }}>
          <IconButton size="small" color="inherit">
            <AccountCircleIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>התחברות</Typography>
        </MenuItem>
      )}
      
      <Divider sx={{ my: 0.5 }} />
      
      {currentUser && (
        <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
          <IconButton size="small" color="inherit">
            <LogoutIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>התנתקות</Typography>
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <StyledAppBar 
      position="fixed" 
      color="default" // Use default color for a more subtle look
    >
      <Toolbar sx={{ 
        direction: 'rtl', 
        minHeight: {xs: 64, sm: 70},
        px: {xs: 2, md: 3}
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon 
            sx={{ 
              color: theme.palette.primary.main, 
              fontSize: 28, 
              mr: 1.5 
            }} 
          />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              textDecoration: 'none',
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '-0.025em'
            }}
          >
            ניהול פרוייקטים חכם
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          {toggleTheme && (
            <Tooltip title={isDarkMode ? "מצב בהיר" : "מצב כהה"}>
              <IconButton
                size="large"
                aria-label="toggle theme"
                color="inherit"
                onClick={toggleTheme}
                sx={{ 
                  borderRadius: 1.5,
                  p: 1.25,
                  color: theme.palette.text.secondary 
                }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="פרויקטים">
            <IconButton
              size="large"
              aria-label="projects"
              color="inherit"
              onClick={navigateToProjects}
              sx={{ 
                borderRadius: 1.5,
                p: 1.25,
                color: theme.palette.text.secondary 
              }}
            >
              <ProjectsIcon />
            </IconButton>
          </Tooltip>
          
          {currentUser ? (
            <>
              <Tooltip title="התראות">
                <IconButton
                  size="large"
                  aria-label="show new notifications"
                  color="inherit"
                  sx={{ 
                    borderRadius: 1.5,
                    p: 1.25,
                    color: theme.palette.text.secondary 
                  }}
                >
                  <Badge 
                    badgeContent={5} 
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '10px' } }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Box 
                sx={{ 
                  height: 24, 
                  borderLeft: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  mx: 1 
                }} 
              />
              
              <Tooltip title="הפרופיל שלי">
                <IconButton
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  sx={{ 
                    borderRadius: 1.5, 
                    mr: 0
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                    src={currentUser.photoURL || undefined}
                  >
                    {!currentUser.photoURL && currentUser.displayName 
                      ? currentUser.displayName.charAt(0).toUpperCase() 
                      : <AccountCircleIcon />}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button 
              variant="contained"
              color="primary"
              component={Link}
              to="/login"
              startIcon={<AccountCircleIcon />}
              sx={{ 
                ml: 1, 
                borderRadius: 2, 
                px: 2,
                py: 1,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
                }
              }}
            >
              התחברות / הרשמה
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            aria-label="show more"
            aria-controls={mobileMenuId}
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
            sx={{ 
              color: theme.palette.text.primary,
              borderRadius: 1.5,
              p: 1
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>
      {renderMobileMenu}
      {renderMenu}
    </StyledAppBar>
  );
};

export default Header; 