import { Link } from 'react-router-dom';
import {
  UserCircle,
  AtSign,
  KeyRound,
  ImagePlus,
  Drama,
  EyeOff,
  Trash2,
  Globe2,
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

      <HelpAccordion icon={<Drama size={20} />} title="Postava v Rozcestí" accent="player">
        <p>
          Jméno, krátké bio a <strong>samostatný avatar</strong> pro tvoji
          platformovou „postavu" — personu, pod kterou se objevíš v chatech a
          komunitě Ikaru. Je nezávislá na herních postavách uvnitř světů.
        </p>
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

      <HelpAccordion icon={<Globe2 size={20} />} title="Moje světy & komunitní stopa" accent="success">
        <p>
          <strong>Moje světy</strong> = seznam světů, kterých jsi členem (klik tě
          přenese do světa). <strong>Moje akce ve světech</strong> agregují blížící
          se herní akce napříč světy. Komunitní stopa (diskuze, články, galerie) se
          plní postupně.
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
