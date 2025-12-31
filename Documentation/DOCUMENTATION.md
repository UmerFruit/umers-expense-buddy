# UTX Expense Buddy - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Application Structure](#application-structure)
5. [Feature Documentation](#feature-documentation)
6. [Component Hierarchy](#component-hierarchy)
7. [Data Flow & State Management](#data-flow--state-management)
8. [Authentication System](#authentication-system)
9. [UI Components](#ui-components)
10. [Utilities & Helpers](#utilities--helpers)
11. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

**Project Name:** UTX Expense Buddy  
**Purpose:** A comprehensive personal finance management application for tracking expenses, managing budgets, monitoring income, and analyzing cash flow.

**Key Value Proposition:**
- Multi-currency support (PKR and USD)
- Real-time expense tracking with visual analytics
- Budget management with overspending alerts
- Income tracking with recurring income support
- Cash flow analysis and financial health monitoring
- Dark/Light theme support
- Export data to CSV
- Category-based expense organization

**Target Users:** Individuals seeking to manage personal finances, track spending habits, and maintain budgets.

---

## Architecture & Technology Stack

### Frontend Framework
- **React 18.3.1** - Core UI library
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Build tool and dev server

### UI Framework & Components
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives
  - Alert Dialog, Dropdown Menu, Dialog, Popover, Select, Tabs, etc.
- **Shadcn/ui** - Pre-built component library built on Radix UI
- **Lucide React** - Icon library
- **Recharts 3.1.2** - Chart visualization library

### Backend & Database
- **Supabase 2.56.1** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email/Password)
  - Row Level Security (RLS)
  - Real-time subscriptions

### State Management & Data Fetching
- **TanStack React Query (v5.83.0)** - Server state management
- **React Context API** - Global state (Theme, Currency)
- **Custom Hooks** - Business logic encapsulation

### Form Handling & Validation
- **React Hook Form 7.61.1** - Form state management
- **Zod 3.25.76** - Schema validation

### Routing
- **React Router DOM 6.30.1** - Client-side routing

### Date Handling
- **date-fns 3.6.0** - Date manipulation and formatting

### Other Notable Libraries
- **next-themes** - Theme management
- **sonner** - Toast notifications
- **cmdk** - Command menu component
- **class-variance-authority** - CSS class management
- **tailwind-merge** - Tailwind class merging utility

---

## Database Schema

### Tables Overview

The application uses 4 main tables with Row Level Security (RLS) policies:

#### 1. **categories** Table
Stores user-defined categories for both expenses and income.

**Schema:**
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
name            TEXT NOT NULL
color           TEXT DEFAULT '#3B82F6'
type            TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'both'))
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

**Category Types:**
- **expense**: Used only for expenses
- **income**: Used only for income
- **both**: Can be used for both expenses and income

**Default Categories:**
When a user signs up, 10 default categories are automatically created:

*Expense Categories:*
- Food & Dining (Red: #EF4444) - type: 'expense'
- Transportation (Blue: #3B82F6) - type: 'expense'
- Entertainment (Purple: #8B5CF6) - type: 'expense'
- Utilities (Amber: #F59E0B) - type: 'expense'
- Healthcare (Green: #10B981) - type: 'expense'
- Shopping (Pink: #EC4899) - type: 'expense'

*Income Categories:*
- Salary (Green: #22C55E) - type: 'income'
- Freelance (Lime: #84CC16) - type: 'income'
- Investment (Amber: #F59E0B) - type: 'income'

*Shared Category:*
- Other (Gray: #6B7280) - type: 'both'

**RLS Policies:**
- Users can only view/create/update/delete their own categories
- Enforced using `auth.uid() = user_id` checks
- Categories are automatically deleted if they're not being used by any expenses or income

#### 2. **expenses** Table
Stores all user expense transactions.

**Schema:**
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
amount          DECIMAL(10,2) NOT NULL
category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE
date            DATE NOT NULL DEFAULT CURRENT_DATE
description     TEXT (nullable)
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

**Triggers:**
- Automatic `updated_at` timestamp update on modification

**RLS Policies:**
- Users can only view/create/update/delete their own expenses
- Cascade delete: Deleting a category deletes all associated expenses

#### 3. **budgets** Table
Stores user budget configurations.

**Schema:**
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
category_id     UUID (nullable) REFERENCES categories(id) ON DELETE CASCADE
name            TEXT NOT NULL
amount          DECIMAL(10,2) NOT NULL
period          TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly'))
start_date      DATE NOT NULL DEFAULT CURRENT_DATE
end_date        DATE (nullable)
is_active       BOOLEAN NOT NULL DEFAULT true
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

**Indexes:**
- `idx_budgets_user_id` - Query optimization for user budgets
- `idx_budgets_category_id` - Quick category-based budget lookups
- `idx_budgets_period` - Filter by budget period
- `idx_budgets_is_active` - Filter active budgets

**Budget Types:**
- **Category Budget:** Linked to specific category (`category_id` not null)
- **Overall Budget:** Applies to all expenses (`category_id` is null)

**RLS Policies:**
- Users can only manage their own budgets

#### 4. **income** Table
Stores user income records.

**Schema:**
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
amount              DECIMAL(10,2) NOT NULL
category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE
date                DATE NOT NULL DEFAULT CURRENT_DATE
description         TEXT (nullable)
is_recurring        BOOLEAN NOT NULL DEFAULT false
recurring_period    TEXT CHECK (recurring_period IN ('weekly', 'monthly', 'yearly'))
created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
```

**Key Changes:**
- **category_id** replaces the old `source` field
- Income entries are now linked to categories with type='income' or type='both'
- Categories provide consistent color coding across income and expenses

**Indexes:**
- `idx_income_user_id` - User income queries
- `idx_income_category_id` - Quick category-based filtering
- `idx_income_date` - Date-based filtering
- `idx_income_is_recurring` - Quick recurring income identification

**Income Types:**
- **One-time Income:** `is_recurring = false`
- **Recurring Income:** `is_recurring = true` with specified period

**RLS Policies:**
- Users can only manage their own income records

---

## Application Structure

### Project File Organization

```
umers-expense-buddy/
├── public/
│   ├── _redirects           # Netlify/Vercel redirect rules
│   └── robots.txt           # Search engine directives
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (Shadcn)
│   │   ├── AddExpenseForm.tsx
│   │   ├── AddBudgetForm.tsx
│   │   ├── AddIncomeForm.tsx
│   │   ├── BudgetManager.tsx
│   │   ├── CashFlowAnalysis.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── CurrencySwitcher.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EditExpenseForm.tsx
│   │   ├── EditBudgetForm.tsx
│   │   ├── ExpenseChart.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── IncomeAnalysis.tsx
│   │   ├── IncomeManager.tsx
│   │   ├── MonthlyBreakdown.tsx
│   │   └── Navigation.tsx
│   ├── contexts/           # React Context providers
│   │   ├── CurrencyContext.tsx
│   │   ├── DataRefreshContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useBudgets.ts
│   │   ├── useExpenses.ts
│   │   ├── useIncome.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/       # External service integrations
│   │   └── supabase/
│   │       ├── client.ts   # Supabase client configuration
│   │       └── types.ts    # Auto-generated TypeScript types
│   ├── lib/
│   │   └── utils.ts        # General utility functions
│   ├── pages/              # Page components
│   │   ├── Auth.tsx        # Login/Signup page
│   │   ├── Index.tsx       # Main dashboard page
│   │   └── NotFound.tsx    # 404 page
│   ├── utils/              # Utility functions
│   │   ├── dateUtils.ts    # Date formatting and manipulation
│   │   └── exportUtils.ts  # CSV export functionality
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── migrations/         # Database migration files
│   │   ├── 20250830162423_*.sql  # Initial schema
│   │   ├── 20250830162445_*.sql  # Security fixes
│   │   └── 20250831000000_*.sql  # Budgets and income tables
│   └── config.toml         # Supabase local config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── vercel.json             # Vercel deployment config
```

---

## Feature Documentation

### 1. Expense Tracking

**Purpose:** Record, view, edit, and delete expense transactions.

**Core Functionality:**

#### Adding Expenses
- **Form Fields:**
  - Amount (required, decimal, minimum 0.01)
  - Date (required, date picker, defaults to today)
  - Category (required, dropdown with color indicators)
  - Description (optional, textarea)

- **Validation:**
  - Amount must be a positive number
  - Category must be selected
  - Date is required

- **Process Flow:**
  1. User clicks "Add Expense" button
  2. Dialog opens with AddExpenseForm
  3. User fills form and submits
  4. Data validated on client-side
  5. Supabase insert query executed
  6. Success/error toast notification
  7. Expense list automatically refreshes
  8. Dialog closes

#### Viewing Expenses
- **Display Modes:**
  - List view with pagination
  - Recent expenses in dashboard (latest 5)
  - Monthly expense view
  - Category-based grouping in charts

- **Information Shown:**
  - Amount (formatted with currency symbol)
  - Description
  - Category name with color indicator
  - Date (formatted as "MMM dd, yyyy")
  - Actions menu (edit/delete)

#### Editing Expenses
- Same form as adding, pre-filled with existing data
- Updates preserve created_at, auto-updates updated_at
- Real-time list refresh after update

#### Deleting Expenses
- Confirmation dialog before deletion
- Cascade delete from database
- Toast notification on success/failure

#### Expense Charts
- **Simple Bar Chart Visualization:**
  - Groups expenses by category
  - Shows total amount per category
  - Displays percentage of total
  - Color-coded bars matching category colors
  - Sorted by amount (descending)

### 2. Budget Management

**Purpose:** Set spending limits and track progress against budgets.

**Core Functionality:**

#### Creating Budgets
- **Form Fields:**
  - Name (required, e.g., "Monthly Groceries")
  - Amount (required, budget limit)
  - Period (weekly/monthly/yearly)
  - Category (optional, for category-specific budgets)
  - Start Date (defaults to today)
  - End Date (optional, for fixed-term budgets)
  - Active Status (boolean, defaults to true)

- **Budget Types:**
  1. **Overall Budget:** No category selected, tracks all expenses
  2. **Category Budget:** Specific category, tracks only that category

#### Budget Progress Tracking
- **Calculation Logic:**
  ```typescript
  relevantExpenses = expenses.filter(expense => {
    isInDateRange && 
    (isAllCategories || expense.category_id === budget.category_id)
  })
  totalSpent = sum(relevantExpenses)
  percentage = (totalSpent / budgetAmount) * 100
  remaining = budgetAmount - totalSpent
  isOverBudget = totalSpent > budgetAmount
  ```

- **Visual Indicators:**
  - Progress bar (0-100%)
  - Color coding:
    - Normal: Default theme color
    - Over budget: Red/destructive color
  - Alert icon for over-budget scenarios
  - Remaining amount display

#### Budget Display
- Card-based layout
- Shows: Name, category, period, amount, status badge
- Progress section with visual bar
- Date range information
- Actions: Edit, Delete

### 3. Income Tracking

**Purpose:** Record and manage income sources for cash flow analysis.

**Core Functionality:**

#### Adding Income
- **Form Fields:**
  - Amount (required)
  - Category (required, dropdown selection from income/both categories)
  - Date (required)
  - Description (optional)
  - Is Recurring (boolean checkbox)
  - Recurring Period (if recurring: weekly/monthly/yearly)

- **Category Selection:**
  - Displays categories with type 'income' or 'both'
  - Color-coded category badges
  - Can create new income categories via Category Manager

- **Income Types:**
  1. **One-time Income:** Single transaction (is_recurring = false)
  2. **Recurring Income:** Regular income with specified frequency

#### Income Statistics
- **Dashboard Metrics:**
  - Total income (all time)
  - Monthly income (current month)
  - Weekly income (current week)
  - Number of recurring sources
  - Income count

#### Income Analysis
- Monthly breakdown visualization
- Category-based grouping and filtering
- Trend analysis
- Comparison with expenses
- Visual representation by income categories

### 4. Cash Flow Analysis

**Purpose:** Comprehensive financial health monitoring.

**Core Metrics:**

#### Monthly Metrics
- **Monthly Income:** Sum of all income in current month
- **Monthly Expenses:** Sum of all expenses in current month
- **Net Cash Flow:** Income - Expenses
- **Savings Rate:** (Net Cash Flow / Income) × 100

#### Financial Health Indicators
- **Expense Ratio:** (Expenses / Income) × 100
  - < 50%: Excellent
  - 50-80%: Good
  - 80-100%: Warning
  - > 100%: Critical (spending exceeds income)

- **Cash Flow Status:**
  - Positive (income > expenses): Green indicator
  - Negative (expenses > income): Red indicator
  - Break Even (income = expenses): Yellow indicator

#### Overall Financial Health
- **Total Income:** All-time income sum
- **Total Expenses:** All-time expense sum
- **Net Worth:** Total Income - Total Expenses

### 5. Monthly Breakdown

**Purpose:** Historical view of financial trends.

**Functionality:**
- **12-Month Rolling View:**
  - Shows last 12 months of data
  - For each month:
    - Total income
    - Total expenses
    - Net cash flow
    - Income count
    - Expense count

- **Average Calculations:**
  - Average monthly income
  - Average monthly expenses
  - Average net cash flow

- **Visualization:**
  - Card-based display
  - Color-coded values
  - Trend indicators

### 6. Category Management

**Purpose:** Organize expenses into custom categories.

**Functionality:**

#### Adding Categories
- Name (required)
- Type (required: 'expense', 'income', or 'both')
- Color picker (default: #3B82F6)
- Color preview

#### Category Types
- **expense:** Only appears in expense forms
- **income:** Only appears in income forms
- **both:** Appears in both expense and income forms

#### Editing Categories
- Update name
- Update type
- Change color
- Updates reflect across all associated expenses and income

#### Deleting Categories
- Confirmation required
- Safe deletion: Checks if category is used in expenses OR income
- Cannot delete if any transactions exist (data integrity)
- Prevents orphaned records in both expenses and income tables

#### Default Categories
Auto-created on user signup (10 categories):

**Expense Categories (6):**
1. Food & Dining - Red (#EF4444) - type: expense
2. Transportation - Blue (#3B82F6) - type: expense
3. Entertainment - Purple (#A855F7) - type: expense
4. Utilities - Amber (#F59E0B) - type: expense
5. Healthcare - Green (#10B981) - type: expense
6. Shopping - Pink (#EC4899) - type: expense

**Income Categories (3):**
7. Salary - Emerald (#059669) - type: income
8. Freelance - Cyan (#06B6D4) - type: income
9. Investment - Violet (#8B5CF6) - type: income

**Shared Category (1):**
10. Other - Gray (#6B7280) - type: both

**Category Creation Logic:**
- Only creates categories that don't already exist (prevents duplicates)
- Uses ON CONFLICT DO NOTHING for safe concurrent signups
- Each user gets their own set of categories (user_id scoped)

### 7. Currency Support

**Purpose:** Display amounts in user's preferred currency.

**Supported Currencies:**
- PKR (Pakistani Rupee) - Symbol: ₨
- USD (US Dollar) - Symbol: $

**Features:**
- Global currency switcher in navigation
- Context-based currency formatting
- Applies to all amount displays
- Persistent preference (could be extended with localStorage)

**Formatting Logic:**
```typescript
formatCurrency(amount) {
  formattedAmount = Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
  
  return currency === 'PKR' ? `₨${formattedAmount}` : `$${formattedAmount}`
}
```

### 8. Data Export

**Purpose:** Export expense data for external analysis.

**Functionality:**
- **CSV Export:**
  - Columns: Date, Amount, Category, Description
  - UTF-8 encoding
  - Automatic download
  - Filename: `utx-expenses.csv`

**Export Process:**
1. User clicks "Export CSV" button
2. All expenses converted to CSV format
3. Browser download triggered
4. File saved locally

### 9. Theme System

**Purpose:** User interface customization.

**Theme Options:**
- **Light:** Light background, dark text
- **Dark:** Dark background, light text
- **System:** Matches OS preference

**Features:**
- Persistent theme storage (localStorage)
- Smooth transitions
- Respects system color scheme changes
- Applied globally via CSS classes

**Implementation:**
- React Context for theme state
- CSS class toggling on document root
- Tailwind CSS dark mode variants

### 10. Authentication System

**Purpose:** Secure user access and data isolation.

**Authentication Provider:** Supabase Auth

**Supported Methods:**
- Email/Password authentication

**Features:**

#### Sign Up
- Email validation
- Password requirements (min 6 characters)
- Password confirmation matching
- Email verification (optional)
- Auto-creates default categories

#### Sign In
- Email/password validation
- Session management
- Persistent authentication
- Error handling

#### Session Management
- JWT-based tokens
- Auto-refresh on token expiry
- Logout functionality

#### Protected Routes
- Redirect to /auth if not authenticated
- Redirect to / if authenticated on auth page
- Loading states during auth checks

---

