
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const { connected, connecting, address, connect, disconnect, isAdmin } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
  ];
  
  // Add admin page to navigation if user is admin
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin' });
  }
  
  const isCurrentPage = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    return location.pathname === href;
  };

  return (
    <header className="bg-background/95 backdrop-blur-md sticky top-0 z-40 border-b">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">JR</span>
            </span>
            <span className="font-semibold text-xl">Jungle Run</span>
          </a>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={`text-sm font-semibold leading-6 relative transition-all hover:text-primary ${
                isCurrentPage(item.href) 
                  ? 'text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary' 
                  : 'text-foreground'
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success animate-pulse-light" />
                  <span>{shortAddress}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={disconnect}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={connect} 
              disabled={connecting}
              className="bg-primary hover:bg-primary/90"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <span className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">JR</span>
                </span>
                <span className="font-semibold text-xl">Jungle Run</span>
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                        isCurrentPage(item.href) 
                          ? 'text-primary bg-muted' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                  {connected ? (
                    <div className="space-y-2">
                      <div className="px-3 text-sm text-muted-foreground">
                        Connected as:
                      </div>
                      <div className="px-3 py-2 font-medium flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse-light" />
                        {shortAddress}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-destructive mt-2"
                        onClick={disconnect}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        connect();
                        setMobileMenuOpen(false);
                      }}
                      disabled={connecting}
                    >
                      {connecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
