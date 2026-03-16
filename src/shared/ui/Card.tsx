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
    <section
      className={clsx(
        'rounded-2xl border border-fern-900/10 bg-white/75 p-4 shadow-glow backdrop-blur-md md:p-5',
        className
      )}
    >
      {(title || subtitle || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-display text-lg text-fern-900">{title}</h3>}
            {subtitle && <p className="text-xs text-fern-800/70">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
};
