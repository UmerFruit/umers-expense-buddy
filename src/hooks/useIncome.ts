import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  date: string;
  description: string | null;
  is_recurring: boolean;
  recurring_period: 'weekly' | 'monthly' | 'yearly' | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
  };
}

// Query key factory
const incomeKeys = {
  all: ['income'] as const,
  byUser: (userId: string) => ['income', userId] as const,
};

export function useIncome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: income = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: user ? incomeKeys.byUser(user.id) : incomeKeys.all,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('income')
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching income:', error);
        throw error;
      }

      return (data || []) as Income[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Create income mutation with optimistic updates
  const createIncomeMutation = useMutation({
    mutationFn: async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('income')
        .insert([{ ...incomeData, user_id: user.id }])
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return data as Income;
    },
    onMutate: async (newIncome) => {
      if (!user) return;

      const queryKey = incomeKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousIncome = queryClient.getQueryData<Income[]>(queryKey);

      // Optimistically add income
      const optimisticIncome: Income = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        amount: newIncome.amount,
        category_id: newIncome.category_id,
        date: newIncome.date,
        description: newIncome.description,
        is_recurring: newIncome.is_recurring,
        recurring_period: newIncome.recurring_period,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Income[]>(queryKey, (old = []) => 
        [optimisticIncome, ...old]
      );

      return { previousIncome, optimisticIncome };
    },
    onError: (err, newIncome, context) => {
      if (!user || !context) return;
      const queryKey = incomeKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousIncome);
      console.error('Failed to create income:', err);
    },
    onSuccess: (data, variables, context) => {
      if (!user || !context) return;
      const queryKey = incomeKeys.byUser(user.id);
      
      queryClient.setQueryData<Income[]>(queryKey, (old = []) => 
        old.map(inc => inc.id === context.optimisticIncome.id ? data : inc)
      );
    },
    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: incomeKeys.byUser(user.id) });
    },
  });

  // Update income mutation
  const updateIncomeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Income> }) => {
      const { data, error } = await supabase
        .from('income')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return data as Income;
    },
    onMutate: async ({ id, updates }) => {
      if (!user) return;

      const queryKey = incomeKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousIncome = queryClient.getQueryData<Income[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Income[]>(queryKey, (old = []) =>
        old.map(inc => inc.id === id ? { ...inc, ...updates } : inc)
      );

      return { previousIncome };
    },
    onError: (err, variables, context) => {
      if (!user || !context) return;
      const queryKey = incomeKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousIncome);
      console.error('Failed to update income:', err);
    },
    onSuccess: (data) => {
      if (!user) return;
      const queryKey = incomeKeys.byUser(user.id);
      
      queryClient.setQueryData<Income[]>(queryKey, (old = []) =>
        old.map(inc => inc.id === data.id ? data : inc)
      );
    },
  });

  // Delete income mutation
  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      if (!user) return;

      const queryKey = incomeKeys.byUser(user.id);
      await queryClient.cancelQueries({ queryKey });

      const previousIncome = queryClient.getQueryData<Income[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<Income[]>(queryKey, (old = []) =>
        old.filter(inc => inc.id !== id)
      );

      return { previousIncome };
    },
    onError: (err, id, context) => {
      if (!user || !context) return;
      const queryKey = incomeKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousIncome);
      console.error('Failed to delete income:', err);
    },
  });

  // Wrapper functions for backward compatibility
  const createIncome = async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>) => {
    try {
      const data = await createIncomeMutation.mutateAsync(incomeData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const data = await updateIncomeMutation.mutateAsync({ id, updates });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      await deleteIncomeMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    income,
    loading,
    createIncome,
    updateIncome,
    deleteIncome,
    refetch,
    // Expose mutations
    createIncomeMutation,
    updateIncomeMutation,
    deleteIncomeMutation,
  };
}
