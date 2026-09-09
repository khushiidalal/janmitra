'use client';

import { clsx } from 'clsx';

interface StepperProps {
  currentStep: number;
}

export default function Stepper({ currentStep }: StepperProps) {
  const steps = [
    { num: 1, label: 'Incident' },
    { num: 2, label: 'People' },
    { num: 3, label: 'Evidence' },
    { num: 4, label: 'Document' },
    { num: 5, label: 'Review' },
  ];

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      {steps.map((step, i) => {
        const isActive = currentStep === step.num;
        const isPast = currentStep > step.num;

        return (
          <div
            key={step.num}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="relative z-10 flex min-w-[56px] flex-col items-center">
              <div
                className={clsx(
                  'flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition-colors',
                  isActive || isPast
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {step.num}
              </div>

              <span
                className={clsx(
                  'mt-1.5 text-xs font-medium transition-colors',
                  isActive || isPast
                    ? 'text-blue-600'
                    : 'text-slate-500'
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={clsx(
                  'mx-3 h-px flex-1 transition-colors',
                  isPast ? 'bg-blue-500' : 'bg-slate-300'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}