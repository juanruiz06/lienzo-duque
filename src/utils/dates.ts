/**
 * Fechas legibles en castellano sin librerías: "hace 5 min", "ayer", "12 sept".
 * `now` es inyectable para poder testearlo.
 */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) {
    return 'ahora';
  }
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24 && date.getDate() === now.getDate()) {
    return `hace ${hours} h`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'ayer';
  }
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}
