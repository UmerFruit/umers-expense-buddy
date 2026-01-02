// Add Loan Form Component
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/use-toast';
import { Loader2, HandCoins, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const loanSchema = z.object({
  person_name: z.string().min(1, 'Person name is required').max(100, 'Name is too long'),
  amount: z.number().positive('Amount must be greater than 0'),
  loan_type: z.enum(['lent', 'borrowed']),
  date: z.string().min(1, 'Date is required'),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface AddLoanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddLoanForm = ({ onSuccess, onCancel }: AddLoanFormProps) => {
  const { createLoan, getPersonNames } = useLoans();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const personNames = useMemo(() => getPersonNames(), [getPersonNames]);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      person_name: '',
      amount: undefined as unknown as number, // Start empty, not 0
      loan_type: 'lent',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedPersonName = form.watch('person_name');
  const watchedLoanType = form.watch('loan_type');

  const filteredSuggestions = useMemo(() => {
    if (!watchedPersonName) return [];
    return personNames.filter(name => 
      name.toLowerCase().includes(watchedPersonName.toLowerCase())
    ).slice(0, 5);
  }, [watchedPersonName, personNames]);

  const onSubmit = async (data: LoanFormData) => {
    setIsSubmitting(true);
    
    const { error } = await createLoan({
      person_name: data.person_name,
      total_amount: data.amount,
      loan_type: data.loan_type,
      date: data.date,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create loan',
        variant: 'destructive',
      });
    } else {
      const actionText = data.loan_type === 'lent' ? 'lent to' : 'borrowed from';
      toast({
        title: 'Loan Created',
        description: `Successfully recorded ₨${data.amount.toLocaleString()} ${actionText} ${data.person_name}`,
      });
      form.reset();
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Loan Type Selection */}
        <FormField
          control={form.control}
          name="loan_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What type of loan is this?</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange('lent')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                      'hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30',
                      field.value === 'lent'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : 'border-muted'
                    )}
                  >
                    <HandCoins className={cn(
                      'h-8 w-8 transition-colors',
                      field.value === 'lent' ? 'text-green-600' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'font-medium',
                      field.value === 'lent' ? 'text-green-600' : 'text-muted-foreground'
                    )}>
                      I Lent Money
                    </span>
                    <span className="text-xs text-muted-foreground">Someone owes you</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('borrowed')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                      'hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30',
                      field.value === 'borrowed'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'border-muted'
                    )}
                  >
                    <Wallet className={cn(
                      'h-8 w-8 transition-colors',
                      field.value === 'borrowed' ? 'text-red-600' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'font-medium',
                      field.value === 'borrowed' ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      I Borrowed Money
                    </span>
                    <span className="text-xs text-muted-foreground">You owe someone</span>
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Person Name with Autocomplete */}
        <FormField
          control={form.control}
          name="person_name"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>
                {watchedLoanType === 'lent' ? 'Who did you lend to?' : 'Who did you borrow from?'}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter person's name"
                  {...field}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
              </FormControl>
              {/* Autocomplete suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                  {filteredSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        form.setValue('person_name', name);
                        setShowSuggestions(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₨</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number.parseFloat(val));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={cn(
              watchedLoanType === 'lent' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                {watchedLoanType === 'lent' ? 'Record Loan' : 'Record Borrowing'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddLoanForm;
