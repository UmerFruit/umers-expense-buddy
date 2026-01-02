// Reusable Category Select with Inline Category Creation
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { Plus, Check, Loader2, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined color options - 8 colors for cleaner UI
const COLOR_OPTIONS = [
  { value: '#EF4444', name: 'Red' },
  { value: '#EAB308', name: 'Yellow' },
  { value: '#84CC16', name: 'Lime' },
  { value: '#22C55E', name: 'Green' },
  { value: '#10B981', name: 'Emerald' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#6366F1', name: 'Indigo' },
  { value: '#A855F7', name: 'Purple' },
];

type CategoryType = 'expense' | 'income' | 'both';

interface CategorySelectWithCreateProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  defaultCategoryType?: CategoryType;
  showTypeSelector?: boolean;
  filterByType?: CategoryType | 'all';
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export const CategorySelectWithCreate = ({
  value,
  onValueChange,
  placeholder = 'Select a category',
  defaultCategoryType = 'expense',
  showTypeSelector = false,
  filterByType = 'all',
  disabled = false,
  className,
  triggerClassName,
}: CategorySelectWithCreateProps) => {
  const { categories, addCategoryMutation } = useCategories();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [categoryType, setCategoryType] = useState<CategoryType>(defaultCategoryType);

  // Filter categories based on type
  const filteredCategories = filterByType === 'all' 
    ? categories 
    : categories.filter(cat => 
        !cat.type || 
        cat.type === filterByType || 
        cat.type === 'both'
      );

  const resetForm = useCallback(() => {
    setNewCategoryName('');
    setSelectedColor(COLOR_OPTIONS[0].value);
    setCategoryType(defaultCategoryType);
    setIsCreating(false);
  }, [defaultCategoryType]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate names
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      toast({
        title: 'Error',
        description: 'A category with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use mutation - optimistic update will happen automatically
      const newCategory = await addCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        color: selectedColor,
        type: categoryType,
      });

      // Auto-select the newly created category
      // Note: This will work immediately due to optimistic updates
      onValueChange(newCategory.id);
      
      toast({
        title: 'Success',
        description: `Category "${newCategoryName.trim()}" created`,
      });
      
      resetForm();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handleRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
    setSelectedColor(COLOR_OPTIONS[randomIndex].value);
  };

  const handleSelectChange = (newValue: string) => {
    if (newValue === '__create_new__') {
      setIsCreating(true);
    } else {
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Select
        value={value}
        onValueChange={handleSelectChange}
        disabled={disabled || isCreating}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="__create_new__" className="text-primary font-medium">
            <div className="flex items-center gap-2">
              <Plus className="w-3 h-3" />
              <span>Create New Category</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Inline Category Creation Form */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isCreating ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 border rounded-lg bg-muted/30 space-y-6">


          {/* Category Name */}
          <div className="space-y-2">
            <Label 
              htmlFor="new-category-name" 
              className="text-s text-muted-foreground block text-center"
            >
              Name
            </Label>
            <Input
              id="new-category-name"
              type="text"
              placeholder="e.g., Groceries, Salary"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={addCategoryMutation.isPending}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCategory();
                }
                if (e.key === 'Escape') {
                  resetForm();
                }
              }}
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRandomColor}
                disabled={addCategoryMutation.isPending}
                className=" w-16 p-0 hover:bg-muted"
                title="Pick random color"
              >
              <Label className="text-s text-muted-foreground text-center">
                Color
              </Label>
                <Shuffle className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 sm:gap-3 flex-wrap sm:flex-nowrap px-2 sm:px-0">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  data-color-picker
                  className={cn(
                    'w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all duration-200 flex-shrink-0',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    selectedColor === color.value && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ 
                    backgroundColor: color.value,
                  }}
                  onClick={() => setSelectedColor(color.value)}
                  disabled={addCategoryMutation.isPending}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Type Selector (only show if context is ambiguous) */}
          {showTypeSelector && (
            <div className="space-y-2">
              <Label className="text-s text-muted-foreground block text-center">
                Type
              </Label>
              <div className="flex items-center justify-center gap-2">
                {(['expense', 'income', 'both'] as CategoryType[]).map((type) => (
                  <label
                    key={type}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border-2 transition-all text-sm capitalize",
                      categoryType === type 
                        ? "border-primary bg-primary text-primary-foreground font-medium" 
                        : "border-border hover:bg-accent hover:border-accent-foreground/20",
                      addCategoryMutation.isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="radio"
                      name="category-type"
                      value={type}
                      checked={categoryType === type}
                      onChange={(e) => setCategoryType(e.target.value as CategoryType)}
                      disabled={addCategoryMutation.isPending}
                      className="sr-only"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              disabled={addCategoryMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
              className="flex-1"
            >
              {addCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Create
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelectWithCreate;
