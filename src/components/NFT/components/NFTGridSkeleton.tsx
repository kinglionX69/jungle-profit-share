
import React from 'react';
import { Skeleton, Box, Grid } from '@mui/material';

const NFTGridSkeleton: React.FC = () => {
  const placeholders = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <Grid container spacing={3} component="div">
      {placeholders.map((index) => (
        <Grid component="div" key={index} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
          <Box 
            sx={{ 
              backgroundImage: 'none',
              backgroundColor: 'transparent',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            }}
          >
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={192}
              sx={{ bgcolor: 'warning.light' }}
            />
            <Box sx={{ p: 2 }}>
              <Skeleton 
                variant="text" 
                width="75%" 
                height={24}
                sx={{ mb: 1, bgcolor: 'warning.light' }}
              />
              <Skeleton 
                variant="text" 
                width="50%" 
                height={16}
                sx={{ mb: 2, bgcolor: 'warning.light' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton 
                  variant="rectangular" 
                  width={96} 
                  height={32}
                  sx={{ borderRadius: 4, bgcolor: 'warning.light' }}
                />
                <Skeleton 
                  variant="rectangular" 
                  width={80} 
                  height={32}
                  sx={{ borderRadius: 4, bgcolor: 'warning.light' }}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default NFTGridSkeleton;
