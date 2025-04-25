import React, { useEffect, useState } from 'react';
import { Box, Grid, Skeleton } from '@mui/material';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StatsCard from './Stats/StatsCard';
import WeeklyClaimsChart from './Stats/WeeklyClaimsChart';

interface ClaimStats {
  totalClaims: number;
  totalAmount: number;
  uniqueWallets: number;
  avgPerClaim: number;
}

interface WeeklyClaimData {
  name: string;
  claims: number;
}

const ClaimStatistics: React.FC = () => {
  const [claimStats, setClaimStats] = useState<ClaimStats>({
    totalClaims: 0,
    totalAmount: 0,
    uniqueWallets: 0,
    avgPerClaim: 0
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyClaimData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchClaimStats = async () => {
      try {
        setIsLoading(true);
        
        const { data: claimHistory, error: historyError } = await supabase
          .from('claim_history')
          .select('*');
        
        if (historyError) {
          console.error("Error fetching claim history:", historyError);
          throw historyError;
        }
        
        if (!claimHistory || claimHistory.length === 0) {
          setClaimStats({
            totalClaims: 0,
            totalAmount: 0,
            uniqueWallets: 0,
            avgPerClaim: 0
          });
          setWeeklyData([]);
          return;
        }
        
        const totalClaims = claimHistory.length;
        const totalAmount = claimHistory.reduce((sum, claim) => sum + Number(claim.amount), 0);
        const uniqueWallets = new Set(claimHistory.map(claim => claim.wallet_address)).size;
        const avgPerClaim = totalClaims > 0 ? totalAmount / totalClaims : 0;
        
        setClaimStats({
          totalClaims,
          totalAmount,
          uniqueWallets,
          avgPerClaim
        });
        
        const now = new Date();
        const weeklyStats: Record<string, number> = {};
        
        for (let i = 0; i < 6; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekName = `Week ${i + 1}`;
          weeklyStats[weekName] = 0;
        }
        
        claimHistory.forEach(claim => {
          const claimDate = new Date(claim.claim_date);
          const diffDays = Math.floor((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.floor(diffDays / 7) + 1;
          
          if (weekNum <= 6) {
            const weekName = `Week ${weekNum}`;
            weeklyStats[weekName] = (weeklyStats[weekName] || 0) + 1;
          }
        });
        
        const weeklyDataArray = Object.entries(weeklyStats).map(([name, claims]) => ({
          name,
          claims
        })).reverse();
        
        setWeeklyData(weeklyDataArray);
      } catch (error) {
        console.error("Error in fetchClaimStats:", error);
        toast.error("Failed to fetch claim statistics");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClaimStats();
  }, []);
  
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((index) => (
          <Grid key={index} xs={12} sm={6} md={3}>
            <Skeleton variant="rectangular" height={118} />
          </Grid>
        ))}
        <Grid xs={12}>
          <Skeleton variant="rectangular" height={300} />
        </Grid>
      </Grid>
    );
  }
  
  const statsData = [
    { title: 'Total Claims', value: claimStats.totalClaims },
    { title: 'Total Amount', value: claimStats.totalAmount.toFixed(2), suffix: 'APT' },
    { title: 'Unique Wallets', value: claimStats.uniqueWallets },
    { title: 'Average per Claim', value: claimStats.avgPerClaim.toFixed(2), suffix: 'APT' }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {statsData.map((stat, index) => (
          <Grid key={index} xs={12} sm={6} md={3}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
            />
          </Grid>
        ))}
        <Grid xs={12}>
          <WeeklyClaimsChart data={weeklyData} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClaimStatistics;
