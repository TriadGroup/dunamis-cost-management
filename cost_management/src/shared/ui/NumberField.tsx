import type { InputHTMLAttributes } from 'react';

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  suffix?: string;
  prefix?: string;
}

export const NumberField = ({ suffix, prefix, className = 'input-dark', ...props }: NumberFieldProps) => {
  return (
    <div className="field-with-affix">
      {prefix ? <span className="field-affix">{prefix}</span> : null}
      <input
        {...props}
        type="number"
        className={className}
        onFocus={(event) => {
          props.onFocus?.(event);
          const target = event.currentTarget;
          requestAnimationFrame(() => target.select());
        }}
        onClick={(event) => {
          props.onClick?.(event);
          event.currentTarget.select();
        }}
        onMouseUp={(event) => {
          props.onMouseUp?.(event);
          event.preventDefault();
        }}
      />
      {suffix ? <span className="field-affix is-end">{suffix}</span> : null}
    </div>
  );
};
