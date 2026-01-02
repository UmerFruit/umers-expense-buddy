import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Query key factory for better organization
const categoriesKeys = {
  all: ['categories'] as const,
  byUser: (userId: string) => ['categories', userId] as const,
};

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch categories using TanStack Query
  const {
    data: categories = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: user ? categoriesKeys.byUser(user.id) : categoriesKeys.all,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Add category mutation with optimistic updates
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          user_id: user.id,
        }])
        .select();

      if (error) throw error;
      return data[0] as Category;
    },
    // Optimistic update: immediately add the category to the cache
    onMutate: async (newCategory) => {
      if (!user) return;

      const queryKey = categoriesKeys.byUser(user.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(queryKey);

      // Optimistically update to the new value
      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`, // Temporary ID
        user_id: user.id,
        name: newCategory.name,
        color: newCategory.color,
        type: newCategory.type,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Category[]>(queryKey, (old = []) => 
        [...old, optimisticCategory].sort((a, b) => a.name.localeCompare(b.name))
      );

      // Return context with the optimistic category and previous data
      return { previousCategories, optimisticCategory };
    },
    // If mutation fails, rollback to previous value
    onError: (err, newCategory, context) => {
      if (!user || !context) return;

      const queryKey = categoriesKeys.byUser(user.id);
      queryClient.setQueryData(queryKey, context.previousCategories);
      console.error('Failed to add category:', err);
    },
    // On success, replace temp ID with real data from server
    onSuccess: (data, variables, context) => {
      if (!user || !context) return;

      const queryKey = categoriesKeys.byUser(user.id);
      
      queryClient.setQueryData<Category[]>(queryKey, (old = []) => 
        old.map(cat => 
          cat.id === context.optimisticCategory.id ? data : cat
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
    },
    // Always refetch after mutation to ensure consistency
    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: categoriesKeys.byUser(user.id) });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0] as Category;
    },
    onSuccess: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: categoriesKeys.byUser(user.id) });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if category is being used by expenses
      const { data: expensesUsingCategory, error: expensesCheckError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (expensesCheckError) throw expensesCheckError;

      // Check if category is being used by income
      const { data: incomeUsingCategory, error: incomeCheckError } = await supabase
        .from('income')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (incomeCheckError) throw incomeCheckError;

      // If category is being used, throw an error
      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        throw new Error('Cannot delete category that is being used by expenses');
      }

      if (incomeUsingCategory && incomeUsingCategory.length > 0) {
        throw new Error('Cannot delete category that is being used by income entries');
      }

      // If not being used, proceed with deletion
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: categoriesKeys.byUser(user.id) });
    },
  });

  // Wrapper functions to match the old API
  const addCategory = async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const data = await addCategoryMutation.mutateAsync(category);
      return { data: [data], error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const data = await updateCategoryMutation.mutateAsync({ id, updates });
      return { data: [data], error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch,
    // Expose mutation objects for more control if needed
    addCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  };
}