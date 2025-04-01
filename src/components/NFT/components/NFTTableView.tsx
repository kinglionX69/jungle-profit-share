
import React from 'react';
import { NFT } from '@/api/types/nft.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import NFTCountdownTimer from './NFTCountdownTimer';

interface NFTTableViewProps {
  nfts: NFT[];
}

const NFTTableView: React.FC<NFTTableViewProps> = ({ nfts }) => {
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
            // Extract numeric part from tokenId for display
            const nftNumber = nft.tokenId.match(/\d+/)?.[0] || nft.tokenId.substring(nft.tokenId.length - 6);
            
            return (
              <TableRow key={nft.tokenId}>
                <TableCell className="font-medium font-bungee">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/lovable-uploads/0f0cffbe-c021-49b7-b714-c4cec03f0893.png" 
                      alt="Proud Lion Logo" 
                      className="w-10 h-10 rounded-full"
                    />
                    <span>{NFT_COLLECTION_NAME} #{nftNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bungee">2 APT</TableCell>
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
