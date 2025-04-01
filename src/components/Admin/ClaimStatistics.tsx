
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
        console.error("Error fetching claim statistics:", error);
        toast.error("Failed to load claim statistics");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClaimStats();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchClaimStats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Statistics</CardTitle>
        <CardDescription>Claims processed over time</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading statistics...</div>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      boxShadow: "var(--shadow)",
                    }}
                    formatter={(value) => [`${value} claims`, 'Claims']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="claims" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">Total claims</div>
                <div className="text-2xl font-bold">{claimStats.totalClaims}</div>
              </div>
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">Unique wallets</div>
                <div className="text-2xl font-bold">{claimStats.uniqueWallets}</div>
              </div>
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">Total amount</div>
                <div className="text-2xl font-bold">{claimStats.totalAmount.toFixed(2)}</div>
              </div>
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">Avg. per claim</div>
                <div className="text-2xl font-bold">{claimStats.avgPerClaim.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ClaimStatistics;
