import { useMemo } from 'react';
import { useIncome } from '@/hooks/useIncome';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Calendar, Repeat, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/dateUtils';

interface IncomeSourceData {
  source: string;
  totalAmount: number;
  count: number;
  isRecurring: boolean;
  averageAmount: number;
  lastReceived: string;
}

export const IncomeAnalysis = () => {
  const { income } = useIncome();

  const incomeAnalysis = useMemo(() => {
    // Group income by source
    const sourceMap = new Map<string, IncomeSourceData>();
    
    income.forEach(item => {
      const existing = sourceMap.get(item.source);
      if (existing) {
        existing.totalAmount += item.amount;
        existing.count += 1;
        existing.averageAmount = existing.totalAmount / existing.count;
        if (new Date(item.date) > new Date(existing.lastReceived)) {
          existing.lastReceived = item.date;
        }
      } else {
        sourceMap.set(item.source, {
          source: item.source,
          totalAmount: item.amount,
          count: 1,
          isRecurring: item.is_recurring,
          averageAmount: item.amount,
          lastReceived: item.date,
        });
      }
    });

    const sources = Array.from(sourceMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate monthly income trends
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIncome = income.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === date.getFullYear() && 
               itemDate.getMonth() === date.getMonth();
      });

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        total: monthIncome.reduce((sum, item) => sum + item.amount, 0),
        count: monthIncome.length,
      });
    }

    // Calculate recurring vs one-time income
    const recurringIncome = income.filter(item => item.is_recurring);
    const oneTimeIncome = income.filter(item => !item.is_recurring);

    const totalRecurring = recurringIncome.reduce((sum, item) => sum + item.amount, 0);
    const totalOneTime = oneTimeIncome.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = totalRecurring + totalOneTime;

    return {
      sources,
      last6Months,
      recurringStats: {
        total: totalRecurring,
        count: recurringIncome.length,
        percentage: totalIncome > 0 ? (totalRecurring / totalIncome) * 100 : 0,
      },
      oneTimeStats: {
        total: totalOneTime,
        count: oneTimeIncome.length,
        percentage: totalIncome > 0 ? (totalOneTime / totalIncome) * 100 : 0,
      },
      totalIncome,
    };
  }, [income]);

  const maxMonthlyIncome = Math.max(...incomeAnalysis.last6Months.map(m => m.total));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Income Analysis</h2>
        <p className="text-muted-foreground">Detailed breakdown of your income sources and trends</p>
      </div>

      {/* Income Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recurring vs One-time Income</CardTitle>
            <CardDescription>Distribution of your income types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Recurring Income</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(incomeAnalysis.recurringStats.total)}
                </span>
              </div>
              <Progress value={incomeAnalysis.recurringStats.percentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">
                {incomeAnalysis.recurringStats.percentage.toFixed(1)}% ({incomeAnalysis.recurringStats.count} sources)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">One-time Income</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {formatCurrency(incomeAnalysis.oneTimeStats.total)}
                </span>
              </div>
              <Progress value={incomeAnalysis.oneTimeStats.percentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">
                {incomeAnalysis.oneTimeStats.percentage.toFixed(1)}% ({incomeAnalysis.oneTimeStats.count} sources)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6-Month Income Trend</CardTitle>
            <CardDescription>Your income trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incomeAnalysis.last6Months.map((month, index) => (
                <div key={`${month.year}-${month.month}`} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">
                    {month.month}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Progress 
                        value={maxMonthlyIncome > 0 ? (month.total / maxMonthlyIncome) * 100 : 0} 
                        className="flex-1 mr-4" 
                      />
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(month.total)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {month.count} income source{month.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Income Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Top Income Sources</CardTitle>
          <CardDescription>Your highest earning income sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeAnalysis.sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No income data available</p>
              </div>
            ) : (
              incomeAnalysis.sources.map((source, index) => (
                <div key={source.source} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{source.source}</h4>
                      {source.isRecurring && (
                        <Badge variant="secondary" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{source.count} payment{source.count !== 1 ? 's' : ''}</span>
                      <span>Avg: {formatCurrency(source.averageAmount)}</span>
                      <span>Last: {new Date(source.lastReceived).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(source.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {incomeAnalysis.totalIncome > 0 ? 
                        ((source.totalAmount / incomeAnalysis.totalIncome) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
