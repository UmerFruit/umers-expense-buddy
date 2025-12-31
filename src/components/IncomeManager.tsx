import { useState } from 'react';
import { useIncome, Income } from '@/hooks/useIncome';
import { formatCurrency } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Repeat, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditIncomeForm } from './EditIncomeForm';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

interface IncomeManagerProps {
  income?: Income[];
  onIncomeChange?: () => void;
}

export const IncomeManager = ({ income: propIncome, onIncomeChange }: IncomeManagerProps = {}) => {
  const { income: hookIncome, loading, deleteIncome, refetch } = useIncome();
  const income = propIncome ?? hookIncome;
  const handleRefetch = onIncomeChange ?? refetch;
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; income: Income | null }>({
    open: false,
    income: null,
  });

  // Calculate pagination
  const totalPages = Math.ceil(income.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncome = income.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value));
    setCurrentPage(1);
  };

  const handleDelete = async (income: Income) => {
    setConfirmDelete({ open: true, income });
  };

  const confirmDeleteIncome = async () => {
    if (!confirmDelete.income) return;

    const { error } = await deleteIncome(confirmDelete.income.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Income deleted successfully",
      });
      handleRefetch();
    }
    setConfirmDelete({ open: false, income: null });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `income-loading-skeleton-${i}`).map((key) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg">
            <div className="flex-1">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </div>
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Income */}
      {income.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No income found</p>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your income by adding one!</p>
        </div>
      )}

      {/* All Income */}
      {income.length > 0 && (
        <div className="space-y-3">
          {paginatedIncome.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-2 sm:space-y-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.categories?.color || '#6B7280' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{item.categories?.name || 'Unknown'}</p>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      {item.is_recurring && (
                        <Badge variant="secondary" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          {item.recurring_period}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-lg font-semibold text-green-600">
                  +{formatCurrency(item.amount)}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIncome(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {income.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, income.length)} of {income.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Dialog open={!!editingIncome} onOpenChange={() => setEditingIncome(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>
          {editingIncome && (
            <EditIncomeForm
              income={editingIncome}
              onSuccess={() => setEditingIncome(null)}
              onIncomeChange={handleRefetch}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, income: null })}
        title="Delete Income"
        description="Are you sure you want to delete this income entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteIncome}
        variant="destructive"
      />
    </div>
  );
};

