
import React from 'react';
import { Container, Box } from '@mui/material';

interface PageContainerProps {
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  className = '', 
  maxWidth = 'lg',
  children 
}) => {
  return (
    <Container maxWidth={maxWidth}>
      <Box 
        sx={{
          py: 4,
          px: { xs: 2, sm: 3 }
        }}
        className={className}
      >
        {children}
      </Box>
    </Container>
  );
};

export default PageContainer;
