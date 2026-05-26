import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { useCharacterDirectory } from '../../../api/useCharacterDirectory';
import {
  useUpdateAccount,
  useDeleteAccount,
  useAccountAddCoOwner,
  useAccountRemoveCoOwner,
  useWorldCurrencies,
} from '../../../api/useCharacterAccounts';
import type { CharacterAccount } from '../../../api/characters.types';
import { CurrencySelect } from '@/features/world/currencies/shared';
import s from './accounts.module.css';

interface Props {
  account: CharacterAccount;
  onDeleted: () => void;
}

/**
 * 8.6 — „Nastavení účtu" sekce dole. Settings fieldy (typ účtu, vedeno u,
 * měna, spoluvlastníci, smazat) jsou PJ-only edit. Vlastník postavy tu sekci
 * vidí read-only — Q8.4.
 */
export function SettingsAccountSection({ account, onDeleted }: Props) {
  const { worldId, userRole } = useWorldContext();
  const isPJ = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  const directory = useCharacterDirectory(worldId);
  const currencies = useWorldCurrencies(worldId);
  const update = useUpdateAccount(worldId, account.id);
  const deleteMut = useDeleteAccount(worldId, account.id);
  const addCo = useAccountAddCoOwner(worldId, account.id);
  const removeCo = useAccountRemoveCoOwner(worldId, account.id);

  const [accountType, setAccountType] = useState(account.accountType);
  const [accessLocId, setAccessLocId] = useState(
    account.accessLocation?.characterId ?? '',
  );
  const [currency, setCurrency] = useState(account.currency);
  const [allowPlayerSelfAdjust, setAllowPlayerSelfAdjust] = useState(
    account.allowPlayerSelfAdjust ?? false,
  );
  const [coOwnerToAdd, setCoOwnerToAdd] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const characters = directory.data ?? [];
  const currencyList = currencies.data?.items ?? [];

  const dirty =
    accountType !== account.accountType ||
    accessLocId !== (account.accessLocation?.characterId ?? '') ||
    currency !== account.currency ||
    allowPlayerSelfAdjust !== (account.allowPlayerSelfAdjust ?? false);

  function handleSaveSettings() {
    update.mutate(
      {
        accountType,
        accessLocationCharacterId: accessLocId || null,
        currency,
        allowPlayerSelfAdjust,
      },
      {
        onSuccess: () => toast.success('Nastavení uloženo'),
        onError: () => toast.error('Uložení selhalo'),
      },
    );
  }

  function handleAddCoOwner() {
    if (!coOwnerToAdd) return;
    addCo.mutate(coOwnerToAdd, {
      onSuccess: () => {
        toast.success('Spoluvlastník přidán');
        setCoOwnerToAdd('');
      },
      onError: () => toast.error('Přidání selhalo'),
    });
  }

  function handleRemoveCoOwner(characterId: string) {
    removeCo.mutate(characterId, {
      onSuccess: () => toast.success('Spoluvlastník odebrán'),
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { error?: { code?: string } } } };
        const code = e?.response?.data?.error?.code;
        if (code === 'CANNOT_REMOVE_PRIMARY')
          toast.error('Primárního vlastníka nelze odebrat');
        else toast.error('Odebrání selhalo');
      },
    });
  }

  function handleDelete() {
    deleteMut.mutate(undefined, {
      onSuccess: () => {
        toast.success('Účet smazán');
        setDeleteOpen(false);
        onDeleted();
      },
      onError: () => toast.error('Smazání selhalo'),
    });
  }

  const findCharName = (id: string) =>
    characters.find((c) => c.id === id || c.slug === id)?.name ?? id;

  if (!isPJ) {
    // Read-only view pro vlastníka — vidí, nemůže měnit.
    return (
      <section className={s.settingsCard}>
        <h3 className={s.settingsTitle}>Nastavení účtu</h3>
        <dl className={s.settingsList}>
          <div className={s.settingsRow}>
            <dt>Typ účtu</dt>
            <dd>{account.accountType}</dd>
          </div>
          <div className={s.settingsRow}>
            <dt>Vedeno u</dt>
            <dd>
              {account.accessLocation
                ? findCharName(account.accessLocation.characterId)
                : 'Nenastaveno'}
            </dd>
          </div>
          <div className={s.settingsRow}>
            <dt>Měna</dt>
            <dd>{account.currency}</dd>
          </div>
          {account.ownerCharacterIds.length > 1 && (
            <div className={s.settingsRow}>
              <dt>Spoluvlastníci</dt>
              <dd>
                {account.ownerCharacterIds
                  .map((id) => findCharName(id))
                  .join(', ')}
              </dd>
            </div>
          )}
        </dl>
        <p className={s.settingsHint}>Změny může provést jen PJ.</p>
      </section>
    );
  }

  return (
    <section className={s.settingsCard}>
      <h3 className={s.settingsTitle}>Nastavení účtu (jen PJ)</h3>

      <label className={s.field}>
        <span>Typ účtu</span>
        <input
          type="text"
          className={s.input}
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        />
      </label>

      <label className={s.field}>
        <span>Vedeno u (postava)</span>
        <select
          className={s.input}
          value={accessLocId}
          onChange={(e) => setAccessLocId(e.target.value)}
        >
          <option value="">— nenastaveno —</option>
          {characters.map((c) => (
            <option key={c.slug} value={c.id}>
              {c.name}
              {c.isNpc ? ' (NPC)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className={s.field}>
        <span>Měna</span>
        {currencyList.length === 0 ? (
          <select
            className={s.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled
          >
            <option value={currency}>{currency || '— žádné —'}</option>
          </select>
        ) : (
          <CurrencySelect
            value={currency}
            onChange={setCurrency}
            items={currencyList}
          />
        )}
      </label>

      <label className={s.field}>
        <span>Vklad / výběr pro hráče</span>
        <span className={s.checkboxRow}>
          <input
            type="checkbox"
            checked={allowPlayerSelfAdjust}
            onChange={(e) => setAllowPlayerSelfAdjust(e.target.checked)}
          />
          <span className={s.helperInline}>
            Povolit hráči-vlastníkovi samostatný vklad i výběr s povinným
            důvodem (historie zůstává auditovatelná).
          </span>
        </span>
      </label>

      <div className={s.settingsActions}>
        <button
          type="button"
          className={s.btnPrimary}
          disabled={!dirty || update.isPending}
          onClick={handleSaveSettings}
        >
          Uložit nastavení
        </button>
      </div>

      <div className={s.coOwners}>
        <h4 className={s.coOwnerTitle}>Spoluvlastníci</h4>
        <ul className={s.coOwnerList}>
          {account.ownerCharacterIds.map((id) => (
            <li key={id} className={s.coOwnerRow}>
              <span>
                {findCharName(id)}
                {id === account.primaryOwnerId && (
                  <span className={s.primaryBadge}>primární</span>
                )}
              </span>
              {id !== account.primaryOwnerId && (
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => handleRemoveCoOwner(id)}
                  title="Odebrat"
                  aria-label="Odebrat spoluvlastníka"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className={s.coOwnerAdd}>
          <select
            className={s.input}
            value={coOwnerToAdd}
            onChange={(e) => setCoOwnerToAdd(e.target.value)}
          >
            <option value="">— vyber postavu —</option>
            {characters
              .filter((c) => !account.ownerCharacterIds.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className={s.btnSecondary}
            disabled={!coOwnerToAdd || addCo.isPending}
            onClick={handleAddCoOwner}
          >
            Přidat
          </button>
        </div>
      </div>

      <div className={s.dangerZone}>
        <button
          type="button"
          className={s.btnDanger}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={14} aria-hidden /> Smazat účet
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Smazat účet?"
        message={`Účet „${account.label}" se trvale smaže včetně historie transakcí. Akci nelze vzít zpět.`}
        confirmLabel="Smazat účet"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isPending={deleteMut.isPending}
      />
    </section>
  );
}
