export function formatDate(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (hours < 24 * 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatFullDate(isoString: string | null): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
}
