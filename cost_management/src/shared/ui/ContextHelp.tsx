import { useId, useState } from 'react';

interface ContextHelpProps {
  text: string;
  label?: string;
}

export const ContextHelp = ({ text, label = 'O que significa' }: ContextHelpProps) => {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`context-help ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="context-help-trigger"
        aria-label={label}
        aria-describedby={tooltipId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
      >
        !
      </button>
      <span id={tooltipId} role="tooltip" className="context-help-bubble">
        {text}
      </span>
    </span>
  );
};
