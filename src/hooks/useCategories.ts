import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type?: string;
  created_at: string;
}

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [user]);

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
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [user, fetchCategories]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}