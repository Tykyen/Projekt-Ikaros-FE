import { Folder, Globe, Lock, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { WorldMapFolder } from '../types';
import s from './FolderCard.module.css';

interface Props {
  folder: WorldMapFolder;
  isPJ: boolean;
  editMode: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 13.4b — dlaždice složky v atlasu. Klik = vstup; PJ v edit módu edit/delete. */
export function FolderCard({
  folder,
  isPJ,
  editMode,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className={s.card}>
      <button type="button" className={s.openBtn} onClick={onOpen}>
        <Folder size={26} aria-hidden />
        <span className={s.name}>{folder.name}</span>
      </button>

      {isPJ && (
        <span
          className={clsx(s.vis, folder.isPublic && s.visPublic)}
          title={folder.isPublic ? 'Veřejná složka' : 'Jen vybraní hráči'}
        >
          {folder.isPublic ? (
            <Globe size={13} aria-hidden />
          ) : (
            <>
              <Lock size={13} aria-hidden /> {folder.visibleToPlayerIds.length}
            </>
          )}
        </span>
      )}

      {isPJ && editMode && (
        <div className={s.actions}>
          <button type="button" onClick={onEdit} aria-label="Upravit složku">
            <Pencil size={14} aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label="Smazat složku">
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
