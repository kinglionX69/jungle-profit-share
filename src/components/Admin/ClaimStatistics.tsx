import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Skeleton,
  Paper
} from '@mui/material';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        
        // Fetch overall claim statistics
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
        
        // Calculate overall stats
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
        
        // Calculate weekly data for the chart
        const now = new Date();
        const weeklyStats: Record<string, number> = {};
        
        // Initialize 6 weeks of data
        for (let i = 0; i < 6; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekName = `Week ${i + 1}`;
          weeklyStats[weekName] = 0;
        }
        
        // Fill in actual claim data
        claimHistory.forEach(claim => {
          const claimDate = new Date(claim.claim_date);
          const diffDays = Math.floor((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.floor(diffDays / 7) + 1;
          
          if (weekNum <= 6) {
            const weekName = `Week ${weekNum}`;
            weeklyStats[weekName] = (weeklyStats[weekName] || 0) + 1;
          }
        });
        
        // Convert to array format for chart
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
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Skeleton variant="rectangular" height={118} />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Skeleton variant="rectangular" height={300} />
        </Grid>
      </Grid>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "'Nunito', sans-serif" }}>
                Total Claims
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontFamily: "'Bungee', cursive" }}>
                {claimStats.totalClaims}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "'Nunito', sans-serif" }}>
                Total Amount
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontFamily: "'Bungee', cursive" }}>
                {claimStats.totalAmount.toFixed(2)} APT
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "'Nunito', sans-serif" }}>
                Unique Wallets
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontFamily: "'Bungee', cursive" }}>
                {claimStats.uniqueWallets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "'Nunito', sans-serif" }}>
                Average per Claim
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontFamily: "'Bungee', cursive" }}>
                {claimStats.avgPerClaim.toFixed(2)} APT
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3,
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: "'Poppins', sans-serif" }}>
              Weekly Claims
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontFamily: "'Nunito', sans-serif" }}
                  />
                  <YAxis 
                    tick={{ fontFamily: "'Nunito', sans-serif" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: "'Nunito', sans-serif",
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Bar 
                    dataKey="claims" 
                    fill="var(--mui-palette-primary-main)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClaimStatistics;
