// Loans management hook for UTX
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

export interface Loan {
  id: string;
  user_id: string;
  person_name: string;
  total_amount: number;
  loan_type: 'lent' | 'borrowed';
  status: 'active' | 'settled';
  created_at: string;
  updated_at: string;
}

export interface LoanTransaction {
  id: string;
  loan_id: string;
  amount: number;
  transaction_type: 'initial' | 'borrowed_more' | 'repaid' | 'lent_more';
  date: string;
  created_at: string;
}

export interface LoanWithTransactions extends Loan {
  transactions?: LoanTransaction[];
}

export interface LoansSummary {
  totalLent: number;
  totalBorrowed: number;
  netPosition: number;
}

export interface CreateLoanData {
  person_name: string;
  total_amount: number;
  loan_type: 'lent' | 'borrowed';
  date: string;
}

export interface CreateTransactionData {
  amount: number;
  transaction_type: 'borrowed_more' | 'repaid' | 'lent_more';
  date: string;
}

// Query key factory
const loansKeys = {
  all: ['loans'] as const,
  byUser: (userId: string) => ['loans', userId] as const,
  detail: (loanId: string) => ['loans', 'detail', loanId] as const,
  transactions: (loanId: string) => ['loan_transactions', loanId] as const,
};

export function useLoans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all loans
  const {
    data: loans = [],
    isLoading: loading,
    refetch: fetchLoans,
  } = useQuery({
    queryKey: user ? loansKeys.byUser(user.id) : loansKeys.all,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching loans:', error);
        throw error;
      }

      return (data || []) as Loan[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Get active loans
  const getActiveLoans = useCallback(() => {
    return loans.filter(loan => loan.status === 'active');
  }, [loans]);

  // Get settled loans
  const getSettledLoans = useCallback(() => {
    return loans.filter(loan => loan.status === 'settled');
  }, [loans]);

  // Get loan by ID (using a separate query for real-time data)
  const getLoanById = useCallback(async (id: string): Promise<{ data: Loan | null; error: Error | null }> => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error as unknown as Error };
    }
    return { data: data as Loan, error: null };
  }, [user]);

  // Get loan transactions
  const getLoanTransactions = useCallback(async (loanId: string): Promise<{ data: LoanTransaction[]; error: Error | null }> => {
    const { data, error } = await supabase
      .from('loan_transactions')
      .select('*')
      .eq('loan_id', loanId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error as unknown as Error };
    }
    return { data: (data || []) as LoanTransaction[], error: null };
  }, []);

  // Create loan mutation with optimistic updates
  const createLoanMutation = useMutation({
    mutationFn: async (loanData: CreateLoanData) => {
      if (!user) throw new Error('User not authenticated');

      // Create the loan
      const { data: newLoan, error: loanError } = await supabase
        .from('loans')
        .insert([{
          user_id: user.id,
          person_name: loanData.person_name,
          total_amount: loanData.total_amount,
          loan_type: loanData.loan_type,
          status: 'active',
        }])
        .select()
        .single();

      if (loanError) throw loanError;

      // Create the initial transaction
      const { error: transactionError } = await supabase
        .from('loan_transactions')
        .insert([{
          loan_id: (newLoan as Loan).id,
          amount: loanData.total_amount,
          transaction_type: 'initial',
          date: loanData.date,
        }]);

      if (transactionError) {
        console.error('Error creating initial transaction:', transactionError);
      }

      return newLoan as Loan;
    },
    onMutate: async (newLoan) => {
      if (!user) return;

      const queryKey = loansKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);

      // Optimistically add loan
      const optimisticLoan: Loan = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        person_name: newLoan.person_name,
        total_amount: newLoan.total_amount,
        loan_type: newLoan.loan_type,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Loan[]>(queryKey, (old = []) => 
        [optimisticLoan, ...old]
      );

      return { previousLoans, optimisticLoan };
    },
    onError: (err, newLoan, context) => {
      if (!user || !context) return;
      const queryKey = loansKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousLoans);
      console.error('Failed to create loan:', err);
    },
    onSuccess: (data, variables, context) => {
      if (!user || !context) return;
      const queryKey = loansKeys.byUser(user.id);
      
      queryClient.setQueryData<Loan[]>(queryKey, (old = []) => 
        old.map(loan => loan.id === context.optimisticLoan.id ? data : loan)
      );
    },
    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: loansKeys.byUser(user.id) });
    },
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async ({ loanId, transactionData }: { loanId: string; transactionData: CreateTransactionData }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current loan
      const { data: currentLoan, error: loanFetchError } = await getLoanById(loanId);
      if (loanFetchError || !currentLoan) {
        throw loanFetchError || new Error('Loan not found');
      }

      // Calculate new total amount
      let newTotalAmount = currentLoan.total_amount;
      if (transactionData.transaction_type === 'borrowed_more' || transactionData.transaction_type === 'lent_more') {
        newTotalAmount += transactionData.amount;
      } else if (transactionData.transaction_type === 'repaid') {
        newTotalAmount -= transactionData.amount;
      }

      // Ensure amount doesn't go negative
      if (newTotalAmount < 0) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create the transaction
      const { data: newTransaction, error: transactionError } = await supabase
        .from('loan_transactions')
        .insert([{
          loan_id: loanId,
          amount: transactionData.amount,
          transaction_type: transactionData.transaction_type,
          date: transactionData.date,
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update loan total_amount and status
      const newStatus = newTotalAmount === 0 ? 'settled' : 'active';
      const { error: updateError } = await supabase
        .from('loans')
        .update({ 
          total_amount: newTotalAmount,
          status: newStatus,
        })
        .eq('id', loanId);

      if (updateError) {
        console.error('Error updating loan:', updateError);
      }

      return { transaction: newTransaction as LoanTransaction, updatedLoan: { ...currentLoan, total_amount: newTotalAmount, status: newStatus } };
    },
    onSuccess: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: loansKeys.byUser(user.id) });
    },
  });

  // Mark as settled mutation
  const markAsSettledMutation = useMutation({
    mutationFn: async (loanId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('loans')
        .update({ status: 'settled', total_amount: 0 })
        .eq('id', loanId)
        .eq('user_id', user.id);

      if (error) throw error;
      return loanId;
    },
    onMutate: async (loanId) => {
      if (!user) return;

      const queryKey = loansKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Loan[]>(queryKey, (old = []) =>
        old.map(loan => loan.id === loanId ? { ...loan, status: 'settled' as const, total_amount: 0 } : loan)
      );

      return { previousLoans };
    },
    onError: (err, loanId, context) => {
      if (!user || !context) return;
      const queryKey = loansKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousLoans);
      console.error('Failed to mark loan as settled:', err);
    },
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      if (!user) throw new Error('User not authenticated');

      // First delete all transactions for this loan
      const { error: transactionError } = await supabase
        .from('loan_transactions')
        .delete()
        .eq('loan_id', loanId);

      if (transactionError) throw transactionError;

      // Then delete the loan
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId)
        .eq('user_id', user.id);

      if (error) throw error;
      return loanId;
    },
    onMutate: async (loanId) => {
      if (!user) return;

      const queryKey = loansKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<Loan[]>(queryKey, (old = []) =>
        old.filter(loan => loan.id !== loanId)
      );

      return { previousLoans };
    },
    onError: (err, loanId, context) => {
      if (!user || !context) return;
      const queryKey = loansKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousLoans);
      console.error('Failed to delete loan:', err);
    },
  });

  // Get loans summary
  const getLoansSummary = useCallback((): LoansSummary => {
    const activeLoans = loans.filter(loan => loan.status === 'active');
    
    const totalLent = activeLoans
      .filter(loan => loan.loan_type === 'lent')
      .reduce((sum, loan) => sum + loan.total_amount, 0);

    const totalBorrowed = activeLoans
      .filter(loan => loan.loan_type === 'borrowed')
      .reduce((sum, loan) => sum + loan.total_amount, 0);

    return {
      totalLent,
      totalBorrowed,
      netPosition: totalLent - totalBorrowed,
    };
  }, [loans]);

  // Get unique person names for autocomplete
  const getPersonNames = useCallback((): string[] => {
    const names = new Set(loans.map(loan => loan.person_name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [loans]);

  // Wrapper functions for backward compatibility
  const createLoan = async (loanData: CreateLoanData): Promise<{ data: Loan | null; error: Error | null }> => {
    try {
      const data = await createLoanMutation.mutateAsync(loanData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const addTransaction = async (
    loanId: string, 
    transactionData: CreateTransactionData
  ): Promise<{ data: LoanTransaction | null; error: Error | null }> => {
    try {
      const result = await addTransactionMutation.mutateAsync({ loanId, transactionData });
      return { data: result.transaction, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const markAsSettled = async (loanId: string): Promise<{ error: Error | null }> => {
    try {
      await markAsSettledMutation.mutateAsync(loanId);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteLoan = async (loanId: string): Promise<{ error: Error | null }> => {
    try {
      await deleteLoanMutation.mutateAsync(loanId);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    loans,
    loading,
    getActiveLoans,
    getSettledLoans,
    getLoanById,
    getLoanTransactions,
    createLoan,
    addTransaction,
    markAsSettled,
    deleteLoan,
    getLoansSummary,
    getPersonNames,
    refetch: fetchLoans,
    // Expose mutations
    createLoanMutation,
    addTransactionMutation,
    markAsSettledMutation,
    deleteLoanMutation,
  };
}
