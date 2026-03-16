import type { ReactNode } from 'react';
import { CenterModal } from '@/shared/ui/CenterModal';
import { StepWizard } from '@/shared/ui/StepWizard';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
}

interface WizardModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  activeStepId: string;
  onStepChange: (id: string) => void;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  submitLabel?: string;
  nextLabel?: string;
  draftLabel?: string;
  error?: string;
  onHelp?: () => void;
}

export const WizardModal = ({
  open,
  title,
  subtitle,
  steps,
  activeStepId,
  onStepChange,
  onClose,
  onBack,
  onNext,
  onSubmit,
  onSaveDraft,
  backDisabled = false,
  nextDisabled = false,
  submitLabel = 'Concluir',
  nextLabel = 'Próximo',
  draftLabel = 'Salvar rascunho',
  error,
  onHelp
}: WizardModalProps) => {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  const isLastStep = activeIndex === steps.length - 1;

  return (
    <CenterModal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      onHelp={onHelp}
      footer={
        <div className="wizard-footer">
          <div className="wizard-feedback">
            <span className="modal-note">{`Etapa ${activeIndex + 1} de ${steps.length}`}</span>
            {error && <span className="wizard-error">{error}</span>}
          </div>
          <div className="wizard-actions">
            {onSaveDraft && (
              <button type="button" className="ghost-btn" onClick={onSaveDraft}>
                {draftLabel}
              </button>
            )}
            <button type="button" className="ghost-btn" onClick={onBack} disabled={backDisabled}>
              Voltar
            </button>
            {isLastStep ? (
              <button type="button" className="cta-btn" onClick={onSubmit}>
                {submitLabel}
              </button>
            ) : (
              <button type="button" className="cta-btn" onClick={onNext} disabled={nextDisabled}>
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      }
    >
      <StepWizard
        steps={steps}
        activeStepId={activeStepId}
        onStepChange={onStepChange}
        allowDirectStepSelection={false}
        progressLabel={`Etapa ${activeIndex + 1} de ${steps.length}`}
      />
    </CenterModal>
  );
};
