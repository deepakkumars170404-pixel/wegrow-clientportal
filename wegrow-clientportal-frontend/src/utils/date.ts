export const TODAY = '2026-12-14';

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const D = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmt = (s: string): string => {
  const d = D(s);
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtS = (s: string): string => {
  const d = D(s);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
};

export const fmtL = (s: string): string => {
  const d = D(s);
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MONF[d.getMonth()]} ${d.getFullYear()}`;
};

export const addDays = (s: string, n: number): string => {
  const d = D(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const daysBetween = (a: string, b: string): number =>
  Math.round((D(b).getTime() - D(a).getTime()) / 86400000);
