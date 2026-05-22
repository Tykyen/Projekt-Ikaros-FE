import { Pencil } from 'lucide-react';
import s from './EditModeBanner.module.css';

interface Props {
  /** Název editovaného tabu — „Režim úprav: <label>". */
  label: string;
}

/** 8.1 — decentní pruh signalizující režim úprav nad obsahem tabu. */
export function EditModeBanner({ label }: Props) {
  return (
    <div className={s.banner}>
      <Pencil size={13} aria-hidden />
      <span>
        Režim úprav: <strong>{label}</strong>
      </span>
    </div>
  );
}
