import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Income, useIncome } from '@/hooks/useIncome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CategorySelectWithCreate } from '@/components/CategorySelectWithCreate';
import { useToast } from '@/hooks/use-toast';

const incomeSchema = z.object({
  category_id: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_period: z.enum(['weekly', 'monthly', 'yearly']).optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface EditIncomeFormProps {
  income: Income;
  onSuccess?: () => void;
}

export const EditIncomeForm = ({ income, onSuccess }: EditIncomeFormProps) => {
  const { updateIncome } = useIncome();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      category_id: income.category_id || '',
      amount: income.amount,
      date: income.date.split('T')[0],
      description: income.description || '',
      is_recurring: income.is_recurring,
      recurring_period: income.recurring_period || undefined,
    },
  });

  const isRecurring = form.watch('is_recurring');

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    
    const incomeData = {
      category_id: data.category_id || null,
      amount: data.amount,
      date: data.date,
      description: data.description || null,
      is_recurring: data.is_recurring,
      recurring_period: data.is_recurring ? data.recurring_period || null : null,
    };

    const { error } = await updateIncome(income.id, incomeData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update income",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Income updated successfully",
      });
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelectWithCreate
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  placeholder="Select a category"
                  defaultCategoryType="income"
                  filterByType="income"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this income..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  className="h-4 w-4"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Recurring Income</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {isRecurring && (
          <FormField
            control={form.control}
            name="recurring_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurring Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Income'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
