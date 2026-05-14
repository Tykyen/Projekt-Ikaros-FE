import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/types';
import {
  useCreateWorld,
  type WorldAccessMode,
} from '@/features/world/api/useCreateWorld';
import { useSlugAvailability } from '@/features/world/api/useSlugAvailability';
import { BasicInfoSection } from './components/BasicInfoSection';
import { GenreSection } from './components/GenreSection';
import { PlayersSection } from './components/PlayersSection';
import { AccessModeSection } from './components/AccessModeSection';
import { SystemSection } from './components/SystemSection';
import { GENRE_CUSTOM_LABEL } from './constants/genres';
import { TONE_CUSTOM_LABEL } from './constants/tones';
import { DEFAULT_SYSTEM, SYSTEM_CUSTOM_ID } from './constants/systems';
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
  const [tones, setTones] = useState<string[]>([]);
  const [customTone, setCustomTone] = useState('');

  const [playersWanted, setPlayersWanted] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);

  const [accessMode, setAccessMode] = useState<WorldAccessMode>('private');

  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [customSystem, setCustomSystem] = useState('');
  const [dice, setDice] = useState<string[]>([]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;

    const finalGenre =
      genre === GENRE_CUSTOM_LABEL ? customGenre.trim() : genre;

    const finalTones = tones
      .filter((t) => t !== TONE_CUSTOM_LABEL)
      .concat(customTone.trim() ? [customTone.trim()] : []);

    const finalSystem =
      system === SYSTEM_CUSTOM_ID ? customSystem.trim() : system;

    try {
      const world = await mutation.mutateAsync({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        genre: finalGenre || undefined,
        tones: finalTones.length ? finalTones : undefined,
        playersWanted: playersWanted.trim() || undefined,
        maxPlayers,
        accessMode,
        system: finalSystem,
        dice: dice.length ? dice : undefined,
      });
      toast.success(`Svět „${world.name}" byl vytvořen.`);
      navigate(`/svet/${world.id}`);
    } catch (err) {
      const apiErr = (err as { response?: { data?: ApiError } })?.response?.data;
      const code = apiErr?.error?.code;
      if (code === 'WORLD_SLUG_TAKEN' || code === 'CONFLICT') {
        toast.error('Adresa už existuje, zvol jinou.');
      } else if (code === 'WORLD_QUOTA_REACHED') {
        toast.error(
          'Dosáhl jsi limitu 30 aktivních světů. Smaž některý nebo požádej admina.',
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
          tones={tones}
          customTone={customTone}
          onGenreChange={setGenre}
          onCustomGenreChange={setCustomGenre}
          onTonesChange={setTones}
          onCustomToneChange={setCustomTone}
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
          onSystemChange={setSystem}
          onCustomSystemChange={setCustomSystem}
          onDiceChange={setDice}
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
