
import React from 'react';
import { useUser } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ClaimHistory: React.FC = () => {
  const { claimHistory, loadingClaimHistory } = useUser();
  
  if (loadingClaimHistory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (claimHistory.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h3 className="text-lg font-medium font-luckiest">No Claim History</h3>
        <p className="text-muted-foreground mt-2 mb-4 font-bungee">
          You haven't made any claims yet. Claims will appear here once processed.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium font-luckiest">Claim History</h3>
      
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-luckiest">Date</TableHead>
              <TableHead className="font-luckiest">Amount</TableHead>
              <TableHead className="hidden md:table-cell font-luckiest">NFTs Used</TableHead>
              <TableHead className="text-right font-luckiest">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claimHistory.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-bungee">
                  {claim.date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell className="font-bungee">
                  {claim.amount} {claim.tokenName}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {claim.nfts.slice(0, 2).map((nft, index) => (
                      <Badge key={index} variant="outline" className="truncate max-w-[150px] font-bungee">
                        {nft}
                      </Badge>
                    ))}
                    {claim.nfts.length > 2 && (
                      <Badge variant="outline" className="font-bungee">+{claim.nfts.length - 2} more</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="bg-success/20 text-success hover:bg-success/20 font-bungee">
                    Completed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClaimHistory;
