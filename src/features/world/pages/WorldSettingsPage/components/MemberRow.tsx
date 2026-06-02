import { useState } from 'react';
import { Plus } from 'lucide-react';
import { UserAvatar, WorldRoleIcon, ConfirmDialog } from '@/shared/ui';
import { WorldRole, type AkjType, type WorldMembership } from '@/shared/types';
import type { UpdateMemberPayload } from '@/features/world/api/useUpdateMember';
import type { CharacterDirectoryEntry } from '../../api/characters.types';
import { ROLE_LABEL, ROLE_ICON_KEY, ALL_ROLES } from '../lib/worldRoles';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import s from './MemberRow.module.css';

interface Props {
  membership: WorldMembership;
  customGroups: string[];
  akjTypes: AkjType[];
  /** PC postavy světa pro select „Postava" (8.2g). */
  pcCharacters: CharacterDirectoryEntry[];
  /** Efektivní role aktuálního uživatele (globální admin = PJ). */
  viewerRole: WorldRole;
  viewerUserId: string;
  onUpdate: (payload: UpdateMemberPayload) => void;
  onRemove: (membershipId: string, name: string) => void;
  /** 8.2g — přiřazení / odpojení postavy (slug nebo undefined). */
  onAssignCharacter: (membershipId: string, characterPath?: string) => void;
  /** 8.2g — otevři modal tvorby PC pro tohoto člena (předvyplněný hráč). */
  onCreateForMember: (membership: WorldMembership) => void;
}

/**
 * 5.3c — řádek tabulky členů s inline editory role / skupiny / AKJ.
 * Hierarchie: vlastní řádek nelze editovat; PomocnyPJ nemění role ≥ své.
 */
export function MemberRow({
  membership,
  customGroups,
  akjTypes,
  pcCharacters,
  viewerRole,
  viewerUserId,
  onUpdate,
  onRemove,
  onAssignCharacter,
  onCreateForMember,
}: Props) {
  const [confirmPj, setConfirmPj] = useState(false);

  const isSelf = membership.userId === viewerUserId;
  const name = membership.user?.username ?? 'Neznámý uživatel';

  // PJ smí spravovat kohokoli kromě sebe; PomocnyPJ jen role pod PomocnyPJ.
  const editable =
    !isSelf &&
    viewerRole >= WorldRole.PomocnyPJ &&
    (viewerRole === WorldRole.PJ || membership.role < WorldRole.PomocnyPJ);
  const removable = editable && membership.role !== WorldRole.PJ;
  // 8.2g — přiřazení postavy: PomocnyPJ+ nebo úprava sebe sama (BE).
  //        Tvorba nové postavy (otevření modalu) je PJ-only.
  const canAssignCharacter = viewerRole >= WorldRole.PomocnyPJ || isSelf;
  const canCreateCharacter = viewerRole >= WorldRole.PJ;

  // PomocnyPJ nesmí v selectu nabízet role PomocnyPJ+.
  const roleOptions =
    viewerRole === WorldRole.PJ
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r < WorldRole.PomocnyPJ);

  function handleRole(next: WorldRole) {
    if (next === membership.role) return;
    if (next === WorldRole.PJ) {
      setConfirmPj(true);
      return;
    }
    onUpdate({ membershipId: membership.id, field: 'role', value: next });
  }

  const sortedAkj = [...akjTypes].sort((a, b) => a.level - b.level);

  return (
    <div className={s.row}>
      <div className={s.identity}>
        <UserAvatar src={worldMemberAvatar(membership)} size="sm" alt={name} />
        <span className={s.name}>{name}</span>
        <WorldRoleIcon role={ROLE_ICON_KEY[membership.role]} size="sm" />
      </div>

      <label className={s.cell}>
        <span className={s.cellLabel}>Role</span>
        <select
          className={s.select}
          value={membership.role}
          disabled={!editable}
          onChange={(e) => handleRole(Number(e.target.value) as WorldRole)}
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
          {/* Aktuální role mimo nabídku (PomocnyPJ+ viděná PomocnymPJ). */}
          {!roleOptions.includes(membership.role) && (
            <option value={membership.role}>
              {ROLE_LABEL[membership.role]}
            </option>
          )}
        </select>
      </label>

      <label className={s.cell}>
        <span className={s.cellLabel}>Skupina</span>
        <select
          className={s.select}
          value={membership.group ?? ''}
          disabled={!editable}
          onChange={(e) =>
            onUpdate({
              membershipId: membership.id,
              field: 'group',
              value: e.target.value || undefined,
            })
          }
        >
          <option value="">— bez skupiny —</option>
          {customGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className={s.cell}>
        <span className={s.cellLabel}>AKJ</span>
        {sortedAkj.length > 0 ? (
          <select
            className={s.select}
            value={membership.akj ?? 0}
            disabled={!editable}
            onChange={(e) =>
              onUpdate({
                membershipId: membership.id,
                field: 'akj',
                value: Number(e.target.value),
              })
            }
          >
            {sortedAkj.map((a) => (
              <option key={a.key} value={a.level}>
                {a.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            className={s.select}
            min={0}
            value={membership.akj ?? 0}
            disabled={!editable}
            onChange={(e) =>
              onUpdate({
                membershipId: membership.id,
                field: 'akj',
                value: Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
        )}
      </label>

      <label className={s.cell}>
        <span className={s.cellLabel}>Postava</span>
        <div className={s.assignCell}>
          <select
            className={s.select}
            value={membership.characterPath ?? ''}
            disabled={!canAssignCharacter}
            aria-label={`Postava pro ${name}`}
            onChange={(e) =>
              onAssignCharacter(membership.id, e.target.value || undefined)
            }
          >
            <option value="">— žádná —</option>
            {pcCharacters.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
            {/* Aktuální characterPath, který už v directory není (smazaná postava). */}
            {membership.characterPath &&
              !pcCharacters.some((c) => c.slug === membership.characterPath) && (
                <option value={membership.characterPath}>
                  {membership.characterPath} (chybí)
                </option>
              )}
          </select>
          {canCreateCharacter && (
            <button
              type="button"
              className={s.createBtn}
              title="Vytvořit novou postavu pro tohoto hráče"
              aria-label={`Vytvořit postavu pro ${name}`}
              onClick={() => onCreateForMember(membership)}
            >
              <Plus size={14} aria-hidden />
            </button>
          )}
        </div>
      </label>

      <div className={s.actions}>
        <button
          type="button"
          className={s.removeBtn}
          disabled={!removable}
          title={
            removable
              ? 'Odebrat člena'
              : isSelf
                ? 'Sám sebe odebrat nelze (viz tab Členství)'
                : 'Tohoto člena nemůžeš odebrat'
          }
          onClick={() => onRemove(membership.id, name)}
        >
          Odebrat
        </button>
      </div>

      <ConfirmDialog
        open={confirmPj}
        onClose={() => setConfirmPj(false)}
        title="Povýšit na PJ?"
        message={`Člen „${name}" získá roli PJ — plnou správu světa. Svět bude mít více než jednoho PJ. Vlastnictví světa se nemění.`}
        confirmLabel="Povýšit na PJ"
        onConfirm={() => {
          onUpdate({
            membershipId: membership.id,
            field: 'role',
            value: WorldRole.PJ,
          });
          setConfirmPj(false);
        }}
      />
    </div>
  );
}
