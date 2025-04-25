import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  TableContainer,
  Paper,
  Box,
  Typography,
  Skeleton,
  Chip,
  Avatar
} from '@mui/material';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import { formatDistanceToNow } from 'date-fns';

interface ClaimHistory {
  id: string;
  created_at: string;
  amount: number;
  token_name: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
}

const ClaimHistory: React.FC = () => {
  const { user } = useUser();
  const [history, setHistory] = useState<ClaimHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchClaimHistory = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('claim_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching claim history:', error);
        setError('Failed to load claim history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaimHistory();
  }, [user?.id]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };
  
  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ 
        backgroundImage: 'none',
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Date</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Amount</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Status</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Transaction</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton variant="text" width={120} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={200} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        bgcolor: 'error.light', 
        color: 'error.main',
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography sx={{ fontFamily: "'Nunito', sans-serif" }}>
          {error}
        </Typography>
      </Box>
    );
  }
  
  if (history.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        bgcolor: 'background.default', 
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontFamily: "'Nunito', sans-serif" }}
        >
          No claim history found
        </Typography>
      </Box>
    );
  }
  
  return (
    <TableContainer component={Paper} sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Date</Typography>
            </TableCell>
            <TableCell>
              <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Amount</Typography>
            </TableCell>
            <TableCell>
              <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Status</Typography>
            </TableCell>
            <TableCell>
              <Typography sx={{ fontFamily: "'Poppins', sans-serif" }}>Transaction</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>
                <Typography sx={{ fontFamily: "'Nunito', sans-serif" }}>
                  {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    src="/lovable-uploads/0f0cffbe-c021-49b7-b714-c4cec03f0893.png" 
                    alt="Proud Lion Logo"
                    sx={{ 
                      width: 24, 
                      height: 24,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Typography sx={{ fontFamily: "'Bungee', cursive" }}>
                    {claim.amount.toFixed(2)} {claim.token_name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={getStatusLabel(claim.status)}
                  color={getStatusColor(claim.status)}
                  size="small"
                  sx={{ 
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 500
                  }}
                />
              </TableCell>
              <TableCell>
                {claim.transaction_hash ? (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: "'Nunito', sans-serif",
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${claim.transaction_hash}`, '_blank')}
                  >
                    View on Explorer
                  </Typography>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    -
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ClaimHistory;
