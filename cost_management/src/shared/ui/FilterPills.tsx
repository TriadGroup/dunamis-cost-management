interface FilterOption {
  id: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
}

export const FilterPills = ({ options, activeId, onChange }: FilterPillsProps) => {
  return (
    <div className="filter-pills">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={activeId === option.id ? 'filter-pill is-active' : 'filter-pill'}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
