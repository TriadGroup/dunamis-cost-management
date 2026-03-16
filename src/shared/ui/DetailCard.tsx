import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

interface DetailCardProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const DetailCard = ({ title, eyebrow, subtitle, action, className, children }: DetailCardProps) => {
  return (
    <section className={clsx('detail-card', className)}>
      <header className="detail-card-header">
        <div>
          {eyebrow && <span className="detail-card-eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
};
