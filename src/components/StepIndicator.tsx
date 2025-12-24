import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step } from "@/types/invoice";

interface StepIndicatorProps {
  currentStep: Step;
  steps: { key: Step; label: string }[];
}

export const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-center max-w-xs mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isCompleted && "gradient-primary text-primary-foreground shadow-glow",
                    isCurrent && "gradient-primary text-primary-foreground shadow-glow scale-110",
                    !isCompleted && !isCurrent && "glass border border-border/50 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-semibold transition-colors duration-300 text-center",
                    isCurrent ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-10 mx-1 rounded-full transition-all duration-300",
                    index < currentIndex ? "gradient-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};