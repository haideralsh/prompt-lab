interface SearchBarProps {
  value: string;
  onChange(value: string): void;
  onClear(): void;
  disabled?: boolean;
  isFiltered: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  disabled = false,
  isFiltered,
}: SearchBarProps) {
  return (
    <div
      style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}
    >
      <input
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Filter tree by file name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minWidth: 320, padding: "6px 8px" }}
        disabled={disabled}
      />
      <button onClick={onClear} disabled={!isFiltered}>
        Clear search
      </button>
    </div>
  );
}