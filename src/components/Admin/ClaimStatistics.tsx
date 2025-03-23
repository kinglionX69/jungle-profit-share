
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const mockClaimData = [
  {
    name: 'Week 1',
    claims: 12,
  },
  {
    name: 'Week 2',
    claims: 18,
  },
  {
    name: 'Week 3',
    claims: 7,
  },
  {
    name: 'Week 4',
    claims: 23,
  },
  {
    name: 'Week 5',
    claims: 15,
  },
  {
    name: 'Week 6',
    claims: 9,
  },
];

const ClaimStatistics: React.FC = () => {
  const totalClaims = mockClaimData.reduce((acc, data) => acc + data.claims, 0);
  const averageClaims = totalClaims / mockClaimData.length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Statistics</CardTitle>
        <CardDescription>Claims processed over the last 6 weeks</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockClaimData}>
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
            <div className="text-2xl font-bold">{totalClaims}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground">Avg. per week</div>
            <div className="text-2xl font-bold">{averageClaims.toFixed(1)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClaimStatistics;
