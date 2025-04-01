
import React from 'react';
import { NFT } from '@/api/types/nft.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import NFTCountdownTimer from './NFTCountdownTimer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-luckiest">NFT</TableHead>
            <TableHead className="font-luckiest">Reward Amount</TableHead>
            <TableHead className="font-luckiest">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nfts.map((nft) => {
            // Get the NFT number using our helper function
            const nftNumber = extractNFTNumber(nft);
            
            return (
              <TableRow key={nft.tokenId}>
                <TableCell className="font-medium font-bungee">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage 
                        src="/lovable-uploads/0f0cffbe-c021-49b7-b714-c4cec03f0893.png" 
                        alt="Proud Lion Logo" 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        PL
                      </AvatarFallback>
                    </Avatar>
                    <span>{NFT_COLLECTION_NAME} #{nftNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bungee">0.1 APT</TableCell>
                <TableCell>
                  {nft.isLocked ? (
                    <NFTCountdownTimer unlockDate={nft.unlockDate} />
                  ) : (
                    <span className="text-green-500 font-medium font-bungee">Available for Claim</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default NFTTableView;
