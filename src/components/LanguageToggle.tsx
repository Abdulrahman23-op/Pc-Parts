import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="relative hover:scale-105 transition-transform px-3"
    >
      <Globe className="h-4 w-4 mr-1" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'عربي' : 'English'}
      </span>
    </Button>
  );
}