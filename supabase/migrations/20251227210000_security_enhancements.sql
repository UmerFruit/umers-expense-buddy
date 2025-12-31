-- Database Security Enhancements
-- This migration adds RLS policies, CHECK constraints, and indexes for security and performance

-- Verify income table exists and enable RLS if not already enabled
ALTER TABLE IF EXISTS public.income ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  -- Income SELECT Policy
  DROP POLICY IF EXISTS "Users can view their own income" ON public.income;
  CREATE POLICY "Users can view their own income" 
  ON public.income 
  FOR SELECT 
  USING ((select auth.uid()) = user_id);

  -- Income INSERT Policy
  DROP POLICY IF EXISTS "Users can create their own income" ON public.income;
  CREATE POLICY "Users can create their own income" 
  ON public.income 
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

  -- Income UPDATE Policy
  DROP POLICY IF EXISTS "Users can update their own income" ON public.income;
  CREATE POLICY "Users can update their own income" 
  ON public.income 
  FOR UPDATE 
  USING ((select auth.uid()) = user_id);

  -- Income DELETE Policy
  DROP POLICY IF EXISTS "Users can delete their own income" ON public.income;
  CREATE POLICY "Users can delete their own income" 
  ON public.income 
  FOR DELETE 
  USING ((select auth.uid()) = user_id);
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Income table does not exist yet';
END $$;

-- Add CHECK constraints for amount validation
DO $$ BEGIN
  ALTER TABLE public.expenses 
  ADD CONSTRAINT IF NOT EXISTS expenses_amount_positive 
  CHECK (amount > 0);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint expenses_amount_positive already exists';
END $$;

DO $$ BEGIN
  ALTER TABLE public.income 
  ADD CONSTRAINT IF NOT EXISTS income_amount_positive 
  CHECK (amount > 0);
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Income table does not exist yet';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint income_amount_positive already exists';
END $$;

-- Add reasonable date constraints
DO $$ BEGIN
  ALTER TABLE public.expenses 
  ADD CONSTRAINT IF NOT EXISTS expenses_reasonable_date 
  CHECK (date >= '2000-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint expenses_reasonable_date already exists';
END $$;

DO $$ BEGIN
  ALTER TABLE public.income 
  ADD CONSTRAINT IF NOT EXISTS income_reasonable_date 
  CHECK (date >= '2000-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year');
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Income table does not exist yet';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint income_reasonable_date already exists';
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);

-- Income table indexes (only if table exists)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_income_user_id ON public.income(user_id);
  CREATE INDEX IF NOT EXISTS idx_income_date ON public.income(date);
  CREATE INDEX IF NOT EXISTS idx_income_user_date ON public.income(user_id, date DESC);
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Income table does not exist yet, skipping income indexes';
END $$;

-- Add update timestamp trigger for income table if it exists and doesn't have trigger
DO $$ BEGIN
  CREATE TRIGGER update_income_updated_at
    BEFORE UPDATE ON public.income
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Income table does not exist yet';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger update_income_updated_at already exists';
END $$;
