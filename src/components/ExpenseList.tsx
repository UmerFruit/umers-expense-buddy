// Expense list component for UTX
import { useState } from 'react';
import { formatDate, formatCurrency } from '@/utils/dateUtils';
import { Expense, Category,useExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditExpenseForm } from './EditExpenseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from './ConfirmDialog';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
}

export const ExpenseList = ({ expenses, categories }: ExpenseListProps) => {
  const { deleteExpense } = useExpenses();
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; expense: Expense | null }>({
    open: false,
    expense: null,
  });

  // Calculate pagination
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value));
    setCurrentPage(1);
  };

  const handleDelete = async (expense: Expense) => {
    setConfirmDelete({ open: true, expense });
  };

  const confirmDeleteExpense = async () => {
    if (!confirmDelete.expense) return;

    const { error } = await deleteExpense(confirmDelete.expense.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No expenses found</p>
        <p className="text-sm text-muted-foreground mt-1">Start tracking your expenses by adding one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {paginatedExpenses.map((expense) => (
          <div
            key={expense.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-2 sm:space-y-0"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: expense.categories?.color || '#6B7280' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">{expense.categories?.name || 'Unknown'}</p>
                  {expense.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{expense.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                    <span>{formatDate(expense.date)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-semibold text-lg sm:text-lg">
                {formatCurrency(expense.amount)}
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingExpense(expense)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(expense)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {expenses.length > 0 && (
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
              {startIndex + 1}-{Math.min(endIndex, expenses.length)} of {expenses.length}
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

      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <EditExpenseForm
              expense={editingExpense}
              onSuccess={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, expense: null })}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteExpense}
        variant="destructive"
      />
    </>
  );
};