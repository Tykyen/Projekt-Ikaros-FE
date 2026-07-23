import { useEffect, type ComponentType } from "react";
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
  const topik = params.get("topik");
  const Section = SECTIONS[tab];

  // Deep-link Vypravěče (07 §5.2): ?sekce=X&topik=Y otevře akordeon (i řetěz
  // rodičů), doscrolluje a krátce zvýrazní. `<details>` je uncontrolled →
  // přímé nastavení .open React nepřepíše.
  useEffect(() => {
    if (!topik) return;
    const el = document.getElementById(topik);
    if (!el) return;
    for (let p: HTMLElement | null = el; p; p = p.parentElement)
      if (p instanceof HTMLDetailsElement) p.open = true;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.classList.add("vypravec-highlight");
    const timer = setTimeout(
      () => el.classList.remove("vypravec-highlight"),
      8000,
    );
    return () => {
      clearTimeout(timer);
      el.classList.remove("vypravec-highlight");
    };
  }, [tab, topik]);

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
          tabem <strong>Začni tady</strong>. Aktualizováno k 2026-07-19.
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
