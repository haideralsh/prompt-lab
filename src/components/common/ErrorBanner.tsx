interface ErrorBannerProps {
  message?: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return <div style={{ color: "red", marginTop: 10 }}>{message}</div>;
}