// Loan Detail Component - Shows full details and transaction history of a loan
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLoans, Loan, LoanTransaction } from '@/hooks/useLoans';
import { AddTransactionForm } from '@/components/AddTransactionForm';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  HandCoins, 
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CircleDot,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoanDetailProps {
  loan: Loan;
  onBack: () => void;
  onUpdate: () => void;
}

// Helper functions
const getTransactionIcon = (type: string, loanType: string) => {
  switch (type) {
    case 'initial':
      return loanType === 'lent' ? <HandCoins className="h-4 w-4" /> : <Wallet className="h-4 w-4" />;
    case 'repaid':
      return <ArrowDownLeft className="h-4 w-4" />;
    case 'lent_more':
    case 'borrowed_more':
      return <ArrowUpRight className="h-4 w-4" />;
    default:
      return <CircleDot className="h-4 w-4" />;
  }
};

const getTransactionColor = (type: string, loanType: string) => {
  switch (type) {
    case 'initial':
      return loanType === 'lent' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'repaid':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'lent_more':
    case 'borrowed_more':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  }
};

const getTransactionLabel = (type: string, loanType: string) => {
  switch (type) {
    case 'initial':
      return loanType === 'lent' ? 'Initial Loan' : 'Initial Borrow';
    case 'repaid':
      return loanType === 'lent' ? 'Payment Received' : 'Payment Made';
    case 'lent_more':
      return 'Additional Loan';
    case 'borrowed_more':
      return 'Additional Borrow';
    default:
      return 'Transaction';
  }
};

const calculateLoanAmounts = (transactions: LoanTransaction[], loan: Loan) => {
  const totalPaid = transactions
    .filter(t => t.transaction_type === 'repaid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAdded = transactions
    .filter(t => t.transaction_type === 'lent_more' || t.transaction_type === 'borrowed_more')
    .reduce((sum, t) => sum + t.amount, 0);

  const initialAmount = transactions
    .find(t => t.transaction_type === 'initial')?.amount || loan.total_amount;

  return { totalPaid, totalAdded, initialAmount };
};

const getTransactionAmountColor = (transactionType: string, loanType: string) => {
  if (transactionType === 'repaid') {
    return 'text-blue-600';
  }
  return loanType === 'lent' ? 'text-green-600' : 'text-red-600';
};

const getAmountDisplayColor = (status: string, loanType: string) => {
  if (status === 'settled') {
    return 'text-muted-foreground line-through';
  }
  return loanType === 'lent' ? 'text-green-600' : 'text-red-600';
};

export const LoanDetail = ({ loan, onBack, onUpdate }: LoanDetailProps) => {
  const { getLoanTransactions, markAsSettled, deleteLoan } = useLoans();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    const { data } = await getLoanTransactions(loan.id);
    setTransactions(data);
    setLoadingTransactions(false);
  }, [loan.id, getLoanTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate total transactions amount
  const { totalPaid, totalAdded, initialAmount } = calculateLoanAmounts(transactions, loan);

  const handleTransactionAdded = useCallback(() => {
    setShowAddTransaction(false);
    fetchTransactions();
    onUpdate();
  }, [fetchTransactions, onUpdate]);

  const handleMarkSettled = useCallback(async () => {
    setIsSettling(true);
    const { error } = await markAsSettled(loan.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to settle loan',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Loan Settled',
        description: `Loan with ${loan.person_name} has been marked as settled`,
      });
      onUpdate();
    }
    setIsSettling(false);
  }, [loan.id, loan.person_name, markAsSettled, onUpdate, toast]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    const { error } = await deleteLoan(loan.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete loan',
        variant: 'destructive',
      });
      setIsDeleting(false);
    } else {
      toast({
        title: 'Loan Deleted',
        description: `Loan with ${loan.person_name} has been deleted`,
      });
      onBack();
    }
  }, [loan.id, loan.person_name, deleteLoan, onBack, toast]);

  const renderHeader = () => (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1">
        <h2 className="text-2xl font-bold">{loan.person_name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={loan.loan_type === 'lent' ? 'default' : 'destructive'} className={cn(
            loan.loan_type === 'lent' ? 'bg-green-600' : 'bg-red-600'
          )}>
            {loan.loan_type === 'lent' ? 'Money Lent' : 'Money Borrowed'}
          </Badge>
          <Badge variant={loan.status === 'active' ? 'outline' : 'secondary'}>
            {loan.status === 'active' ? 'Active' : 'Settled'}
          </Badge>
        </div>
      </div>
    </div>
  );

  const renderAmountCard = () => {
    let amountLabel = '';

    if (loan.status === 'settled') {
      amountLabel = 'Final Amount (Settled)';
    } else if (loan.loan_type === 'lent') {
      amountLabel = 'Outstanding Balance (Receivable)';
    } else {
      amountLabel = 'Outstanding Balance (Payable)';
    }

    return (
      <Card className={cn(
        'border-2',
        loan.loan_type === 'lent' ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
      )}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {amountLabel}
            </p>
            <p className={cn(
              'text-4xl font-bold',
              getAmountDisplayColor(loan.status, loan.loan_type)
            )}>
              {formatCurrency(loan.total_amount)}
            </p>
            {loan.status === 'active' && (
              <p className="text-xs text-muted-foreground mt-2">
                {loan.loan_type === 'lent' ? `${loan.person_name} owes you this amount` : `You owe ${loan.person_name} this amount`}
              </p>
            )}
          </div>

          {totalPaid > 0 && loan.status === 'active' && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repayment Progress</span>
                <span className="font-medium">{Math.round((totalPaid / (initialAmount + totalAdded)) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full transition-all duration-500',
                    loan.loan_type === 'lent' ? 'bg-green-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(100, (totalPaid / (initialAmount + totalAdded)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {formatCurrency(totalPaid)} of {formatCurrency(initialAmount + totalAdded)} repaid
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderActionButtons = () => (
    loan.status === 'active' && (
      <div className="flex flex-wrap gap-3">
        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
          <DialogTrigger asChild>
            <Button className="flex-1 sm:flex-none">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Record a payment or additional {loan.loan_type === 'lent' ? 'loan' : 'borrowing'} for {loan.person_name}
              </DialogDescription>
            </DialogHeader>
            <AddTransactionForm
              loan={loan}
              onSuccess={handleTransactionAdded}
              onCancel={() => setShowAddTransaction(false)}
            />
          </DialogContent>
        </Dialog>

        {loan.total_amount === 0 && (
          <Button
            variant="outline"
            onClick={handleMarkSettled}
            disabled={isSettling}
            className="flex-1 sm:flex-none border-green-500 text-green-600 hover:bg-green-50"
          >
            {isSettling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark as Settled
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the loan record with {loan.person_name} and all its transaction history. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Loan'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  );

  const renderTransactionHistory = () => {
    const renderTransactionContent = () => {
      if (loadingTransactions) {
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        );
      }
      
      if (transactions.length === 0) {
        return (
          <p className="text-center text-muted-foreground py-8">No transactions recorded</p>
        );
      }
      
      return (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
          
          <div className="space-y-6">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="relative flex gap-4 pl-10">
                <div className={cn(
                  'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2',
                  getTransactionColor(transaction.transaction_type, loan.loan_type)
                )}>
                  {getTransactionIcon(transaction.transaction_type, loan.loan_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {getTransactionLabel(transaction.transaction_type, loan.loan_type)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-semibold',
                        getTransactionAmountColor(transaction.transaction_type, loan.loan_type)
                      )}>
                        {transaction.transaction_type === 'repaid' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transaction.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>All transactions for this loan in chronological order</CardDescription>
        </CardHeader>
        <CardContent>
          {renderTransactionContent()}
        </CardContent>
      </Card>
    );
  };

  const renderLoanInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Loan Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created</span>
          <span>{formatDate(loan.created_at)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Updated</span>
          <span>{formatDate(loan.updated_at)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Initial Amount</span>
          <span>{formatCurrency(initialAmount)}</span>
        </div>
        {totalAdded > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Additional {loan.loan_type === 'lent' ? 'Loans' : 'Borrowing'}</span>
            <span className="text-orange-600">+{formatCurrency(totalAdded)}</span>
          </div>
        )}
        {totalPaid > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Repaid</span>
            <span className="text-blue-600">-{formatCurrency(totalPaid)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderAmountCard()}
      {renderActionButtons()}
      {renderTransactionHistory()}
      {renderLoanInfo()}
    </div>
  );
};

export default LoanDetail;
