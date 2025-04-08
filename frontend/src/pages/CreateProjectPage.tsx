import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid as MuiGrid,
  CircularProgress,
  Alert,
  MenuItem,
  GridProps,
  styled,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import { 
  AddCircleOutline as AddCircleOutlineIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { createProject } from '../services/api';

// Add the styled Grid fix here
interface StyledGridProps extends GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}
const Grid = styled(MuiGrid)<StyledGridProps>({});

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: '100vh',
  paddingTop: theme.spacing(8),
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

const FormCard = styled(Paper)(({ theme }) => ({
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
  padding: theme.spacing(1.5, 6),
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 15px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
  }
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

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(4),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  display: 'inline-block',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: 3,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 3,
  }
}));

const FieldSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  position: 'relative',
  '&:last-child': {
    marginBottom: 0,
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  borderRadius: '50%',
  padding: theme.spacing(1),
  marginLeft: theme.spacing(1.5),
}));

const StepContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

// Mock data for dropdowns (replace with actual data fetching later)
const mockClients = [
  { id: '1', name: 'לקוח א' },
  { id: '2', name: 'חברת בניה ב' },
  { id: '3', name: 'יזם ג' },
];

const projectTypes = [
  'בנייה חדשה',
  'שיפוץ',
  'תשתיות',
  'אחר',
];

const CreateProjectPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [client, setClient] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const totalSteps = 3;
  
  const steps = [
    { label: 'פרטי פרויקט', icon: <EngineeringIcon color="primary" /> },
    { label: 'מיקום וסיווג', icon: <LocationIcon color="primary" /> },
    { label: 'מידע נוסף', icon: <DescriptionIcon color="primary" /> }
  ];

  const handleNext = () => {
    // Validation for each step
    if (activeStep === 0 && (!projectName || !client)) {
      setError('אנא מלא את שם הפרויקט והלקוח');
      return;
    }
    
    if (activeStep === 1 && (!address || !city || !projectType)) {
      setError('אנא מלא את פרטי המיקום וסוג הפרויקט');
      return;
    }
    
    setError(null);
    setActiveStep((prevStep) => Math.min(prevStep + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!projectName || !client || !address || !city || !projectType || !startDate) {
      setError('אנא מלא את כל שדות החובה המסומנים ב-*');
      return;
    }

    setIsSubmitting(true);

    // Prepare project data
    const projectData = {
      name: projectName,
      clientId: client, // Assuming client state holds the ID
      address,
      city,
      type: projectType,
      startDate,
      endDate: endDate || null, // Allow empty end date
      description,
      status: 'active', // Add status property
    };

    try {
      // Call API to create project
      const response = await createProject(projectData);
      
      if (response.error) {
        setError(response.error);
        console.error("Project creation failed:", response.error);
        setIsSubmitting(false);
        return;
      }
      
      // Success - Navigate to the new project page
      const createdProject = response.data;
      if (createdProject?.id) {
        navigate(`/projects/${createdProject.id}`);
      } else {
        navigate('/projects'); // Fallback to projects list if ID is missing
      }
    } catch (err) {
      setError('שגיאה ביצירת הפרויקט. אנא נסה שוב.');
      console.error("Project creation failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
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
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="overline" 
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                letterSpacing: 1.2,
                fontSize: '0.9rem',
                mb: 1,
                display: 'block'
              }}
            >
              ניהול פרויקטים
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.2rem', md: '2.8rem' },
                mb: 2,
                background: theme.palette.mode === 'dark' 
                  ? `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.7)})` 
                  : `-webkit-linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
            יצירת פרויקט חדש
          </Typography>
            <Typography
              variant="body1"
              sx={{
                color: alpha(theme.palette.text.primary, 0.7),
                fontSize: '1.1rem',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              צור פרויקט חדש ונהל את כל המסמכים, הצוות והתקשורת במקום אחד
            </Typography>
          </Box>
          
          <FormCard>
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
              alternativeLabel
              sx={{ 
                '& .MuiStepConnector-line': {
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                },
                mb: 5
              }}
            >
              {steps.map((step, index) => (
                <Step 
                  key={index}
                  completed={activeStep > index}
                  sx={{
                    '& .MuiStepLabel-iconContainer': {
                      bgcolor: activeStep >= index 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.grey[300], 0.5),
                      borderRadius: '50%',
                      width: 50,
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }
                  }}
                >
                  <StepLabel 
                    icon={activeStep > index ? <CheckIcon /> : step.icon}
                    StepIconProps={{
                      sx: {
                        fontSize: 24,
                      }
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
              {activeStep === 0 && (
                <StepContent>
                  <SectionTitle variant="h5">
                    <IconWrapper>
                      <EngineeringIcon />
                    </IconWrapper>
                    פרטי הפרויקט
                  </SectionTitle>
                  
                  <FieldSection>
                    <StyledTextField
                  required
                  fullWidth
                  id="projectName"
                  label="שם הפרויקט"
                  name="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isSubmitting}
                      InputLabelProps={{ dir: 'rtl' }}
                      placeholder="הזן את שם הפרויקט"
                      helperText="שם הפרויקט כפי שיוצג במערכת"
                      sx={{ mb: 3 }}
                />
                    
                    <StyledTextField
                  required
                  fullWidth
                      select
                  id="client"
                  label="לקוח"
                  name="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ dir: 'rtl' }}
                      helperText="בחר את הלקוח הקשור לפרויקט"
                >
                  <MenuItem value="" disabled><em>בחר לקוח...</em></MenuItem>
                  {mockClients.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                    </StyledTextField>
                  </FieldSection>
                </StepContent>
              )}
              
              {activeStep === 1 && (
                <StepContent>
                  <SectionTitle variant="h5">
                    <IconWrapper>
                      <LocationIcon />
                    </IconWrapper>
                    מיקום וסיווג
                  </SectionTitle>
                  
                  <FieldSection>
                    <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                        <StyledTextField
                  required
                  fullWidth
                  id="address"
                  label="כתובת הפרויקט"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ dir: 'rtl' }}
                          placeholder="הזן את כתובת הפרויקט"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                        <StyledTextField
                  required
                  fullWidth
                  id="city"
                  label="עיר"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ dir: 'rtl' }}
                          placeholder="שם העיר"
                />
              </Grid>
                    </Grid>
                  </FieldSection>
                  
                  <FieldSection>
                    <StyledTextField
                  required
                  fullWidth
                  select
                  id="projectType"
                  label="סוג הפרויקט"
                  name="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ dir: 'rtl' }}
                      helperText="בחר את הקטגוריה המתאימה לפרויקט"
                >
                  <MenuItem value="" disabled><em>בחר סוג...</em></MenuItem>
                  {projectTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                    </StyledTextField>
                  </FieldSection>
                </StepContent>
              )}
              
              {activeStep === 2 && (
                <StepContent>
                  <SectionTitle variant="h5">
                    <IconWrapper>
                      <DescriptionIcon />
                    </IconWrapper>
                    מידע נוסף
                  </SectionTitle>
                  
                  <FieldSection>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                  required
                  fullWidth
                  id="startDate"
                  label="תאריך התחלה"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    dir: 'rtl' 
                  }}
                  disabled={isSubmitting}
                          helperText="התאריך בו הפרויקט מתחיל"
                />
              </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                  fullWidth
                  id="endDate"
                  label="תאריך סיום (משוער)"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    dir: 'rtl' 
                  }}
                  disabled={isSubmitting}
                          helperText="תאריך סיום משוער (אופציונלי)"
                />
              </Grid>
                    </Grid>
                  </FieldSection>
                  
                  <FieldSection>
                    <StyledTextField
                  fullWidth
                  id="description"
                  label="תיאור הפרויקט"
                  name="description"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  InputLabelProps={{ dir: 'rtl' }}
                      placeholder="תאר את הפרויקט בכמה מילים..."
                      helperText="הוסף פרטים על הפרויקט, מטרות ודגשים חשובים"
                    />
                  </FieldSection>
                </StepContent>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 5,
                pt: 3,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <StepButton
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0 || isSubmitting}
                  startIcon={<ArrowForwardIcon />}
                  sx={{ 
                    visibility: activeStep === 0 ? 'hidden' : 'visible'
                  }}
                >
                  חזרה
                </StepButton>
                
                {activeStep < totalSteps - 1 ? (
                  <StepButton
                    variant="contained"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    endIcon={<ArrowBackIcon />}
                  >
                    המשך
                  </StepButton>
                ) : (
                  <SubmitButton
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {isSubmitting ? 'יוצר פרויקט...' : 'צור פרויקט'}
                  </SubmitButton>
                )}
              </Box>
            </Box>
          </FormCard>
          
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button
              variant="text"
              startIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/projects')}
              sx={{ 
                fontWeight: 600,
                color: alpha(theme.palette.text.primary, 0.7),
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent'
                }
              }}
            >
              חזרה לרשימת הפרויקטים
            </Button>
          </Box>
      </Container>
      </PageContainer>
    </MainLayout>
  );
};

export default CreateProjectPage; 