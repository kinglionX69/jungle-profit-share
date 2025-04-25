
import { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Button, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useWallet } from '@/context/wallet';
import { IS_TESTNET } from '@/utils/aptos/constants/network';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connected, address, isAdmin, disconnect } = useWallet();
  const location = useLocation();

  // Debug output for admin status
  useEffect(() => {
    if (connected && address) {
      console.log("Header component - Connected wallet:", address);
      console.log("Header component - Is admin:", isAdmin);
      
      // Check if this is the specified admin wallet
      if (address === "0xbaa4882c050dd32d2405e9c50eecd308afa1cf4f023e45371671a60a051ea500") {
        console.log("Header component - This is the specified admin wallet");
      }
    }
  }, [connected, address, isAdmin]);

  // Navigation items with conditional admin access
  const navItems = [
    ...(connected ? [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: <DashboardIcon />
      }
    ] : []),
    ...(isAdmin || (address === "0xbaa4882c050dd32d2405e9c50eecd308afa1cf4f023e45371671a60a051ea500") ? [
      {
        label: 'Admin',
        to: '/admin',
        icon: <AdminIcon />
      }
    ] : [])
  ];

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(8px)' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              textDecoration: 'none',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {IS_TESTNET && (
              <Box 
                component="span"
                sx={{ 
                  fontSize: '0.75rem', 
                  bgcolor: 'warning.main', 
                  color: 'warning.contrastText',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mr: 1,
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}
              >
                Testnet
              </Box>
            )}
            Jungle NFT Rewards
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                startIcon={item.icon}
                color={location.pathname === item.to ? 'primary' : 'inherit'}
                sx={{ 
                  fontWeight: location.pathname === item.to ? 700 : 400,
                }}
              >
                {item.label}
              </Button>
            ))}
            
            {connected ? (
              <Button
                variant="outlined"
                color="inherit"
                onClick={disconnect}
                startIcon={<WalletIcon />}
                sx={{ ml: 2 }}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/"
                startIcon={<WalletIcon />}
                sx={{ ml: 2 }}
              >
                Connect Wallet
              </Button>
            )}
          </Box>

          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              edge="end"
              color="inherit"
              onClick={toggleMobileMenu}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: '300px',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={toggleMobileMenu} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem 
              key={item.to} 
              component={RouterLink} 
              to={item.to}
              onClick={toggleMobileMenu}
              sx={{
                bgcolor: location.pathname === item.to ? 'action.selected' : 'transparent',
                color: location.pathname === item.to ? 'primary.main' : 'text.primary',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          {connected ? (
            <ListItem onClick={() => { disconnect(); toggleMobileMenu(); }}>
              <ListItemIcon><WalletIcon /></ListItemIcon>
              <ListItemText primary="Disconnect" />
            </ListItem>
          ) : (
            <ListItem 
              component={RouterLink} 
              to="/"
              onClick={toggleMobileMenu}
            >
              <ListItemIcon><WalletIcon /></ListItemIcon>
              <ListItemText primary="Connect Wallet" />
            </ListItem>
          )}
        </List>
      </Drawer>
    </AppBar>
  );
};

export default Header;
