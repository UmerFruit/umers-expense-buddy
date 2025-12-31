# UTX Expense Buddy - Complete API & Reference Guide

## Quick Reference Index

### Main Documentation Files
1. **DOCUMENTATION.md** - Core features, database schema, architecture
2. **DOCUMENTATION_PART_2.md** - Component hierarchy, data flow, hooks
3. **DOCUMENTATION_PART_3.md** - Utilities, UI components, build guide
4. **API_REFERENCE.md** (this file) - Complete API reference

---

## Supabase Database API Reference

### Expenses Table API

#### Get All Expenses for User
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select(`
    id,
    amount,
    date,
    description,
    category_id,
    created_at,
    updated_at,
    categories (
      id,
      name,
      color
    )
  `)
  .eq('user_id', userId)
  .order('date', { ascending: false })
```

**Response:**
```typescript
{
  data: [
    {
      id: "uuid",
      amount: 100.50,
      date: "2025-01-15",
      description: "Lunch at restaurant",
      category_id: "category-uuid",
      created_at: "2025-01-15T10:30:00Z",
      updated_at: "2025-01-15T10:30:00Z",
      categories: {
        id: "category-uuid",
        name: "Food & Dining",
        color: "#EF4444"
      }
    }
  ],
  error: null
}
```

#### Create Expense
```typescript
const { data, error } = await supabase
  .from('expenses')
  .insert([{
    user_id: userId,
    amount: 100.50,
    category_id: categoryId,
    date: '2025-01-15',
    description: 'Lunch at restaurant'
  }])
  .select()
  .single()
```

#### Update Expense
```typescript
const { data, error } = await supabase
  .from('expenses')
  .update({
    amount: 150.00,
    description: 'Updated description'
  })
  .eq('id', expenseId)
  .select()
  .single()
```

#### Delete Expense
```typescript
const { error } = await supabase
  .from('expenses')
  .delete()
  .eq('id', expenseId)
```

#### Get Expenses by Date Range
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false })
```

#### Get Expenses by Category
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('category_id', categoryId)
  .order('date', { ascending: false })
```

---

### Categories Table API

#### Get All Categories for User
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', userId)
  .order('name')
```

**Response:**
```typescript
{
  data: [
    {
      id: "uuid",
      user_id: "user-uuid",
      name: "Food & Dining",
      color: "#EF4444",
      type: "expense",
      created_at: "2025-01-01T00:00:00Z"
    },
    {
      id: "uuid-2",
      user_id: "user-uuid",
      name: "Salary",
      color: "#22C55E",
      type: "income",
      created_at: "2025-01-01T00:00:00Z"
    }
  ],
  error: null
}
```

#### Get Categories by Type
```typescript
// Get income categories only
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', userId)
  .in('type', ['income', 'both'])
  .order('name')

// Get expense categories only
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', userId)
  .in('type', ['expense', 'both'])
  .order('name')
```

#### Create Category
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert([{
    user_id: userId,
    name: 'Travel',
    color: '#10B981',
    type: 'expense'  // or 'income' or 'both'
  }])
  .select()
  .single()
```

#### Update Category
```typescript
const { data, error } = await supabase
  .from('categories')
  .update({
    name: 'Food & Beverages',
    color: '#F59E0B',
    type: 'both'
  })
  .eq('id', categoryId)
  .select()
  .single()
```

#### Delete Category
```typescript
// Note: The application checks if category is used before deletion
// If category is being used by expenses or income, deletion is prevented
// To delete, you must first remove or reassign all related transactions
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', categoryId)
```

**Safe Deletion Pattern (Application Level):**
```typescript
// Check for usage before deleting
const { data: expensesUsingCategory } = await supabase
  .from('expenses')
  .select('id')
  .eq('category_id', categoryId)
  .limit(1)

const { data: incomeUsingCategory } = await supabase
  .from('income')
  .select('id')
  .eq('category_id', categoryId)
  .limit(1)

if (expensesUsingCategory?.length === 0 && incomeUsingCategory?.length === 0) {
  // Safe to delete
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
} else {
  // Show error message
  throw new Error('Cannot delete category that is being used')
}
```

---

### Budgets Table API

#### Get All Budgets for User
```typescript
const { data, error } = await supabase
  .from('budgets')
  .select(`
    id,
    name,
    amount,
    period,
    start_date,
    end_date,
    is_active,
    category_id,
    created_at,
    updated_at,
    categories (
      id,
      name,
      color
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

**Response:**
```typescript
{
  data: [
    {
      id: "uuid",
      name: "Monthly Groceries",
      amount: 500.00,
      period: "monthly",
      start_date: "2025-01-01",
      end_date: null,
      is_active: true,
      category_id: "category-uuid",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      categories: {
        id: "category-uuid",
        name: "Food & Dining",
        color: "#EF4444"
      }
    }
  ],
  error: null
}
```

#### Create Budget
```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert([{
    user_id: userId,
    name: 'Monthly Groceries',
    amount: 500.00,
    period: 'monthly',
    category_id: categoryId, // null for overall budget
    start_date: '2025-01-01',
    end_date: null, // null for ongoing
    is_active: true
  }])
  .select()
  .single()
```

#### Update Budget
```typescript
const { data, error } = await supabase
  .from('budgets')
  .update({
    amount: 600.00,
    is_active: false
  })
  .eq('id', budgetId)
  .select()
  .single()
```

#### Delete Budget
```typescript
const { error } = await supabase
  .from('budgets')
  .delete()
  .eq('id', budgetId)
```

#### Get Active Budgets Only
```typescript
const { data, error } = await supabase
  .from('budgets')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
```

---

### Income Table API

#### Get All Income for User with Categories
```typescript
const { data, error } = await supabase
  .from('income')
  .select(`
    id,
    amount,
    category_id,
    date,
    description,
    is_recurring,
    recurring_period,
    created_at,
    updated_at,
    categories (
      id,
      name,
      color,
      type
    )
  `)
  .eq('user_id', userId)
  .order('date', { ascending: false })
```

**Response:**
```typescript
{
  data: [
    {
      id: "uuid",
      user_id: "user-uuid",
      amount: 5000.00,
      category_id: "category-uuid",
      date: "2025-01-15",
      description: "Monthly salary",
      is_recurring: true,
      recurring_period: "monthly",
      created_at: "2025-01-15T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
      categories: {
        id: "category-uuid",
        name: "Salary",
        color: "#22C55E",
        type: "income"
      }
    }
  ],
  error: null
}
```

#### Create Income
```typescript
const { data, error } = await supabase
  .from('income')
  .insert([{
    user_id: userId,
    amount: 5000.00,
    category_id: categoryId,  // Must be a category with type='income' or 'both'
    date: '2025-01-15',
    description: 'Monthly salary',
    is_recurring: true,
    recurring_period: 'monthly'
  }])
  .select()
  .single()
```

#### Update Income
```typescript
const { data, error } = await supabase
  .from('income')
  .update({
    amount: 5500.00,
    category_id: newCategoryId,
    description: 'Salary with bonus'
  })
  .eq('id', incomeId)
  .select()
  .single()
```

#### Delete Income
```typescript
const { error } = await supabase
  .from('income')
  .delete()
  .eq('id', incomeId)
```

#### Get Recurring Income Only
```typescript
const { data, error } = await supabase
  .from('income')
  .select(`
    *,
    categories (
      id,
      name,
      color,
      type
    )
  `)
  .eq('user_id', userId)
  .eq('is_recurring', true)
```

---

## Authentication API Reference

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

**Response:**
```typescript
{
  data: {
    user: {
      id: "user-uuid",
      email: "user@example.com",
      // ... other user fields
    },
    session: {
      access_token: "jwt-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      // ... other session fields
    }
  },
  error: null
}
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

### Get Current Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Listen to Auth State Changes
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log(event, session)
    // Events: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.
  }
)

// Cleanup
subscription.unsubscribe()
```

---

## React Hook APIs

### useExpenses Hook API

```typescript
const {
  expenses,        // Expense[]
  categories,      // Category[]
  loading,         // boolean
  addExpense,      // (expense: NewExpense) => Promise<{error?}>
  updateExpense,   // (id: string, updates: Partial<Expense>) => Promise<{error?}>
  deleteExpense,   // (id: string) => Promise<{error?}>
  addCategory,     // (category: NewCategory) => Promise<{error?}>
  updateCategory,  // (id: string, updates: Partial<Category>) => Promise<{error?}>
  deleteCategory,  // (id: string) => Promise<{error?}>
  refetch          // () => void
} = useExpenses()
```

**Usage Example:**
```typescript
const { expenses, categories, addExpense } = useExpenses()

const handleAddExpense = async () => {
  const { error } = await addExpense({
    amount: 100.50,
    category_id: categories[0].id,
    date: '2025-01-15',
    description: 'Lunch'
  })
  
  if (error) {
    console.error(error)
  } else {
    console.log('Expense added successfully')
  }
}
```

### useBudgets Hook API

```typescript
const {
  budgets,        // Budget[]
  loading,        // boolean
  createBudget,   // (budget: NewBudget) => Promise<{error?}>
  updateBudget,   // (id: string, updates: Partial<Budget>) => Promise<{error?}>
  deleteBudget,   // (id: string) => Promise<{error?}>
  refetch         // () => void
} = useBudgets()
```

**Usage Example:**
```typescript
const { budgets, createBudget } = useBudgets()

const handleCreateBudget = async () => {
  const { error } = await createBudget({
    name: 'Monthly Groceries',
    amount: 500.00,
    period: 'monthly',
    category_id: categoryId,
    start_date: '2025-01-01',
    end_date: null,
    is_active: true
  })
}
```

### useIncome Hook API

```typescript
const {
  income,         // Income[]
  loading,        // boolean
  createIncome,   // (income: NewIncome) => Promise<{error?}>
  updateIncome,   // (id: string, updates: Partial<Income>) => Promise<{error?}>
  deleteIncome,   // (id: string) => Promise<{error?}>
  refetch         // () => void
} = useIncome()
```

### useAuth Hook API

```typescript
const {
  user,     // User | null
  loading,  // boolean
  signIn,   // (email: string, password: string) => Promise<{error?}>
  signUp,   // (email: string, password: string) => Promise<{error?}>
  signOut   // () => Promise<{error?}>
} = useAuth()
```

---

## Context APIs

### Theme Context API

```typescript
const {
  theme,     // 'dark' | 'light' | 'system'
  setTheme   // (theme: Theme) => void
} = useTheme()
```

**Usage:**
```typescript
import { useTheme } from '@/contexts/ThemeContext'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

### Currency Context API

```typescript
const {
  currency,        // 'PKR' | 'USD'
  setCurrency,     // (currency: Currency) => void
  formatCurrency   // (amount: number) => string
} = useCurrency()
```

**Usage:**
```typescript
import { useCurrency } from '@/contexts/CurrencyContext'

function PriceDisplay({ amount }: { amount: number }) {
  const { formatCurrency } = useCurrency()
  
  return <span>{formatCurrency(amount)}</span>
}
```

---

## Utility Functions API

### Date Utilities

```typescript
import { 
  formatDate,
  getCurrentWeekRange,
  getCurrentMonthRange,
  isExpenseInRange 
} from '@/utils/dateUtils'

// Format date
const formatted = formatDate('2025-01-15')
// Returns: "Jan 15, 2025"

// Get current week range
const weekRange = getCurrentWeekRange()
// Returns: { start: Date, end: Date }

// Get current month range
const monthRange = getCurrentMonthRange()
// Returns: { start: Date, end: Date }

// Check if expense is in range
const isInRange = isExpenseInRange(
  '2025-01-15',
  new Date('2025-01-01'),
  new Date('2025-01-31')
)
// Returns: boolean
```

### Export Utilities

```typescript
import { exportToCSV } from '@/utils/exportUtils'

// Export expenses to CSV
exportToCSV(expenses, 'my-expenses')
// Downloads: my-expenses.csv
```

### General Utilities

```typescript
import { cn } from '@/lib/utils'

// Merge Tailwind classes
const className = cn(
  'px-4 py-2',
  'bg-blue-500',
  condition && 'bg-red-500'
)
```

---

## TypeScript Type Definitions

### Expense Types
```typescript
interface Expense {
  id: string
  user_id: string
  amount: number
  category_id: string
  date: string
  description: string | null
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    color: string
  }
}

type NewExpense = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
```

### Category Types
```typescript
interface Category {
  id: string
  user_id: string
  name: string
  color: string
  type?: string  // 'income' | 'expense' | 'both'
  created_at: string
}

type NewCategory = Omit<Category, 'id' | 'user_id' | 'created_at'>
```

### Budget Types
```typescript
interface Budget {
  id: string
  user_id: string
  category_id: string | null
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    color: string
  }
}

type NewBudget = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
```

### Income Types
```typescript
interface Income {
  id: string
  user_id: string
  amount: number
  category_id: string  // Linked to categories table
  date: string
  description: string | null
  is_recurring: boolean
  recurring_period: 'weekly' | 'monthly' | 'yearly' | null
  created_at: string
  updated_at: string
  categories?: {  // Joined from categories table
    id: string
    name: string
    color: string
    type: string
  }
}

type NewIncome = Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
```

---

## Component Props Reference

### AddExpenseForm Props
```typescript
interface AddExpenseFormProps {
  categories: Category[]
  onSuccess: () => void
  onExpenseChange?: () => void
}
```

### ExpenseList Props
```typescript
interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onExpenseChange?: () => void
}
```

### ExpenseChart Props
```typescript
interface ExpenseChartProps {
  expenses: Expense[]
  categories: Category[]
}
```

### BudgetManager Props
```typescript
// No props - uses hooks internally
```

### CashFlowAnalysis Props
```typescript
// No props - uses hooks internally
```

### CategoryManager Props
```typescript
interface CategoryManagerProps {
  categories: Category[]
  onCategoryChange: () => void
}
```

---

## Environment Variables Reference

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Sentry
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Accessing Environment Variables

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

---

## Build & Deployment Commands

### Development
```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Build
```bash
npm run build
# Creates production build in dist/
```

### Preview Build
```bash
npm run preview
# Preview production build locally
```

### Lint
```bash
npm run lint
# Run ESLint on project
```

---

## Database Backup & Restore

### Backup Supabase Database
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Specific table
supabase db dump -f expenses_backup.sql --table expenses
```

### Restore Database
```bash
# Using Supabase CLI
supabase db push

# Or execute SQL file in Supabase dashboard
```

---

## Common Queries & Patterns

### Get Monthly Expense Total
```typescript
const getMonthlyTotal = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) return 0
  return data.reduce((sum, expense) => sum + expense.amount, 0)
}
```

### Get Category Breakdown
```typescript
const getCategoryBreakdown = async (userId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      amount,
      categories (
        name,
        color
      )
    `)
    .eq('user_id', userId)
  
  if (error) return []
  
  // Group by category
  const breakdown = data.reduce((acc, expense) => {
    const categoryName = expense.categories?.name || 'Unknown'
    if (!acc[categoryName]) {
      acc[categoryName] = 0
    }
    acc[categoryName] += expense.amount
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(breakdown).map(([name, amount]) => ({
    name,
    amount
  }))
}
```

### Get Budget Status
```typescript
const getBudgetStatus = async (budgetId: string) => {
  // Get budget details
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single()
  
  if (budgetError) return null
  
  // Get related expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', budget.user_id)
    .gte('date', budget.start_date)
  
  if (expensesError) return null
  
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const remaining = budget.amount - totalSpent
  const percentageUsed = (totalSpent / budget.amount) * 100
  
  return {
    budget,
    totalSpent,
    remaining,
    percentageUsed,
    isOverBudget: totalSpent > budget.amount
  }
}
```

---

## Error Handling Patterns

### Hook Error Handling
```typescript
const { expenses, error } = useExpenses()

if (error) {
  return (
    <div className="error-container">
      <p>Error loading expenses: {error.message}</p>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  )
}
```

### Async Operation Error Handling
```typescript
const handleAddExpense = async (expenseData: NewExpense) => {
  try {
    const { error } = await addExpense(expenseData)
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Success",
      description: "Expense added successfully"
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive"
    })
  }
}
```

---

## Performance Best Practices

### 1. Use React Query Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    }
  }
})
```

### 2. Memoize Expensive Calculations
```typescript
const statistics = useMemo(() => {
  return calculateExpensiveStats(expenses)
}, [expenses])
```

### 3. Debounce User Input
```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  // Search with debouncedSearch
}, [debouncedSearch])
```

### 4. Paginate Large Lists
```typescript
const PAGE_SIZE = 50

const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

### 5. Optimize Re-renders
```typescript
const ExpenseItem = memo(({ expense }: { expense: Expense }) => {
  // Component implementation
})
```

---

## Troubleshooting Guide

### Issue: Expenses not loading
**Solution:**
1. Check Supabase connection
2. Verify RLS policies
3. Check user authentication
4. Inspect browser console for errors

### Issue: Budget calculations incorrect
**Solution:**
1. Verify date range logic
2. Check expense filtering
3. Ensure timezone consistency
4. Validate budget period settings

### Issue: Theme not persisting
**Solution:**
1. Check localStorage permissions
2. Verify ThemeProvider wraps app
3. Check storageKey prop

### Issue: Currency not formatting correctly
**Solution:**
1. Verify CurrencyProvider is active
2. Check formatCurrency implementation
3. Ensure Intl.NumberFormat support

---

## Version History & Changelog

### Version 1.0.0 (Initial Release)
- Basic expense tracking
- Category management
- Budget creation and monitoring
- Income tracking
- Cash flow analysis
- Dark/Light theme
- CSV export

### Future Roadmap
- [ ] Recurring expenses
- [ ] Receipt attachments
- [ ] Multi-currency with live exchange rates
- [ ] Mobile app (React Native)
- [ ] Shared budgets
- [ ] Advanced analytics
- [ ] Goal tracking
- [ ] Data import from CSV

---

## Support & Resources

### Documentation
- Main Docs: DOCUMENTATION.md
- Component Guide: DOCUMENTATION_PART_2.md
- Build Guide: DOCUMENTATION_PART_3.md
- API Reference: API_REFERENCE.md

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com)

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

---

## License

This project is for personal use and educational purposes.

---

**End of API Reference Guide**
