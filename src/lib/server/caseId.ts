export function generateCaseId(prefix: string, seq: number): string {
  const year = new Date().getFullYear();
  const safePrefix = prefix === 'CMP' ? 'CMP' : 'FIR';
  const padded = String(seq).padStart(3, '0');
  return `${safePrefix}-${year}-${padded}`;
}

export function formatDisplayDate(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
