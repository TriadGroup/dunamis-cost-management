import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const Card = ({ title, subtitle, action, children, className }: CardProps) => {
  return (
    <section className={clsx('detail-card', className)}>
      {(title || subtitle || action) && (
        <header className="detail-card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
};
