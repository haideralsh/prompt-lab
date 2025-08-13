interface TreeStatusProps {
  show: boolean;
  isFiltered: boolean;
}

export function TreeStatus({ show, isFiltered }: TreeStatusProps) {
  if (!show) return null;
  return (
    <div style={{ marginTop: 16, fontStyle: "italic", opacity: 0.8 }}>
      {isFiltered ? "No results found." : "Directory is empty."}
    </div>
  );
}