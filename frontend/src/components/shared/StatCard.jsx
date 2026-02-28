import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard Component
 * Displays a statistic with icon, value, and optional trend
 */
export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection,
  color = 'blue',
  className 
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trendDirection === 'up' ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {trend}%
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            )}
          </div>

          {Icon && (
            <div className={cn('p-3 rounded-full', colorClasses[color])}>
              <Icon size={24} className="text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
