-- Clean up duplicate categories and ensure proper types
-- This migration cleans up existing data after the type column was added

-- First, ensure all existing categories have a type (default to 'both' for backward compatibility)
UPDATE public.categories
SET type = 'both'
WHERE type IS NULL;

-- Remove duplicate categories, keeping the oldest one for each user+name combination
DELETE FROM public.categories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id
  FROM public.categories
  ORDER BY user_id, name, created_at ASC
);

-- Update default category types based on common usage patterns
UPDATE public.categories
SET type = 'expense'
WHERE name IN ('Food & Dining', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping')
AND type = 'both';

UPDATE public.categories
SET type = 'income'
WHERE name IN ('Salary', 'Freelance', 'Investment', 'Business Income', 'Rental Income')
AND type = 'both';

-- Keep 'Other' as 'both' since it can be used for both income and expenses
