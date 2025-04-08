import React from 'react';
import { 
  Box, 
  Typography, 
  Link, 
  Divider, 
  useTheme, 
  alpha,
  IconButton,
  Stack,
  Tooltip,
  Grid as MuiGrid,
  styled
} from '@mui/material';
import { 
  Email as EmailIcon,
  Phone as PhoneIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Dashboard as DashboardIcon,
  Policy as PolicyIcon,
  Gavel as TermsIcon
} from '@mui/icons-material';

// Define interface for Grid props to ensure TypeScript compatibility
interface GridProps {
  container?: boolean;
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number;
  justifyContent?: string;
  children?: React.ReactNode;
  key?: React.Key;
}

// Create a styled Grid component that properly handles these props
const Grid = styled(MuiGrid)<GridProps>(({ }) => ({}));

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  // Social media icons with simplified display
  const socialMedia = [
    { icon: <FacebookIcon fontSize="small" />, name: 'Facebook', url: 'https://facebook.com' },
    { icon: <TwitterIcon fontSize="small" />, name: 'Twitter', url: 'https://twitter.com' },
    { icon: <LinkedInIcon fontSize="small" />, name: 'LinkedIn', url: 'https://linkedin.com' },
    { icon: <InstagramIcon fontSize="small" />, name: 'Instagram', url: 'https://instagram.com' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        width: '100%',
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'light' 
          ? alpha(theme.palette.primary.main, 0.03)
          : alpha(theme.palette.background.paper, 0.2),
        direction: 'rtl', // Ensure RTL layout
        textAlign: 'right', // Ensure text aligns right
      }}
    >
      <Grid container spacing={2} justifyContent="space-between" alignItems="center" direction="row">
        {/* Company Info - Simplified */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ color: theme.palette.primary.main, fontSize: 22, ml: 1 }} />
            <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
              ניהול פרוייקטים חכם
            </Typography>
          </Box>
        </Grid>
        
        {/* Contact Info - Compact */}
        <Grid item xs={12} md={4}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 3 }} 
            justifyContent="center"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
              <EmailIcon fontSize="small" sx={{ ml: 0.75, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                info@pmartai.co.il
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
              <PhoneIcon fontSize="small" sx={{ ml: 0.75, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                03-1234567
              </Typography>
            </Box>
          </Stack>
        </Grid>
        
        {/* Social links - Compact */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1 }}>
            {socialMedia.map((social, idx) => (
              <Tooltip key={idx} title={social.name}>
                <IconButton 
                  component="a" 
                  href={social.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ 
                    color: theme.palette.primary.main,
                  }}
                >
                  {social.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.2) }} />
      
      {/* Copyright and links - Compact */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, // Use regular row with RTL direction
        justifyContent: 'space-between', 
        alignItems: { xs: 'center', sm: 'center' },
        py: 0.5,
        fontSize: '0.75rem'
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link
            href="/privacy"
            underline="hover"
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PolicyIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.9rem' }} />
              מדיניות פרטיות
            </Box>
          </Link>
          
          <Link
            href="/terms"
            underline="hover"
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TermsIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.9rem' }} />
              תנאי שימוש
            </Box>
          </Link>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          © {currentYear} ניהול פרוייקטים חכם. כל הזכויות שמורות.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer; 