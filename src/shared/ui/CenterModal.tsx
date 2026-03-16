import { useEffect, type PropsWithChildren, type ReactNode } from 'react';

interface CenterModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onHelp?: () => void;
  footer?: ReactNode;
}

export const CenterModal = ({ open, title, subtitle, onClose, onHelp, footer, children }: CenterModalProps) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="center-modal-overlay" onClick={onClose}>
      <section className="center-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="center-modal-header">
          <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
            <h3 style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {onHelp && (
              <button type="button" className="ghost-btn" onClick={onHelp} title="Como usar">
                Como usar
              </button>
            )}
            <button type="button" className="ghost-btn" onClick={onClose}>
              Fechar
            </button>
          </div>
        </header>

        <div className="center-modal-content">{children}</div>

        {footer && <footer className="center-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
};
