interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) => {
  return (
    <label className="search-bar">
      <span>Buscar</span>
      <input
        className="input-dark"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
};
