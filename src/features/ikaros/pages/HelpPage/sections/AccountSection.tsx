import { Link } from 'react-router-dom';
import {
  UserCircle,
  AtSign,
  KeyRound,
  ShieldCheck,
  ImagePlus,
  Drama,
  EyeOff,
  Trash2,
  Globe2,
  Bell,
  Palette,
  Download,
  Baby,
  Flag,
} from 'lucide-react';
import { HelpAccordion, StepList, CalloutBox, TermGrid } from '../components';

export function AccountSection() {
  return (
    <>
      <p>
        Všechna nastavení účtu jsou na <Link to="/ikaros/profil">stránce Profil</Link>{' '}
        (po přihlášení). Rozbal si oblast, kterou řešíš.
      </p>

      <HelpAccordion icon={<UserCircle size={20} />} title="Hlavička & něco o mně" accent="accent" defaultOpen>
        <p>
          V hlavičce karty je avatar, přezdívka, město, datum založení, poslední
          přihlášení, barva chatu a motiv. Většinu polí (město, zobrazované jméno)
          upravíš tlačítkem <strong>Upravit</strong>.
        </p>
        <p>
          <strong>Něco o mně</strong> = volný text o tobě (max 1000 znaků),
          zobrazuje se na veřejném profilu.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Drama size={20} />} title="Postava v Campu" accent="player">
        <p>
          Jméno, krátké bio a <strong>samostatný avatar</strong> pro tvoji
          platformovou „postavu" — personu, pod kterou se objevíš v chatech a
          komunitě Ikaru. Je nezávislá na herních postavách uvnitř světů.
          V <strong>Camp</strong> pod ní vystupuješ přímo u zpráv (tvé jméno
          a obrázek postavy); v Putyce se ukazuje účet.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Palette size={20} />} title="Vzhled a čitelnost" accent="accent">
        <p>
          V sekci <strong>Vzhled</strong> si zvolíš <strong>motiv</strong> platformy
          a v <strong>Doladění vzhledu</strong> si vše přizpůsobíš jen pro sebe.
        </p>
        <p>
          <strong>Velikost rozhraní</strong> (100–150 %) zvětší celé rozhraní —
          písmo, tlačítka i ikony. Hodí se, když je ti výchozí velikost malá nebo
          hůř čteš. Dál si posuvníky doladíš <strong>jas</strong> a{' '}
          <strong>kontrast</strong>, případně jednotlivé barvy.
        </p>
        <p>
          <strong>Barva chatu</strong> určuje barvu tvých zpráv v chatech. Pod
          výběrem barvy si rozbalíš <strong>Pojmenované barvy</strong> — sadu
          barev s názvy, kde stačí kliknout a barva se rovnou použije. Krajně
          tmavé a světlé odstíny v ní schválně nejsou, aby tvé zprávy zůstaly
          čitelné na tmavém i světlém pozadí. Stejnou nápovědu najdeš u všech
          výběrů barvy ve světě.
        </p>
        <CalloutBox variant="tip">
          Doladění se ukládá na tvůj účet, takže platí na{' '}
          <strong>všech zařízeních</strong> — nastavíš jednou na počítači a stejně
          to máš i na telefonu.
        </CalloutBox>
      </HelpAccordion>

      <HelpAccordion icon={<AtSign size={20} />} title="Přezdívka & e-mail" accent="info">
        <p>
          Vedle e-mailu vidíš odznak <strong>✓ Ověřeno</strong> nebo{' '}
          <strong>⚠ Neověřeno</strong>. Pokud e-mail nedorazil, klikni „Poslat znovu"
          (max 3× za 15 min) a zkontroluj Spam.
        </p>
        <p><strong>Změna e-mailu</strong> (tlačítko Změnit u hlavičky):</p>
        <StepList
          steps={[
            'Zadáš novou adresu a aktuální heslo.',
            'Na novou adresu přijde potvrzovací odkaz (platí 1 hodinu).',
            'Po kliknutí se adresa přepne; na starou dorazí informativní e-mail.',
          ]}
        />
        <p><strong>Změna přezdívky</strong> (Bezpečnost → „Požádat o změnu přezdívky"):</p>
        <StepList
          steps={[
            'Zadáš novou variantu — schvaluje administrátor.',
            'Žádost můžeš stáhnout, dokud čeká; o rozhodnutí přijde e-mail.',
            'Po schválení platí cooldown 30 dní, kdy nelze žádat znovu.',
          ]}
        />
      </HelpAccordion>

      <HelpAccordion icon={<KeyRound size={20} />} title="Heslo & reset" accent="warning">
        <p>
          <strong>Změna hesla</strong> vyžaduje staré heslo. Po úspěšné změně se
          odhlásí všechna ostatní zařízení.
        </p>
        <p>
          <strong>Odhlásit se ze všech zařízení</strong> (Bezpečnost → karta
          „Aktivní relace"): pokud máš podezření, že se k účtu dostal někdo
          cizí, jedním tlačítkem ukončíš všechna přihlášení — včetně toho
          aktuálního, pak se přihlásíš znovu.
        </p>
        <p><strong>Zapomenuté heslo</strong>:</p>
        <StepList
          steps={[
            <>V přihlašovacím dialogu klikni „Zapomněl/a jsi heslo?".</>,
            <>Zadáš e-mail → přijde odkaz na reset (platí 1 hodinu, na jedno použití).</>,
            <>Nastavíš nové heslo a znovu se přihlásíš (žádný auto-login).</>,
          ]}
        />
        <CalloutBox variant="tip">
          Pokud měl účet naplánované smazání, reset hesla ho současně zruší a účet
          obnoví.
        </CalloutBox>
      </HelpAccordion>

      <HelpAccordion icon={<ShieldCheck size={20} />} title="Dvoufaktorové ověření (2FA)" accent="success">
        <p>
          Druhý zámek u přihlášení — <strong>dobrovolný</strong>. K heslu přidáš
          jednorázový kód z aplikace v mobilu (Google Authenticator, Authy…). I
          když ti někdo uhodne heslo, bez telefonu se dovnitř nedostane.
        </p>
        <p><strong>Zapnutí</strong> (Bezpečnost → „Zapnout 2FA"):</p>
        <StepList
          steps={[
            'Naskenuješ QR kód v authenticator aplikaci.',
            'Opíšeš vygenerovaný 6místný kód.',
            <>
              Dostaneš <strong>10 záložních kódů</strong> — ulož si je. Každý
              funguje jednou a pomůže, když nemáš po ruce telefon.
            </>,
          ]}
        />
        <p>
          <strong>Přihlášení s 2FA</strong>: po heslu zadáš kód z aplikace (nebo
          jeden záložní kód). Můžeš zaškrtnout{' '}
          <strong>„Důvěřovat tomuto zařízení 30 dní"</strong> — pak se na něm 2FA
          příště nezeptá.
        </p>
        <p>
          <strong>Důvěryhodná zařízení</strong> si zobrazíš a odvoláš v
          Bezpečnosti. Vypnutí 2FA i změna hesla je všechna automaticky odvolá.
        </p>
        <CalloutBox variant="tip">
          Vypnout 2FA nebo vygenerovat nové záložní kódy lze kdykoli — vždy po
          potvrzení heslem.
        </CalloutBox>
      </HelpAccordion>

      <HelpAccordion icon={<ImagePlus size={20} />} title="Avatar" accent="corrector">
        <p>
          Pokud nenahraješ vlastní avatar, použije se <strong>default</strong> —
          muž, žena nebo „bytost"; typ si vybíráš v profilu.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<EyeOff size={20} />} title="Soukromí" accent="info">
        <TermGrid
          items={[
            { term: 'Neviditelný mód', desc: 'Skryje tvůj online stav — zelená/žlutá tečka u jména zmizí ostatním. Ty vidíš ostatní beze změny.' },
            { term: 'Pošta jen pro přátele', desc: 'Napsat ti jako první může jen přítel (a administrátor); na tvou zprávu ti odpoví kdokoli.' },
          ]}
        />
      </HelpAccordion>

      <HelpAccordion icon={<Bell size={20} />} title="Notifikace (upozornění)" accent="accent">
        <p>
          Sám/sama si vybíráš, na co ti přijde <strong>push upozornění</strong> —
          bublina na telefon nebo do prohlížeče, i když appku nemáš otevřenou.
          Nejdřív upozornění <strong>povol na zařízení</strong> (tlačítko v sekci),
          pak zaškrtni typy:
        </p>
        <TermGrid
          items={[
            { term: 'Chat ve světě', desc: 'Nová zpráva v chatu světa, jehož jsi členem.' },
            { term: 'Akce ve světě', desc: 'Nová hra ve světě + připomínka 24 hodin a 1 hodinu před začátkem, ať na hru nezapomeneš.' },
            { term: 'Vlastní diskuse', desc: 'Nový příspěvek v diskusi, kterou jsi založil/a.' },
            { term: 'Vlastní článek a galerie', desc: 'Schválení, zamítnutí nebo nové hodnocení tvého článku či obrázku.' },
            { term: 'Novinky světa', desc: 'Nová novinka ve světě, jehož jsi členem.' },
            { term: 'Novinky Ikarosu', desc: 'Oznámení a novinky celé platformy.' },
            { term: 'Pošta', desc: 'Nová soukromá zpráva nebo systémové oznámení v Poště — standardně zapnuto, klepnutí na bublinu otevře Poštu.' },
            { term: 'Putyka', desc: 'Zprávy v Dimenzionální Putyce — standardně vypnuto, ať tě každá hláška neruší.' },
          ]}
        />
        <CalloutBox variant="tip">
          Hlavní vypínač „Push notifikace" ztlumí všechno naráz. Vypnutí ovlivní
          jen bublinky — ve zvonečku v hlavičce uvidíš upozornění vždy. Na každém
          zařízení (telefon, počítač) se push povoluje zvlášť.
        </CalloutBox>
      </HelpAccordion>

      <HelpAccordion icon={<Globe2 size={20} />} title="Moje světy & komunitní stopa" accent="success">
        <p>
          <strong>Moje světy</strong> = seznam světů, kterých jsi členem (klik tě
          přenese do světa). <strong>Moje akce ve světech</strong> agregují blížící
          se herní akce napříč světy. <strong>Moje diskuze, Moje články a Moje
          galerie</strong> ukazují, co jsi v komunitě vytvořil/a — klik otevře
          detail, „Zobrazit vše" přejde do příslušné sekce.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Flag size={20} />} title="Moderace (moje hlášení a rozhodnutí)" accent="info">
        <p>
          Sekce <strong>Moderace</strong> v profilu shrnuje tvoji stranu
          nahlašování — na jednom místě vidíš:
        </p>
        <TermGrid
          items={[
            { term: 'Moje hlášení', desc: 'Co jsi nahlásil/a a v jakém je to stavu (Čeká / V řešení / Vyřízeno).' },
            { term: 'Rozhodnutí o mém obsahu', desc: 'Když moderátor zasáhl proti tvému obsahu, uvidíš tu odůvodnění a na co se opírá.' },
          ]}
        />
        <p>
          S rozhodnutím nesouhlasíš? U něj je tlačítko <strong>„Odvolat se"</strong>{' '}
          — odvolání posoudí <strong>jiný</strong> moderátor než ten, kdo rozhodl.
          Nahlásit obsah můžeš tlačítkem „Nahlásit" přímo u něj (viz tab Platforma
          → Nahlásit obsah).
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Download size={20} />} title="Stáhnout moje data" accent="success">
        <p>
          V sekci <strong>Účet</strong> je tlačítko{' '}
          <strong>„Stáhnout moje data (JSON)"</strong>. Vytvoří a stáhne soubor s
          tvými údaji — profil, členství ve světech, přátelství a další záznamy,
          které o tobě vedeme (právo na přístup a přenositelnost). Nabídneme ti ho i{' '}
          <strong>před smazáním účtu</strong>, ať si data odneseš dřív, než zmizí.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Baby size={20} />} title="Věková hranice 15+" accent="warning">
        <p>
          Při registraci se ptáme jen na to, jestli ti je{' '}
          <strong>15 a víc, nebo méně</strong> — přesné datum narození nechceme.
        </p>
        <p>
          Platforma je určena hráčům <strong>od 15 let</strong>. Když zvolíš
          „méně než 15", registrace se <strong>nedokončí</strong> — formulář to
          vysvětlí rovnou a budeme se těšit, až se vrátíš později. Účty mladších
          uživatelů založené dříve zůstávají v <strong>režimu ochrany</strong>{' '}
          (neveřejný profil, skrytí v adresáři uživatelů). Podrobnosti jsou v{' '}
          <Link to="/soukromi">Zásadách ochrany osobních údajů</Link>.
        </p>
      </HelpAccordion>

      <HelpAccordion icon={<Trash2 size={20} />} title="Smazání účtu (tombstone)" accent="warning">
        <p>Smazání účtu funguje v <strong>30denním hold režimu</strong>:</p>
        <StepList
          steps={[
            'Klikneš „Smazat účet", potvrdíš opsáním přezdívky.',
            <>Účet jde do stavu <em>čeká na smazání</em>. Tvůj obsah (chat, články, diskuze) zůstává, ale jméno se v UI překrývá tombstone páskou.</>,
            'Pokud se během 30 dní přihlásíš, nabídneme reaktivaci.',
            'Po 30 dnech proběhne anonymizace: avatary se smažou (GDPR), autorství nahradí trvalý „Smazaný účet".',
          ]}
        />
        <CalloutBox variant="pozor">
          Pokud jsi jediný PJ světa, který má Pomocného PJ, ten se při tvém smazání{' '}
          <strong>automaticky povýší na PJ</strong>. Tombstone je po cleanupu nevratný.
        </CalloutBox>
      </HelpAccordion>
    </>
  );
}
