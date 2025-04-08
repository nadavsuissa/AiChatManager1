import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  styled,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
  from?: {
    pathname: string;
  };
}

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4, 0),
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.08)} 100%)` 
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
}));

const CircleShape = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: alpha(theme.palette.primary.light, 0.1),
  opacity: 0.5,
  zIndex: 0,
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.07)',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  padding: theme.spacing(4, 5),
  position: 'relative',
  width: '100%',
  maxWidth: 480,
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.85) 
    : theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.12)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 1.5,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    }
  },
  '& .MuiInputLabel-root': {
    transition: 'all 0.3s ease',
  }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(1.5, 0),
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 15px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
  }
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(1.5, 0),
  fontWeight: 600,
  border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'translateY(-3px)',
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  '&::before, &::after': {
    borderColor: alpha(theme.palette.divider, 0.15),
  },
}));

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loginWithGoogle, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  // Redirect to previous page or home page after login
  const from = state?.from?.pathname || '/';
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('אנא מלא את כל השדות');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in the context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in the context
      console.error('Google login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PageContainer>
      <CircleShape 
        sx={{ 
          width: 400, 
          height: 400, 
          top: -150, 
          right: -100,
          background: alpha(theme.palette.primary.light, 0.05),
          opacity: 0.6
        }} 
      />
      <CircleShape 
        sx={{ 
          width: 300, 
          height: 300, 
          bottom: -50, 
          left: '10%',
          background: alpha(theme.palette.primary.light, 0.07),
          opacity: 0.5
        }} 
      />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <LoginCard>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                mx: 'auto',
                mb: 2,
                width: 64,
                height: 64,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <LoginIcon fontSize="large" />
            </Avatar>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1,
                background: theme.palette.mode === 'dark' 
                  ? `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.7)})` 
                  : `-webkit-linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              ברוכים הבאים
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: alpha(theme.palette.text.primary, 0.7),
                fontWeight: 400,
              }}
            >
              התחבר לחשבונך כדי להמשיך
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
              }}
            >
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleEmailLogin} noValidate>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="דואר אלקטרוני"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ dir: 'rtl' }}
              sx={{ mb: 3 }}
            />
            
            <StyledTextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="סיסמה"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ dir: 'rtl' }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ textAlign: 'end', mb: 3 }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  שכחת סיסמה?
                </Typography>
              </Link>
            </Box>
            
            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'התחברות'}
            </SubmitButton>
            
            <StyledDivider>או</StyledDivider>
            
            <GoogleButton
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              התחברות עם Google
            </GoogleButton>
          </Box>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography 
              variant="body2"
              sx={{
                color: alpha(theme.palette.text.primary, 0.7),
              }}
            >
              אין לך חשבון עדיין?{' '}
              <Link 
                to="/register" 
                style={{ 
                  textDecoration: 'none'
                }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  הרשמה
                </Typography>
              </Link>
            </Typography>
          </Box>
        </LoginCard>
        
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              fontWeight: 600,
              color: alpha(theme.palette.text.primary, 0.6),
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: 'transparent'
              }
            }}
          >
            חזרה לדף הבית
          </Button>
        </Box>
      </Container>
    </PageContainer>
  );
};

export default LoginPage; 