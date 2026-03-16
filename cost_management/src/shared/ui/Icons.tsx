import type { SVGProps } from 'react';
import clsx from 'clsx';

export type IconName =
  | 'home'
  | 'cost'
  | 'revenue'
  | 'investment'
  | 'result'
  | 'calendar'
  | 'seed'
  | 'tractor'
  | 'list'
  | 'target'
  | 'wallet'
  | 'warning'
  | 'magic'
  | 'flow'
  | 'gear'
  | 'panel'
  | 'trace'
  | 'trash'
  | 'close';

interface UiIconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export const UiIcon = ({ name, className, ...props }: UiIconProps) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M4 11.5 12 5l8 6.5" {...common} />
          <path d="M6 10.5V20h12v-9.5" {...common} />
        </svg>
      );
    case 'cost':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M4 4h16v16H4z" {...common} />
          <path d="M8 8h8M8 12h6M8 16h4" {...common} />
        </svg>
      );
    case 'revenue':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M4 19h16" {...common} />
          <path d="M7 14l4-4 3 3 3-5" {...common} />
          <path d="M17 8h2v2" {...common} />
        </svg>
      );
    case 'investment':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <circle cx="12" cy="12" r="8" {...common} />
          <path d="M12 8v8M8 12h8" {...common} />
        </svg>
      );
    case 'result':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M5 12l4 4 10-10" {...common} />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <rect x="4" y="5" width="16" height="15" rx="2" {...common} />
          <path d="M8 3v4M16 3v4M4 10h16" {...common} />
        </svg>
      );
    case 'seed':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M12 20V11" {...common} />
          <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5Z" {...common} />
          <path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5Z" {...common} />
        </svg>
      );
    case 'tractor':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <circle cx="7" cy="17" r="3" {...common} />
          <circle cx="17" cy="16" r="2" {...common} />
          <path d="M4 17V9h7l2 3h3v5" {...common} />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M9 7h10M9 12h10M9 17h10" {...common} />
          <circle cx="5" cy="7" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="5" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    case 'target':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <circle cx="12" cy="12" r="8" {...common} />
          <circle cx="12" cy="12" r="4" {...common} />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" {...common} />
          <path d="M4 8V6a2 2 0 0 1 2-2h9" {...common} />
          <path d="M16 13h4" {...common} />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M12 3 2 20h20L12 3Z" {...common} />
          <path d="M12 9v5" {...common} />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    case 'magic':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M3 21 14 10" {...common} />
          <path d="M14 4v4M12 6h4M18 11v3M16.5 12.5h3" {...common} />
        </svg>
      );
    case 'flow':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M7 6h10M7 18h10" {...common} />
          <path d="M7 6a2 2 0 1 0 0 4h5a2 2 0 1 1 0 4H8" {...common} />
          <path d="M17 6h0M17 18h0" {...common} />
        </svg>
      );
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" {...common} />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4H20a1 1 0 0 0-.6.7Z" {...common} />
        </svg>
      );
    case 'panel':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" {...common} />
          <path d="M9 4v16" {...common} />
        </svg>
      );
    case 'trace':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M6 6h12M6 12h8M6 18h10" {...common} />
          <circle cx="17" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'trash':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...common} />
          <path d="M10 11v6M14 11v6" {...common} />
        </svg>
      );
    case 'close':
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M18 6L6 18M6 6l12 12" {...common} />
        </svg>
      );
    default:
      return null;
  }
};

interface ToneChipProps {
  tone: 'cost' | 'revenue' | 'investment' | 'result';
  label: string;
  icon: IconName;
  className?: string;
}

export const ToneChip = ({ tone, label, icon, className }: ToneChipProps) => {
  return (
    <span className={clsx('tone-chip', `tone-chip-${tone}`, className)}>
      <UiIcon name={icon} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};
