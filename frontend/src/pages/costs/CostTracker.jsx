import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCosts } from '@/hooks/useCosts';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, DollarSign, FileText, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

/**
 * Cost Tracker Page
 * Main page for managing expenses and revenue
 */
export default function CostTracker() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, expenses, revenue
  
  const { 
    transactions, 
    isLoadingTransactions, 
    summary,
    deleteTransaction,
    isDeleting 
  } = useCosts();

  /**
   * Get filtered transactions based on active tab
   */
  const getFilteredTransactions = () => {
    const transactionsList = Array.isArray(transactions) 
      ? transactions 
      : (transactions?.results || []);
    
    switch (activeTab) {
      case 'expenses':
        return transactionsList.filter(t => t.type === 'expense');
      case 'revenue':
        return transactionsList.filter(t => t.type === 'revenue');
      default:
        return transactionsList;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  /**
   * Handle delete transaction
   */
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  /**
   * Get type badge
   */
  const getTypeBadge = (type) => {
    return type === 'expense' 
      ? <Badge variant="destructive">Expense</Badge>
      : <Badge variant="success">Revenue</Badge>;
  };

  if (isLoadingTransactions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalExpenses = summary?.total_expenses || 0;
  const totalRevenue = summary?.total_revenue || 0;
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Tracker</h1>
          <p className="text-gray-600 mt-1">Manage expenses and revenue</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/costs/report')}
          >
            <FileText size={16} className="mr-2" />
            Generate Report
          </Button>
          <Button onClick={() => navigate('/costs/add')} className="flex items-center gap-2">
            <Plus size={20} />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="text-red-600" size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit/Loss */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(netProfit))}
                </p>
              </div>
              <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'All Transactions' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'expenses', label: 'Expenses' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filteredTransactions && filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left: Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-full ${
                      transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'revenue' ? (
                        <TrendingUp className="text-green-600" size={24} />
                      ) : (
                        <TrendingDown className="text-red-600" size={24} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{transaction.description || 'Transaction'}</h3>
                        {getTypeBadge(transaction.type)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Category: {transaction.category}</span>
                        <span>•</span>
                        <span>Date: {formatDate(transaction.date)}</span>
                        {transaction.animal && (
                          <>
                            <span>•</span>
                            <span>Animal ID: {transaction.animal}</span>
                          </>
                        )}
                      </div>
                      {transaction.notes && (
                        <p className="text-sm text-gray-600 mt-1">{transaction.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'revenue' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(transaction.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'all' 
                ? 'Get started by adding your first transaction'
                : `No ${activeTab} recorded yet`
              }
            </p>
            <Button onClick={() => navigate('/costs/add')}>
              <Plus size={20} className="mr-2" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
