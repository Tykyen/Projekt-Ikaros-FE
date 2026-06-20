import { useCallback, useEffect, useRef, useState } from 'react';
import DiceBox from '@drdreo/dice-box-threejs';
import { materialTextureDescriptor } from '../lib/dice3dThemes';
import type { Dice3dTheme } from '../lib/dice3dThemes';
import styles from './DiceBox3D.module.css';

/**
 * Zaregistruje vlastní materiálové textury — přepíše `DiceColors.getTexture`
 * tak, že pro známé id materiálu vrátí deskriptor (`source` webp v `public/`),
 * jinak deleguje na originál. Knihovna nemá veřejné API pro vlastní textury,
 * tohle je nejmenší zásah do interní `DiceColors`.
 */
function patchCustomTextures(box: unknown): void {
  const dc = (box as { DiceColors?: Record<string, unknown> }).DiceColors;
  if (!dc || typeof dc.getTexture !== 'function' || dc.__ikarosPatched) return;
  const orig = (dc.getTexture as (n: unknown) => unknown).bind(dc);
  dc.getTexture = (name: unknown) => {
    if (typeof name === 'string') {
      const desc = materialTextureDescriptor(name);
      if (desc) return desc;
    }
    return orig(name);
  };
  dc.__ikarosPatched = true;
}

/**
 * Krok 6.3-fix4 — React wrapper nad `@drdreo/dice-box-threejs`.
 *
 * Reálná fyzikální 3D kostka v transparentním fullscreen canvasu. Výsledek
 * je PŘEDURČENÝ (notace `1d20@13`) — kostka se realisticky kutálí, ale
 * dopadne na hodnotu z payloadu (WS shoda u všech hráčů).
 *
 * Instance se vytvoří JEDNOU (lazy přes `React.lazy` v overlay) a žije dál —
 * každý hod jen `clearDice()` + `roll()`. Knihovna nemá `destroy()`, takže
 * mount/unmount per hod by leakoval RAF/renderer; proto persistentní host.
 */
interface DiceBox3DProps {
  /** Notace s předurčením, např. `1d20@13`. */
  notation: string;
  theme: Dice3dTheme;
  /** Mění se s každým hodem (= roll.timestamp) → spustí nový hod. */
  nonce: number;
  /** Hod je aktivní (jinak host čeká skrytý). */
  active: boolean;
  /**
   * 6.3-fix5 — po `initialize()` protoč jeden NEVIDITELNÝ ghost `roll()`.
   * Knihovna má flaky úplně první `roll()` (renderer/fyzika se rozjede až
   * prvním hodem); ghost ho spotřebuje při otevření mapy, takže hráčův první
   * reálný hod je fakticky druhý → spolehlivý. Jen mapa (chat = false).
   */
  warmup?: boolean;
  /** Po dosednutí kostek. */
  onComplete: () => void;
  /** Init/roll selhal (např. WebGL) → overlay přepne na 2D fallback. */
  onError: () => void;
  /**
   * 6.3-fix8 — REÁLNÝ (ne-ghost) hod právě začal kutálení. Overlay od tohoto
   * okamžiku počítá svůj animační strop, takže pomalý warmup/ghost před prvním
   * hodem neukrojí z animačního okna.
   */
  onRollStart?: () => void;
}

type DiceBoxInstance = InstanceType<typeof DiceBox>;

/** 6.3-fix5 — notace neviditelného ghost-warmup hodu (hodnota je lhostejná). */
const GHOST_NOTATION = '1d6@1';

export default function DiceBox3D({
  notation,
  theme,
  nonce,
  active,
  warmup,
  onComplete,
  onError,
  onRollStart,
}: DiceBox3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<DiceBoxInstance | null>(null);
  const [ready, setReady] = useState(false);
  // Naposled aplikovaný materiál — `updateConfig` (async reload textury) voláme
  // jen při změně, jinak hodíme rovnou (méně race → spolehlivější render).
  const lastMaterialRef = useRef<string | null>(null);
  // Vždy nejnovější hodnoty (rollNow čte z refs, ne ze zastaralého closure).
  const latestRef = useRef({ notation, active, theme });
  latestRef.current = { notation, active, theme };
  const cbRef = useRef({ onComplete, onError, onRollStart });
  cbRef.current = { onComplete, onError, onRollStart };
  // Ghost-warmup stav (6.3-fix5 + fix8):
  //   isGhost      = právě běžící roll je neviditelný ghost (onRollComplete ho
  //                  zahodí, nepropaguje ven).
  //   ghostStarted = ghost už byl odpálen (max jednou na životnost enginu).
  //   ghostWarm    = ghost DOběhl → engine je zahřátý, reálné hody smí ven.
  //   pendingNonce = reálný hod, který dorazil DŘÍV, než ghost doběhl → vystřelí
  //                  se z onRollComplete ghostu. Bez fronty by tenhle hod byl ta
  //                  flaky první roll() knihovny a animace by se ztratila (= kořen
  //                  „první 3D animace chybí"). 0 = nic nečeká.
  const isGhostRef = useRef(false);
  const ghostStartedRef = useRef(false);
  const ghostWarmRef = useRef(false);
  const pendingNonceRef = useRef(0);
  // 6.3-fix10 — poslední nonce, který už byl reálně hozen. Brání dvojímu hodu,
  // když hod-effekt běží víckrát (změna nonce → pak změna active).
  const lastRolledNonceRef = useRef(0);

  /** Spustí hod z aktuálního stavu — voláno po `ready` i při změně `nonce`. */
  const rollNow = useCallback(() => {
    const box = boxRef.current;
    const host = hostRef.current;
    const { notation, active, theme } = latestRef.current;
    if (!box || !active || !notation) return;
    // 6.3-fix5 — reálný hod ruší případný probíhající ghost: onRollComplete
    // zase propaguje ven a `clearDice` níže smaže ghost kostky. Reálný hod má
    // vždy přednost, i kdyby hráč hodil dřív, než ghost doběhne.
    isGhostRef.current = false;
    try {
      // Dorovnat rozměry z reálného hostu — konstruktor je čte při vytvoření,
      // takže při prvním hodu (host se právě zobrazil) můžou být 0 → kostka by
      // padla mimo viewport. Tímto je scéna/svět vždy správně velká.
      if (host && host.clientWidth) {
        // Prostý {x,y} — NE three.Vector2 z appky (knihovna má vlastní baked
        // three; míchání instancí rozbíjí render). Knihovna čte jen .x/.y.
        box.setDimensions({
          x: host.clientWidth,
          y: host.clientHeight,
        } as Parameters<DiceBoxInstance['setDimensions']>[0]);
      }
      box.clearDice();
      const matId = theme.colorset.name;
      const needsReload = matId !== lastMaterialRef.current;
      console.info(
        '[dice3d] real roll: active=', active,
        'via=', needsReload ? 'updateConfig' : 'direct',
        'mat=', matId, 'last=', lastMaterialRef.current,
      ); // DIAG fix9
      const fire = () => {
        box.clearDice();
        cbRef.current.onRollStart?.();
        console.info('[dice3d] box.roll fired', notation); // DIAG fix9
        void box.roll(notation).catch((e) => {
          console.warn('[dice3d] box.roll rejected', e); // DIAG fix9
          cbRef.current.onError();
        });
      };
      if (needsReload) {
        // Materiál se změnil → reload tématu (async), pak hod.
        lastMaterialRef.current = matId;
        void box
          .updateConfig({
            theme_customColorset: theme.colorset,
            theme_material: theme.material,
          })
          .then(fire)
          .catch((e) => {
            console.warn('[dice3d] updateConfig rejected', e); // DIAG fix9
            cbRef.current.onError();
          });
      } else {
        // Stejný materiál → hodit rovnou (žádný async reload = míň race).
        fire();
      }
    } catch (e) {
      console.warn('[dice3d] rollNow threw', e); // DIAG fix9
      cbRef.current.onError();
    }
  }, []);

  /** 6.3-fix8 — vystřel reálný hod, který čekal za ghostem (0 = nic nečeká). */
  const flushPendingRoll = useCallback(() => {
    const n = pendingNonceRef.current;
    if (n > 0) {
      pendingNonceRef.current = 0;
      if (lastRolledNonceRef.current === n) return; // už hozeno effektem (fix10)
      lastRolledNonceRef.current = n;
      rollNow();
    }
  }, [rollNow]);

  /** 6.3-fix5 — neviditelný ghost hod (spustí se max jednou po `ready` ve
   *  warmup módu). Host je v té chvíli skrytý (`active=false` → opacity 0),
   *  takže kostka se protočí mimo zrak. */
  const runGhostRoll = useCallback(() => {
    const box = boxRef.current;
    const host = hostRef.current;
    if (!box || ghostStartedRef.current) return;
    ghostStartedRef.current = true;
    isGhostRef.current = true;
    // 6.3-fix8 — když ghost selže (reject/throw), engine prohlásíme za „zahřátý"
    // a hned vystřelíme čekající reálný hod, ať neuvázne ve frontě.
    const onGhostFail = (): void => {
      isGhostRef.current = false;
      ghostWarmRef.current = true;
      flushPendingRoll();
    };
    try {
      if (host && host.clientWidth) {
        box.setDimensions({
          x: host.clientWidth,
          y: host.clientHeight,
        } as Parameters<DiceBoxInstance['setDimensions']>[0]);
      }
      box.clearDice();
      const { theme } = latestRef.current;
      // 6.3-fix9 — ghost protáhne i `updateConfig` (async reload tématu), ne jen
      // `roll()`. První reálný hod skoro vždy přepíná na hráčův skin → spustí
      // PRVNÍ `updateConfig`, a to je nejspíš ta studená/flaky operace, co spolkne
      // 1. animaci (ghost ji jinak nikdy neprošel). Po ghostu je už zahřátá.
      console.info('[dice3d] ghost: updateConfig+roll warmup start'); // DIAG fix9
      void box
        .updateConfig({
          theme_customColorset: theme.colorset,
          theme_material: theme.material,
        })
        .then(() => box.roll(GHOST_NOTATION))
        .catch(onGhostFail);
    } catch {
      onGhostFail();
    }
  }, [flushPendingRoll]);

  // Init jednou.
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    const box = new DiceBox(host, {
      assetPath: '/dice-box/',
      theme_customColorset: theme.colorset,
      theme_material: theme.material,
      theme_texture: '',
      theme_surface: 'green-felt',
      // Bílé silnější světlo — výchozí krémové (0xefdfd5) kalí barvy materiálu.
      color_spotlight: 0xffffff,
      light_intensity: 1.2,
      shadows: true,
      sounds: false,
      // Vyšší gravitace = rychlejší usazení; menší kostka + mírnější hod =
      // víc místa od okraje, krajní kostky (Fate hází 4) neuletí ze stolu.
      gravity_multiplier: 500,
      baseScale: 85,
      strength: 0.85,
      onRollComplete: () => {
        if (cancelled) return;
        // 6.3-fix5 — ghost hod jen protáhl engine: ukliď kostky, NEpropaguj
        // ven (žádný readout/onDone). Reálný hod propaguje normálně.
        if (isGhostRef.current) {
          isGhostRef.current = false;
          ghostWarmRef.current = true; // engine zahřátý → reálné hody smí ven
          console.info('[dice3d] ghost complete → engine warm'); // DIAG fix9
          try {
            box.clearDice();
          } catch {
            /* ignore */
          }
          // 6.3-fix8 — reálný hod čekal za ghostem → teď ho vystřel na zahřátém
          // enginu (latestRef má aktuální notaci/aktivitu/téma).
          flushPendingRoll();
          return;
        }
        console.info('[dice3d] real roll complete (onComplete)'); // DIAG fix9
        cbRef.current.onComplete();
      },
    });

    // Vlastní materiálové textury PŘED initialize (loadTheme čte getTexture).
    patchCustomTextures(box);

    box
      .initialize()
      .then(() => {
        if (cancelled) return;
        boxRef.current = box;
        console.info('[dice3d] engine ready (fix9 diag live)'); // DIAG fix9
        // Materiál z init configu už je aplikovaný → první hod stejného
        // materiálu nemusí volat updateConfig.
        lastMaterialRef.current = theme.colorset.name;
        try {
          // Průhledné pozadí scény. (Vlastní světla NEpřidáváme — musela by
          // být z knihovní three; vibrance řeší CSS filtr na canvasu + config
          // color_spotlight/light_intensity.)
          box.scene.background = null;
        } catch {
          /* defenzivní */
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) cbRef.current.onError();
      });

    return () => {
      cancelled = true;
      try {
        boxRef.current?.clearDice();
      } catch {
        /* knihovna nemá destroy(); aspoň uvolni kostky */
      }
      if (host) host.innerHTML = '';
      boxRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hod: po dokončení initu (ready), při změně nonce I při přepnutí `active`.
  useEffect(() => {
    if (!ready) return;
    console.info(
      '[dice3d] hod effect: nonce=', nonce, 'active=', active,
      'ghostWarm=', ghostWarmRef.current, 'lastRolled=', lastRolledNonceRef.current,
    ); // DIAG fix10
    // 6.3-fix8 — ghost-warmup spustíme VŽDY hned po `ready` (ODPOJENO od `active`).
    // Knihovní flaky první roll() tak vždy padne na neviditelný ghost. Pokud už
    // čeká reálný hod (hráč hodil DŘÍV, než engine dojel init), zařadíme jeho
    // nonce do fronty — vystřelí se z onRollComplete ghostu.
    if (warmup && !ghostStartedRef.current) {
      if (nonce > 0) pendingNonceRef.current = nonce;
      runGhostRoll();
      return;
    }
    // 6.3-fix7 — `nonce === 0` = sentinel „není co házet" (overlay se zhasíná,
    // `roll → null`). Reálný hod má vždy nonce = timestamp > 0.
    if (nonce === 0) return;
    // Ghost ještě běží → reálný hod počká za ním (vystřelí ho onRollComplete).
    if (warmup && !ghostWarmRef.current) {
      pendingNonceRef.current = nonce;
      return;
    }
    // 6.3-fix10 — KOŘEN „první animace chybí": `active` (host viditelný) přepne na
    // true až O RENDER POZDĚJI než se změní `nonce` (overlay nastaví phase/
    // use3dThisRoll v effectu). Kdybychom házeli hned na změnu nonce, rollNow
    // trefí `active=false`, spadne na guardu (tiše) a protože se nonce už nemění,
    // effect se znovu nespustí → hod se ztratí. Proto závisíme i na `active` a
    // každý nonce hodíme PRÁVĚ JEDNOU — hod vystřelí přesně ve chvíli, kdy
    // `active` naběhne na true.
    if (!active) return;
    if (lastRolledNonceRef.current === nonce) return;
    lastRolledNonceRef.current = nonce;
    rollNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nonce, active]);

  // Po dokončení hodu (overlay schován → active=false) uklidit kostky.
  useEffect(() => {
    if (active || !ready) return;
    const box = boxRef.current;
    if (box) {
      try {
        box.clearDice();
      } catch {
        /* ignore */
      }
    }
  }, [active, ready]);

  // 6.3-fix5 — host skrytý, dokud neběží reálný hod (`active`). Warmup/ghost
  // tak nikdy neprobleskne; `opacity:0` (ne display:none) nechá canvas kreslit,
  // aby se ghost reálně protočil.
  return (
    <div
      ref={hostRef}
      className={`${styles.host}${active ? '' : ` ${styles.hidden}`}`}
      aria-hidden
    />
  );
}
