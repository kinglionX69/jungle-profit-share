
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  suffix?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, suffix }) => {
  return (
    <Card sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <CardContent>
        <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "'Nunito', sans-serif" }}>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontFamily: "'Bungee', cursive" }}>
          {value}{suffix && ` ${suffix}`}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
