
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyStatsData {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyBarChartProps {
  data: MonthlyStatsData[];
}

export const MonthlyBarChart = ({ data }: MonthlyBarChartProps) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>월별 수입/지출 차트</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString()}원`}
              />
              <Legend />
              <Bar dataKey="income" name="수입" fill="#22c55e" />
              <Bar dataKey="expense" name="지출" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
