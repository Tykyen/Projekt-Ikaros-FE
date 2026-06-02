import { type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { HELP_TABS, TAB_LABELS, parseTab, type HelpTab } from "./helpers";
import { StartSection } from "./sections/StartSection";
import { PagesSection } from "./sections/PagesSection";
import { AccountSection } from "./sections/AccountSection";
import { RolesSection } from "./sections/RolesSection";
import { FaqSection } from "./sections/FaqSection";
import s from "./HelpPage.module.css";

const SECTIONS: Record<HelpTab, ComponentType> = {
  start: StartSection,
  stranky: PagesSection,
  ucet: AccountSection,
  role: RolesSection,
  faq: FaqSection,
};

export default function HelpPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("sekce"));
  const Section = SECTIONS[tab];

  function changeTab(next: HelpTab) {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "start") out.delete("sekce");
        else out.set("sekce", next);
        return out;
      },
      { replace: false },
    );
  }

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1>Nápověda</h1>
        <p className={s.lead}>
          Co stránky umí, kdo má jaká práva, jak na účet a kam se obrátit.
          Aktualizováno k 2026-06-02 (11.2 + rozšíření — Storyboard jako
          spustitelná příprava: strom scénářů, mapa-podklad s legendou, galerie
          s odesláním/naplánováním do chatu, knihovna šablon scén a „Načíst
          přípravu" na taktické mapě. Plus 11.1 — Pavučina: vztahový graf
          kampaně. Předchozí: 10.2n —
          Orchestrace: spawn palety
          (PC / NPC / Bestiář) jsou nově sbalitelné s počtem aktivních v hlavičce
          a panel „Přístup a viditelnost" umožní PJ skrýt mapu nebo zamknout pohyb
          hráčům — najednou všem na scéně i jednotlivě konkrétnímu hráči. Předchozí:
          10.2l + 10.2m — Taktická mapa dokončena:
          deník PJ jako samostatná stránka (Hra → Deník PJ, sdílí obsah s deníkem
          na mapě) a ping — dvojklikem na plochu pošleš všem na scéně barevný
          prstenec (označený tvou postavou, u PJ „PJ"). Předchozí: 13.3 + 10.2k — Zvuky: stránka Zvuková
          databáze (knihovna hudby/zvuků světa z YouTube, filtry, správa PJ);
          PJ pouští hudbu na taktickou mapu jako ambient scény i přímo do chatu
          („pustit zvuk všem“). Předchozí: 10.2j — hod kostkou na mapě; 10.2i —
          počasí na mapě; 10.2h — mlha války; 10.2g — efekty; 10.2f — iniciativa
          a tracker boje.).
        </p>
      </header>

      <nav className={s.tabs} role="tablist" aria-label="Sekce nápovědy">
        {HELP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={clsx(s.tab, tab === t && s.tabActive)}
            onClick={() => changeTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <section className={s.content} aria-live="polite">
        <Section />
      </section>
    </article>
  );
}
