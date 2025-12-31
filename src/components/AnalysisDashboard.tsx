import { useMemo } from 'react';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/utils/dateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Repeat,
  TrendingDown,
  Target
} from 'lucide-react';

interface IncomeSourceData {
  category: string;
  totalAmount: number;
  count: number;
  isRecurring: boolean;
  averageAmount: number;
  lastReceived: string;
}

interface ExpenseCategoryData {
  category: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
  lastExpense: string;
}

export const AnalysisDashboard = () => {
  const { income, loading: incomeLoading } = useIncome();
  const { expenses, loading: expensesLoading } = useExpenses();

  const incomeAnalysis = useMemo(() => {
    // Group income by category
    const categoryMap = new Map<string, IncomeSourceData>();

    income.forEach(item => {
      const categoryName = item.categories?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.totalAmount += item.amount;
        existing.count += 1;
        existing.averageAmount = existing.totalAmount / existing.count;
        if (new Date(item.date) > new Date(existing.lastReceived)) {
          existing.lastReceived = item.date;
        }
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          totalAmount: item.amount,
          count: 1,
          isRecurring: item.is_recurring,
          averageAmount: item.amount,
          lastReceived: item.date,
        });
      }
    });

    const sources = Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

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

  const expenseAnalysis = useMemo(() => {
    // Group expenses by category
    const categoryMap = new Map<string, ExpenseCategoryData>();

    expenses.forEach(item => {
      const categoryName = item.categories?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.totalAmount += item.amount;
        existing.count += 1;
        existing.averageAmount = existing.totalAmount / existing.count;
        if (new Date(item.date) > new Date(existing.lastExpense)) {
          existing.lastExpense = item.date;
        }
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          totalAmount: item.amount,
          count: 1,
          averageAmount: item.amount,
          lastExpense: item.date,
        });
      }
    });

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate monthly expense trends
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthExpenses = expenses.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === date.getFullYear() &&
               itemDate.getMonth() === date.getMonth();
      });

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        total: monthExpenses.reduce((sum, item) => sum + item.amount, 0),
        count: monthExpenses.length,
      });
    }

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    return {
      categories,
      last6Months,
      totalExpenses,
      averageExpense,
    };
  }, [expenses]);

  const maxMonthlyIncome = Math.max(...incomeAnalysis.last6Months.map(m => m.total));
  const maxMonthlyExpense = Math.max(...expenseAnalysis.last6Months.map(m => m.total));

  const currentMonthIncome = incomeAnalysis.last6Months.at(-1)?.total || 0;
  const currentMonthExpenses = expenseAnalysis.last6Months.at(-1)?.total || 0;
  const netIncome = currentMonthIncome - currentMonthExpenses;

  // Show loading state while data is being fetched
  if (incomeLoading || expensesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analysis</h1>
          <p className="text-muted-foreground">Detailed insights into your financial data</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => `analysis-loading-skeleton-${i}`).map((key) => (
            <Card key={key}>
              <CardHeader className="pb-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => `analysis-chart-skeleton-${i}`).map((key) => (
            <Card key={key}>
              <CardHeader>
                <div className="animate-pulse space-y-2">
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-3">
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Analysis</h1>
        <p className="text-muted-foreground">Comprehensive analysis of your income and expenses</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonthIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentMonthExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentMonthIncome > 0 ? ((netIncome / currentMonthIncome) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income">Income Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-6">
          {/* Income Analysis Content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income Categories</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomeAnalysis.sources.slice(0, 5).map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.category}</span>
                        {category.isRecurring && (
                          <Badge variant="secondary" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} transactions • Avg: {formatCurrency(category.averageAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(category.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((category.totalAmount / incomeAnalysis.totalIncome) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Composition</CardTitle>
                <CardDescription>Recurring vs One-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Recurring Income</span>
                    <span className="font-medium">
                      {formatCurrency(incomeAnalysis.recurringStats.total)} ({incomeAnalysis.recurringStats.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={incomeAnalysis.recurringStats.percentage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>One-time Income</span>
                    <span className="font-medium">
                      {formatCurrency(incomeAnalysis.oneTimeStats.total)} ({incomeAnalysis.oneTimeStats.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={incomeAnalysis.oneTimeStats.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income Trends (Last 6 Months)</CardTitle>
              <CardDescription>Monthly income over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomeAnalysis.last6Months.map((month, index) => (
                  <div key={`${month.month}-${month.year}`} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">
                      {month.month} {month.year}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatCurrency(month.total)}</span>
                        <span>{month.count} transactions</span>
                      </div>
                      <Progress
                        value={maxMonthlyIncome > 0 ? (month.total / maxMonthlyIncome) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Expense Analysis Content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseAnalysis.categories.slice(0, 5).map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} transactions • Avg: {formatCurrency(category.averageAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(category.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((category.totalAmount / expenseAnalysis.totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
                <CardDescription>Key expense metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(expenseAnalysis.totalExpenses)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Expenses</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(expenseAnalysis.averageExpense)}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Expense</div>
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {expenses.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Trends (Last 6 Months)</CardTitle>
              <CardDescription>Monthly expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseAnalysis.last6Months.map((month, index) => (
                  <div key={`${month.month}-${month.year}`} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">
                      {month.month} {month.year}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatCurrency(month.total)}</span>
                        <span>{month.count} transactions</span>
                      </div>
                      <Progress
                        value={maxMonthlyExpense > 0 ? (month.total / maxMonthlyExpense) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};