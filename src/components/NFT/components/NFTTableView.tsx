import React from 'react';
import { NFT } from '@/api/types/nft.types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  TableContainer,
  Paper,
  Avatar,
  Box,
  Typography
} from '@mui/material';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import NFTCountdownTimer from './NFTCountdownTimer';

interface NFTTableViewProps {
  nfts: NFT[];
}

const NFTTableView: React.FC<NFTTableViewProps> = ({ nfts }) => {
  // Helper function to extract NFT number from properties or name
  const extractNFTNumber = (nft: NFT): string => {
    // Try to parse properties if available
    if (nft.properties) {
      try {
        // If properties is a string, parse it, otherwise use it directly
        const props = typeof nft.properties === 'string' 
          ? JSON.parse(nft.properties) 
          : nft.properties;
          
        // Look for common metadata fields that might contain the number
        if (props.name && typeof props.name === 'string') {
          const nameMatch = props.name.match(/#(\d+)/);
          if (nameMatch && nameMatch[1]) return nameMatch[1];
        }
        
        if (props.token_number) return props.token_number;
        if (props.tokenId) return props.tokenId;
        if (props.token_id) return props.token_id;
        if (props.id) return props.id;
      } catch (error) {
        console.log('Error parsing NFT properties:', error);
      }
    }
    
    // If we couldn't get it from properties, try from the name
    if (nft.name) {
      const nameMatch = nft.name.match(/#(\d+)/);
      if (nameMatch && nameMatch[1]) return nameMatch[1];
    }
    
    // Last resort: extract numeric part from tokenId
    return nft.tokenId.match(/\d+/)?.[0] || nft.tokenId.substring(nft.tokenId.length - 6);
  };

  return (
    <TableContainer component={Paper} sx={{ 
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      boxShadow: 'none',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHead>
              <Typography sx={{ fontFamily: "'Luckiest Guy', cursive" }}>NFT</Typography>
            </TableHead>
            <TableHead>
              <Typography sx={{ fontFamily: "'Luckiest Guy', cursive" }}>Reward Amount</Typography>
            </TableHead>
            <TableHead>
              <Typography sx={{ fontFamily: "'Luckiest Guy', cursive" }}>Status</Typography>
            </TableHead>
          </TableRow>
        </TableHead>
        <TableBody>
          {nfts.map((nft) => {
            // Get the NFT number using our helper function
            const nftNumber = extractNFTNumber(nft);
            
            return (
              <TableRow key={nft.tokenId}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src="/lovable-uploads/0f0cffbe-c021-49b7-b714-c4cec03f0893.png" 
                      alt="Proud Lion Logo"
                      sx={{ 
                        width: 48, 
                        height: 48,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    />
                    <Typography sx={{ fontFamily: "'Bungee', cursive" }}>
                      {NFT_COLLECTION_NAME} #{nftNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontFamily: "'Bungee', cursive" }}>0.1 APT</Typography>
                </TableCell>
                <TableCell>
                  {nft.isLocked ? (
                    <NFTCountdownTimer unlockDate={nft.unlockDate} />
                  ) : (
                    <Typography 
                      sx={{ 
                        color: 'success.main',
                        fontWeight: 500,
                        fontFamily: "'Bungee', cursive"
                      }}
                    >
                      Available for Claim
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NFTTableView;
