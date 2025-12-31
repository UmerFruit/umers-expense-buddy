// Expenses management hook for UTX
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type?: string;
  created_at: string;
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch expenses with category information
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }, [user]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  }, [user]);

  // Add new expense
  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        user_id: user.id,
      }])
      .select();

    if (!error && data) {
      await fetchExpenses(); // Refresh the list
    }
    
    return { data, error };
  };

  // Update expense
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();

    if (!error) {
      await fetchExpenses(); // Refresh the list
    }
    
    return { data, error };
  };

  // Delete expense
  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchExpenses(); // Refresh the list
    }
    
    return { error };
  };

  // Add new category
  const addCategory = async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        user_id: user.id,
      }])
      .select();

    if (!error && data) {
      await fetchCategories(); // Refresh the list
    }
    
    return { data, error };
  };

  // Update category
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();

    if (!error) {
      await fetchCategories(); // Refresh the list
      await fetchExpenses(); // Refresh expenses to show updated category names
    }
    
    return { data, error };
  };

  // Delete category
  const deleteCategory = async (id: string) => {
    // Check if category is being used by expenses
    const { data: expensesUsingCategory, error: expensesCheckError } = await supabase
      .from('expenses')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (expensesCheckError) {
      return { error: expensesCheckError };
    }

    // Check if category is being used by income
    const { data: incomeUsingCategory, error: incomeCheckError } = await supabase
      .from('income')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (incomeCheckError) {
      return { error: incomeCheckError };
    }

    // If category is being used, return an error
    if (expensesUsingCategory && expensesUsingCategory.length > 0) {
      return { error: new Error('Cannot delete category that is being used by expenses') };
    }

    if (incomeUsingCategory && incomeUsingCategory.length > 0) {
      return { error: new Error('Cannot delete category that is being used by income entries') };
    }

    // If not being used, proceed with deletion
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchCategories(); // Refresh the list
      await fetchExpenses(); // Refresh expenses
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCategories();
    } else {
      setExpenses([]);
      setCategories([]);
      setLoading(false);
    }
  }, [user, fetchExpenses, fetchCategories]);

  return {
    expenses,
    categories,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: () => {
      fetchExpenses();
      fetchCategories();
    }
  };
}