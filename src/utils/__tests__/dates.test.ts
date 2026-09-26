import { formatRelative } from '../dates';

describe('formatRelative', () => {
  const now = new Date('2026-09-26T18:00:00');

  it.each([
    ['2026-09-26T17:59:50', 'ahora'],
    ['2026-09-26T17:55:00', 'hace 5 min'],
    ['2026-09-26T15:00:00', 'hace 3 h'],
    ['2026-09-25T10:00:00', 'ayer'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelative(iso, now)).toBe(expected);
  });

  it('fechas más antiguas se ven como día y mes', () => {
    expect(formatRelative('2026-09-12T10:00:00', now)).toMatch(/12/);
  });
});
