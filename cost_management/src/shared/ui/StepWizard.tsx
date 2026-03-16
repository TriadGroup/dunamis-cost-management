import type { ReactNode } from 'react';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
}

interface StepWizardProps {
  steps: WizardStep[];
  activeStepId: string;
  onStepChange: (id: string) => void;
  allowDirectStepSelection?: boolean;
  progressLabel?: string;
}

export const StepWizard = ({ steps, activeStepId, onStepChange, allowDirectStepSelection = true, progressLabel }: StepWizardProps) => {
  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];

  return (
    <section className="step-wizard">
      {progressLabel && <p className="step-progress-label">{progressLabel}</p>}
      <ol className="step-wizard-nav">
        {steps.map((step, index) => {
          const active = step.id === activeStep.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                className={active ? 'step-pill is-active' : 'step-pill'}
                onClick={() => allowDirectStepSelection && onStepChange(step.id)}
                disabled={!allowDirectStepSelection}
              >
                <span>{index + 1}</span>
                {step.title}
              </button>
            </li>
          );
        })}
      </ol>

      <article className="step-panel">
        <h4>{activeStep.title}</h4>
        {activeStep.description && <p>{activeStep.description}</p>}
        <div className="step-panel-content">{activeStep.content}</div>
      </article>
    </section>
  );
};
