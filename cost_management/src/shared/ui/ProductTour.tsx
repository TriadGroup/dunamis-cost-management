import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useOnboardingStore } from '@/app/store';
import { tourDefinitions } from '@/features/onboarding/tourDefinitions';
import './ProductTour.css';

export const ProductTour = () => {
  const { currentTourId, currentStepIndex, nextStep, prevStep, skipTour, completeTour } = useOnboardingStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tourRef = useRef<HTMLDivElement>(null);

  const activeTour = currentTourId ? tourDefinitions[currentTourId] : null;
  const currentStep = activeTour?.steps[currentStepIndex];

  useEffect(() => {
    if (!currentStep) return;

    const updatePosition = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      if (currentStep.target === 'body') {
        setTargetRect(null);
        return;
      }

      const elements = document.querySelectorAll(currentStep.target);
      const element = Array.from(elements).find(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect((prev) => {
          if (!prev || Math.abs(prev.top - rect.top) > 1 || Math.abs(prev.left - rect.left) > 1 || prev.width !== rect.width || prev.height !== rect.height) {
            return rect;
          }
          return prev;
        });
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep]);

  useEffect(() => {
    if (!targetRect || !currentStep) return;

    const padding = 24;
    const tooltipWidth = 360;
    const { placement = 'bottom' } = currentStep;

    let nextTop = 0;
    let nextLeft = 0;

    const tooltipHeight = tourRef.current?.offsetHeight || 180;

    if (placement === 'bottom') {
      nextTop = targetRect.bottom + padding;
      nextLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    } else if (placement === 'top') {
      nextTop = targetRect.top - padding - tooltipHeight;
      nextLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    } else if (placement === 'right') {
      nextTop = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      nextLeft = targetRect.right + padding;
    } else if (placement === 'left') {
      nextTop = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      nextLeft = targetRect.left - tooltipWidth - padding;
    }

    // Keep tooltip in viewport
    nextLeft = Math.max(20, Math.min(nextLeft, window.innerWidth - tooltipWidth - 20));
    nextTop = Math.max(20, Math.min(nextTop, window.innerHeight - tooltipHeight - 20));

    setTooltipPos({ top: nextTop, left: nextLeft });
  }, [targetRect, currentStep]);

  if (!activeTour || !currentStep) return null;

  const isLastStep = currentStepIndex === activeTour.steps.length - 1;

  // Spotlight dimensions with padding
  const hole = targetRect ? {
    x: targetRect.left - 12,
    y: targetRect.top - 12,
    w: targetRect.width + 24,
    h: targetRect.height + 24,
    r: 12
  } : null;

  return ReactDOM.createPortal(
    <div className="product-tour-root">
      <svg className="tour-svg-overlay" width={windowSize.width} height={windowSize.height} viewBox={`0 0 ${windowSize.width} ${windowSize.height}`}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {hole && (
              <rect 
                x={hole.x} 
                y={hole.y} 
                width={hole.w} 
                height={hole.h} 
                rx={hole.r} 
                ry={hole.r} 
                fill="black" 
                className="tour-hole-transition"
              />
            )}
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.65)" 
          mask="url(#tour-spotlight-mask)" 
          className="tour-backdrop"
        />
      </svg>

      <div 
        ref={tourRef}
        className={`tour-tooltip placement-${currentStep.placement || 'bottom'} ${currentStep.target === 'body' ? 'is-centered' : ''}`}
        style={currentStep.target !== 'body' ? { top: tooltipPos.top, left: tooltipPos.left } : {}}
      >
        <div className="tour-header">
          <div className="tour-title-group">
            <span className="tour-sparkle">✨</span>
            <h4>{currentStep.title}</h4>
          </div>
          <button type="button" className="tour-close-btn" onClick={skipTour} aria-label="Fechar tutorial">
            ×
          </button>
        </div>

        <div className="tour-body">
          <p>{currentStep.content}</p>
        </div>

        <div className="tour-footer">
          <div className="tour-progress-dots">
            {activeTour.steps.map((_, idx) => (
              <span key={idx} className={`tour-dot ${idx === currentStepIndex ? 'is-active' : ''}`} />
            ))}
          </div>
          
          <div className="tour-actions">
            {currentStepIndex > 0 && (
              <button type="button" className="tour-btn-secondary" onClick={prevStep}>
                Voltar
              </button>
            )}
            <button 
              type="button" 
              className="tour-btn-primary" 
              onClick={isLastStep ? completeTour : nextStep}
            >
              {isLastStep ? (currentTourId === 'global' ? 'Começar' : 'Concluir') : 'Próximo'}
            </button>
          </div>
        </div>
        
        {currentStep.target !== 'body' && <div className="tour-arrow" />}
      </div>
    </div>,
    document.body
  );
};
