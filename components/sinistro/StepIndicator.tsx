import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  label: string
  number: number
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({
  steps,
  currentStep,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep
        const isActive = step.number === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                  isCompleted
                    ? "bg-[#0f766e] border-[#0f766e] text-white"
                    : isActive
                    ? "bg-[#1a2744] border-[#1a2744] text-white"
                    : "bg-white border-[#e2e8f0] text-[#94a3b8]"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1.5 font-medium whitespace-nowrap hidden sm:block",
                  isActive
                    ? "text-[#1a2744]"
                    : isCompleted
                    ? "text-[#0f766e]"
                    : "text-[#94a3b8]"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mb-5 hidden sm:block",
                  isCompleted ? "bg-[#0f766e]" : "bg-[#e2e8f0]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
