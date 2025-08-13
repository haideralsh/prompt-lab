export function SelectedFileInfo({ path }: { path: string | null }) {
  if (!path) return null;
  return (
    <div style={{ marginTop: 20, fontStyle: "italic" }}>
      Selected file: {path}
    </div>
  );
}