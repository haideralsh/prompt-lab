interface ErrorBannerProps {
  message?: string;
}

// only used in the sidebar
export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return <div className="mt-4 text-red-600">{message}</div>;
}
