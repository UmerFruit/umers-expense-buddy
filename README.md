# UTX Expense Buddy

A comprehensive personal finance management application built with React, TypeScript, and Supabase. Track your expenses, manage budgets, monitor income, and analyze your cash flow all in one place.

## 🚀 Features

### 💰 Expense Tracking
- Add, edit, and delete expenses
- Categorize expenses with custom categories
- Real-time expense tracking with visual charts
- Export expenses to CSV format

### 🌙 Dark Mode
- Toggle between light, dark, and system themes
- Persistent theme preference
- Beautifully designed dark mode interface

### 🎯 Budget Management
- Create budgets by category or for all expenses
- Set weekly, monthly, or yearly budget periods
- Visual progress tracking with alerts for overspending
- Budget vs actual spending analysis

### 📈 Income Tracking
- Record one-time and recurring income sources
- Track income from multiple sources (salary, freelance, investments)
- Categorize income by source and frequency

### 💳 Cash Flow Analysis
- Complete financial overview with income vs expenses
- Monthly cash flow tracking
- Savings rate calculation
- Net worth tracking
- Financial health indicators

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Charts**: Recharts
- **Form Handling**: React Hook Form, Zod validation
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/UmerFruit/umers-expense-buddy.git
cd umers-expense-buddy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# Apply the migrations to your Supabase database
# You can use the Supabase CLI or run the SQL files directly in the Supabase dashboard
```

5. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Schema

The application uses the following main tables:

### Expenses
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `amount` (Decimal)
- `category_id` (UUID, Foreign Key to categories)
- `date` (Date)
- `description` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

### Categories
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `name` (Text)
- `color` (Text)
- `created_at` (Timestamp)

### Budgets
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `category_id` (UUID, Foreign Key to categories, Optional)
- `name` (Text)
- `amount` (Decimal)
- `period` (Enum: weekly, monthly, yearly)
- `start_date`, `end_date` (Dates)
- `is_active` (Boolean)
- `created_at`, `updated_at` (Timestamps)

### Income
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `amount` (Decimal)
- `source` (Text)
- `date` (Date)
- `description` (Text, Optional)
- `is_recurring` (Boolean)
- `recurring_period` (Enum: weekly, monthly, yearly, Optional)
- `created_at`, `updated_at` (Timestamps)

## 🎨 UI Components

The application uses a comprehensive design system with:

- **Color System**: HSL-based theming for perfect dark mode support
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standardized spacing scale
- **Components**: Reusable UI components built with Radix UI primitives

## 🔐 Authentication

- User authentication powered by Supabase Auth
- Row Level Security (RLS) for data protection
- Automatic user session management

## 📱 Responsive Design

- Mobile-first design approach
- Responsive navigation and layouts
- Touch-friendly interfaces

## 🚦 Getting Started

1. **Sign up/Sign in**: Create an account or sign in with existing credentials
2. **Add Categories**: Set up expense categories to organize your spending
3. **Record Expenses**: Start tracking your daily expenses
4. **Set Up Income**: Add your income sources for complete financial tracking
5. **Create Budgets**: Set spending limits to control your finances
6. **Monitor Cash Flow**: Use the cash flow analysis to understand your financial health

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── AddExpenseForm.tsx
│   ├── BudgetManager.tsx
│   ├── CashFlowAnalysis.tsx
│   ├── Dashboard.tsx
│   ├── IncomeManager.tsx
│   └── ...
├── contexts/           # React contexts
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   ├── useBudgets.ts
│   ├── useExpenses.ts
│   ├── useIncome.ts
│   └── ...
├── integrations/       # External service integrations
│   └── supabase/
├── lib/               # Utility libraries
├── pages/             # Page components
├── utils/             # Utility functions
└── ...
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

Made with ❤️ by [Umer Farooq](https://github.com/UmerFruit)
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8650771b-4906-47a3-bec1-2b5ea2187f8f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
