import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/types';
import {
  useCreateWorld,
  type WorldAccessMode,
} from '@/features/world/api/useCreateWorld';
import { useSlugAvailability } from '@/features/world/api/useSlugAvailability';
import { CALENDAR_PRESETS } from '@/shared/lib/calendarEngine/presets';
import { BasicInfoSection } from './components/BasicInfoSection';
import { GenreSection } from './components/GenreSection';
import { PlayersSection } from './components/PlayersSection';
import { AccessModeSection } from './components/AccessModeSection';
import { SystemSection } from './components/SystemSection';
import { TechnologySection } from './components/TechnologySection';
import { MagicSection } from './components/MagicSection';
import { ThemeSection } from './components/ThemeSection';
import { CalendarsSection } from './components/CalendarsSection';
import { GENRE_CUSTOM_LABEL, themeForGenre } from './constants/genres';
import { DEFAULT_SYSTEM, SYSTEM_CUSTOM_ID } from './constants/systems';
import { getDicePreset, applySystemChange } from './constants/systemDicePresets';
import {
  DEFAULT_TECH_MIN,
  DEFAULT_TECH_MAX,
} from './constants/technologyLevels';
import { useWorldSlug } from './hooks/useWorldSlug';
import s from './CreateWorldPage.module.css';

export default function CreateWorldPage() {
  const navigate = useNavigate();
  const mutation = useCreateWorld();

  // Form state
  const [name, setName] = useState('');
  const { slug, onSlugChange } = useWorldSlug(name);
  const [description, setDescription] = useState('');

  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  // Tóny vyprávění: UI sekce dočasně vyřazena (2026-05-14). Pole zůstává
  // v BE schématu i `CreateWorldInput`; nyní z formuláře neposíláme.

  const [playersWanted, setPlayersWanted] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);

  const [accessMode, setAccessMode] = useState<WorldAccessMode>('private');

  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [customSystem, setCustomSystem] = useState('');
  // 2.3b — start s presetem default systému; smart-replace při změně.
  const [dice, setDice] = useState<string[]>(() =>
    getDicePreset(DEFAULT_SYSTEM),
  );

  // 2.3b — změna systému přednastaví kostky, ale nepřepíše ruční úpravy.
  function handleSystemChange(next: string) {
    setDice((prev) => applySystemChange(system, next, prev));
    setSystem(next);
  }

  // 2.3d — technologické pásmo světa (seeduje stránku Technologie).
  const [techMin, setTechMin] = useState(DEFAULT_TECH_MIN);
  const [techMax, setTechMax] = useState(DEFAULT_TECH_MAX);

  // 2.3e — tradice magie světa (seeduje stránku Magický systém).
  const [magicTraditions, setMagicTraditions] = useState<string[]>([]);

  // 5.0 — motiv světa se odvozuje ze žánru; `themeOverride` = ruční přepis PJ
  // (null = odvozeno).
  const [themeOverride, setThemeOverride] = useState<string | null>(null);

  // 9.3-F-I-Q1 — calendar selector. Default: jen Gregorian zaškrtnutý + jako ⭐.
  const [selectedCalendarSlugs, setSelectedCalendarSlugs] = useState<
    Set<string>
  >(() => new Set(['gregorian']));
  const [defaultCalendarSlug, setDefaultCalendarSlug] = useState<string | null>(
    'gregorian',
  );

  function toggleCalendar(slug: string) {
    setSelectedCalendarSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        // Pokud odškrtnu aktuální default, posuň default na první zbývající (nebo null).
        if (defaultCalendarSlug === slug) {
          const first = next.values().next().value ?? null;
          setDefaultCalendarSlug(first);
        }
      } else {
        next.add(slug);
        // První zaškrtnutý se stane default.
        if (defaultCalendarSlug === null) setDefaultCalendarSlug(slug);
      }
      return next;
    });
  }

  // 2.3 D-NEW-slug-check — live availability check
  const slugStatus = useSlugAvailability(slug);

  // Validace
  const nameOk = name.trim().length >= 2 && name.trim().length <= 60;
  const slugOk =
    slug.length >= 2 && slugStatus !== 'taken' && slugStatus !== 'invalid';
  const genreOk =
    genre !== '' && (genre !== GENRE_CUSTOM_LABEL || customGenre.trim() !== '');
  const systemOk =
    system !== '' &&
    (system !== SYSTEM_CUSTOM_ID || customSystem.trim() !== '');
  const canSubmit =
    nameOk && slugOk && genreOk && systemOk && slugStatus !== 'checking';

  const missing: string[] = [];
  if (!nameOk) missing.push('Název');
  if (!slugOk) missing.push('Adresa');
  if (!genreOk) missing.push('Žánr');
  if (!systemOk) missing.push('Systém');
  const submitTitle = canSubmit
    ? 'Vytvořit svět'
    : `Vyplň: ${missing.join(', ')}`;

  // 5.0 — efektivní žánr (po rozbalení „Vlastní") a z něj odvozený motiv.
  const finalGenre = genre === GENRE_CUSTOM_LABEL ? customGenre.trim() : genre;
  const effectiveTheme = themeOverride ?? themeForGenre(finalGenre);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;

    const finalSystem =
      system === SYSTEM_CUSTOM_ID ? customSystem.trim() : system;

    // 9.3-F-I-Q1 — sestavit calendars array z vybraných presetů
    const selectedPresets = CALENDAR_PRESETS.filter((p) =>
      selectedCalendarSlugs.has(p.slug),
    );
    const calendarsPayload = selectedPresets.map((p) => p.template);

    try {
      const world = await mutation.mutateAsync({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        genre: finalGenre || undefined,
        playersWanted: playersWanted.trim() || undefined,
        maxPlayers,
        accessMode,
        system: finalSystem,
        dice: dice.length ? dice : undefined,
        techLevelMin: techMin,
        techLevelMax: techMax,
        magicTraditions: magicTraditions.length ? magicTraditions : undefined,
        themeId: effectiveTheme,
        calendars: calendarsPayload,
        ...(defaultCalendarSlug && selectedCalendarSlugs.has(defaultCalendarSlug)
          ? { defaultCalendarSlug }
          : {}),
      });
      toast.success(`Svět „${world.name}" byl vytvořen.`);
      navigate(`/svet/${world.slug}`);
    } catch (err) {
      const apiErr = (err as { response?: { data?: ApiError } })?.response?.data;
      const code = apiErr?.error?.code;
      if (code === 'WORLD_SLUG_TAKEN' || code === 'CONFLICT') {
        toast.error('Adresa už existuje, zvol jinou.');
      } else if (code === 'WORLD_QUOTA_REACHED') {
        toast.error(
          'Dosáhl jsi limitu 30 aktivních světů. Smaž některý nebo požádej admina.',
        );
      } else if (code === 'WORLD_MEMBERSHIP_QUOTA_REACHED') {
        toast.error(
          'Bez podpory můžeš být max ve 3 světech. Staň se podporovatelem (Uživatelé → Podporovatelé), nebo některý svět opusť.',
        );
      } else {
        toast.error('Vytvoření světa selhalo. Zkus to znovu.');
      }
    }
  };

  return (
    <form className={s.page} onSubmit={handleSubmit} noValidate>
      <header className={s.header}>
        <button
          type="button"
          className={s.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ←
        </button>
        <h1 className={s.title}>Vytvořit nový svět</h1>
      </header>

      <div className={s.grid}>
        <BasicInfoSection
          name={name}
          slug={slug}
          description={description}
          slugStatus={slugStatus}
          onNameChange={setName}
          onSlugChange={onSlugChange}
          onDescriptionChange={setDescription}
        />
        <GenreSection
          genre={genre}
          customGenre={customGenre}
          onGenreChange={setGenre}
          onCustomGenreChange={setCustomGenre}
        />
        <PlayersSection
          playersWanted={playersWanted}
          maxPlayers={maxPlayers}
          onPlayersWantedChange={setPlayersWanted}
          onMaxPlayersChange={setMaxPlayers}
        />
        <AccessModeSection value={accessMode} onChange={setAccessMode} />
        <SystemSection
          system={system}
          customSystem={customSystem}
          dice={dice}
          onSystemChange={handleSystemChange}
          onCustomSystemChange={setCustomSystem}
          onDiceChange={setDice}
        />
        <TechnologySection
          min={techMin}
          max={techMax}
          onMinChange={setTechMin}
          onMaxChange={setTechMax}
        />
        <MagicSection
          traditions={magicTraditions}
          onChange={setMagicTraditions}
        />
        <ThemeSection
          genre={finalGenre}
          themeOverride={themeOverride}
          onThemeOverrideChange={setThemeOverride}
        />
        <CalendarsSection
          selectedSlugs={selectedCalendarSlugs}
          defaultSlug={defaultCalendarSlug}
          onToggle={toggleCalendar}
          onSetDefault={setDefaultCalendarSlug}
        />
      </div>

      <footer className={s.footer}>
        <button
          type="button"
          className={s.cancelBtn}
          onClick={() => navigate(-1)}
          disabled={mutation.isPending}
        >
          Zrušit
        </button>
        <button
          type="submit"
          className={s.submitBtn}
          disabled={!canSubmit || mutation.isPending}
          title={submitTitle}
        >
          {mutation.isPending ? 'Vytvářím…' : 'Vytvořit svět'}
        </button>
      </footer>
    </form>
  );
}
