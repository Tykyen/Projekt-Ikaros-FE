import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  CalendarPlus,
  RotateCcw,
  Send,
  ShieldCheck,
  KeyRound,
  Coins as CoinsIcon,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useCharacterAccounts,
  useUpdateAccount,
  useAccountUndo,
  useWorldCurrencies,
} from '../../api/useCharacterAccounts';
import type {
  CharacterAccount,
  FinanceEntry,
} from '../../api/characters.types';
import {
  formatCurrency,
  convertAmount,
  getCurrencySymbol,
  useUserPreferredCurrency,
  UnknownCurrencyChip,
  type WorldCurrencyItem,
} from '@/features/world/currencies/shared';
import type { Page } from '../../api/pages.types';
import { EditStickyBar } from './EditStickyBar';
import { EditModeBanner } from './EditModeBanner';
import { SubdocErrorState } from './SubdocErrorState';
import { AccountSwitcher } from './accounts/AccountSwitcher';
import { CreateAccountModal } from './accounts/CreateAccountModal';
import { TransferModal } from './accounts/TransferModal';
import { SettingsAccountSection } from './accounts/SettingsAccountSection';
import { AdjustBalanceModal } from './accounts/AdjustBalanceModal';
import { ConfirmAddMonthlyModal } from './accounts/ConfirmAddMonthlyModal';
import { WorldRole } from '@/shared/types';
import s from './subdocs.module.css';
import a from './accounts/accounts.module.css';
import ed from './editors/editors.module.css';

interface Props {
  page: Page;
  mode: 'view' | 'edit';
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onBackToProfil: () => void;
}

function fmtDate(iso?: string | Date): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('cs-CZ');
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 8.6 — Multi-account FinanceTab. Postava může mít 1..20 účtů (osobní,
 * společné, tajné, …). Hero karta zobrazuje aktivní účet, switcher umožňuje
 * přepínání. Hráč může poslat peníze na jiný účet/postavu (TransferModal).
 *
 * PJ-only nastavení účtu (typ, vedeno u, měna, spoluvlastníci) je dole v
 * `SettingsAccountSection`.
 */
export function FinanceTab({
  page,
  mode,
  onExitEdit,
  onDirtyChange,
  onBackToProfil,
}: Props) {
  const { worldId, userRole } = useWorldContext();
  const isPJ = (userRole ?? -1) >= WorldRole.PomocnyPJ;
  const accountsQuery = useCharacterAccounts(worldId, page.slug);
  const currenciesQuery = useWorldCurrencies(worldId);

  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (accountsQuery.isLoading) return <Spinner center />;
  if (accountsQuery.isError) {
    return (
      <SubdocErrorState
        error={accountsQuery.error}
        resourceLabel="finance"
        onRetry={() => accountsQuery.refetch()}
      />
    );
  }
  const accounts = accountsQuery.data ?? [];
  // Derived default: pokud activeAccountId není v aktuálním seznamu, použij první.
  const resolvedActiveId =
    activeAccountId && accounts.some((a) => a.id === activeAccountId)
      ? activeAccountId
      : (accounts[0]?.id ?? null);
  const activeAccount =
    accounts.find((a) => a.id === resolvedActiveId) ?? null;
  const currencies = currenciesQuery.data?.items ?? [];

  return (
    <div className={s.financeShell}>
      <div className={s.financeMain}>
        {accounts.length > 1 && (
          <SummaryBanner
            accounts={accounts}
            currencies={currencies}
            worldId={worldId}
          />
        )}

        <AccountSwitcher
          accounts={accounts}
          activeId={resolvedActiveId}
          onChange={setActiveAccountId}
          onCreate={() => setCreateOpen(true)}
          canCreate
          currencies={currencies}
        />

        {activeAccount ? (
          mode === 'edit' ? (
            <AccountEdit
              account={activeAccount}
              page={page}
              worldId={worldId}
              currencies={currencies}
              isPJ={isPJ}
              onExitEdit={onExitEdit}
              onDirtyChange={onDirtyChange}
              onBackToProfil={onBackToProfil}
            />
          ) : (
            <AccountView
              account={activeAccount}
              worldId={worldId}
              currencies={currencies}
              isPJ={isPJ}
              onAccountDeleted={() => {
                setActiveAccountId(null);
                void accountsQuery.refetch();
              }}
            />
          )
        ) : (
          <p className={s.empty}>Žádný účet — vytvoř první.</p>
        )}
      </div>

      {activeAccount && (
        <FinanceAside
          page={page}
          account={activeAccount}
          onBackToProfil={onBackToProfil}
        />
      )}

      {createOpen && (
        <CreateAccountModal
          worldId={worldId}
          characterSlug={page.slug}
          currencies={currencies}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setActiveAccountId(id);
            setCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ── Summary banner ─────────────────────────────────────────────────

function SummaryBanner({
  accounts,
  currencies,
  worldId,
}: {
  accounts: CharacterAccount[];
  currencies: WorldCurrencyItem[];
  worldId: string;
}) {
  const { resolvedCode } = useUserPreferredCurrency(worldId, currencies);

  // Per-currency rozklad
  const totals = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + a.balance;
    return acc;
  }, {});

  // Hlavní total v preferred měně (skip neznámé měny — viz UnknownCurrencyChip)
  const unknownCount = accounts.filter(
    (a) => !currencies.some((c) => c.code === a.currency),
  ).length;
  const totalInPreferred = resolvedCode
    ? accounts.reduce((sum, a) => {
        const converted = convertAmount(
          a.balance,
          a.currency,
          resolvedCode,
          currencies,
        );
        return sum + (converted ?? 0);
      }, 0)
    : null;

  return (
    <div className={a.summaryBanner}>
      {totalInPreferred !== null && resolvedCode && (
        <div className={a.summaryItem}>
          <span className={a.summaryLabel}>Celkem (v {resolvedCode})</span>
          <span className={a.summaryValue}>
            {formatCurrency(totalInPreferred, resolvedCode, currencies)}
          </span>
        </div>
      )}
      {Object.entries(totals)
        .filter(([cur]) => currencies.some((c) => c.code === cur))
        .map(([cur, total]) => (
          <div key={cur} className={a.summaryItem}>
            <span className={a.summaryLabel}>Účty v {cur}</span>
            <span className={a.summaryValue}>
              {formatCurrency(total, cur, currencies)}
            </span>
          </div>
        ))}
      {unknownCount > 0 && (
        <div className={a.summaryItem}>
          <UnknownCurrencyChip code={`${unknownCount} účtů`} />
        </div>
      )}
    </div>
  );
}

// ── Aside (sticky pro 1 aktivní účet) ─────────────────────────────

function FinanceAside({
  page,
  account,
  onBackToProfil,
}: {
  page: Page;
  account: CharacterAccount;
  onBackToProfil: () => void;
}) {
  const accessStatus = account.accessLocation ? 'Aktivní' : 'Nenastaveno';
  return (
    <aside className={s.financeAside}>
      {page.imageUrl && (
        <div className={s.asidePortraitWrap}>
          <img
            src={page.imageUrl}
            alt={page.title}
            className={s.asidePortrait}
            loading="lazy"
          />
        </div>
      )}
      <h1 className={s.asideTitle}>
        {account.label}
        <br />
        <span className={s.asideTitleHighlight}>{page.title}</span>
      </h1>
      <ul className={s.metaList}>
        <li className={s.metaRow}>
          <ShieldCheck size={16} className={s.metaIcon} aria-hidden />
          <span className={s.metaLabel}>Typ účtu</span>
          <strong className={s.metaValue}>
            {account.accountType || 'Nenastaveno'}
          </strong>
        </li>
        <li className={s.metaRow}>
          <KeyRound size={16} className={s.metaIcon} aria-hidden />
          <span className={s.metaLabel}>Stav přístupu</span>
          <strong className={s.metaValue}>{accessStatus}</strong>
        </li>
        <li className={s.metaRow}>
          <CoinsIcon size={16} className={s.metaIcon} aria-hidden />
          <span className={s.metaLabel}>Měna</span>
          <strong className={s.metaValue}>
            {account.currency || 'Nenastavena'}
          </strong>
        </li>
        <li className={s.metaRow}>
          <RefreshCcw size={16} className={s.metaIcon} aria-hidden />
          <span className={s.metaLabel}>Poslední synchronizace</span>
          <strong className={s.metaValue}>{fmtDate(account.updatedAt)}</strong>
        </li>
      </ul>
      <button
        type="button"
        className={s.disconnectBtn}
        onClick={onBackToProfil}
      >
        Odpojit účet
      </button>
    </aside>
  );
}

// ── View (jeden účet) ─────────────────────────────────────────────

interface ViewProps {
  account: CharacterAccount;
  worldId: string;
  currencies: WorldCurrencyItem[];
  isPJ: boolean;
  onAccountDeleted: () => void;
}

function AccountView({
  account,
  worldId,
  currencies,
  isPJ,
  onAccountDeleted,
}: ViewProps) {
  const incomeSum = account.incomeEntries.reduce((s, e) => s + e.amount, 0);
  const expenseSum = account.expenseEntries.reduce((s, e) => s + e.amount, 0);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [addMonthlyOpen, setAddMonthlyOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const undo = useAccountUndo(worldId, account.id);
  const currencyKnown = currencies.some((c) => c.code === account.currency);
  // Spec 8.x-prep §4.4 (B3) — tlačítko Vklad/Výběr visible pokud PJ+ nebo
  // hráč-vlastník s allowPlayerSelfAdjust=true. BE je autoritativní (403
  // pokud uvnitř modalu BE odmítne).
  const canAdjust = isPJ || account.allowPlayerSelfAdjust === true;
  // Spec 8.x-prep — Zaúčtovat měsíc + Vrátit transakci dostupné stejně jako
  // v Edit modu (autor postavy + PomocnyPJ+); permission rozhoduje BE
  // (assertWriteContentAccess).

  function runUndo() {
    undo.mutate(undefined, {
      onSuccess: () => toast.success('Transakce vrácena'),
      onError: () => toast.error('Vrácení selhalo'),
    });
    setUndoOpen(false);
  }

  return (
    <>
      <div className={s.heroCard}>
        <div className={s.heroBadges}>
          <span className={`${s.heroBadge} ${s.badgeActive}`}>
            Aktivní účet
          </span>
          <span className={s.heroBadge}>Zabezpečená relace</span>
          {account.ownerCharacterIds.length > 1 && (
            <span className={`${s.heroBadge} ${s.badgeActive}`}>Sdílený</span>
          )}
        </div>
        <div className={s.heroBalance}>
          <span className={s.heroLabel}>Aktuální zůstatek</span>
          <span className={s.heroValue}>
            {formatCurrency(account.balance, account.currency, currencies)}
            {!currencyKnown && (
              <>
                {' '}
                <UnknownCurrencyChip code={account.currency} />
              </>
            )}
          </span>
        </div>
        <div className={s.heroSplit}>
          <div className={`${s.splitCard} ${s.splitIncome}`}>
            <span className={s.splitLabel}>Příjmy</span>
            <strong className={s.splitValue}>
              +{formatCurrency(incomeSum, account.currency, currencies)}
            </strong>
          </div>
          <div className={s.splitDivider} aria-hidden />
          <div className={`${s.splitCard} ${s.splitExpense}`}>
            <span className={s.splitLabel}>Výdaje</span>
            <strong className={s.splitValue}>
              −{formatCurrency(expenseSum, account.currency, currencies)}
            </strong>
          </div>
        </div>
        <div className={s.actionRow}>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => setTransferOpen(true)}
          >
            <Send size={14} aria-hidden /> Poslat
          </button>
          {canAdjust && (
            <button
              type="button"
              className={s.actionBtn}
              onClick={() => setAdjustOpen(true)}
              title={isPJ ? 'Vklad / Výběr (PJ)' : 'Vklad / Výběr'}
            >
              <CoinsIcon size={14} aria-hidden /> Vklad / Výběr
            </button>
          )}
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => setAddMonthlyOpen(true)}
            title="Zaúčtuje měsíční bilanci (income − expense) z uložených polí"
          >
            <CalendarPlus size={14} aria-hidden /> Zaúčtovat měsíc
          </button>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => setUndoOpen(true)}
            disabled={undo.isPending || account.transactions.length === 0}
            title="Vrátit poslední transakci"
          >
            <RotateCcw size={14} aria-hidden /> Vrátit transakci
          </button>
        </div>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Historie transakcí</h2>
        <Transactions account={account} currencies={currencies} />
      </section>

      {account.notes && account.notes.trim() && (
        <section className={s.notesCard}>
          <h2 className={s.notesTitle}>Rozepsané</h2>
          <div className={s.notesBody}>
            <RichTextEditor value={account.notes} readOnly />
          </div>
        </section>
      )}

      <SettingsAccountSection
        account={account}
        onDeleted={onAccountDeleted}
      />

      {transferOpen && (
        <TransferModal
          worldId={worldId}
          fromAccount={account}
          onClose={() => setTransferOpen(false)}
          onTransferred={() => setTransferOpen(false)}
        />
      )}

      {adjustOpen && (
        <AdjustBalanceModal
          worldId={worldId}
          account={account}
          currencies={currencies}
          onClose={() => setAdjustOpen(false)}
        />
      )}

      {addMonthlyOpen && (
        <ConfirmAddMonthlyModal
          worldId={worldId}
          account={account}
          currencies={currencies}
          onClose={() => setAddMonthlyOpen(false)}
        />
      )}

      <ConfirmDialog
        open={undoOpen}
        onClose={() => setUndoOpen(false)}
        title="Vrátit poslední transakci?"
        message="Poslední transakce se odebere a zůstatek se o ni upraví. Akci nelze vzít zpět."
        confirmLabel="Vrátit transakci"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={runUndo}
        isPending={undo.isPending}
      />
    </>
  );
}

function Transactions({
  account,
  currencies,
}: {
  account: CharacterAccount;
  currencies: WorldCurrencyItem[];
}) {
  if (account.transactions.length === 0) {
    return <p className={s.empty}>Zatím žádné transakce.</p>;
  }
  return (
    <ul className={s.rowList}>
      {[...account.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((t) => (
          <li key={t.id} className={s.row}>
            <span>
              {t.description || 'Transakce'}{' '}
              <span
                className={s.rowMeta}
                title={`Zapsáno: ${fmtDate(t.date)}`}
              >
                {t.inGameDate ? (
                  <>📅 {formatInGameDate(t.inGameDate)}</>
                ) : (
                  fmtDate(t.date)
                )}
              </span>
            </span>
            <span
              className={`${s.rowAmount} ${
                t.delta >= 0 ? s.amountPos : s.amountNeg
              }`}
            >
              {t.delta >= 0 ? '+' : ''}
              {formatCurrency(t.delta, account.currency, currencies)}
            </span>
          </li>
        ))}
    </ul>
  );
}

/**
 * Spec 8.x-prep §4.4 — render in-game data v historii. Krátká forma bez
 * závislosti na calendar config (BE neukládá calendar slug, jen FantasyDate
 * shape). Plný `formatFantasyDate` (s názvem měsíce) se použije až ve
 * sdíleném útvaru později, pokud bude potřeba.
 */
function formatInGameDate(date: {
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
}): string {
  const datePart = `${date.day}. ${date.monthIndex + 1}. ${date.year}`;
  if (date.hour !== undefined && date.minute !== undefined) {
    const hh = String(date.hour).padStart(2, '0');
    const mm = String(date.minute).padStart(2, '0');
    return `${datePart}, ${hh}:${mm}`;
  }
  return datePart;
}

// ── Edit (jeden účet — entries + notes + actions) ─────────────────

interface EditProps {
  account: CharacterAccount;
  page: Page;
  worldId: string;
  currencies: WorldCurrencyItem[];
  isPJ: boolean;
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onBackToProfil: () => void;
}

function AccountEdit({
  account,
  worldId,
  currencies,
  isPJ,
  onExitEdit,
  onDirtyChange,
}: EditProps) {
  const updateMut = useUpdateAccount(worldId, account.id);
  const undo = useAccountUndo(worldId, account.id);

  const [label, setLabel] = useState(account.label);
  const [incomeEntries, setIncomeEntries] = useState<FinanceEntry[]>(
    () => account.incomeEntries,
  );
  const [expenseEntries, setExpenseEntries] = useState<FinanceEntry[]>(
    () => account.expenseEntries,
  );
  const [notes, setNotes] = useState(account.notes ?? '');
  const [dirty, setDirty] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  // Spec 8.x-prep §4.2 — Fáze D dodá ConfirmAddMonthlyModal. Prozatím
  // state otevírá placeholder toast (přes alert flow ve Fázi C). Modal
  // se zapojí v Step D1.
  const [addMonthlyOpen, setAddMonthlyOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const canAdjust = isPJ || account.allowPlayerSelfAdjust === true;
  const currencyKnown = currencies.some((c) => c.code === account.currency);
  const currencySymbol = getCurrencySymbol(account.currency, currencies);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const touch = () => setDirty(true);

  function patchEntry(
    list: 'income' | 'expense',
    index: number,
    patch: Partial<FinanceEntry>,
  ) {
    const setter = list === 'income' ? setIncomeEntries : setExpenseEntries;
    setter((es) => es.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    touch();
  }
  function removeEntry(list: 'income' | 'expense', index: number) {
    const setter = list === 'income' ? setIncomeEntries : setExpenseEntries;
    setter((es) => es.filter((_, i) => i !== index));
    touch();
  }
  function addEntry(list: 'income' | 'expense') {
    const setter = list === 'income' ? setIncomeEntries : setExpenseEntries;
    setter((es) => [...es, { id: newId(), label: '', amount: 0 }]);
    touch();
  }

  function handleSave() {
    updateMut.mutate(
      { label, incomeEntries, expenseEntries, notes },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Účet uložen');
        },
        onError: () => toast.error('Uložení selhalo'),
      },
    );
  }

  function runUndo() {
    undo.mutate(undefined, {
      onSuccess: () => toast.success('Transakce vrácena'),
      onError: () => toast.error('Vrácení selhalo'),
    });
    setUndoOpen(false);
  }

  const actionsBusy = undo.isPending;

  return (
    <>
      <EditModeBanner label="Finance" />

      <div className={s.heroCard}>
        <div className={s.heroBalance}>
          <span className={s.heroLabel}>Aktuální zůstatek (uloženo)</span>
          <span className={s.heroValue}>
            {formatCurrency(account.balance, account.currency, currencies)}
            {!currencyKnown && (
              <>
                {' '}
                <UnknownCurrencyChip code={account.currency} />
              </>
            )}
          </span>
        </div>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Název účtu</h2>
        <input
          type="text"
          className={ed.field}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            touch();
          }}
        />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Měsíční příjmy</h2>
        <EntryList
          list="income"
          entries={incomeEntries}
          currencySymbol={currencySymbol}
          onPatch={(i, p) => patchEntry('income', i, p)}
          onRemove={(i) => removeEntry('income', i)}
          onAdd={() => addEntry('income')}
        />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Měsíční výdaje</h2>
        <EntryList
          list="expense"
          entries={expenseEntries}
          currencySymbol={currencySymbol}
          onPatch={(i, p) => patchEntry('expense', i, p)}
          onRemove={(i) => removeEntry('expense', i)}
          onAdd={() => addEntry('expense')}
        />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Účtování</h2>
        {dirty && (
          <p className={s.empty}>
            Nejdřív ulož změny příjmů a výdajů — zaúčtování počítá z uložených
            dat.
          </p>
        )}
        <div className={s.actionRow}>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => setAddMonthlyOpen(true)}
            disabled={dirty || actionsBusy}
          >
            <CalendarPlus size={14} aria-hidden /> Zaúčtovat měsíc
          </button>
          {canAdjust && (
            <button
              type="button"
              className={s.actionBtn}
              onClick={() => setAdjustOpen(true)}
              disabled={actionsBusy}
              title={isPJ ? 'Vklad / Výběr (PJ)' : 'Vklad / Výběr'}
            >
              <CoinsIcon size={14} aria-hidden /> Vklad / Výběr
            </button>
          )}
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => setUndoOpen(true)}
            disabled={dirty || actionsBusy || account.transactions.length === 0}
          >
            <RotateCcw size={14} aria-hidden /> Vrátit transakci
          </button>
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Historie transakcí</h2>
        <Transactions account={account} currencies={currencies} />
      </section>

      <section className={s.notesCard}>
        <h2 className={s.notesTitle}>Rozepsané</h2>
        <RichTextEditor
          value={notes}
          onChange={(v) => {
            setNotes(v);
            touch();
          }}
        />
      </section>

      <EditStickyBar
        dirty={dirty}
        isPending={updateMut.isPending}
        onSave={handleSave}
        onCancel={onExitEdit}
      />

      {addMonthlyOpen && (
        <ConfirmAddMonthlyModal
          worldId={worldId}
          account={account}
          currencies={currencies}
          onClose={() => setAddMonthlyOpen(false)}
        />
      )}

      {adjustOpen && (
        <AdjustBalanceModal
          worldId={worldId}
          account={account}
          currencies={currencies}
          onClose={() => setAdjustOpen(false)}
        />
      )}

      <ConfirmDialog
        open={undoOpen}
        onClose={() => setUndoOpen(false)}
        title="Vrátit poslední transakci?"
        message="Poslední transakce se odebere a zůstatek se o ni upraví. Akci nelze vzít zpět."
        confirmLabel="Vrátit transakci"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={runUndo}
        isPending={undo.isPending}
      />
    </>
  );
}

function EntryList({
  list,
  entries,
  currencySymbol,
  onPatch,
  onRemove,
  onAdd,
}: {
  list: 'income' | 'expense';
  entries: FinanceEntry[];
  currencySymbol: string;
  onPatch: (index: number, patch: Partial<FinanceEntry>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  const placeholder =
    list === 'income' ? 'např. Plat, Renta, Odměna…' : 'např. Nájem, Daně, Jídlo…';
  return (
    <div className={ed.stack}>
      {entries.length > 0 && (
        <div className={`${ed.row} ${ed.entryHeaderRow}`}>
          <span className={`${ed.entryHeaderLabel} ${ed.rowGrow}`}>Popis</span>
          <span className={`${ed.entryHeaderLabel} ${ed.fieldNum}`}>
            Částka ({currencySymbol})
          </span>
          <span className={ed.entryHeaderSpacer} aria-hidden />
        </div>
      )}
      {entries.map((entry, i) => (
        <div key={entry.id} className={ed.row}>
          <input
            className={`${ed.field} ${ed.rowGrow}`}
            value={entry.label}
            placeholder={placeholder}
            aria-label={list === 'income' ? 'Popis příjmu' : 'Popis výdaje'}
            onChange={(e) => onPatch(i, { label: e.target.value })}
          />
          <input
            className={`${ed.field} ${ed.fieldNum}`}
            type="number"
            min={0}
            step={1}
            value={entry.amount}
            aria-label={`Částka v ${currencySymbol}`}
            onChange={(e) => onPatch(i, { amount: Number(e.target.value) })}
          />
          <button
            type="button"
            className={ed.iconBtn}
            onClick={() => onRemove(i)}
            title="Smazat"
            aria-label="Smazat"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button type="button" className={ed.addBtn} onClick={onAdd}>
        <Plus size={13} aria-hidden /> Přidat {list === 'income' ? 'příjem' : 'výdaj'}
      </button>
    </div>
  );
}

