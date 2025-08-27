interface TreeStatusProps {
  show: boolean;
  isFiltered: boolean;
}

export function TreeStatus({ show }: TreeStatusProps) {
  if (!show) return null;
  return (
    <div className="mt-2 text-sm italic text-gray-500">
      No results found.
    </div>
  );
}
