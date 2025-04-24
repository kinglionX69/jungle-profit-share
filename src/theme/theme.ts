
import { createTheme } from '@mui/material/styles';

// Create a jungle-themed Material UI theme
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50', // Jungle green as primary
      light: '#81C784',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFC107', // Amber as secondary (golden amber)
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#000000',
    },
    background: {
      default: '#0F1A12', // Dark jungle background
      paper: '#162019',
    },
    success: {
      main: '#4CAF50', // Green
      light: '#81C784',
      dark: '#2E7D32',
    },
    warning: {
      main: '#FFC107', // Amber
      light: '#FFD54F',
      dark: '#FFA000',
    },
    error: {
      main: '#F44336', // Red
      light: '#E57373',
      dark: '#D32F2F',
    },
    info: {
      main: '#2196F3', // Blue
      light: '#64B5F6',
      dark: '#1976D2',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
      disabled: 'rgba(255, 255, 255, 0.5)',
    }
  },
  typography: {
    fontFamily: "'Poppins', 'Nunito', sans-serif",
    h1: {
      fontFamily: "'Luckiest Guy', cursive",
      fontWeight: 400,
    },
    h2: {
      fontFamily: "'Luckiest Guy', cursive",
      fontWeight: 400,
    },
    h3: {
      fontFamily: "'Luckiest Guy', cursive",
      fontWeight: 400,
    },
    h4: {
      fontFamily: "'Luckiest Guy', cursive",
      fontWeight: 400,
    },
    h5: {
      fontFamily: "'Bungee', cursive",
      fontWeight: 400,
    },
    h6: {
      fontFamily: "'Bungee', cursive",
      fontWeight: 400,
    },
    body1: {
      fontFamily: "'Nunito', sans-serif",
    },
    body2: {
      fontFamily: "'Nunito', sans-serif",
    },
    button: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        containedPrimary: {
          background: 'linear-gradient(145deg, #4CAF50 0%, #388E3C 100%)',
          boxShadow: '0px 4px 8px rgba(76, 175, 80, 0.25)',
          '&:hover': {
            background: 'linear-gradient(145deg, #388E3C 0%, #1B5E20 100%)',
            boxShadow: '0px 6px 10px rgba(76, 175, 80, 0.35)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(145deg, #FFC107 0%, #FFA000 100%)',
          boxShadow: '0px 4px 8px rgba(255, 193, 7, 0.25)',
          '&:hover': {
            background: 'linear-gradient(145deg, #FFA000 0%, #FF8F00 100%)',
            boxShadow: '0px 6px 10px rgba(255, 193, 7, 0.35)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(22, 32, 25, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    }
  },
});

export default theme;
