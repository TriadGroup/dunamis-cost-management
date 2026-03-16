import { useMemo, useState } from 'react';
import type { OptionCatalogEntry } from '@/app/store/useOptionCatalogStore';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: OptionCatalogEntry[];
  onCreate?: (label: string) => string;
  placeholder?: string;
  createLabel?: string;
  disabled?: boolean;
  className?: string;
}

const CREATE_SENTINEL = '__create_option__';

export const CreatableSelect = ({
  value,
  onChange,
  options,
  onCreate,
  placeholder = 'Escolha uma opção',
  createLabel = 'Criar outra opção',
  disabled = false,
  className = 'select-dark'
}: CreatableSelectProps) => {
  const [draftLabel, setDraftLabel] = useState('');
  const [creating, setCreating] = useState(false);

  const normalizedOptions = useMemo(() => {
    const entries = options.filter((option, index, all) => all.findIndex((entry) => entry.value === option.value) === index);
    return entries.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [options]);

  const handleCreate = () => {
    if (!onCreate) return;
    const createdValue = onCreate(draftLabel.trim());
    if (createdValue) {
      onChange(createdValue);
    }
    setDraftLabel('');
    setCreating(false);
  };

  return (
    <div className="creatable-select">
      <select
        className={className}
        value={creating ? CREATE_SENTINEL : value}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === CREATE_SENTINEL) {
            setCreating(true);
            return;
          }
          setCreating(false);
          onChange(nextValue);
        }}
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {onCreate ? <option value={CREATE_SENTINEL}>{createLabel}</option> : null}
      </select>

      {creating ? (
        <div className="creatable-select-row">
          <input
            type="text"
            className="input-dark"
            value={draftLabel}
            placeholder="Digite a nova opção"
            onChange={(event) => setDraftLabel(event.target.value)}
          />
          <button type="button" className="ghost-btn" onClick={handleCreate} disabled={!draftLabel.trim()}>
            Salvar
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setCreating(false);
              setDraftLabel('');
            }}
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </div>
  );
};
