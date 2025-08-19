export function SelectedFileInfo({ path }: { path: string | null }) {
  if (!path) return null;
  return (
    <div className="mt-4 truncate text-xs italic text-gray-500">
      Selected file: {path}
    </div>
  );
}