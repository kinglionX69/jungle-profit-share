
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Skeleton
} from '@mui/material';
import StatsCard from './Stats/StatsCard';
import WeeklyClaimsChart from './Stats/WeeklyClaimsChart';

// Mock data for weekly claims
const weeklyClaimsData = [
  { name: 'Week 1', claims: 65 },
  { name: 'Week 2', claims: 59 },
  { name: 'Week 3', claims: 80 },
  { name: 'Week 4', claims: 81 },
  { name: 'Week 5', claims: 56 },
  { name: 'Week 6', claims: 55 },
  { name: 'Week 7', claims: 78 }
];

interface StatData {
  id: string;
  title: string;
  value: string | number;
  suffix?: string;
}

const ClaimStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatData[]>([
    { id: 'total-claims', title: 'Total Claims', value: 0 },
    { id: 'unique-wallets', title: 'Unique Wallets', value: 0 },
    { id: 'avg-claim', title: 'Avg. Claim', value: 0, suffix: 'APT' },
    { id: 'claimed-nfts', title: 'NFTs Claimed', value: 0 },
    { id: 'last-claim', title: 'Last Claim', value: '—' },
    { id: 'claim-rate', title: 'Claim Success Rate', value: '0%' }
  ]);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatistics([
          { id: 'total-claims', title: 'Total Claims', value: 457 },
          { id: 'unique-wallets', title: 'Unique Wallets', value: 328 },
          { id: 'avg-claim', title: 'Avg. Claim', value: 0.523, suffix: 'APT' },
          { id: 'claimed-nfts', title: 'NFTs Claimed', value: 623 },
          { id: 'last-claim', title: 'Last Claim', value: '2 hours ago' },
          { id: 'claim-rate', title: 'Claim Success Rate', value: '98%' }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching claim statistics:', error);
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, []);

  const renderStatCards = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid component="div" item xs={12} sm={6} md={4} key={item}>
              <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Skeleton variant="text" width="60%" height={30} />
                <Skeleton variant="text" width="40%" height={40} />
              </Box>
            </Grid>
          ))}
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {statistics.map((stat) => (
          <Grid component="div" item xs={12} sm={6} md={4} key={stat.id}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Claim Statistics
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        {renderStatCards()}
      </Box>
      
      <Grid container spacing={3}>
        <Grid component="div" item xs={12}>
          <WeeklyClaimsChart data={weeklyClaimsData} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClaimStatistics;
