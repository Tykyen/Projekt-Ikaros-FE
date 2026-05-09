export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrengthResult {
  score: PasswordStrengthScore;
  label: string;
  color: string;
}

/**
 * Heuristika síly hesla — bez externí knihovny. Skóre 0–4 podle
 * délky a různorodosti znaků. Skóre není gate (BE má jen min 6),
 * jen vizuální nápověda v RegisterModalu.
 */
export function passwordStrength(pw: string): PasswordStrengthResult {
  let raw = 0;
  if (pw.length >= 8) raw++;
  if (pw.length >= 12) raw++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) raw++;
  if (/\d/.test(pw)) raw++;
  if (/[^a-zA-Z0-9]/.test(pw)) raw++;

  const score = Math.min(raw, 4) as PasswordStrengthScore;
  const labels = [
    'Velmi slabé',
    'Slabé',
    'Průměrné',
    'Silné',
    'Velmi silné',
  ];
  const colors = [
    'var(--danger)',
    'var(--warning)',
    'var(--accent)',
    'var(--success)',
    'var(--success)',
  ];
  return { score, label: labels[score], color: colors[score] };
}
