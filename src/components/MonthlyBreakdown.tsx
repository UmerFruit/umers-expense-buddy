import { useMemo } from 'react';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  netFlow: number;
  incomeCount: number;
  expenseCount: number;
}

export const MonthlyBreakdown = () => {
  const { income } = useIncome();
  const { expenses } = useExpenses();
  const { formatCurrency } = useCurrency();

  const monthlyData = useMemo(() => {
    // Get the last 12 months
    const months: MonthlyData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Filter income for this month
      const monthIncome = income.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === date.getFullYear() && 
               itemDate.getMonth() === date.getMonth();
      });

      // Filter expenses for this month
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === date.getFullYear() && 
               expenseDate.getMonth() === date.getMonth();
      });

      const totalIncome = monthIncome.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        income: totalIncome,
        expenses: totalExpenses,
        netFlow: totalIncome - totalExpenses,
        incomeCount: monthIncome.length,
        expenseCount: monthExpenses.length,
      });
    }

    return months;
  }, [income, expenses]);

  // Calculate current month data
  const currentMonth = monthlyData[monthlyData.length - 1] || {
    month: 'Current',
    year: new Date().getFullYear(),
    income: 0,
    expenses: 0,
    netFlow: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  // Calculate totals and averages
  const totals = monthlyData.reduce(
    (acc, month) => ({
      income: acc.income + month.income,
      expenses: acc.expenses + month.expenses,
      netFlow: acc.netFlow + month.netFlow,
    }),
    { income: 0, expenses: 0, netFlow: 0 }
  );

  const averages = {
    income: totals.income / monthlyData.length,
    expenses: totals.expenses / monthlyData.length,
    netFlow: totals.netFlow / monthlyData.length,
  };

  return (
    <div className="space-y-6">
      {/* Current Month Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonth.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.incomeCount} income source{currentMonth.incomeCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentMonth.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.expenseCount} expense{currentMonth.expenseCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className={`h-4 w-4 ${currentMonth.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonth.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentMonth.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.netFlow >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 12-Month Averages */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Averages</CardTitle>
          <CardDescription>Average monthly income, expenses, and cash flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Income</span>
                <span className="text-sm text-green-600 font-semibold">
                  {formatCurrency(averages.income)}
                </span>
              </div>
              <Progress 
                value={averages.income > 0 ? 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Expenses</span>
                <span className="text-sm text-red-600 font-semibold">
                  {formatCurrency(averages.expenses)}
                </span>
              </div>
              <Progress 
                value={averages.income > 0 ? (averages.expenses / averages.income) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Net Flow</span>
                <span className={`text-sm font-semibold ${averages.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(averages.netFlow)}
                </span>
              </div>
              <Progress 
                value={averages.income > 0 ? Math.abs(averages.netFlow / averages.income) * 100 : 0} 
                className={`h-2 ${averages.netFlow >= 0 ? '' : '[&>div]:bg-red-500'}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Last 12 months income vs expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={`${month.year}-${month.month}`} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {month.month} {month.year}
                  </span>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Income</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(month.income)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {month.incomeCount} source{month.incomeCount !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expenses</span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(month.expenses)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {month.expenseCount} expense{month.expenseCount !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Net Flow</span>
                    <span className={`text-sm font-semibold ${month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(month.netFlow)}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-1">
                  <Badge variant={month.netFlow >= 0 ? 'default' : 'destructive'}>
                    {month.netFlow >= 0 ? '+' : '-'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
