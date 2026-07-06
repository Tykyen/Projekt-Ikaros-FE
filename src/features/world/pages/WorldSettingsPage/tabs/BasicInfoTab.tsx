import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/shared/ui";
import { useWorldContext } from "@/features/world/context/WorldContext";
import {
  useUpdateWorld,
  type UpdateWorldInput,
} from "@/features/world/api/useUpdateWorld";
import { useUploadImage } from "@/shared/api";
import { PillChips } from "@/features/ikaros/pages/CreateWorldPage/components/PillChips";
import {
  GENRES,
  GENRE_CUSTOM_LABEL,
} from "@/features/ikaros/pages/CreateWorldPage/constants/genres";
import {
  RPG_SYSTEMS,
  SYSTEM_CUSTOM_ID,
} from "@/features/ikaros/pages/CreateWorldPage/constants/systems";
import {
  DICE,
  DICE_DESCRIPTIONS,
} from "@/features/ikaros/pages/CreateWorldPage/constants/dice";
import { applySystemChange } from "@/features/ikaros/pages/CreateWorldPage/constants/systemDicePresets";
import { DicePresetResetLink } from "@/features/ikaros/pages/CreateWorldPage/components/DicePresetResetLink";
import sec from "@/features/ikaros/pages/CreateWorldPage/components/sections.module.css";
import { SettingsPanel } from "../components/SettingsPanel";
import {
  basicInfoSchema,
  type BasicInfoForm,
} from "../lib/worldSettingsSchema";
import s from "./BasicInfoTab.module.css";

function sameArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

/** 10.2j — výchozí viditelnost hodů: hráči vidí jen hody spoluhráčů. */
const DEFAULT_DICE_VISIBILITY = {
  showPjRolls: false,
  showNpcBestieRolls: false,
  showTeammateRolls: true,
};

/**
 * 5.3a — formulář metadat světa. Reuse `sections.module.css` + constants
 * z CreateWorldPage. Ukládá `PATCH /worlds/:id` jen se změněnými poli.
 */
export default function BasicInfoTab() {
  const { world } = useWorldContext();
  const mutation = useUpdateWorld(world?.id ?? "");
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  // Genre/system: pokud hodnota světa není v presetech → režim „Vlastní".
  const genreInList =
    !!world?.genre && GENRES.some((g) => g.label === world.genre);
  const systemInList =
    !!world && RPG_SYSTEMS.some((sys) => sys.id === world.system);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: world?.name ?? "",
      description: world?.description ?? "",
      genre: genreInList
        ? world!.genre!
        : world?.genre
          ? GENRE_CUSTOM_LABEL
          : "",
      customGenre: genreInList ? "" : (world?.genre ?? ""),
      system: systemInList ? world!.system : SYSTEM_CUSTOM_ID,
      customSystem: systemInList ? "" : (world?.system ?? ""),
      dice: world?.dice ?? [],
      maxPlayers: world?.maxPlayers ?? null,
      playersWanted: world?.playersWanted ?? "",
      imageUrl: world?.imageUrl ?? "",
      diceVisibility: world?.diceVisibility ?? DEFAULT_DICE_VISIBILITY,
    },
  });

  // FIX-5 — `defaultValues` se aplikují jen při prvním mountu; bez resyncu
  // formulář zůstane na hodnotách odsud i když základní info uloží jiný PJ
  // mezitím → další „Uložit změny" tady jeho změnu tiše přepíše. RHF `reset()`
  // v efektu je tady idiomatičtější než render-time state adjust (vyčistí
  // i dirty/touched příznaky).
  useEffect(() => {
    if (!world) return;
    reset({
      name: world.name,
      description: world.description ?? "",
      genre: genreInList
        ? world.genre!
        : world.genre
          ? GENRE_CUSTOM_LABEL
          : "",
      customGenre: genreInList ? "" : (world.genre ?? ""),
      system: systemInList ? world.system : SYSTEM_CUSTOM_ID,
      customSystem: systemInList ? "" : (world.system ?? ""),
      dice: world.dice ?? [],
      maxPlayers: world.maxPlayers ?? null,
      playersWanted: world.playersWanted ?? "",
      imageUrl: world.imageUrl ?? "",
      diceVisibility: world.diceVisibility ?? DEFAULT_DICE_VISIBILITY,
    });
  }, [world, genreInList, systemInList, reset]);

  if (!world) return null;

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() = R19 false positive
  const genre = watch("genre");
  const system = watch("system");
  const imageUrl = watch("imageUrl");

  async function handleFile(file: File) {
    try {
      const res = await upload.mutateAsync(file);
      setValue("imageUrl", res.url, { shouldDirty: true });
      toast.success("Obrázek nahrán.");
    } catch {
      toast.error("Nahrání obrázku selhalo.");
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const finalGenre =
      values.genre === GENRE_CUSTOM_LABEL
        ? values.customGenre.trim()
        : values.genre;
    const finalSystem =
      values.system === SYSTEM_CUSTOM_ID
        ? values.customSystem.trim()
        : values.system;

    const patch: UpdateWorldInput = {};
    if (values.name.trim() !== world.name) patch.name = values.name.trim();
    const desc = values.description.trim();
    if (desc !== (world.description ?? "")) patch.description = desc;
    if (finalGenre !== (world.genre ?? "")) patch.genre = finalGenre;
    if (finalSystem !== world.system) patch.system = finalSystem;
    if (!sameArray(values.dice, world.dice ?? [])) patch.dice = values.dice;
    if (values.maxPlayers !== (world.maxPlayers ?? null))
      patch.maxPlayers = values.maxPlayers;
    const pw = values.playersWanted.trim();
    if (pw !== (world.playersWanted ?? "")) patch.playersWanted = pw;
    if (values.imageUrl !== (world.imageUrl ?? ""))
      patch.imageUrl = values.imageUrl;
    const dv = world.diceVisibility ?? DEFAULT_DICE_VISIBILITY;
    if (
      values.diceVisibility.showPjRolls !== dv.showPjRolls ||
      values.diceVisibility.showNpcBestieRolls !== dv.showNpcBestieRolls ||
      values.diceVisibility.showTeammateRolls !== dv.showTeammateRolls
    )
      patch.diceVisibility = values.diceVisibility;

    if (Object.keys(patch).length === 0) {
      toast.info("Žádné změny k uložení.");
      return;
    }
    try {
      await mutation.mutateAsync(patch);
      toast.success("Změny uloženy.");
    } catch {
      toast.error("Uložení selhalo. Zkus to znovu.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsPanel
        title="Základní informace"
        description="Název, popis a herní profil světa."
        action={
          <Button type="submit" loading={mutation.isPending}>
            Uložit změny
          </Button>
        }
      >
        <div className={sec.field}>
          <label htmlFor="ws-name" className={`${sec.label} ${sec.required}`}>
            Název světa
          </label>
          <input
            id="ws-name"
            type="text"
            className={`${sec.input} ${errors.name ? sec.inputError : ""}`}
            maxLength={60}
            {...register("name")}
          />
          {errors.name && <p className={sec.error}>{errors.name.message}</p>}
        </div>

        <div className={sec.field}>
          <label className={sec.label}>Adresa</label>
          <div className={sec.adressRow}>
            <span className={sec.adressPrefix}>/svet/</span>
            <input
              className={`${sec.input} ${sec.adressInput}`}
              value={world.slug}
              disabled
              readOnly
            />
          </div>
          <p className={sec.helper}>
            Adresu světa po založení nelze měnit (rozbila by existující odkazy).
          </p>
        </div>

        <div className={sec.field}>
          <label htmlFor="ws-desc" className={sec.label}>
            Identita
          </label>
          <textarea
            id="ws-desc"
            className={sec.textarea}
            rows={4}
            maxLength={1000}
            {...register("description")}
          />
        </div>

        <div className={sec.field}>
          <label htmlFor="ws-genre" className={sec.label}>
            Žánr
          </label>
          <select id="ws-genre" className={sec.select} {...register("genre")}>
            <option value="" disabled>
              -- Vyberte žánr --
            </option>
            {GENRES.map((g) => (
              <option key={g.label} value={g.label}>
                {g.label}
              </option>
            ))}
            <option value={GENRE_CUSTOM_LABEL}>{GENRE_CUSTOM_LABEL}</option>
          </select>
          {genre === GENRE_CUSTOM_LABEL && (
            <input
              type="text"
              className={`${sec.input} ${sec.customInput}`}
              maxLength={40}
              placeholder="Pojmenuj vlastní žánr…"
              {...register("customGenre")}
            />
          )}
          <p className={sec.helper}>
            Změna žánru neovlivní motiv světa — ten se nastavuje v tabu Vzhled.
          </p>
        </div>

        <div className={sec.twoCol}>
          <div className={sec.field}>
            <label htmlFor="ws-players" className={sec.label}>
              Koho hledáte
            </label>
            <textarea
              id="ws-players"
              className={sec.textarea}
              rows={3}
              maxLength={500}
              {...register("playersWanted")}
            />
          </div>
          <div className={sec.field}>
            <label htmlFor="ws-max" className={sec.label}>
              Kapacita
            </label>
            <Controller
              name="maxPlayers"
              control={control}
              render={({ field }) => (
                <input
                  id="ws-max"
                  type="number"
                  className={sec.input}
                  min={1}
                  max={999}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") return field.onChange(null);
                    const n = Number(raw);
                    if (Number.isFinite(n))
                      field.onChange(Math.min(999, Math.max(1, Math.floor(n))));
                  }}
                />
              )}
            />
            <p className={sec.helper}>Max. počet hráčů. Nepovinné.</p>
          </div>
        </div>

        <div className={sec.field}>
          <label htmlFor="ws-system" className={`${sec.label} ${sec.required}`}>
            Herní systém
          </label>
          <Controller
            name="system"
            control={control}
            render={({ field }) => (
              <select
                id="ws-system"
                className={sec.select}
                value={field.value}
                onChange={(e) => {
                  const next = e.target.value;
                  // 2.3b — smart-replace kostek při ruční změně systému.
                  setValue(
                    "dice",
                    applySystemChange(field.value, next, getValues("dice")),
                    { shouldDirty: true },
                  );
                  field.onChange(next);
                }}
              >
                {RPG_SYSTEMS.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.label}
                  </option>
                ))}
              </select>
            )}
          />
          {system === SYSTEM_CUSTOM_ID && (
            <input
              type="text"
              className={`${sec.input} ${sec.customInput}`}
              maxLength={60}
              placeholder="Pojmenuj svůj systém…"
              {...register("customSystem")}
            />
          )}
        </div>

        <div className={sec.field}>
          <span className={sec.label}>Kostky / mechaniky</span>
          <Controller
            name="dice"
            control={control}
            render={({ field }) => (
              <PillChips
                options={DICE}
                value={field.value}
                onChange={field.onChange}
                ariaLabel="Kostky a mechaniky"
                descriptions={DICE_DESCRIPTIONS}
              />
            )}
          />
          <DicePresetResetLink
            system={system}
            dice={watch("dice")}
            onApply={(d) => setValue("dice", d, { shouldDirty: true })}
          />
        </div>

        <div className={sec.field}>
          <span className={sec.label}>Viditelnost hodů na mapě</span>
          <Controller
            name="diceVisibility"
            control={control}
            render={({ field }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={field.value.showPjRolls}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        showPjRolls: e.target.checked,
                      })
                    }
                  />
                  Hráči vidí PJ hody
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={field.value.showNpcBestieRolls}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        showNpcBestieRolls: e.target.checked,
                      })
                    }
                  />
                  Hráči vidí hody NPC a bestií
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={field.value.showTeammateRolls}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        showTeammateRolls: e.target.checked,
                      })
                    }
                  />
                  Hráči vidí hody spoluhráčů
                </label>
              </div>
            )}
          />
        </div>

        <div className={sec.field}>
          <span className={sec.label}>Hero obrázek</span>
          <div className={s.heroRow}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Náhled hero obrázku"
                className={s.heroPreview}
              />
            ) : (
              <div className={s.heroEmpty}>Bez obrázku</div>
            )}
            <div className={s.heroActions}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={upload.isPending}
                onClick={() => fileRef.current?.click()}
              >
                Nahrát obrázek
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setValue("imageUrl", "", { shouldDirty: true })
                  }
                >
                  Odebrat
                </Button>
              )}
            </div>
          </div>
        </div>
      </SettingsPanel>
    </form>
  );
}
