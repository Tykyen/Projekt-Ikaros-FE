import type { CSSProperties, ReactNode } from 'react';
import { Check } from 'lucide-react';
import s from '../HelpPage.module.css';

export type PermissionColumn = {
  key: string;
  label: string;
  /** Ikona role v hlavičce (WorldRoleIcon / RoleStar). */
  icon?: ReactNode;
  /** Token barvy checku, např. '--role-world-pj'. */
  colorVar?: string;
};

export type PermissionRow = {
  action: string;
  /** key sloupce → smí/nesmí. */
  allow: Record<string, boolean>;
};

/** Matice oprávnění (sticky 1. sloupec, ✓/—). Wrapper nad .matrix. */
export function PermissionTable({
  columns,
  rows,
  caption,
}: {
  columns: PermissionColumn[];
  rows: PermissionRow[];
  caption: string;
}) {
  return (
    <div className={s.matrixWrap}>
      <table className={s.matrix} aria-label={caption}>
        <thead>
          <tr>
            <th scope="col">Oprávnění</th>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                <span className={s.matrixHeaderCell}>
                  {c.icon}
                  <span className={s.matrixHeaderLabel}>{c.label}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.action}>
              <td>{row.action}</td>
              {columns.map((c) => {
                const cellStyle = c.colorVar
                  ? ({ ['--cell-color' as string]: `var(${c.colorVar})` } as CSSProperties)
                  : undefined;
                return (
                  <td key={c.key}>
                    {row.allow[c.key] ? (
                      <span className={s.matrixCheck} style={cellStyle} aria-label="ano">
                        <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className={s.matrixEmpty} aria-label="ne">
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
