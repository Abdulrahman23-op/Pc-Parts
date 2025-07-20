import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Category } from '@/lib/storage';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
      <Button
        variant={selectedCategory === null ? "glow" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9"
      >
        {t('categories.all_categories')}
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "glow" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className="transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9"
        >
          <span className="truncate max-w-[120px] sm:max-w-none">
            {t(`categories.${category.name}`) || category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}