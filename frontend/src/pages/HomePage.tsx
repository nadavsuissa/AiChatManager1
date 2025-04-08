import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid as MuiGrid,
  Typography,
  useTheme,
  alpha,
  Paper,
  Avatar,
  Stack,
  IconButton,
  Slide,
  SvgIcon,
  SvgIconProps
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { GridProps } from '@mui/material/Grid';
import MainLayout from '../layouts/MainLayout';
import {
  AutoAwesome as AiIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircleOutline as CheckIcon,
  Speed as SpeedIcon,
  Bolt as BoltIcon,
  Security as SecurityIcon,
  SmartToy as BotIcon,
  Code as CodeIcon,
  CloudUpload as CloudUploadIcon,
  Insights as InsightsIcon,
  Dashboard as DashboardIcon,
  Layers as LayersIcon,
  Timer as TimerIcon,
  Groups as TeamsIcon,
  QuestionAnswer as QAIcon,
  Badge as BadgeIcon,
  LightbulbOutlined as IdeaIcon,
  MailOutline as MailIcon,
  Folder as FolderIcon,
  People as PeopleIcon,
  UploadFile as UploadFileIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';

// Add these keyframe animations
const TimelineProgress = keyframes`
  0% { height: 0; }
  100% { height: 70%; }
`;

const pulse = keyframes`
  0% { transform: translateY(-50%) scale(1); opacity: 1; }
  50% { transform: translateY(-50%) scale(1.3); opacity: 0.7; }
  100% { transform: translateY(-50%) scale(1); opacity: 1; }
`;

// Type definitions
interface HomePageProps {
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

// Create a properly typed Grid component that works with all Grid props
interface StyledGridProps extends GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean | "auto" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  sm?: number | boolean | "auto" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  md?: number | boolean | "auto" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  lg?: number | boolean | "auto" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  xl?: number | boolean | "auto" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  spacing?: number | string;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
}

const Grid = styled(MuiGrid)<StyledGridProps>(({ theme }) => ({}));

// ========== Styled Components ==========

const GradientBackground = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(120deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
    : `linear-gradient(120deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  zIndex: -1,
}));

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  paddingTop: theme.spacing(14),
  paddingBottom: theme.spacing(12),
  textAlign: 'right',
  direction: 'rtl',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(140deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)` 
    : `linear-gradient(140deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
}));

const HighlightedText = styled('span')(({ theme }) => ({
  color: theme.palette.primary.main,
  position: 'relative',
  fontWeight: 800,
  paddingBottom: '4px',
  borderBottom: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  display: 'inline-block',
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.07)',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 50px rgba(0, 0, 0, 0.12)',
  }
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2.5,
  boxShadow: theme.shadows[2],
  border: 'none',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.5) 
    : alpha(theme.palette.background.default, 0.6),
  textAlign: 'center',
  '&:hover': {
    transform: 'scale(1.02) translateY(-3px)',
    boxShadow: theme.shadows[5],
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.7) 
      : theme.palette.background.paper,
    '& .featureIconWrapper': {
      transform: 'scale(1.05)',
    }
  }
}));

const ColoredAvatarWrapper = styled(Box)(({ theme, bgcolor }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px auto',
  background: bgcolor ? `linear-gradient(135deg, ${alpha(bgcolor as string, 0.1)} 0%, ${alpha(bgcolor as string, 0.25)} 100%)` : theme.palette.action.hover,
  boxShadow: 'none',
  transition: 'transform 0.3s ease',
}));

const ColoredAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  boxShadow: 'none',
  margin: 0,
  transition: 'none',
  background: 'transparent',
}));

const StatsWrapper = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.6)})`
    : `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.9)}, ${alpha(theme.palette.primary.main, 0.8)})`,
  padding: theme.spacing(10, 0),
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
   '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 50%, ${alpha('#fff', 0.1)}, transparent 60%)`,
    zIndex: 0,
  }
}));

const CircleShape = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: alpha(theme.palette.primary.light, 0.2),
  opacity: 0.4,
  zIndex: 0,
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.2 : 0.8),
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.08)}`,
  padding: theme.spacing(2.5),
  overflow: 'hidden',
}));

const Dot = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  display: 'inline-block',
  marginLeft: theme.spacing(1),
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  position: 'relative',
  textAlign: 'center',
}));

const TestimonialCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.06)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  height: '100%',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

// New Keyframes for subtle bobbing animation
const bobbing = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

// IBM Logo Icon (improved)
const IBMIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 32 32" {...props}>
    <path d="M2 21.5h28v1.5H2zM2 18h28v1.5H2zM13 6h6v9h-6zM6 6h5v1.5H6zM6 9h5v1.5H6zM6 12h5v1.5H6zM6 15h5v1.5H6zM21 6h5v1.5h-5zM21 9h5v1.5h-5zM21 12h5v1.5h-5zM21 15h5v1.5h-5zM2 24.5h28v1.5H2zM2 27h4.5v1.5H2zM7.5 27h4.5v1.5H7.5zM13 27h6v1.5h-6zM20 27h4.5v1.5H20zM25.5 27H30v1.5h-4.5z" />
  </SvgIcon>
);

// Microsoft Logo Icon (improved)
const MicrosoftIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M11.4 2H2v9.4h9.4V2zm10.2 0h-9.4v9.4h9.4V2zM11.4 12.2H2v9.4h9.4v-9.4zm10.2 0h-9.4v9.4h9.4v-9.4z" />
  </SvgIcon>
);

// Amazon Logo Icon (improved)
const AmazonIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M14.23 12.43c-1.87 1.38-4.58 2.12-6.92 2.12-3.27 0-6.21-1.2-8.44-3.21-.18-.16-.02-.38.19-.26a15.45 15.45 0 0 0 7.76 2.06c1.9 0 4-.39 5.93-1.2.29-.12.53.19.24.34"></path>
    <path d="M14.86 11.63c-.24-.3-1.56-.14-2.15-.07-.18.02-.21-.14-.05-.25 1.05-.74 2.78-.53 2.98-.28.2.25-.05 1.97-1.03 2.79-.15.12-.34.06-.23-.11.22-.55.7-1.77.48-2.08"></path>
    <path d="M13.43 9.9c-.47-.63-1.08-1.14-1.81-1.54a5.97 5.97 0 0 0-2.24-.73 7.98 7.98 0 0 0-2.32.08c-.76.14-1.46.41-2.11.8-.33.19-.62.44-.86.72-.12.14-.23.29-.31.45-.1.16-.13.21-.25.41-.12.2-.18.47-.18.71 0 .12.01.23.04.35.07.29.22.55.42.77.41.45.95.75 1.54.89.64.15 1.31.13 1.94-.07.63-.2 1.21-.53 1.71-.97.5-.43.84-.98 1.08-1.58.24-.59.34-1.24.28-1.88-.06-.57-.22-1.14-.47-1.65-.51-1-1.27-1.85-2.22-2.47a7.3 7.3 0 0 0-2.86-1c-1.05-.17-2.14-.13-3.17.12-.05.01-.09-.04-.07-.09.82-2.66 3.26-4.58 6.09-4.73 3.2-.18 6.16 1.75 7.3 4.66.18.47.3.96.36 1.46.06.5.06 1-.04 1.5-.19 1.02-.66 1.96-1.37 2.71-.32.34-.69.65-1.08.91.03.01.06.02.07.03.75.41 1.42.92 2.02 1.5.13.12.22.07.17-.07-.27-.84-.3-1.5-.06-2.14.25-.63.69-1.17 1.23-1.56.54-.39 1.18-.64 1.84-.71.33-.04.67-.03 1 .02.33.06.66.15.97.29.63.28 1.15.72 1.55 1.25.2.27.37.56.48.88.06.16.1.32.12.48 0 .02-.01.04-.03.05l-.25.15c-.21.12-.43.22-.66.31-.45.18-.92.33-1.4.45-.48.12-.97.21-1.46.28-.98.14-1.98.19-2.97.15-.99-.04-1.98-.18-2.94-.43-.49-.12-.96-.27-1.43-.45-.47-.18-.94-.39-1.38-.62-.09-.05-.09-.18 0-.22.17-.08.33-.16.47-.26.14-.1.26-.22.35-.36.17-.3.18-.71-.09-.91-.14-.1-.3-.16-.46-.19-.16-.03-.33-.04-.5-.03-1.67.13-3.17.99-4.19 2.34.76.78 1.68 1.38 2.7 1.77 1.01.39 2.09.57 3.17.51 1.08-.05 2.15-.32 3.11-.8.97-.47 1.84-1.14 2.49-1.95.64.82 1.58 1.37 2.62 1.57 1.04.2 2.15.07 3.13-.36.01 0 .02 0 .03-.02a6.5 6.5 0 0 0 2.31-1.86c.03-.03.08-.01.08.03a7.5 7.5 0 0 1-2.68 5.94 7.52 7.52 0 0 1-5.97 1.97 7.49 7.49 0 0 1-5.38-3.56c-1.13.61-2.38.94-3.66.97-1.27.03-2.54-.24-3.66-.77-1.12-.54-2.1-1.33-2.8-2.29-.7-.96-1.13-2.08-1.23-3.23-.1-1.15.12-2.32.65-3.37.53-1.05 1.33-1.96 2.32-2.61s2.15-1.06 3.36-1.11c1.21-.05 2.42.24 3.5.84 1.08.59 2 1.48 2.62 2.58.31.55.54 1.15.69 1.76.15.61.22 1.24.22 1.87 0 .19.2.31.34.21a4.95 4.95 0 0 1 2.77-1.35 5 5 0 0 1 2.38.2c.19.06.28-.19.13-.34"></path>
  </SvgIcon>
);

// Google Logo Icon (improved)
const GoogleIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
  </SvgIcon>
);

// Oracle Logo Icon (improved)
const OracleIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M4.5 10.5c0-2.485 2.015-4.5 4.5-4.5h6c2.485 0 4.5 2.015 4.5 4.5v3c0 2.485-2.015 4.5-4.5 4.5H9c-2.485 0-4.5-2.015-4.5-4.5v-3zm4.5-1.5c-.828 0-1.5.672-1.5 1.5v3c0 .828.672 1.5 1.5 1.5h6c.828 0 1.5-.672 1.5-1.5v-3c0-.828-.672-1.5-1.5-1.5H9z" />
  </SvgIcon>
);

// Facebook Logo Icon (new)
const FacebookIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
  </SvgIcon>
);

// Apple Logo Icon (new)
const AppleIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M17.05 12.87c-.03-2.82 2.31-4.18 2.42-4.25-1.32-1.92-3.37-2.19-4.1-2.22-1.74-.18-3.4 1.03-4.29 1.03-.89 0-2.26-1.01-3.71-.98-1.9.03-3.65 1.11-4.63 2.81-1.98 3.43-.51 8.5 1.42 11.28.94 1.36 2.06 2.88 3.54 2.83 1.42-.05 1.96-.92 3.68-.92 1.71 0 2.19.92 3.69.89 1.53-.03 2.49-1.39 3.42-2.76.99-1.35 1.51-2.79 1.51-2.85-.03-.01-2.9-1.11-2.93-4.4zM14.72 6.79c.74-.91 1.26-2.19 1.12-3.44-1.08.04-2.39.72-3.16 1.64-.69.81-1.3 2.1-1.13 3.34 1.2.09 2.43-.62 3.17-1.54z" />
  </SvgIcon>
);

// Add these styled components after the existing styled components
const TimelineContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: '40px 0',
  padding: '20px 0',
  width: '100%',
  direction: 'rtl', // Ensure RTL layout for timeline
  '&::after': {
    content: '""',
    position: 'absolute',
    width: 4,
    backgroundColor: alpha(theme.palette.primary.main, 0.15), // Lighter color for the inactive line
    top: 0,
    bottom: 0,
    right: '50%',
    marginRight: -2,
    borderRadius: 4,
    zIndex: 1,
  },
  // Add a progress line that fills up
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 4,
    backgroundColor: theme.palette.primary.main, // Solid color for the progress line
    top: 0,
    height: 0, // Start with height 0
    right: '50%',
    marginRight: -2,
    borderRadius: 4,
    zIndex: 1,
    animation: `${TimelineProgress} 1.5s ease-out forwards`,
    animationDelay: '0.5s', // Start after the timeline appears
  },
  [theme.breakpoints.down('md')]: {
    '&::after': {
      right: 20, // Move the line to the right side on mobile
      marginRight: 0,
    },
    '&::before': {
      right: 20, // Move the progress line as well
      marginRight: 0,
    }
  }
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  position: 'relative',
  margin: theme.spacing(6, 0),
  '&:first-of-type': {
    marginTop: 0,
  },
  '&:last-of-type': {
    marginBottom: 0,
  },
  [theme.breakpoints.down('md')]: {
    margin: theme.spacing(4, 0), // Less spacing on mobile
  }
}));

const TimelineContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '45%',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.05)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.07)}`,
  textAlign: 'right',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 15px 30px ${alpha(theme.palette.common.black, 0.1)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    left: -20,
    borderWidth: 10,
    borderStyle: 'solid',
    borderColor: `transparent transparent transparent ${theme.palette.background.paper}`,
  },
  [theme.breakpoints.down('md')]: {
    width: 'calc(100% - 50px)', // Take full width minus space for timeline
    marginRight: 50, // Space for the timeline on the right
    '&::before': {
      display: 'none', // Hide the arrow on mobile
    }
  }
}));

const TimelineContentLeft = styled(TimelineContent)(({ theme }) => ({
  marginLeft: 'auto',
  marginRight: 0,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    right: -20,
    left: 'auto',
    borderWidth: 10,
    borderStyle: 'solid',
    borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    marginRight: 50, // Same right margin on mobile
    width: 'calc(100% - 50px)', // Same width on mobile
    '&::before': {
      display: 'none', // Hide the arrow on mobile
    }
  }
}));

const TimelineNumber = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'completed'
})<{ bgcolor?: string; completed?: boolean }>(({ theme, bgcolor, completed }) => ({
  position: 'absolute',
  top: '50%',
  right: '50%',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: completed ? theme.palette.success.main : (bgcolor as string) || theme.palette.primary.main,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 3px 10px ${alpha(completed ? theme.palette.success.main : theme.palette.primary.main, 0.4)}`,
  transform: 'translate(50%, -50%)',
  zIndex: 2,
  fontWeight: 700,
  fontSize: '1.5rem',
  border: `3px solid ${theme.palette.background.default}`,
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('md')]: {
    right: 20, // Position on the right side of the screen
    transform: 'translateY(-50%)', // Only translate vertically
    width: 50,
    height: 50,
    fontSize: '1.2rem',
  }
}));

// Add a custom styled component for the content indicator
const CompletedIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  right: '100%',
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  transform: 'translateY(-50%)',
  zIndex: 0,
  boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0.4)}`,
  animation: `${pulse} 2s infinite`,
  display: 'block',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  }
}));

// Replace the TimelineLine component which isn't being used
const TimelineIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  padding: theme.spacing(1),
  background: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '50%',
  marginLeft: theme.spacing(2),
}));

const TestimonialSliderControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(5),
  gap: theme.spacing(2),
}));

const SliderButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 48,
  height: 48,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.2),
    transform: 'translateY(-3px)',
  }
}));

// Add these styled components after the TestimonialCard component
const TestimonialContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 3),
  paddingTop: theme.spacing(5.5), // Extra padding on top for the quote mark
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.7) 
    : theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    right: 30,
    width: 20,
    height: 20,
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.7) 
      : theme.palette.background.paper,
    transform: 'rotate(45deg)',
    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.04)',
    zIndex: -1,
  }
}));

const TestimonialQuote = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  lineHeight: 1.75,
  fontWeight: 400,
  color: alpha(theme.palette.text.primary, 0.87),
  position: 'relative',
}));

const QuoteIcon = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 20,
  right: 30,
  color: alpha(theme.palette.primary.main, 0.15),
  fontSize: '3rem',
  fontFamily: 'Georgia, serif',
  fontWeight: 700,
  lineHeight: 1,
  height: 'auto',
  width: 'auto',
}));

const TestimonialAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(1.5),
}));

const HomePage: React.FC<HomePageProps> = ({ toggleTheme, isDarkMode }) => {
  const theme = useTheme();

  // Features data
  const features = [
    {
      icon: <AiIcon />,
      title: "עוזר AI אישי",
      description: "קבל תשובות מיידיות ותובנות חכמות לכל שאלה על הפרויקט שלך.",
      color: theme.palette.primary.main
    },
    {
      icon: <CloudUploadIcon />,
      title: "העלאת מסמכים",
      description: "העלאה קלה ומהירה של מסמכים, תוכניות וקבצים לכל פרויקט.",
      color: "#8e24aa"
    },
    {
      icon: <TeamsIcon />,
      title: "ניהול צוותים",
      description: "נהל את כל אנשי הצוות, ההרשאות והתפקידים במקום אחד.",
      color: "#00acc1"
    },
    {
      icon: <QAIcon />,
      title: "שאלות ותשובות",
      description: "שאל שאלות בשפה טבעית וקבל תשובות מדויקות מבוססות תוכן.",
      color: "#43a047"
    },
    {
      icon: <InsightsIcon />,
      title: "ניתוח נתונים",
      description: "קבל תובנות עסקיות וניתוחים מתקדמים על הפרויקטים שלך.",
      color: "#ff9800"
    },
    {
      icon: <SecurityIcon />,
      title: "אבטחה מתקדמת",
      description: "הגנה מקיפה על כל המידע והנתונים שלך עם הצפנה מתקדמת.",
      color: "#e53935"
    }
  ];

  // Statistics data
  const stats = [
    { value: "93%", label: "שיפור בניהול הפרויקטים", icon: <SpeedIcon /> },
    { value: "75%", label: "פחות זמן בחיפוש מסמכים", icon: <TimerIcon /> },
    { value: "87%", label: "עלייה בשיתוף פעולה בצוות", icon: <TeamsIcon /> },
    { value: "50%", label: "הפחתה בטעויות ובעיות", icon: <BoltIcon /> }
  ];

  // Steps data
  const steps = [
    {
      number: "01",
      title: "הגדר פרויקט חדש",
      description: "צור פרויקט חדש והגדר את המאפיינים הבסיסיים שלו בקלות."
    },
    {
      number: "02",
      title: "הוסף את הצוות שלך",
      description: "הזמן את חברי הצוות והגדר את ההרשאות המתאימות לכל אחד."
    },
    {
      number: "03",
      title: "העלה מסמכים ונתונים",
      description: "העלה את כל המסמכים, התכניות והקבצים הקשורים לפרויקט."
    },
    {
      number: "04",
      title: "שאל את ה-AI שלך",
      description: "התחל לשאול שאלות וקבל תשובות מיידיות מהעוזר החכם שלך."
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "המערכת חסכה לנו שעות רבות של עבודה וחיפוש מידע. הפרויקטים שלנו מתנהלים הרבה יותר יעיל.",
      author: "יעל כהן",
      position: "מנהלת פרויקטים, חברת בנייה בע\"מ",
      avatarUrl: "/assets/avatars/testimonial1.jpg"
    },
    {
      quote: "העוזר ה-AI נותן תשובות מדויקות ומהירות לכל השאלות שלנו. זה כמו לשכור עובד נוסף שעובד 24/7.",
      author: "אבי לוי",
      position: "מנכ\"ל, לוי הנדסה",
      avatarUrl: "/assets/avatars/testimonial2.jpg"
    },
    {
      quote: "הממשק אינטואטיבי ונוח לשימוש. ההטמעה הייתה מהירה והצוות שלנו התחיל להשתמש במערכת מיד.",
      author: "דנה ישראלי",
      position: "מנהלת טכנולוגיות, טכנולוגיות מתקדמות בע\"מ",
      avatarUrl: "/assets/avatars/testimonial3.jpg"
    }
  ];

  return (
    <MainLayout toggleTheme={toggleTheme} isDarkMode={isDarkMode}>
      {/* Hero Section */}
      <HeroSection>
        <GradientBackground />
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Dot />
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      letterSpacing: 1.2,
                      fontSize: '0.9rem'
                    }}
                  >
                    פלטפורמה מתקדמת לניהול פרויקטים
                  </Typography>
                </Box>
                
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
                    fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.2rem' },
                    lineHeight: 1.25,
              mb: 3,
                    color: theme.palette.text.primary,
                    letterSpacing: '-1px'
                  }}
                >
                  נהל פרויקטים בעזרת{' '}
                  <HighlightedText>AI חכם</HighlightedText>
          </Typography>
                
          <Typography
                  variant="h6" 
            sx={{
              fontWeight: 400,
                    color: alpha(theme.palette.text.primary, 0.7),
                    mb: 4,
                    maxWidth: 600,
                    lineHeight: 1.75
            }}
          >
                  שדרג את ניהול הפרויקטים שלך עם עוזר AI חכם שמכיר את כל הפרטים.
                  העלה מסמכים, נהל צוות, וקבל תשובות מיידיות - הכל במקום אחד.
          </Typography>
                
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
                  sx={{ mb: 5 }}
          >
            <Button
              variant="contained"
              size="large"
                    endIcon={<ArrowBackIcon />}
              sx={{
                      borderRadius: 2,
                py: 1.5,
                      px: 3,
                fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: `0 6px 15px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                      },
                      transition: 'all 0.2s ease-out'
              }}
            >
                    התחל בחינם
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                      borderRadius: 2,
                py: 1.5,
                      px: 3,
                fontWeight: 600,
                      fontSize: '1rem',
                      borderWidth: 1.5,
                      borderColor: theme.palette.primary.main,
                 '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    תיאום הדגמה
                  </Button>
                </Stack>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex' }}>
                    {[1, 2, 3].map((i) => (
                      <Avatar
                        key={i}
                        src={`/assets/avatars/user${i}.jpg`}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: `2px solid ${theme.palette.background.paper}`,
                          ml: -1.5
                        }}
                      />
                    ))}
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <BoltIcon 
                          key={star} 
                          fontSize="small" 
                          sx={{ color: '#FFD700' }} 
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                      למעלה מ-2,000 לקוחות מרוצים
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                <Paper 
                  elevation={2}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.85),
                    boxShadow: theme.shadows[2],
                    transform: 'translateY(0px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                      background: alpha(theme.palette.background.paper, 0.95),
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.15),
                      color: theme.palette.info.main,
                      mr: 1.5
                    }}
                  >
                    <DashboardIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                      AI Project Management Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      נתונים ותובנות בזמן אמת
                    </Typography>
                  </Box>
                </Paper>
                
                <Paper
                  elevation={2}
                    sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.85),
                    boxShadow: theme.shadows[2],
                    transform: 'translateY(0px)',
                    transition: 'all 0.3s ease 0.1s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                      background: alpha(theme.palette.background.paper, 0.95),
                    }
                  }}
                >
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.main,
                      mr: 1.5
                        }}
                      >
                        <CheckIcon />
                      </Avatar>
                      <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                          פרויקט הושלם
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          לפני 2 דקות
                        </Typography>
                      </Box>
                </Paper>
                
                <Paper
                  elevation={2}
                    sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.85),
                    boxShadow: theme.shadows[2],
                    transform: 'translateY(0px)',
                    transition: 'all 0.3s ease 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                      background: alpha(theme.palette.background.paper, 0.95),
                    }
                  }}
                >
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.main,
                      mr: 1.5
                        }}
                      >
                        <BotIcon />
                      </Avatar>
                      <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                          עוזר AI פעיל
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          מוכן לשאלות
                        </Typography>
                      </Box>
                </Paper>
                    </Stack>
            </Grid>
          </Grid>
          
          {/* Trusted by logos */}
          <Box sx={{ mt: 6, pt: 6, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography 
              variant="subtitle2" 
              align="center" 
              gutterBottom
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 500,
                mb: 3 
              }}
            >
              בשימוש על ידי חברות מובילות
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: { xs: 4, md: 5 },
                opacity: 0.85,
                transition: 'all 0.3s ease',
              }}
            >
              <GoogleIcon 
                  sx={{ 
                  fontSize: 42,
                  color: '#4285F4',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(66, 133, 244, 0.3))'
                    }
                  }}
                />
              <MicrosoftIcon 
                sx={{ 
                  fontSize: 42,
                  color: '#00A4EF',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 164, 239, 0.3))'
                  }
                }}
              />
              <AmazonIcon 
                sx={{ 
                  fontSize: 42,
                  color: '#FF9900',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(255, 153, 0, 0.3))'
                  }
                }}
              />
              <IBMIcon 
                sx={{ 
                  fontSize: 42,
                  color: '#1F70C1',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(31, 112, 193, 0.3))'
                  }
                }}
              />
              <AppleIcon
                sx={{ 
                  fontSize: 42,
                  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.3))'
                  }
                }}
              />
              <FacebookIcon
                sx={{ 
                  fontSize: 42,
                  color: '#1877F2',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0px 2px 4px rgba(24, 119, 242, 0.3))'
                  }
                }}
              />
            </Box>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: theme.palette.background.paper,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <CircleShape 
          sx={{ 
            width: 200, 
            height: 200, 
            bottom: -50, 
            left: -50,
          }} 
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <SectionTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Divider sx={{ width: 60, mr: 2, borderColor: alpha(theme.palette.primary.main, 0.3) }} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  letterSpacing: 1
                }}
              >
                יכולות מתקדמות
              </Typography>
              <Divider sx={{ width: 60, ml: 2, borderColor: alpha(theme.palette.primary.main, 0.3) }} />
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              כל מה שאתה צריך לניהול פרויקטים חכם
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                color: alpha(theme.palette.text.primary, 0.7),
                fontWeight: 400
              }}
            >
              פלטפורמה מתקדמת עם כל הכלים הנדרשים לניהול יעיל של הפרויקטים שלך
            </Typography>
          </SectionTitle>

          {/* Explicitly forced 3x2 grid layout */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',               /* 1 column on mobile */
              sm: 'repeat(2, 1fr)',    /* 2 columns on tablets */
              md: 'repeat(3, 1fr)'     /* 3 columns on desktop and up */
            },
            gap: 3,
            mt: 4
          }}>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <ColoredAvatarWrapper
                    className="featureIconWrapper"
                    bgcolor={feature.color}
                  >
                    <ColoredAvatar sx={{ color: feature.color }}>
                      {React.cloneElement(feature.icon, { 
                        sx: { fontSize: 32 } 
                      })}
                    </ColoredAvatar>
                  </ColoredAvatarWrapper>
                    <Typography
                    variant="h6"
                      gutterBottom
                    sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, flexGrow: 1 }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                    variant="contained"
                      endIcon={<ArrowBackIcon />}
                    size="small"
                      sx={{
                      color: '#fff',
                      bgcolor: feature.color,
                      borderRadius: 1.5,
                        mt: 'auto',
                      alignSelf: 'center',
                      fontWeight: 500,
                      px: 2,
                      py: 0.5,
                      fontSize: '0.8rem',
                        '&:hover': {
                        bgcolor: alpha(feature.color, 0.85),
                        boxShadow: `0 3px 8px ${alpha(feature.color, 0.25)}`
                        }
                      }}
                    >
                      למד עוד
                    </Button>
                  </CardContent>
                </FeatureCard>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <StatsWrapper>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha('#fff', 0.15),
                      color: '#fff'
                    }}
                  >
                  {stat.icon}
                  </Avatar>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                      fontSize: { xs: '2.2rem', md: '2.8rem' }
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </StatsWrapper>

      {/* How It Works Section */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: theme.palette.background.default,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <CircleShape 
          sx={{ 
            width: 300, 
            height: 300, 
            bottom: -150, 
            right: -100,
            background: alpha(theme.palette.primary.light, 0.1),
            opacity: 0.5
          }} 
        />
        <CircleShape 
          sx={{ 
            width: 200, 
            height: 200, 
            top: -100, 
            left: -50,
            background: alpha(theme.palette.primary.light, 0.15),
            opacity: 0.3
          }} 
        />
        
         <Container maxWidth="lg">
          <SectionTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Divider sx={{ width: 60, mr: 2 }} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  letterSpacing: 1
                }}
              >
                מדריך מהיר
              </Typography>
              <Divider sx={{ width: 60, ml: 2 }} />
            </Box>
           <Typography
             variant="h2"
             gutterBottom
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              איך להתחיל בארבעה צעדים פשוטים
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                color: alpha(theme.palette.text.primary, 0.7),
                fontWeight: 400,
                mb: 4
              }}
            >
              תהליך מהיר וקל שיאפשר לך להתחיל להשתמש במערכת תוך דקות
           </Typography>
          </SectionTitle>

          {/* Modern Timeline Implementation */}
          <TimelineContainer>
            {steps.map((step, index) => {
              // Generate a unique color for each step from the primary palette
              const stepColor = index === 0 
                ? theme.palette.primary.main
                : index === 1 
                  ? theme.palette.info.main 
                  : index === 2 
                    ? theme.palette.success.main 
                    : theme.palette.warning.main;
              
              // Determine if step should appear on left or right side (desktop only)
              const isEven = index % 2 === 0;
              
              // Select an icon based on the step
              const stepIcon = index === 0 
                ? <FolderIcon />
                : index === 1 
                  ? <PeopleIcon />
                  : index === 2 
                    ? <UploadFileIcon />
                    : <QuestionAnswerIcon />;
              
              // Add animation delay for stepped appearance
              const animationDelay = `${index * 0.2}s`;
              
              // Mark first two steps as completed for demonstration
              const isCompleted = index < 2;
              
              return (
                <TimelineItem 
                  key={index}
                  sx={{
                    animation: 'fadeInUp 0.8s ease-out both',
                    animationDelay,
                    '@keyframes fadeInUp': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(20px)'
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  <TimelineNumber 
                    bgcolor={stepColor} 
                    completed={isCompleted}
                  >
                    {isCompleted ? <CheckIcon /> : step.number}
                    {isCompleted && <CompletedIndicator />}
                  </TimelineNumber>
                  
                  {/* On desktop: alternate left/right, on mobile: always right aligned */}
                  {isEven ? (
                    <TimelineContent sx={{ 
                      marginRight: 'auto', 
                      marginLeft: 0,
                      [theme.breakpoints.down('md')]: {
                        marginRight: 50,
                        marginLeft: 0,
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <TimelineIcon sx={{ color: stepColor }}>
                          {React.cloneElement(stepIcon, { fontSize: 'inherit' })}
                        </TimelineIcon>
                      <Typography
                          variant="h5"
                        sx={{
                            fontWeight: 600, 
                            color: stepColor,
                            fontSize: { xs: '1.1rem', md: '1.25rem' }
                          }}
                        >
                          {step.title}
                      </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{ opacity: 0.8 }}
                      >
                        {step.description}
                      </Typography>
                    </TimelineContent>
                  ) : (
                    <TimelineContentLeft
                      sx={{
                        [theme.breakpoints.down('md')]: {
                          marginRight: 50,
                          marginLeft: 0,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <TimelineIcon sx={{ color: stepColor }}>
                          {React.cloneElement(stepIcon, { fontSize: 'inherit' })}
                        </TimelineIcon>
                      <Typography
                        variant="h5"
                          sx={{ 
                            fontWeight: 600, 
                            color: stepColor,
                            fontSize: { xs: '1.1rem', md: '1.25rem' }
                          }}
                      >
                        {step.title}
                     </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{ opacity: 0.8 }}
                      >
                        {step.description}
                     </Typography>
                    </TimelineContentLeft>
                  )}
                </TimelineItem>
              );
            })}
          </TimelineContainer>

          {/* CTA Button */}
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 4,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 14px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                transition: 'all 0.3s ease'
              }}
            >
              התחל עכשיו
            </Button>
          </Box>
         </Container>
       </Box>

      {/* Testimonials Section */}
      <Box
        sx={{
          py: { xs: 10, md: 15 },
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.6)
            : `linear-gradient(180deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <CircleShape 
          sx={{ 
            width: 450, 
            height: 450, 
            top: -180, 
            right: -120,
            background: alpha(theme.palette.primary.light, 0.05),
            opacity: 0.7
          }} 
        />
        <CircleShape 
          sx={{ 
            width: 300, 
            height: 300, 
            bottom: -100, 
            left: '40%',
            background: alpha(theme.palette.primary.light, 0.04),
            opacity: 0.5
          }} 
        />
        
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              maxWidth: 550, 
              mx: 'auto', 
              mb: 8, 
              textAlign: 'center',
              position: 'relative',
            }}
          >
              <Typography 
              variant="overline" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.9rem',
                mb: 1,
                display: 'block'
                }}
              >
              קולות מהשטח
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
              סיפורי הצלחה
          </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: alpha(theme.palette.text.primary, 0.7),
                fontSize: '1.1rem',
                maxWidth: 500,
                mx: 'auto'
              }}
            >
              המילים של לקוחותינו מספרות את הסיפור טוב יותר מכל דבר שאנחנו יכולים לומר
                   </Typography>
          </Box>

          <Grid container spacing={6} justifyContent="center" sx={{ mb: 6 }}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index} sx={{ textAlign: 'center' }}>
                <TestimonialCard>
                  <TestimonialContent>
                    <QuoteIcon>״</QuoteIcon>
                    <TestimonialQuote variant="body1">
                      {testimonial.quote}
                    </TestimonialQuote>
                  </TestimonialContent>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TestimonialAvatar 
                      src={testimonial.avatarUrl} 
                      alt={testimonial.author}
                      className="testimonial-image"
                    />
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 0.5 
                      }}
                    >
                      {testimonial.author}
                    </Typography>
                    
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: alpha(theme.palette.text.secondary, 0.8),
                        fontWeight: 500
                      }}
                    >
                      {testimonial.position}
                  </Typography>
                  </Box>
                </TestimonialCard>
              </Grid>
            ))}
          </Grid>
          
          <TestimonialSliderControls>
            <SliderButton>
              <ArrowForwardIcon />
            </SliderButton>
            
            {[1, 2, 3].map((dot, i) => (
              <Box
                key={i}
                sx={{
                  width: i === 0 ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: i === 0 
                    ? theme.palette.primary.main 
                    : alpha(theme.palette.primary.main, 0.3),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: i === 0 
                      ? theme.palette.primary.main 
                      : alpha(theme.palette.primary.main, 0.5),
                  }
                }}
              />
            ))}
            
            <SliderButton>
              <ArrowBackIcon />
            </SliderButton>
          </TestimonialSliderControls>
          
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                background: alpha(theme.palette.primary.main, 0.08),
                borderRadius: 5,
                padding: theme.spacing(1, 4),
                mb: 4
              }}
            >
                  <Typography 
                variant="h5" 
                component="span" 
                    sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: { xs: '1.3rem', md: '1.6rem' }
                }}
              >
                4.9
                  </Typography>
              <Box sx={{ mx: 1.5 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <BoltIcon 
                    key={star} 
                    sx={{ 
                      color: '#FFD700',
                      fontSize: '1.2rem' 
                    }} 
                  />
                ))}
              </Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: alpha(theme.palette.text.primary, 0.7),
                  fontWeight: 500
                }}
              >
                 ממוצע דירוג
                      </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.9) 
                  : theme.palette.primary.main,
                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`,
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.35)}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? theme.palette.primary.main 
                    : theme.palette.primary.dark,
                },
                transition: 'all 0.3s ease'
              }}
            >
              קרא עוד חוות דעת
            </Button>
          </Box>
          
          {/* Add company logos section at the bottom */}
          <Box sx={{ mt: 10, pt: 8, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Grid container spacing={3} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: { xs: 2, md: 0 },
                    textAlign: { xs: 'center', md: 'right' }
                  }}
                >
                  חברות מובילות סומכות עלינו
                      </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: { xs: 3, md: 4 },
                    opacity: 0.8
                  }}
                >
                  <GoogleIcon sx={{ fontSize: 36, color: '#4285F4' }} />
                  <MicrosoftIcon sx={{ fontSize: 36, color: '#00A4EF' }} />
                  <AmazonIcon sx={{ fontSize: 36, color: '#FF9900' }} />
                  <IBMIcon sx={{ fontSize: 36, color: '#1F70C1' }} />
                  <AppleIcon sx={{ fontSize: 36, color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000' }} />
                    </Box>
              </Grid>
          </Grid>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 10, md: 15 },
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <CircleShape 
          sx={{ 
            width: 400, 
            height: 400, 
            bottom: -200, 
            right: -100,
            background: alpha('#fff', 0.05)
          }} 
        />
        <CircleShape 
          sx={{ 
            width: 300, 
            height: 300, 
            top: -100, 
            left: -100,
            background: alpha('#fff', 0.05)
          }} 
        />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2.2rem', md: '3rem' }
            }}
          >
            מוכנים להתחיל לנהל פרויקטים בצורה חכמה יותר?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
              opacity: 0.9
            }}
          >
            הצטרף לאלפי לקוחות מרוצים שכבר משתמשים במערכת לניהול הפרויקטים שלהם.
            הרשמה בחינם, ללא צורך בכרטיס אשראי.
          </Typography>
          
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
          >
          <Button
            variant="contained"
            size="large"
            sx={{
                bgcolor: '#fff',
                color: theme.palette.primary.main,
                fontWeight: 600,
                px: 4,
              py: 1.5,
                borderRadius: 2,
              '&:hover': {
                  bgcolor: alpha('#fff', 0.9),
                  boxShadow: `0 8px 25px ${alpha('#000', 0.2)}`
                }
              }}
            >
              צור חשבון בחינם
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MailIcon />}
              sx={{
                color: '#fff',
                borderColor: alpha('#fff', 0.5),
              fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: alpha('#fff', 0.05)
                }
              }}
            >
              צור קשר
          </Button>
          </Stack>
        </Container>
      </Box>
    </MainLayout>
  );
};

export default HomePage; 