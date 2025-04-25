
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface WeeklyClaimData {
  name: string;
  claims: number;
}

interface WeeklyClaimsChartProps {
  data: WeeklyClaimData[];
}

const WeeklyClaimsChart: React.FC<WeeklyClaimsChartProps> = ({ data }) => {
  return (
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
          <BarChart data={data}>
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
  );
};

export default WeeklyClaimsChart;
