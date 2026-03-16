import type { ReactNode } from 'react';
import clsx from 'clsx';

interface AttentionBannerProps {
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
  action?: ReactNode;
  onClick?: () => void;
}

export const AttentionBanner = ({ title, description, severity = 'medium', action, onClick }: AttentionBannerProps) => {
  return (
    <article
      className={clsx('attention-banner', `severity-${severity}`, onClick && 'is-clickable')}
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
      <div className="attention-copy">
        <p className="attention-title">{title}</p>
        <p className="attention-description">{description}</p>
      </div>
      {action && <div className="attention-action">{action}</div>}
    </article>
  );
};
