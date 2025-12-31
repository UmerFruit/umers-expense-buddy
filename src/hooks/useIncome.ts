import { useState, useEffect, useCallback } from 'react';
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

export function useIncome() {
  const { user } = useAuth();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncome = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
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
    } else {
      setIncome((data || []) as Income[]);
    }
    setLoading(false);
  }, [user]);

  const createIncome = async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('income')
      .insert([{ ...incomeData, user_id: user.id }])
      .select()
      .single();

    if (!error) {
      // Ensure the refetch happens after a small delay to prevent race conditions
      setTimeout(() => {
        fetchIncome();
      }, 50);
    }

    return { data, error };
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const { data, error } = await supabase
      .from('income')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      await fetchIncome();
    }

    return { data, error };
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchIncome();
    }

    return { error };
  };

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  return {
    income,
    loading,
    createIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncome,
  };
}
