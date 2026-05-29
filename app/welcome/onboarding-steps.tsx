const STEPS = [
  { label: "Plan" },
  { label: "Name" },
  { label: "Payment" },
];

type Props = {
  currentStep: 1 | 2 | 3;
};

export function OnboardingSteps({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted
                    ? "bg-fuchsia-500 text-white"
                    : isActive
                      ? "bg-white text-neutral-950"
                      : "border border-white/20 text-white/30",
                ].join(" ")}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  isActive ? "text-white" : "text-white/30",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={[
                  "mx-3 mb-5 h-px w-12 sm:w-16",
                  isCompleted ? "bg-fuchsia-500" : "bg-white/10",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
