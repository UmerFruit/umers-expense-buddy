-- Fix RLS Policy Performance - Auth RLS Initialization Plan
-- This migration optimizes RLS policies by wrapping auth.uid() in subqueries
-- This prevents the function from being re-evaluated for each row, improving performance

-- Drop and recreate categories policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view their own categories" 
ON public.categories 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
CREATE POLICY "Users can create their own categories" 
ON public.categories 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories" 
ON public.categories 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories" 
ON public.categories 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Drop and recreate expenses policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses" 
ON public.expenses 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
CREATE POLICY "Users can create their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses" 
ON public.expenses 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own expenses" 
ON public.expenses 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Drop and recreate income policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view their own income" ON public.income;
CREATE POLICY "Users can view their own income" 
ON public.income 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own income" ON public.income;
CREATE POLICY "Users can create their own income" 
ON public.income 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own income" ON public.income;
CREATE POLICY "Users can update their own income" 
ON public.income 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own income" ON public.income;
CREATE POLICY "Users can delete their own income" 
ON public.income 
FOR DELETE 
USING ((select auth.uid()) = user_id);
