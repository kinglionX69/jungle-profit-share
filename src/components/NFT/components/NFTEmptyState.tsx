
import React from 'react';
import { Search, PackageOpen, RefreshCcw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  Button, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText
} from '@mui/material';
import { useUser } from '@/context/UserContext';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

interface NFTEmptyStateProps {
  filterEligible?: boolean;
}

const NFTEmptyState: React.FC<NFTEmptyStateProps> = ({ filterEligible = false }) => {
  const { fetchUserData } = useUser();
  
  return (
    <Card sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 6, 
        px: 2 
      }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: 'warning.light', 
          color: 'warning.main', 
          borderRadius: '50%', 
          mb: 2 
        }}>
          {filterEligible ? (
            <Search size={40} />
          ) : (
            <PackageOpen size={40} />
          )}
        </Box>
        
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 1,
          fontFamily: "'Poppins', sans-serif"
        }}>
          {filterEligible 
            ? 'No Eligible NFTs Found' 
            : `No ${NFT_COLLECTION_NAME} NFTs Found`}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            textAlign: 'center', 
            maxWidth: 'md', 
            mb: 3,
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          {filterEligible
            ? 'You don\'t have any NFTs eligible for claiming rewards at this time.'
            : `We couldn't find any ${NFT_COLLECTION_NAME} NFTs in your wallet.`}
        </Typography>
        
        <Box sx={{ width: '100%', maxWidth: 'xs', spaceY: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => fetchUserData()}
            sx={{ 
              width: '100%',
              justifyContent: 'center',
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                bgcolor: 'warning.light',
                borderColor: 'warning.main'
              }
            }}
          >
            <RefreshCcw style={{ marginRight: 8, width: 16, height: 16 }} />
            Refresh NFTs
          </Button>
          
          {!filterEligible && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Troubleshooting Tips:
              </Typography>
              <List dense sx={{ pl: 2 }}>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText 
                    primary="Make sure your wallet contains Proud Lions Club NFTs"
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  />
                </ListItem>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText 
                    primary="Check that you're connected with the correct wallet"
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  />
                </ListItem>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText 
                    primary="Try refreshing your browser and reconnecting"
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  />
                </ListItem>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText 
                    primary="The blockchain network might be congested, try again later"
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NFTEmptyState;
