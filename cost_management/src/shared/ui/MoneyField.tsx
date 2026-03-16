import { useEffect, useState } from 'react';

const parseDecimal = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCents = (value: string): number => Math.round(parseDecimal(value) * 100);
const toDisplayValue = (valueCents: number): string => {
  if (!valueCents) return '';
  return (valueCents / 100).toFixed(2).replace('.', ',');
};

interface MoneyFieldProps {
  valueCents: number;
  onChange: (nextValueCents: number) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const MoneyField = ({
  valueCents,
  onChange,
  placeholder = '0,00',
  ariaLabel = 'Valor em reais',
  className = 'input-dark',
  disabled = false
}: MoneyFieldProps) => {
  const [displayValue, setDisplayValue] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDisplayValue(toDisplayValue(valueCents));
    }
  }, [editing, valueCents]);

  return (
    <div className="field-with-affix">
      <span className="field-affix">R$</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        className={className}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={(event) => {
          setEditing(true);
          const target = event.currentTarget;
          requestAnimationFrame(() => target.select());
        }}
        onClick={(event) => event.currentTarget.select()}
        onMouseUp={(event) => event.preventDefault()}
        onChange={(event) => {
          setDisplayValue(event.target.value);
          onChange(toCents(event.target.value));
        }}
        onBlur={() => {
          const nextValueCents = toCents(displayValue);
          setDisplayValue(toDisplayValue(nextValueCents));
          setEditing(false);
        }}
      />
    </div>
  );
};
