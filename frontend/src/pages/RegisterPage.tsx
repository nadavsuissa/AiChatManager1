import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Grid as MuiGrid,
  styled,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  BadgeOutlined as UsernameIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { checkUsernameAvailable } from '../services/api';

// Fix for the Grid component in MUI v5
interface GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number;
}

const Grid = styled(MuiGrid)<GridProps>({});

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: '100vh',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
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

const RegisterCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.07)',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  padding: theme.spacing(4, 5),
  position: 'relative',
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

const StepButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1.2, 3),
  fontWeight: 600,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[3],
  }
}));

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { label: 'פרטים אישיים', description: 'הזנת שם ופרטי המשתמש' },
    { label: 'פרטי כניסה', description: 'הגדרת פרטי ההתחברות למערכת' }
  ];
  
  const { signUp, loginWithGoogle, error, setError } = useAuth();
  const navigate = useNavigate();
  
  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(false);
      setUsernameError(username ? 'שם המשתמש חייב להיות לפחות 3 תווים' : null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await checkUsernameAvailable(username);
        if (response.error) {
          setUsernameError(response.error);
          setUsernameAvailable(false);
        } else {
          setUsernameError(null);
          setUsernameAvailable(true);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameError('שגיאה בבדיקת זמינות שם המשתמש');
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  const handleNext = () => {
    // Validation for step 1
    if (activeStep === 0) {
      if (!firstName || !lastName || !username) {
        setError('אנא מלא את כל השדות הנדרשים');
        return;
      }
      
      if (!usernameAvailable) {
        setError('אנא בחר שם משתמש זמין');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError(null);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };
  
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password || !confirmPassword || !firstName || !lastName || !username) {
      setError('אנא מלא את כל השדות');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    
    if (password.length < 6) {
      setError('הסיסמה חייבת להיות לפחות 6 תווים');
      return;
    }
    
    if (!usernameAvailable) {
      setError('אנא בחר שם משתמש זמין וחוקי');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await signUp(email, password, { firstName, lastName, username });
      navigate('/');
    } catch (error) {
      // Error is handled in the context
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    try {
      setIsSubmitting(true);
      // We'll need to redirect to a profile completion page after Google login
      await loginWithGoogle();
      // Note: additionalUserInfo might not be available directly in UserCredential
      // We'll rely on redirection logic from the backend
      navigate('/complete-profile');
    } catch (error) {
      console.error('Google sign-up failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters and underscores
    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(value);
  };

  return (
    <PageContainer>
      <CircleShape 
        sx={{ 
          width: 450, 
          height: 450, 
          top: -180, 
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
      
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
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
            <PersonAddIcon fontSize="large" />
        </Avatar>
          
          <Typography
            variant="h3"
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
            יצירת חשבון חדש
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              fontWeight: 400,
              maxWidth: 500,
              mx: 'auto'
            }}
          >
            הצטרף למערכת וקבל גישה לכל הכלים והפרויקטים
        </Typography>
        </Box>
        
        <RegisterCard>
        {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, 
                borderRadius: 2,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
              }}
            >
            {error}
          </Alert>
        )}
        
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 5,
              '& .MuiStepConnector-line': {
                borderColor: alpha(theme.palette.primary.main, 0.2)
              },
            }}
          >
            {steps.map((step, index) => (
              <Step 
                key={index}
                completed={activeStep > index}
              >
                <StepLabel 
                  StepIconProps={{
                    sx: {
                      '&.MuiStepIcon-root': {
                        color: activeStep >= index 
                          ? theme.palette.primary.main
                          : alpha(theme.palette.grey[500], 0.5),
                      }
                    }
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleEmailSignUp} noValidate>
            {activeStep === 0 ? (
              // Step 1: Personal Information
              <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                  <StyledTextField 
                    label="שם פרטי"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ dir: 'rtl' }}
                    placeholder="הזן את שמך הפרטי"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
                  <StyledTextField 
                    label="שם משפחה"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ dir: 'rtl' }}
                    placeholder="הזן את שם המשפחה שלך"
              />
            </Grid>
            <Grid item xs={12}>
                  <StyledTextField 
                    label="שם משתמש"
                value={username}
                onChange={handleUsernameChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                          <UsernameIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: isCheckingUsername ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                      ) : usernameAvailable && username ? (
                        <InputAdornment position="end">
                          <CheckIcon color="success" />
                        </InputAdornment>
                  ) : null
                }}
                    InputLabelProps={{ dir: 'rtl' }}
                error={!!usernameError}
                    helperText={usernameError || (usernameAvailable && username ? 'שם המשתמש זמין' : 'בחר שם משתמש ייחודי (אותיות, מספרים וקווים תחתונים בלבד)')}
                FormHelperTextProps={{
                  sx: { color: usernameAvailable && username ? 'success.main' : undefined }
                }}
                    placeholder="בחר שם משתמש"
              />
            </Grid>
              </Grid>
            ) : (
              // Step 2: Account Information
              <Grid container spacing={3}>
            <Grid item xs={12}>
                  <StyledTextField 
                    label="דואר אלקטרוני"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ dir: 'rtl' }}
                    placeholder="הזן את כתובת הדואר האלקטרוני שלך"
              />
            </Grid>
            <Grid item xs={12}>
                  <StyledTextField 
                    label="סיסמה"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                    InputLabelProps={{ dir: 'rtl' }}
                    helperText="סיסמה חייבת להכיל לפחות 6 תווים"
                    placeholder="בחר סיסמה חזקה"
              />
            </Grid>
            <Grid item xs={12}>
                  <StyledTextField 
                    label="אימות סיסמה"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    InputLabelProps={{ dir: 'rtl' }}
                    error={password !== confirmPassword && confirmPassword !== ''}
                    helperText={password !== confirmPassword && confirmPassword !== '' ? 'הסיסמאות אינן תואמות' : ''}
                    placeholder="הזן את הסיסמה שוב"
              />
            </Grid>
          </Grid>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 5,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              {activeStep === 0 ? (
                <Box /> // Empty box for spacing
              ) : (
                <StepButton
                  variant="outlined"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  startIcon={<ArrowForwardIcon />}
                >
                  חזרה
                </StepButton>
              )}
              
              {activeStep === 0 ? (
                <StepButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={!firstName || !lastName || !usernameAvailable}
                  endIcon={<ArrowBackIcon />}
                >
                  המשך
                </StepButton>
              ) : (
                <SubmitButton
            type="submit"
            variant="contained"
                  disabled={isSubmitting || !email || !password || !confirmPassword || password !== confirmPassword}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'הרשמה'}
                </SubmitButton>
              )}
            </Box>
          </Box>
          
          {activeStep === 0 && (
            <>
              <StyledDivider>או</StyledDivider>
              
              <GoogleButton
            onClick={handleGoogleSignUp}
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            disabled={isSubmitting}
              >
                הרשמה באמצעות Google
              </GoogleButton>
            </>
          )}
        </RegisterCard>
        
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography 
            variant="body2"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              mb: 2
            }}
          >
            כבר יש לך חשבון?{' '}
            <Link 
              to="/login" 
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
                התחבר
                </Typography>
              </Link>
            </Typography>
          
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

export default RegisterPage; 