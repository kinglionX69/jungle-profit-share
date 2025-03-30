
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const NFTGridSkeleton: React.FC = () => {
  // Create an array of 6 placeholders
  const placeholders = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {placeholders.map((index) => (
        <div 
          key={index} 
          className="glass border border-jungle-700/20 rounded-xl overflow-hidden animate-pulse shadow-md"
        >
          <Skeleton className="w-full h-48 bg-amber-500/10" />
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2 bg-amber-500/10" />
            <Skeleton className="h-4 w-1/2 mb-4 bg-amber-500/10" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24 rounded-full bg-amber-500/10" />
              <Skeleton className="h-8 w-20 rounded-full bg-amber-500/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGridSkeleton;
