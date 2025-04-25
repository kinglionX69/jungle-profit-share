import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { 
  Box, 
  Typography, 
  Button,
  Container
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default'
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', px: 2 }}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: '8rem',
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            404
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
            Page Not Found
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            The page you are looking for doesn't exist or has been moved.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate("/")}
            startIcon={<HomeIcon />}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
