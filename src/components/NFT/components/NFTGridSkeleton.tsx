
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface NFTGridSkeletonProps {
  count?: number;
}

const NFTGridSkeleton: React.FC<NFTGridSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="rounded-lg border overflow-hidden bg-card">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGridSkeleton;
