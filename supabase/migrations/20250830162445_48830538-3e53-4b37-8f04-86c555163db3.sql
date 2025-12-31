-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only create default categories if the user doesn't already have any
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = NEW.id) THEN
    INSERT INTO public.categories (user_id, name, color, type) VALUES
      (NEW.id, 'Food & Dining', '#EF4444', 'expense'),
      (NEW.id, 'Transportation', '#3B82F6', 'expense'),
      (NEW.id, 'Entertainment', '#8B5CF6', 'expense'),
      (NEW.id, 'Utilities', '#F59E0B', 'expense'),
      (NEW.id, 'Healthcare', '#10B981', 'expense'),
      (NEW.id, 'Shopping', '#EC4899', 'expense'),
      (NEW.id, 'Other', '#6B7280', 'both'),
      (NEW.id, 'Salary', '#22C55E', 'income'),
      (NEW.id, 'Freelance', '#84CC16', 'income'),
      (NEW.id, 'Investment', '#F59E0B', 'income');
  END IF;
  RETURN NEW;
END;
$$;