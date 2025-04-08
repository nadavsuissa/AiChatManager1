import { createTheme } from "@mui/material";
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';

// Create and export the default theme with RTL support
export const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: "'Heebo', 'Roboto', 'Arial', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
          textAlign: 'right',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        },
        '*, *::before, *::after': {
          textAlign: 'right',
          direction: 'rtl',
        },
        'p, span, div, h1, h2, h3, h4, h5, h6': {
          '&:not([dir="ltr"])': {
            direction: 'rtl',
            textAlign: 'right',
            unicodeBidi: 'isolate'
          }
        },
        'span:has(> number), p:has(> number)': {
          direction: 'rtl',
          textAlign: 'right',
        },
        '[dir="rtl"] .MuiBox-root, [dir="rtl"] .MuiCardContent-root': {
          '& > .MuiBox-root': {
            '&.MuiBox-root': {
              '&[style*="display: flex"]': {
                // Remove forced row-reverse which causes double-reversal
                // flexDirection: 'row-reverse !important'
              }
            }
          }
        },
        '.MuiGrid-container': {
          direction: 'rtl',
        },
        '.MuiCard-root': {
          direction: 'rtl',
          textAlign: 'right'
        },
        '.MuiCardContent-root': {
          direction: 'rtl',
          textAlign: 'right'
        },
        '.MuiContainer-root': {
          direction: 'rtl'
        },
        '.MuiCardActionArea-root': {
          direction: 'rtl',
          textAlign: 'right'
        },
        '.MuiCardActions-root': {
          direction: 'rtl',
          justifyContent: 'flex-start'
        },
        '.MuiTypography-root': {
          direction: 'rtl',
          textAlign: 'right'
        },
        '.MuiBox-root': {
          direction: 'rtl'
        },
        '.MuiChip-root': {
          direction: 'rtl'
        },
        '.MuiIconButton-root': {
          direction: 'rtl'
        },
        '.MuiButton-root': {
          direction: 'rtl'
        }
      },
    },
    MuiMenu: {
      defaultProps: {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      },
      styleOverrides: {
        paper: {
          direction: 'rtl',
          textAlign: 'right'
        }
      }
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          direction: 'rtl'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          direction: 'rtl',
          textAlign: 'right'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          direction: 'rtl',
          textAlign: 'right'
        }
      }
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          direction: 'rtl',
          textAlign: 'right',
          '& .MuiCardActionArea-focusHighlight': {
            direction: 'rtl'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
        startIcon: {
          marginLeft: '8px',
          marginRight: '-4px'
        },
        endIcon: {
          marginRight: '8px',
          marginLeft: '-4px'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          direction: 'rtl',
          '& .MuiChip-icon': {
            marginLeft: '5px',
            marginRight: '-5px'
          },
          '& .MuiChip-deleteIcon': {
            marginRight: '5px',
            marginLeft: '-5px'
          },
          '& .MuiChip-label': {
            textAlign: 'center !important',
            padding: '0 8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            margin: '0 auto'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          direction: 'rtl'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          direction: 'rtl',
          textAlign: 'right',
          '&:not(.MuiTypography-noWrap)': {
            width: '100%'
          },
          '&.MuiTypography-noWrap': {
            unicodeBidi: 'plaintext'
          }
        },
        body1: {
          direction: 'rtl',
          textAlign: 'right'
        },
        body2: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h1: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h2: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h3: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h4: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h5: {
          direction: 'rtl',
          textAlign: 'right'
        },
        h6: {
          direction: 'rtl',
          textAlign: 'right'
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
        indicator: {
          transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
        },
        flexContainer: {
          direction: 'rtl'
        },
        scroller: {
          overflow: 'auto !important',
          direction: 'rtl'
        }
      }
    },
  },
});

// Cache with RTL support - Use createCache
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Optional dark theme
export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
}); 