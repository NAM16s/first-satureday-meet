
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
}

export const YearSelector = ({ 
  selectedYear, 
  onPreviousYear, 
  onNextYear 
}: YearSelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={onPreviousYear}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg">{selectedYear}년</span>
      <Button variant="outline" size="sm" onClick={onNextYear}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
