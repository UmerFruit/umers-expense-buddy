# UTX Expense Buddy - Technical Documentation (Part 2)

## Component Hierarchy

### Application Root Structure

```
App (Root)
├── QueryClientProvider (TanStack Query)
├── ThemeProvider (Theme Context)
├── CurrencyProvider (Currency Context)
├── TooltipProvider (Radix UI)
├── Toaster (Toast notifications - shadcn)
├── Sonner (Alternative toast - sonner)
└── BrowserRouter (React Router)
    └── Routes
        ├── Route "/" → Index Page
        ├── Route "/auth" → Auth Page
        └── Route "*" → NotFound Page
```

### Index Page (Main Dashboard)

```
Index
├── Navigation (Top bar)
└── Dashboard (Main content)
    ├── Header Section
    │   ├── Title and description
    │   └── Action buttons
    │       ├── Categories Dialog
    │       ├── Export CSV Button
    │       └── Add Expense Dialog
    ├── Stats Cards (5 cards)
    │   ├── Monthly Income Card
    │   ├── Monthly Expenses Card
    │   ├── Net Cash Flow Card
    │   ├── Weekly Expenses Card
    │   └── Total Expenses Card
    └── Tabs Component
        ├── Overview Tab
        │   ├── Expense Chart
        │   └── Recent Expenses List
        ├── Budgets Tab
        │   └── BudgetManager Component
        ├── Income Tab
        │   └── IncomeManager Component
        ├── Cash Flow Tab
        │   └── CashFlowAnalysis Component
        └── Monthly Tab
            └── MonthlyBreakdown Component
```

### Auth Page Structure

```
Auth
├── Theme Toggle (Top right)
└── Card (Center)
    ├── Logo and Title
    └── Tabs
        ├── Sign In Tab
        │   └── Sign In Form
        │       ├── Email Input
        │       ├── Password Input
        │       └── Submit Button
        └── Sign Up Tab
            └── Sign Up Form
                ├── Email Input
                ├── Password Input
                ├── Confirm Password Input
                └── Submit Button
```

---

## Data Flow & State Management

### State Management Architecture

The application uses a hybrid state management approach:

#### 1. Server State (TanStack Query)
**Purpose:** Managing data from Supabase (expenses, categories, budgets, income)

**Query Client Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (can be configured)
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
})
```

**Usage Pattern:**
- Custom hooks (useExpenses, useBudgets, useIncome) encapsulate queries
- Automatic background refetching
- Optimistic updates
- Error handling

#### 2. Global Client State (React Context)

**Theme Context:**
```typescript
interface ThemeContextType {
  theme: 'dark' | 'light' | 'system'
  setTheme: (theme) => void
}
```
- Manages UI theme preference
- Persists to localStorage
- Syncs with system preferences

**Currency Context:**
```typescript
interface CurrencyContextType {
  currency: 'PKR' | 'USD'
  setCurrency: (currency) => void
  formatCurrency: (amount: number) => string
}
```
- Manages currency display preference
- Provides formatting function
- Available globally

#### 3. Local Component State (useState)
- Form inputs
- Dialog open/close states
- Loading states
- Temporary UI state

### Data Flow Patterns

#### Creating a New Expense (Complete Flow)

```
User Action: Click "Add Expense"
    ↓
Component: Dashboard sets showAddExpense = true
    ↓
UI: Dialog opens with AddExpenseForm
    ↓
User Action: Fill form and submit
    ↓
Component: AddExpenseForm validates data
    ↓
Hook: useExpenses.addExpense() called
    ↓
API: Supabase INSERT query
    {
      amount: number,
      category_id: string,
      date: string,
      description: string | null,
      user_id: string (from auth)
    }
    ↓
Database: Row Level Security check (auth.uid() = user_id)
    ↓
Success Response
    ↓
Hook: useExpenses.fetchExpenses() called
    ↓
Component: ExpenseList re-renders with new data
    ↓
UI: Toast notification shown
    ↓
Component: Dialog closes
```

#### Budget Progress Calculation Flow

```
User opens Budget Manager
    ↓
Hook: useBudgets.fetchBudgets()
    ↓
Hook: useExpenses (already cached via React Query)
    ↓
Component: BudgetManager receives both datasets
    ↓
Function: getBudgetProgress(budget)
    {
      Filter expenses by:
        - Date range (start_date to end_date or ongoing)
        - Category (if category-specific budget)
      
      Calculate:
        totalSpent = sum(filtered expenses)
        percentage = (totalSpent / budget.amount) * 100
        remaining = budget.amount - totalSpent
        isOverBudget = totalSpent > budget.amount
    }
    ↓
UI: Render budget cards with:
    - Progress bar
    - Status indicators
    - Color coding
```

---

## Custom Hooks Documentation

### 1. useAuth Hook

**Location:** `src/hooks/useAuth.ts`

**Purpose:** Manages authentication state and operations.

**Interface:**
```typescript
interface UseAuthReturn {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{error: Error | null}>
  signUp: (email: string, password: string) => Promise<{error: Error | null}>
  signOut: () => Promise<{error: Error | null}>
}
```

**Implementation Details:**
- Listens to Supabase auth state changes
- Manages user session
- Provides authentication methods
- Auto-refreshes on session expiry

**Usage:**
```typescript
const { user, loading, signIn, signOut } = useAuth()

// Protected route check
if (!loading && !user) {
  return <Navigate to="/auth" />
}
```

### 2. useExpenses Hook

**Location:** `src/hooks/useExpenses.ts`

**Purpose:** Manages expense and category data operations.

**Interface:**
```typescript
interface UseExpensesReturn {
  expenses: Expense[]
  categories: Category[]
  loading: boolean
  addExpense: (expense: NewExpense) => Promise<{error?}>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<{error?}>
  deleteExpense: (id: string) => Promise<{error?}>
  addCategory: (category: NewCategory) => Promise<{error?}>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{error?}>
  deleteCategory: (id: string) => Promise<{error?}>
  refetch: () => void
}

interface Category {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
  type?: 'income' | 'expense' | 'both'
}
```

**Data Fetching:**
```typescript
// Expenses with category join
const { data, error } = await supabase
  .from('expenses')
  .select(`
    *,
    categories (
      id,
      name,
      color,
      type
    )
  `)
  .order('date', { ascending: false })
```

**Features:**
- Automatic data refresh after mutations
- Optimistic updates
- Error handling with toast notifications
- Safe category deletion (checks usage in both expenses and income)
- Category type filtering for expense/income forms
- Backward compatibility for categories without type field

### 3. useBudgets Hook

**Location:** `src/hooks/useBudgets.ts`

**Purpose:** Manages budget CRUD operations.

**Interface:**
```typescript
interface UseBudgetsReturn {
  budgets: Budget[]
  loading: boolean
  createBudget: (budget: NewBudget) => Promise<{error?}>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<{error?}>
  deleteBudget: (id: string) => Promise<{error?}>
  refetch: () => void
}
```

**Special Features:**
- Joins with categories table
- Filters by user_id
- Supports both category-specific and overall budgets

### 4. useIncome Hook

**Location:** `src/hooks/useIncome.ts`

**Purpose:** Manages income record operations.

**Interface:**
```typescript
interface UseIncomeReturn {
  income: Income[]
  loading: boolean
  createIncome: (income: NewIncome) => Promise<{error?}>
  updateIncome: (id: string, updates: Partial<Income>) => Promise<{error?}>
  deleteIncome: (id: string) => Promise<{error?}>
  refetch: () => void
}

interface Income {
  id: string
  user_id: string
  amount: number
  category_id: string
  date: string
  description: string | null
  is_recurring: boolean
  recurring_period: 'weekly' | 'monthly' | 'yearly' | null
  created_at: string
  categories?: {
    id: string
    name: string
    color: string
    type?: string
  }
}
```

**Data Fetching:**
```typescript
// Income with category join
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
  .order('date', { ascending: false })
```

**Features:**
- Supports recurring income tracking
- Date-based filtering
- Category-based organization (uses categories instead of text source)
- Color-coded visual representation
- Joined category data for display

---

## Component Details

### Core Components

#### 1. Dashboard Component

**Location:** `src/components/Dashboard.tsx`

**Purpose:** Main application view showing all financial data.

**State Management:**
```typescript
const [showAddExpense, setShowAddExpense] = useState(false)
const [showCategories, setShowCategories] = useState(false)
```

**Data Dependencies:**
- useExpenses hook (expenses, categories)
- useIncome hook (income)
- useCurrency context

**Computed Metrics (useMemo):**
```typescript
const { 
  weeklyExpenses,    // Expenses in current week
  monthlyExpenses,   // Expenses in current month
  weeklyTotal,       // Sum of weekly expenses
  monthlyTotal,      // Sum of monthly expenses
  totalExpenses,     // All-time total
  recentExpenses,    // Latest 5 expenses
  monthlyIncome,     // Current month income
  weeklyIncome,      // Current week income
  netMonthlyFlow     // Monthly income - monthly expenses
} = useMemo(() => {
  // Calculations...
}, [expenses, income])
```

**Sections:**
1. **Header:** Title, description, action buttons
2. **Stats Cards:** 5 metric cards with icons and values
3. **Tabs:**
   - Overview: Chart + Recent Expenses
   - Budgets: Budget management
   - Income: Income tracking
   - Cash Flow: Financial analysis
   - Monthly: Historical breakdown

#### 2. AddExpenseForm Component

**Location:** `src/components/AddExpenseForm.tsx`

**Purpose:** Form for creating new expenses.

**Props:**
```typescript
interface AddExpenseFormProps {
  categories: Category[]
  onSuccess: () => void
  onExpenseChange?: () => void
}
```

**Form State:**
```typescript
const [formData, setFormData] = useState({
  amount: '',
  category_id: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
})
```

**Validation Rules:**
- Amount: Required, positive number
- Category: Required
- Date: Required
- Description: Optional

**Submission Flow:**
1. Validate all fields
2. Parse amount to float
3. Call addExpense from useExpenses
4. Show success/error toast
5. Reset form
6. Trigger callbacks (onExpenseChange, onSuccess)

#### 3. ExpenseList Component

**Location:** `src/components/ExpenseList.tsx`

**Purpose:** Display list of expenses with edit/delete actions.

**Props:**
```typescript
interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onExpenseChange?: () => void
}
```

**Features:**
- Responsive card layout
- Color-coded category indicators
- Formatted dates and amounts
- Dropdown menu for actions
- Edit dialog (opens EditExpenseForm)
- Delete confirmation

**Item Display:**
- Category color dot
- Description (or "No description")
- Date (formatted)
- Category badge
- Amount (formatted with currency)
- Actions menu

#### 4. ExpenseChart Component

**Location:** `src/components/ExpenseChart.tsx`

**Purpose:** Visualize expenses by category.

**Props:**
```typescript
interface ExpenseChartProps {
  expenses: Expense[]
  categories: Category[]
}
```

**Chart Implementation:**
- Custom bar chart (not using recharts)
- Horizontal bars with category colors
- Shows amount and percentage
- Sorted by amount (descending)

**Calculation:**
```typescript
// Group by category
categoryTotals = expenses.reduce((acc, expense) => {
  acc[expense.category_id] += expense.amount
  return acc
}, {})

// Calculate percentages
totalValue = sum(all amounts)
percentage = (categoryAmount / maxValue) * 100
share = (categoryAmount / totalValue) * 100
```

#### 5. BudgetManager Component

**Location:** `src/components/BudgetManager.tsx`

**Purpose:** Manage and track budget progress.

**Key Functions:**
```typescript
getBudgetProgress(budget) {
  // Filter relevant expenses
  const relevantExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const isInDateRange = expenseDate >= startDate && 
                          (!endDate || expenseDate <= endDate)
    const isInCategory = !budget.category_id || 
                         expense.category_id === budget.category_id
    return isInDateRange && isInCategory
  })
  
  // Calculate metrics
  const totalSpent = sum(relevantExpenses)
  const percentage = (totalSpent / budget.amount) * 100
  const remaining = budget.amount - totalSpent
  const isOverBudget = totalSpent > budget.amount
  
  return { totalSpent, percentage, isOverBudget, remaining }
}
```

**Visual Elements:**
- Budget cards with progress bars
- Over-budget warning indicators
- Active/Inactive badges
- Category and period labels
- Add budget dialog

#### 6. CashFlowAnalysis Component

**Location:** `src/components/CashFlowAnalysis.tsx`

**Purpose:** Comprehensive financial health dashboard.

**Computed Metrics:**
```typescript
const cashFlowData = useMemo(() => {
  // Current month income
  const monthlyIncome = sum(income in current month)
  
  // Current month expenses
  const monthlyExpenses = sum(expenses in current month)
  
  // Net cash flow
  const netCashFlow = monthlyIncome - monthlyExpenses
  const isPositive = netCashFlow > 0
  
  // Savings rate
  const savingsRate = (netCashFlow / monthlyIncome) * 100
  
  // Expense ratio
  const expenseRatio = (monthlyExpenses / monthlyIncome) * 100
  
  // All-time totals
  const totalIncome = sum(all income)
  const totalExpenses = sum(all expenses)
  const totalNetWorth = totalIncome - totalExpenses
  
  return { /* all metrics */ }
}, [income, expenses])
```

**Status Determination:**
```typescript
getCashFlowStatus() {
  if (netCashFlow > 0) {
    return {
      icon: TrendingUp,
      color: 'text-green-600',
      status: 'Positive Cash Flow',
      description: 'Your income exceeds your expenses'
    }
  } else if (netCashFlow < 0) {
    return {
      icon: TrendingDown,
      color: 'text-red-600',
      status: 'Negative Cash Flow',
      description: 'Your expenses exceed your income'
    }
  } else {
    return {
      icon: DollarSign,
      color: 'text-yellow-600',
      status: 'Break Even',
      description: 'Your income equals your expenses'
    }
  }
}
```

#### 7. IncomeManager Component

**Location:** `src/components/IncomeManager.tsx`

**Purpose:** Manage income sources and view income history.

**Tabs:**
1. **Overview:**
   - Total income card
   - Monthly income card
   - Recurring sources card
   - Recent income list
   - Empty state with call-to-action

2. **History:**
   - Complete income history
   - Filter by date
   - Edit/delete actions

3. **Analysis:**
   - Income trends
   - Source breakdown
   - Recurring vs one-time comparison

#### 8. MonthlyBreakdown Component

**Location:** `src/components/MonthlyBreakdown.tsx`

**Purpose:** Show 12-month financial history.

**Data Calculation:**
```typescript
const monthlyData = useMemo(() => {
  const months = []
  const now = new Date()
  
  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    
    // Filter income for this month
    const monthIncome = income.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate.getFullYear() === date.getFullYear() && 
             itemDate.getMonth() === date.getMonth()
    })
    
    // Filter expenses for this month
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === date.getFullYear() && 
             expenseDate.getMonth() === date.getMonth()
    })
    
    const totalIncome = sum(monthIncome)
    const totalExpenses = sum(monthExpenses)
    
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      income: totalIncome,
      expenses: totalExpenses,
      netFlow: totalIncome - totalExpenses,
      incomeCount: monthIncome.length,
      expenseCount: monthExpenses.length
    })
  }
  
  return months
}, [income, expenses])
```

**Displayed Information:**
- Current month summary (3 cards)
- 12-month averages
- Monthly comparison table
- Trend indicators

#### 9. Navigation Component

**Location:** `src/components/Navigation.tsx`

**Purpose:** Top navigation bar with branding and user actions.

**Elements:**
- **Left:** UTX logo and title
- **Right (when authenticated):**
  - User email (hidden on mobile)
  - Currency switcher
  - Theme toggle
  - User menu dropdown
    - Sign Out option

**Responsive Design:**
- Sticky positioning
- Backdrop blur effect
- Mobile-optimized spacing
- Conditional element hiding

#### 10. CategoryManager Component

**Location:** `src/components/CategoryManager.tsx`

**Purpose:** Add, edit, and delete expense categories.

**Props:**
```typescript
interface CategoryManagerProps {
  categories: Category[]
  onCategoryChange: () => void
}
```

**Features:**
- Add new category form
  - Name input
  - Color picker (input type="color")
  - Preview of selected color
- Category list
  - Color indicator
  - Name
  - Edit/Delete actions
- Delete confirmation dialog
- Cascade delete warning (deletes all associated expenses)

---

