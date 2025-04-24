import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Container, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { Menu as MenuIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { useWallet } from '@/context/WalletContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { connected, connect, address } = useWallet();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    // Only show admin link if needed
    // { name: 'Admin', path: '/admin' }
  ];
  
  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const renderNavLinks = () => (
    <>
      {navLinks.map((link) => (
        <Button 
          key={link.name} 
          component={RouterLink} 
          to={link.path}
          color="inherit"
          sx={{ mx: 1, fontWeight: 500 }}
        >
          {link.name}
        </Button>
      ))}
    </>
  );
  
  const renderMobileDrawer = () => (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
      PaperProps={{
        sx: {
          width: 240,
          backgroundColor: 'background.default',
          backgroundImage: 'none'
        }
      }}
    >
      <Box
        sx={{ width: 240 }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List>
          {navLinks.map((link) => (
            <ListItem 
              button 
              key={link.name} 
              component={RouterLink} 
              to={link.path}
            >
              <ListItemText 
                primary={link.name} 
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
  
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'text.primary',
              fontFamily: "'Luckiest Guy', cursive",
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              letterSpacing: '0.05em'
            }}
          >
            JUNGLE NFTs
          </Typography>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {renderNavLinks()}
            </Box>
          )}
          
          {/* Wallet Button */}
          <Box sx={{ ml: 2 }}>
            {connected ? (
              <Button 
                variant="outlined"
                color="secondary"
                startIcon={<WalletIcon />}
                sx={{ borderRadius: 4 }}
              >
                {shortAddress}
              </Button>
            ) : (
              <Button 
                variant="contained"
                color="secondary"
                onClick={connect}
                startIcon={<WalletIcon />}
                sx={{ borderRadius: 4 }}
              >
                Connect
              </Button>
            )}
          </Box>
          
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>
      
      {/* Mobile Navigation Drawer */}
      {renderMobileDrawer()}
    </AppBar>
  );
};

export default Header;
