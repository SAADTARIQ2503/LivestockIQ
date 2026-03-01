import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancialReport } from '@/hooks/useCosts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Doughnut, Bar } from 'react-chartjs-2';

/**
 * Financial Report Page
 * Generate and view financial reports
 */
export default function FinancialReport() {
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const { report, isLoading } = useFinancialReport(dateRange);

  /**
   * Handle date change
   */
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle print report
   */
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const expenseByCategory = report?.expense_by_category || [];
  const revenueByCategory = report?.revenue_by_category || [];

  const expenseChartData = {
    labels: expenseByCategory.map(item => item.category),
    datasets: [{
      data: expenseByCategory.map(item => item.total),
      backgroundColor: [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      ],
    }],
  };

  const revenueChartData = {
    labels: revenueByCategory.map(item => item.category),
    datasets: [{
      data: revenueByCategory.map(item => item.total),
      backgroundColor: [
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      ],
    }],
  };

  const monthlyData = report?.monthly_summary || [];
  const monthlyChartData = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(item => item.revenue),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Expenses',
        data: monthlyData.map(item => item.expenses),
        backgroundColor: '#ef4444',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const totalRevenue = report?.total_revenue || 0;
  const totalExpenses = report?.total_expenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/costs')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Financial Report</h1>
            <p className="text-gray-600 mt-1">
              {formatDate(dateRange.start_date)} - {formatDate(dateRange.end_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Download size={16} className="mr-2" />
            Print / Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={dateRange.start_date}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={dateRange.end_date}
                onChange={handleDateChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">LivestockIQ Financial Report</h1>
        <p className="text-gray-600 mt-2">
          Period: {formatDate(dateRange.start_date)} - {formatDate(dateRange.end_date)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Generated on {formatDate(new Date())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</p>
            <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Profit Margin</p>
            <p className={`text-2xl font-bold mt-2 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Expense Breakdown */}
        {expenseByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 print:h-48">
                <Doughnut data={expenseChartData} options={chartOptions} />
              </div>
              <div className="mt-4 space-y-2">
                {expenseByCategory.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.category}:</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Breakdown */}
        {revenueByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 print:h-48">
                <Doughnut data={revenueChartData} options={chartOptions} />
              </div>
              <div className="mt-4 space-y-2">
                {revenueByCategory.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.category}:</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Summary */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 print:h-64">
              <Bar data={monthlyChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Expenses & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expenses */}
        {report?.top_expenses && report.top_expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="text-red-600" size={20} />
                Top Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.top_expenses.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description || expense.category}</p>
                      <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Revenue */}
        {report?.top_revenue && report.top_revenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Top Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.top_revenue.map((revenue, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{revenue.description || revenue.category}</p>
                      <p className="text-sm text-gray-600">{formatDate(revenue.date)}</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(revenue.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}