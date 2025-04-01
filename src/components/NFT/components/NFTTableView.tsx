
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
            <TableHead>NFT</TableHead>
            <TableHead>Reward Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nfts.map((nft) => {
            // Extract numeric part from tokenId for display
            const nftNumber = nft.tokenId.match(/\d+/)?.[0] || nft.tokenId.substring(nft.tokenId.length - 6);
            
            return (
              <TableRow key={nft.tokenId}>
                <TableCell className="font-medium">
                  {NFT_COLLECTION_NAME} #{nftNumber}
                </TableCell>
                <TableCell>2 APT</TableCell>
                <TableCell>
                  {nft.isLocked ? (
                    <NFTCountdownTimer unlockDate={nft.unlockDate} />
                  ) : (
                    <span className="text-green-500 font-medium">Available for Claim</span>
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
