# UTX Expense Buddy - Technical Documentation (Part 3)

## Utilities & Helper Functions

### Date Utilities (`src/utils/dateUtils.ts`)

**Purpose:** Centralized date manipulation and formatting functions.

#### Functions:

**1. formatDate**
```typescript
export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'MMM dd, yyyy')
}
```
- Input: ISO date string or Date object
- Output: "Jan 15, 2025"
- Used: Expense lists, budget dates, income dates

**2. getCurrentWeekRange**
```typescript
export const getCurrentWeekRange = () => {
  const now = new Date()
  return {
    start: startOfWeek(now),  // Sunday
    end: endOfWeek(now)        // Saturday
  }
}
```
- Returns: Object with start and end Date objects
- Used: Dashboard weekly stats

**3. getCurrentMonthRange**
```typescript
export const getCurrentMonthRange = () => {
  const now = new Date()
  return {
    start: startOfMonth(now),  // First day of month
    end: endOfMonth(now)       // Last day of month
  }
}
```
- Returns: Object with start and end Date objects
- Used: Dashboard monthly stats, cash flow analysis

**4. isExpenseInRange**
```typescript
export const isExpenseInRange = (
  expenseDate: string, 
  start: Date, 
  end: Date
) => {
  return isWithinInterval(new Date(expenseDate), { start, end })
}
```
- Input: Date to check, start date, end date
- Output: Boolean
- Used: Filtering expenses by date range

### Export Utilities (`src/utils/exportUtils.ts`)

**Purpose:** Export functionality for data portability.

**exportToCSV Function:**
```typescript
export const exportToCSV = (
  expenses: Expense[], 
  filename: string = 'expenses'
) => {
  // 1. Create CSV headers
  const headers = ['Date', 'Amount', 'Category', 'Description']
  
  // 2. Transform expense data to rows
  const rows = expenses.map(expense => [
    expense.date,
    expense.amount.toString(),
    expense.categories?.name || 'Unknown',
    expense.description || ''
  ])
  
  // 3. Combine headers and rows, escape fields
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  // 4. Create Blob with UTF-8 encoding
  const blob = new Blob([csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  
  // 5. Create download link and trigger
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

**Usage:**
```typescript
// In Dashboard component
const handleExportCSV = () => {
  exportToCSV(expenses, 'utx-expenses')
}
```

**CSV Output Format:**
```csv
"Date","Amount","Category","Description"
"2025-01-15","45.50","Food & Dining","Lunch at restaurant"
"2025-01-14","120.00","Shopping","New shoes"
```

---

## UI Component Library (Shadcn/ui)

The application uses Shadcn/ui components, which are built on Radix UI primitives. These are NOT imported as npm packages but rather copied into the `src/components/ui/` directory.

### Key UI Components Used:

#### 1. Button (`button.tsx`)
**Variants:**
- default: Primary button style
- destructive: Red/danger actions
- outline: Border with transparent background
- secondary: Muted background
- ghost: No background, hover effect
- link: Text link style

**Sizes:**
- default
- sm (small)
- lg (large)
- icon (square for icons only)

**Usage:**
```typescript
<Button variant="outline" size="sm">
  Click me
</Button>
```

#### 2. Card (`card.tsx`)
**Sub-components:**
- Card: Wrapper
- CardHeader: Top section
- CardTitle: Heading
- CardDescription: Subtitle
- CardContent: Main content area
- CardFooter: Bottom section

**Usage:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### 3. Dialog (`dialog.tsx`)
**Purpose:** Modal overlays for forms and confirmations.

**Sub-components:**
- Dialog: Root provider
- DialogTrigger: Opens dialog
- DialogContent: Modal content
- DialogHeader: Top section
- DialogTitle: Heading
- DialogDescription: Subtitle
- DialogFooter: Bottom section with actions

**Usage:**
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### 4. Select (`select.tsx`)
**Purpose:** Dropdown selection.

**Sub-components:**
- Select: Root
- SelectTrigger: Button to open
- SelectValue: Shows selected value
- SelectContent: Dropdown menu
- SelectItem: Menu item

**Usage:**
```typescript
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### 5. Input (`input.tsx`)
**Types:** text, number, email, password, date, etc.

**Usage:**
```typescript
<Input 
  type="number" 
  placeholder="0.00"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### 6. Textarea (`textarea.tsx`)
**Usage:**
```typescript
<Textarea 
  placeholder="Enter description..."
  rows={3}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### 7. Tabs (`tabs.tsx`)
**Sub-components:**
- Tabs: Root
- TabsList: Tab buttons container
- TabsTrigger: Individual tab button
- TabsContent: Tab panel

**Usage:**
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### 8. Badge (`badge.tsx`)
**Variants:**
- default: Primary color
- secondary: Muted color
- destructive: Red/danger
- outline: Border only

**Usage:**
```typescript
<Badge variant="secondary">Active</Badge>
```

#### 9. Progress (`progress.tsx`)
**Usage:**
```typescript
<Progress value={75} />  {/* 0-100 */}
```

#### 10. Toast (`toast.tsx`, `toaster.tsx`)
**Usage via hook:**
```typescript
const { toast } = useToast()

toast({
  title: "Success",
  description: "Operation completed",
  variant: "default" // or "destructive"
})
```

#### 11. Alert Dialog (`alert-dialog.tsx`)
**Purpose:** Confirmation dialogs.

**Sub-components:**
- AlertDialog: Root
- AlertDialogTrigger: Opens dialog
- AlertDialogContent: Modal content
- AlertDialogHeader: Top section
- AlertDialogTitle: Heading
- AlertDialogDescription: Message
- AlertDialogFooter: Actions
- AlertDialogAction: Confirm button
- AlertDialogCancel: Cancel button

**Usage:**
```typescript
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>
        Confirm
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 12. Dropdown Menu (`dropdown-menu.tsx`)
**Usage:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Styling System

### Tailwind CSS Configuration

**Location:** `tailwind.config.ts`

**Key Configuration:**
```typescript
export default {
  darkMode: ["class"],  // Class-based dark mode
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ... more extensions
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
}
```

### CSS Variables (Design Tokens)

**Location:** `src/index.css`

**Light Theme:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

**Dark Theme:**
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... */
}
```

### Responsive Design

**Breakpoints (Tailwind default):**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

**Usage:**
```typescript
<div className="grid gap-3 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-5">
  {/* Responsive grid */}
</div>
```

**Custom Breakpoint:**
```css
/* In tailwind.config.ts */
screens: {
  'xs': '475px',
  ...defaultTheme.screens,
}
```

---

## Supabase Integration

### Client Configuration

**Location:** `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
```

### Environment Variables

**Required Variables:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### TypeScript Type Generation

**Location:** `src/integrations/supabase/types.ts`

**Generated from Supabase schema using:**
```bash
supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
```

**Type Safety:**
```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'

// Row type (from SELECT)
type Expense = Tables<'expenses'>

// Insert type (for INSERT)
type NewExpense = TablesInsert<'expenses'>

// Update type (for UPDATE)
type ExpenseUpdate = TablesUpdate<'expenses'>
```

### Query Examples

**1. SELECT with JOIN:**
```typescript
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
  .order('date', { ascending: false })
```

**2. INSERT:**
```typescript
const { data, error } = await supabase
  .from('expenses')
  .insert([{
    amount: 100.50,
    category_id: 'uuid',
    date: '2025-01-15',
    description: 'Lunch',
    user_id: user.id
  }])
  .select()
```

**3. UPDATE:**
```typescript
const { data, error } = await supabase
  .from('expenses')
  .update({ amount: 150.00 })
  .eq('id', expenseId)
  .select()
```

**4. DELETE:**
```typescript
const { error } = await supabase
  .from('expenses')
  .delete()
  .eq('id', expenseId)
```

**5. Filtering:**
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', userId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false })
```

---

## Building the Application from Scratch

### Step 1: Project Setup

**1.1 Create Vite React TypeScript Project:**
```bash
npm create vite@latest umers-expense-buddy -- --template react-ts
cd umers-expense-buddy
```

**1.2 Install Core Dependencies:**
```bash
npm install react-router-dom @tanstack/react-query @supabase/supabase-js date-fns
```

**1.3 Install UI Dependencies:**
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-label @radix-ui/react-progress
```

**1.4 Install Form & Validation:**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**1.5 Install Styling:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
```

**1.6 Install Icons & Charts:**
```bash
npm install lucide-react recharts
```

**1.7 Install Theme & Utilities:**
```bash
npm install next-themes sonner cmdk vaul
```

### Step 2: Configure Tailwind

**2.1 Update `tailwind.config.ts`:**
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Add all color tokens
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

**2.2 Update `src/index.css`:**
Add all CSS variables for light and dark themes (see Styling System section).

### Step 3: Setup Supabase

**3.1 Create Supabase Project:**
- Go to supabase.com
- Create new project
- Note the project URL and anon key

**3.2 Create `.env.local`:**
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**3.3 Create Supabase Client:**
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**3.4 Run Database Migrations:**
Execute all SQL files from `supabase/migrations/` in the Supabase SQL editor or using CLI:
```bash
supabase db push
```

### Step 4: Create UI Components

**4.1 Install Shadcn CLI (Optional):**
```bash
npx shadcn-ui@latest init
```

**4.2 Add Individual Components:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
```

### Step 5: Create Context Providers

**5.1 Theme Context (`src/contexts/ThemeContext.tsx`):**
```typescript
// Copy implementation from Part 2
```

**5.2 Currency Context (`src/contexts/CurrencyContext.tsx`):**
```typescript
// Copy implementation from Feature Documentation
```

### Step 6: Create Custom Hooks

**6.1 Auth Hook (`src/hooks/useAuth.ts`):**
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, signIn, signUp, signOut }
}
```

**6.2 Expenses Hook, Budgets Hook, Income Hook:**
Implement as shown in Custom Hooks Documentation section.

### Step 7: Create Utility Functions

**7.1 Date Utils (`src/utils/dateUtils.ts`):**
Copy implementation from Utilities section.

**7.2 Export Utils (`src/utils/exportUtils.ts`):**
Copy implementation from Utilities section.

### Step 8: Create Components

Create all components as documented in Component Details section:
- Dashboard.tsx
- Navigation.tsx
- AddExpenseForm.tsx
- ExpenseList.tsx
- ExpenseChart.tsx
- BudgetManager.tsx
- AddBudgetForm.tsx
- IncomeManager.tsx
- AddIncomeForm.tsx
- CashFlowAnalysis.tsx
- MonthlyBreakdown.tsx
- CategoryManager.tsx
- EditExpenseForm.tsx

### Step 9: Create Pages

**9.1 Auth Page (`src/pages/Auth.tsx`):**
Login and signup page with tabs (see Auth Page Structure).

**9.2 Index Page (`src/pages/Index.tsx`):**
Protected main dashboard page.

**9.3 NotFound Page (`src/pages/NotFound.tsx`):**
```typescript
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p>Page not found</p>
        <Button onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
    </div>
  )
}
```

### Step 10: Setup Routing

**10.1 App.tsx:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import Index from '@/pages/Index'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <CurrencyProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

### Step 11: Build & Deploy

**11.1 Build for Production:**
```bash
npm run build
```

**11.2 Deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

Or connect GitHub repository to Vercel dashboard.

**11.3 Set Environment Variables:**
In Vercel dashboard, add:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

## Additional Features to Implement

### 1. Expense Search & Filtering
- Search by description
- Filter by category
- Date range picker
- Amount range filter

### 2. Recurring Expenses
- Set up recurring expense schedules
- Auto-generate based on frequency
- Edit/delete recurring templates

### 3. Budget Alerts
- Email notifications for overspending
- Browser notifications
- Weekly/monthly budget reports

### 4. Data Import
- CSV import for bulk expense addition
- Parse and validate CSV format
- Map columns to fields

### 5. Multi-Currency Support
- Add more currencies
- Exchange rate API integration
- Convert between currencies

### 6. Analytics Dashboard
- Spending trends over time
- Category distribution charts
- Year-over-year comparison
- Forecasting

### 7. Receipt Attachments
- Upload receipt images
- Store in Supabase Storage
- Link to expenses

### 8. Shared Budgets
- Multi-user budgets
- Family expense tracking
- Permission management

### 9. Goals & Savings
- Set financial goals
- Track progress
- Milestone celebrations

### 10. Mobile App
- React Native version
- Offline support
- Push notifications

---

## Performance Optimizations

### 1. React Query Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

### 2. Memoization
Use `useMemo` for expensive calculations:
```typescript
const statistics = useMemo(() => {
  // Heavy calculations
  return computedData
}, [dependencies])
```

### 3. Lazy Loading
```typescript
const ExpenseChart = lazy(() => import('@/components/ExpenseChart'))

<Suspense fallback={<Skeleton />}>
  <ExpenseChart />
</Suspense>
```

### 4. Pagination
Implement pagination for large expense lists:
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .range(start, end)
  .order('date', { ascending: false })
```

### 5. Debouncing
For search inputs:
```typescript
const debouncedSearch = useDebounce(searchTerm, 300)
```

---

## Security Considerations

### 1. Row Level Security (RLS)
All tables have RLS policies ensuring users can only access their own data.

### 2. Input Validation
- Client-side: React Hook Form + Zod
- Server-side: PostgreSQL constraints and triggers

### 3. Environment Variables
Never commit `.env.local` to version control.

### 4. SQL Injection Prevention
Supabase client uses parameterized queries.

### 5. XSS Prevention
React automatically escapes values in JSX.

### 6. Authentication
- Secure password storage (Supabase Auth)
- JWT tokens with expiration
- Auto-refresh tokens

---

## Testing Strategy

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react'
import { ExpenseList } from '@/components/ExpenseList'

describe('ExpenseList', () => {
  it('renders empty state', () => {
    render(<ExpenseList expenses={[]} categories={[]} />)
    expect(screen.getByText('No expenses found')).toBeInTheDocument()
  })
})
```

### Integration Tests
Test complete user flows:
- Sign up → Create expense → View dashboard

### E2E Tests (Playwright/Cypress)
```typescript
test('user can add expense', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Add Expense')
  await page.fill('input[name="amount"]', '50')
  await page.selectOption('select[name="category"]', 'Food')
  await page.click('text=Save')
  await expect(page.locator('text=50')).toBeVisible()
})
```

---

## Maintenance & Monitoring

### Error Logging
Integrate Sentry or similar:
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-dsn',
  environment: import.meta.env.MODE,
})
```

### Analytics
Google Analytics or Plausible:
```typescript
import ReactGA from 'react-ga4'

ReactGA.initialize('GA-MEASUREMENT-ID')
```

### Performance Monitoring
```typescript
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
})
```

---

## Conclusion

This documentation provides a complete blueprint for recreating the UTX Expense Buddy application. Every feature, component, database structure, and utility function has been documented with implementation details.

**Key Takeaways:**
1. Modern React with TypeScript for type safety
2. Supabase for backend (auth, database, real-time)
3. TanStack Query for efficient data fetching
4. Shadcn/ui for accessible, customizable components
5. Tailwind CSS for responsive design
6. Comprehensive financial tracking features

With this documentation, a developer can:
- Understand the complete architecture
- Recreate each component and feature
- Extend functionality with new features
- Deploy a production-ready application

**Total Time Estimate for Rebuild:** 40-60 hours for a single developer with the provided documentation.
