import { type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { HELP_TABS, TAB_LABELS, parseTab, type HelpTab } from "./helpers";
import { StartSection } from "./sections/StartSection";
import { PlatformSection } from "./sections/PlatformSection";
import { WorldSection } from "./sections/WorldSection";
import { RolesSection } from "./sections/RolesSection";
import { AccountSection } from "./sections/AccountSection";
import { FaqSection } from "./sections/FaqSection";
import { Seo } from "@/shared/seo";
import s from "./HelpPage.module.css";

const SECTIONS: Record<HelpTab, ComponentType> = {
  start: StartSection,
  platforma: PlatformSection,
  svet: WorldSection,
  role: RolesSection,
  ucet: AccountSection,
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
      <Seo
        title="Nápověda"
        description="Jak používat platformu Ikaros — co která stránka umí, kdo má jaká práva, jak na účet, postavy a hraní."
      />
      <header className={s.header}>
        <h1>Nápověda</h1>
        <p className={s.lead}>
          Vše, co potřebuješ pro hru — co která stránka umí, kdo má jaká práva a
          jak na účet. Vyber si sekci níže a rozbal, co tě zajímá. Nový tu? Začni
          tabem <strong>Začni tady</strong>. Aktualizováno k 2026-07-12.
        </p>
      </header>

      <div className={s.tabs} role="tablist" aria-label="Sekce nápovědy">
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
      </div>

      <section className={s.content} aria-live="polite">
        <Section />
      </section>
    </article>
  );
}
