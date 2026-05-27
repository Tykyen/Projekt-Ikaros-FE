/**
 * 9.4-I — Modal pro tvorbu / editaci generátoru počasí (spec §3.2).
 *
 * 3 taby (horizontální, scroll-friendly na mobile):
 *   1. „Preset"     — `WeatherPresetWizard` (3 stadia + search + recently used)
 *   2. „Základ"     — Name, Description, tempMin/Max + unit, windMin/Max + gust
 *   3. „Pokročilé"  — pressure, humidity, weatherTypes probabilities, customFields builder
 *
 * Po výběru presetu ve stage 3 → form state se předvyplní (config + defaultName),
 * uživatel se přepne na „Základ" tab a může uložit.
 *
 * Editing mode: pokud `editingGenerator` non-null, otevře se rovnou „Základ"
 * tab s předvyplněnými hodnotami (preset wizard tab dostupný, ale skip).
 */
import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Plus, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { Modal, Button, Input, Tabs, type TabItem } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import {
  useCreateWeatherGenerator,
  useUpdateWeatherGenerator,
} from '@/features/world/api/useWeatherGenerators';
import { useCreateCustomPreset } from '@/features/world/api/useCustomPresets';
import type {
  WeatherGenerator,
  WeatherGeneratorConfig,
  WeatherTypeEntry,
  CustomFieldConfig,
} from '@/shared/types';
import { WeatherPresetWizard } from './wizard/WeatherPresetWizard';
import type { PresetItem } from './wizard/types';
import { mergeRepairConfig } from './repairConfig';
import s from './WeatherGeneratorModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  /** Pokud `undefined` → create mode; jinak edit mode (předvyplnit z config). */
  editingGenerator?: WeatherGenerator;
  /**
   * 9.4 — callback z wizardu kdy uživatel zvolil rozcestí kartu „📦 Sety".
   * Parent (WorldWeatherPage) zachytí, zavře tento generator modal a otevře
   * `WeatherSetsModal`. Pokud chybí, sety karta klikem nereaguje (defensive).
   */
  onSwitchToSets?: () => void;
}

type TabId = 'preset' | 'basic' | 'advanced';

const TABS: TabItem[] = [
  { id: 'preset', label: 'Preset' },
  { id: 'basic', label: 'Základ' },
  { id: 'advanced', label: 'Pokročilé' },
];

const EMPTY_CONFIG: WeatherGeneratorConfig = {
  tempMin: 0,
  tempMax: 25,
  tempUnit: 'C',
  weatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 60,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 30,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [5, 8],
      precipRange: [1, 10],
    },
  ],
  windMin: 0,
  windMax: 30,
  windGustMultiplier: 1.5,
  pressureMin: 990,
  pressureMax: 1030,
  humidityMin: 30,
  humidityMax: 90,
  customFields: [],
};

export function WeatherGeneratorModal({
  open,
  onClose,
  worldId,
  editingGenerator,
  onSwitchToSets,
}: Props) {
  const isEdit = !!editingGenerator;
  const user = useAtomValue(currentUserAtom);
  const userId = user?.id ?? null;

  const createMut = useCreateWeatherGenerator(worldId);
  const updateMut = useUpdateWeatherGenerator(worldId);
  // 9.4-dluh — uložit aktuální config jako custom svět-scoped preset
  const createPresetMut = useCreateCustomPreset(worldId);

  const [activeTab, setActiveTab] = useState<TabId>(isEdit ? 'basic' : 'preset');
  const [name, setName] = useState(editingGenerator?.name ?? '');
  const [description, setDescription] = useState(
    editingGenerator?.description ?? '',
  );
  const [config, setConfig] = useState<WeatherGeneratorConfig>(
    editingGenerator?.config ?? EMPTY_CONFIG,
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 9.4-J — generátor bez monthlyTemps = chybí klimatický model.
  // Edit: zobrazí warning banner + CTA „Opravit klimat".
  // Create: save guard (uživatel musí buď vybrat preset, nebo vědomě potvrdit přes „Prázdný formulář").
  const climateModelMissing = !config.monthlyTemps?.length;
  const [acknowledgedEmptyConfig, setAcknowledgedEmpty] = useState(false);

  // 9.4-dluh — inline form pro uložení aktuální config jako custom preset
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetEmoji, setPresetEmoji] = useState('');
  const [presetNameError, setPresetNameError] = useState<string | null>(null);

  async function handleSavePreset() {
    const trimmed = presetName.trim();
    if (!trimmed) {
      setPresetNameError('Zadej název presetu.');
      return;
    }
    if (trimmed.length > 80) {
      setPresetNameError('Název je příliš dlouhý (max 80).');
      return;
    }
    setPresetNameError(null);
    try {
      await createPresetMut.mutateAsync({
        name: trimmed,
        description: presetDescription.trim() || undefined,
        emoji: presetEmoji.trim() || undefined,
        config,
      });
      toast.success('Preset uložen — najdeš ho v wizardu pod „Mé presety".');
      setSavePresetOpen(false);
      setPresetName('');
      setPresetDescription('');
      setPresetEmoji('');
    } catch {
      toast.error('Uložení presetu selhalo.');
    }
  }

  // Re-init není potřeba — parent dělá conditional render (`{modal.kind === 'create' && <Modal />}`),
  // takže modal vždy fresh-mounts s init state z props. Pokud by parent ne-conditionally renderoval,
  // přidej `key={editingGenerator?.id ?? 'new'}` na modal element v parent.

  function handleApplyPreset(item: PresetItem) {
    const newConfig = item.toConfig();
    if (isEdit && climateModelMissing) {
      // 9.4-J — Repair mód: merge jen klima-fields, viz mergeRepairConfig.
      setConfig(mergeRepairConfig(config, newConfig));
      toast.success(`Klimat „${item.displayName}" aplikován`);
    } else {
      setConfig(newConfig);
      if (!name.trim()) setName(item.defaultGeneratorName);
      toast.success(`Preset „${item.displayName}" načten`);
    }
    setActiveTab('basic');
  }

  function handleSkipWizard() {
    setConfig(EMPTY_CONFIG);
    setActiveTab('basic');
    // 9.4-J — vědomá escape hatch: uživatel chce generátor bez klimatu.
    // Bez tohohle flagu save guard zablokuje uložení.
    setAcknowledgedEmpty(true);
  }

  const pending = createMut.isPending || updateMut.isPending;

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Zadej název generátoru.');
      setActiveTab('basic');
      return;
    }
    if (trimmed.length > 100) {
      setNameError('Název je příliš dlouhý (max 100).');
      return;
    }
    setNameError(null);

    // 9.4-J — Create guard: nový generátor musí mít buď klimatický model,
    // nebo vědomé potvrzení přes „Prázdný formulář".
    if (!isEdit && climateModelMissing && !acknowledgedEmptyConfig) {
      toast.error(
        'Vyber preset (Preset tab) nebo klikni „Prázdný formulář" pokud chceš generátor bez klimatu.',
      );
      setActiveTab('preset');
      return;
    }

    const payload = {
      name: trimmed,
      description: description.trim() || undefined,
      config,
    };
    try {
      if (isEdit && editingGenerator) {
        await updateMut.mutateAsync({ id: editingGenerator.id, ...payload });
        toast.success('Generátor upraven.');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Generátor vytvořen.');
      }
      onClose();
    } catch {
      toast.error('Uložení generátoru selhalo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit generátor' : 'Nový generátor počasí'}
      size="xl"
      footer={
        <>
          {!isEdit && activeTab === 'preset' && (
            <Button variant="ghost" onClick={handleSkipWizard} disabled={pending}>
              Prázdný formulář
            </Button>
          )}
          {/* 9.4-dluh — Uložit aktuální config jako svět-scoped preset.
              Skryto v záložce „Preset" (tam ještě uživatel nevyplnil config). */}
          {activeTab !== 'preset' && !savePresetOpen && (
            <Button
              variant="ghost"
              onClick={() => {
                setSavePresetOpen(true);
                setPresetName(name.trim());
              }}
              disabled={pending || createPresetMut.isPending}
              title="Uložit aktuální konfiguraci jako vlastní preset pro znovupoužití."
            >
              <Save size={14} aria-hidden /> Uložit jako preset
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} loading={pending}>
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
        </>
      }
    >
      {/* 9.4-dluh — Inline „Uložit jako preset" formulář. */}
      {savePresetOpen && (
        <div className={s.savePresetForm}>
          <div className={s.savePresetHead}>
            <strong>Uložit jako preset</strong>
            <button
              type="button"
              className={s.savePresetClose}
              onClick={() => {
                setSavePresetOpen(false);
                setPresetNameError(null);
              }}
              aria-label="Zavřít formulář"
            >
              <X size={14} />
            </button>
          </div>
          <p className={s.savePresetHint}>
            Uložená konfigurace bude dostupná v wizardu pod „Mé presety" jen
            pro tento svět. Config je po uložení neměnný — upravit můžeš jen
            název, popis a ikonu.
          </p>
          <div className={s.savePresetRow}>
            <Input
              label="Název presetu"
              value={presetName}
              onChange={(e) => {
                setPresetName(e.target.value);
                if (presetNameError) setPresetNameError(null);
              }}
              maxLength={80}
              error={presetNameError ?? undefined}
              placeholder="Např. Severní lesy mého světa"
            />
            <Input
              label="Ikona (emoji)"
              value={presetEmoji}
              onChange={(e) => setPresetEmoji(e.target.value)}
              maxLength={8}
              placeholder="🌲"
            />
          </div>
          <Input
            label="Popisek (volitelně)"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            maxLength={500}
            placeholder={'Krátký kontext (např. „pro lesní regiony Aelos").'}
          />
          <div className={s.savePresetActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSavePresetOpen(false)}
              disabled={createPresetMut.isPending}
            >
              Zrušit
            </Button>
            <Button
              size="sm"
              onClick={handleSavePreset}
              loading={createPresetMut.isPending}
            >
              <Save size={14} aria-hidden /> Uložit preset
            </Button>
          </div>
        </div>
      )}

      {/* 9.4-J — Banner: edit existujícího generátoru bez klimatického modelu. */}
      {isEdit && climateModelMissing && (
        <div className={s.climateWarning} role="status">
          <AlertTriangle size={18} aria-hidden />
          <div className={s.climateWarningBody}>
            <strong>Generátor nemá klimatický model.</strong>
            <span>
              Teplota se generuje jen jako šum kolem středu rozsahu —
              nezohledňuje sezónu ani místní klima. Vyber reálný klimat nebo
              archetyp.
            </span>
          </div>
          <Button size="sm" onClick={() => setActiveTab('preset')}>
            Opravit klimat
          </Button>
        </div>
      )}

      <Tabs
        items={TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        orientation="horizontal"
      >
        {activeTab === 'preset' && (
          <div className={s.tabPanel}>
            <WeatherPresetWizard
              worldId={worldId}
              userId={userId}
              onApplyPreset={handleApplyPreset}
              onSwitchToSets={onSwitchToSets}
              mode={isEdit && climateModelMissing ? 'repair' : 'create'}
            />
          </div>
        )}

        {activeTab === 'basic' && (
          <BasicTab
            name={name}
            description={description}
            nameError={nameError}
            config={config}
            onNameChange={(v) => {
              setName(v);
              if (nameError) setNameError(null);
            }}
            onDescriptionChange={setDescription}
            onConfigChange={setConfig}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedTab
            config={config}
            onConfigChange={setConfig}
            showAdvanced={showAdvanced}
            onToggleAdvanced={setShowAdvanced}
          />
        )}
      </Tabs>
    </Modal>
  );
}

// ── BasicTab ───────────────────────────────────────────────────────────

interface BasicTabProps {
  name: string;
  description: string;
  nameError: string | null;
  config: WeatherGeneratorConfig;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onConfigChange: (c: WeatherGeneratorConfig) => void;
}

function BasicTab({
  name,
  description,
  nameError,
  config,
  onNameChange,
  onDescriptionChange,
  onConfigChange,
}: BasicTabProps) {
  return (
    <div className={`${s.tabPanel} ${s.form}`}>
      <Input
        label="Název"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={100}
        error={nameError ?? undefined}
        placeholder="Např. Hlavní město, Sever Čech, Pobřeží…"
      />

      <div className={s.field}>
        <label className={s.label} htmlFor="wg-desc">
          Popisek (volitelně)
        </label>
        <textarea
          id="wg-desc"
          className={s.textarea}
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Krátký popis kontextu (např. lokace, klimatický kontext)…"
        />
      </div>

      <div className={s.row}>
        <NumberField
          label="Teplota — min"
          value={config.tempMin}
          onChange={(v) => onConfigChange({ ...config, tempMin: v })}
          suffix={config.tempUnit === 'C' ? '°C' : '°F'}
        />
        <NumberField
          label="Teplota — max"
          value={config.tempMax}
          onChange={(v) => onConfigChange({ ...config, tempMax: v })}
          suffix={config.tempUnit === 'C' ? '°C' : '°F'}
        />
        <div className={s.field}>
          <span className={s.label}>Jednotka</span>
          <div className={s.radioGroup} role="radiogroup" aria-label="Jednotka teploty">
            <label className={s.radio}>
              <input
                type="radio"
                name="tempUnit"
                value="C"
                checked={config.tempUnit === 'C'}
                onChange={() => onConfigChange({ ...config, tempUnit: 'C' })}
              />
              <span>°C</span>
            </label>
            <label className={s.radio}>
              <input
                type="radio"
                name="tempUnit"
                value="F"
                checked={config.tempUnit === 'F'}
                onChange={() => onConfigChange({ ...config, tempUnit: 'F' })}
              />
              <span>°F</span>
            </label>
          </div>
        </div>
      </div>

      <div className={s.row}>
        <NumberField
          label="Vítr — min (km/h)"
          value={config.windMin}
          min={0}
          onChange={(v) => onConfigChange({ ...config, windMin: v })}
        />
        <NumberField
          label="Vítr — max (km/h)"
          value={config.windMax}
          min={0}
          onChange={(v) => onConfigChange({ ...config, windMax: v })}
        />
        <NumberField
          label="Násobič nárazů"
          value={config.windGustMultiplier}
          min={1}
          step={0.1}
          onChange={(v) => onConfigChange({ ...config, windGustMultiplier: v })}
        />
      </div>
    </div>
  );
}

// ── AdvancedTab ────────────────────────────────────────────────────────

interface AdvancedTabProps {
  config: WeatherGeneratorConfig;
  onConfigChange: (c: WeatherGeneratorConfig) => void;
  showAdvanced: boolean;
  onToggleAdvanced: (v: boolean) => void;
}

function AdvancedTab({
  config,
  onConfigChange,
  showAdvanced,
  onToggleAdvanced,
}: AdvancedTabProps) {
  return (
    <div className={`${s.tabPanel} ${s.form}`}>
      <label className={s.toggleRow}>
        <input
          type="checkbox"
          checked={showAdvanced}
          onChange={(e) => onToggleAdvanced(e.target.checked)}
        />
        <span>Zobrazit pokročilá nastavení</span>
      </label>

      {!showAdvanced && (
        <p className={s.hint}>
          Pokročilá nastavení (tlak, vlhkost, typy počasí, vlastní hazardy)
          jsou pro většinu světů zbytečná — preset ze záložky „Preset" je
          obvykle dostačující.
        </p>
      )}

      {showAdvanced && (
        <>
          <div className={s.row}>
            <NumberField
              label="Tlak — min (hPa)"
              value={config.pressureMin}
              onChange={(v) => onConfigChange({ ...config, pressureMin: v })}
            />
            <NumberField
              label="Tlak — max (hPa)"
              value={config.pressureMax}
              onChange={(v) => onConfigChange({ ...config, pressureMax: v })}
            />
          </div>
          <div className={s.row}>
            <NumberField
              label="Vlhkost — min (%)"
              value={config.humidityMin}
              min={0}
              max={100}
              onChange={(v) => onConfigChange({ ...config, humidityMin: v })}
            />
            <NumberField
              label="Vlhkost — max (%)"
              value={config.humidityMax}
              min={0}
              max={100}
              onChange={(v) => onConfigChange({ ...config, humidityMax: v })}
            />
          </div>

          <WeatherTypesEditor
            entries={config.weatherTypes}
            onChange={(weatherTypes) =>
              onConfigChange({ ...config, weatherTypes })
            }
          />

          <CustomFieldsBuilder
            fields={config.customFields}
            onChange={(customFields) =>
              onConfigChange({ ...config, customFields })
            }
          />
        </>
      )}
    </div>
  );
}

// ── WeatherTypesEditor ────────────────────────────────────────────────

interface WeatherTypesEditorProps {
  entries: WeatherTypeEntry[];
  onChange: (entries: WeatherTypeEntry[]) => void;
}

function WeatherTypesEditor({ entries, onChange }: WeatherTypesEditorProps) {
  const probabilitySum = useMemo(
    () => entries.reduce((sum, e) => sum + (e.probability || 0), 0),
    [entries],
  );

  function update(index: number, patch: Partial<WeatherTypeEntry>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  return (
    <div className={s.subsection}>
      <div className={s.subsectionHead}>
        <span className={s.subsectionTitle}>Typy počasí</span>
        <span
          className={`${s.sumBadge} ${
            probabilitySum === 100 ? s.sumOk : s.sumWarn
          }`}
        >
          Σ pravděpodobnost: {probabilitySum} / 100
        </span>
      </div>
      <ul className={s.weatherList}>
        {entries.map((entry, idx) => (
          <li key={`${entry.type}-${idx}`} className={s.weatherRow}>
            <span className={s.weatherLabel}>{entry.label}</span>
            <label className={s.inlineField}>
              <span>Pravděp. (%)</span>
              <input
                type="number"
                className={s.numberInput}
                min={0}
                max={100}
                value={entry.probability}
                onChange={(e) =>
                  update(idx, { probability: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className={s.inlineField}>
              <span>Cloud min</span>
              <input
                type="number"
                className={s.numberInput}
                min={0}
                max={8}
                value={entry.cloudRange[0]}
                onChange={(e) =>
                  update(idx, {
                    cloudRange: [
                      Number(e.target.value) || 0,
                      entry.cloudRange[1],
                    ],
                  })
                }
              />
            </label>
            <label className={s.inlineField}>
              <span>Cloud max</span>
              <input
                type="number"
                className={s.numberInput}
                min={0}
                max={8}
                value={entry.cloudRange[1]}
                onChange={(e) =>
                  update(idx, {
                    cloudRange: [
                      entry.cloudRange[0],
                      Number(e.target.value) || 0,
                    ],
                  })
                }
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── CustomFieldsBuilder ───────────────────────────────────────────────

interface CustomFieldsBuilderProps {
  fields: CustomFieldConfig[];
  onChange: (fields: CustomFieldConfig[]) => void;
}

function CustomFieldsBuilder({ fields, onChange }: CustomFieldsBuilderProps) {
  function add() {
    onChange([
      ...fields,
      { label: '', possibleValues: [''], probability: 10 },
    ]);
  }

  function update(idx: number, patch: Partial<CustomFieldConfig>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function remove(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
  }

  return (
    <div className={s.subsection}>
      <div className={s.subsectionHead}>
        <span className={s.subsectionTitle}>Vlastní hazardy / extras</span>
        <Button variant="ghost" size="sm" onClick={add}>
          <Plus size={14} aria-hidden /> Přidat
        </Button>
      </div>
      {fields.length === 0 && (
        <p className={s.hint}>
          Žádné vlastní hazardy. Klikni „Přidat" pro mlhu/ledovku/prachovou
          bouři.
        </p>
      )}
      <ul className={s.customFieldList}>
        {fields.map((field, idx) => (
          <li key={idx} className={s.customFieldRow}>
            <input
              type="text"
              className={s.textInput}
              placeholder="Název (např. Mlha)"
              value={field.label}
              onChange={(e) => update(idx, { label: e.target.value })}
            />
            <input
              type="text"
              className={s.textInput}
              placeholder="Hodnoty (čárkou oddělené)"
              value={field.possibleValues.join(', ')}
              onChange={(e) =>
                update(idx, {
                  possibleValues: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
            <input
              type="number"
              className={s.numberInput}
              min={0}
              max={100}
              value={field.probability}
              onChange={(e) =>
                update(idx, { probability: Number(e.target.value) || 0 })
              }
            />
            <button
              type="button"
              className={s.removeBtn}
              onClick={() => remove(idx)}
              aria-label="Smazat hazard"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Reusable NumberField ──────────────────────────────────────────────

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: NumberFieldProps) {
  return (
    <label className={s.field}>
      <span className={s.label}>
        {label}
        {suffix && <span className={s.suffix}> ({suffix})</span>}
      </span>
      <input
        type="number"
        className={s.numberInput}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        min={min}
        max={max}
        step={step ?? 1}
      />
    </label>
  );
}
