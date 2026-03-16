import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

interface ExecutiveCardProps extends PropsWithChildren {
  title: string;
  value: string;
  eyebrow?: string;
  helper?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
  onClick?: () => void;
}

export const ExecutiveCard = ({ title, value, eyebrow, helper, tone = 'neutral', icon, onClick, children }: ExecutiveCardProps) => {
  return (
    <article
      className={clsx('executive-card', `tone-${tone}`, onClick && 'is-clickable')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <header className="executive-card-header">
        <div className="executive-card-title-block">
          <p>{eyebrow || title}</p>
          {eyebrow && <strong className="executive-card-title">{title}</strong>}
        </div>
        {icon && <span className="executive-card-icon">{icon}</span>}
      </header>
      <p className="executive-card-value">{value}</p>
      {(helper || children) && (
        <footer className="executive-card-footer">
          {helper && <p className="executive-card-helper">{helper}</p>}
          {children}
        </footer>
      )}
    </article>
  );
};
