import type { ReactNode } from 'react';

interface SmartEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const SmartEmptyState = ({ title, description, action }: SmartEmptyStateProps) => {
  return (
    <section className="smart-empty-state">
      <div className="smart-empty-mark" aria-hidden="true">
        <span />
      </div>
      <p className="smart-empty-title">{title}</p>
      <p className="smart-empty-description">{description}</p>
      {action && <div className="smart-empty-action">{action}</div>}
    </section>
  );
};
