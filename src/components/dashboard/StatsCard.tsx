
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
  subValue?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  valueClassName, 
  subValue 
}: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subValue && (
          <p className="text-xs text-muted-foreground">
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
