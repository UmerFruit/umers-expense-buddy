// Import Page Component - Bank Statement Import
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Sidebar } from '@/components/Sidebar';
import { ImportTransactions } from '@/components/ImportTransactions';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const Import = () => {
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Import Bank Statement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDF or CSV files to automatically import your transactions
          </p>
        </div>
        
        <ImportTransactions />
      </main>
    </div>
  );
};

export default Import;
