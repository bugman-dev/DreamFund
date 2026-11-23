export type Period = 'month' | 'year' | 'all';

export function todayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || 'there';
}

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(iso: string): string {
  const [year, month] = iso.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function daysUntil(target: string, today: string): number {
  const [ty, tm, td] = target.split('-').map(Number);
  const [cy, cm, cd] = today.split('-').map(Number);
  const targetUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  const todayUtc = Date.UTC(cy, (cm || 1) - 1, cd || 1);
  return Math.round((targetUtc - todayUtc) / 86400000);
}

export function periodStart(period: Period, today: string): string | null {
  if (period === 'all') return null;
  if (period === 'year') return `${today.slice(0, 4)}-01-01`;
  return `${today.slice(0, 7)}-01`;
}

export function formatClock(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
