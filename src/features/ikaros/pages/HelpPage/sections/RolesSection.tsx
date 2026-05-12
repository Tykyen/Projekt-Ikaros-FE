import s from '../HelpPage.module.css';

export function RolesSection() {
  return (
    <>
      <p>
        Ikaros má dvě úrovně rolí: <strong>globální</strong> (napříč
        platformou) a <strong>světová</strong> (uvnitř konkrétního světa).
        Globální role se zdědí všude; světová platí jen v daném světě.
      </p>

      <h2>Globální role</h2>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Kdo to je</th>
              <th>Co může</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Superadmin</strong></td>
              <td>Zakladatel platformy (Tyky)</td>
              <td>
                Vše. Jediný, kdo nastavuje Admin role a granular permissions
                (<code>canManageAdmins</code>, <code>canModerateContent</code>,
                {' '}<code>canEditPlatformPages</code>).
              </td>
            </tr>
            <tr>
              <td><strong>Admin</strong></td>
              <td>Důvěryhodný moderátor</td>
              <td>
                Adresář uživatelů, ban/unban, změna role (s hierarchií),
                schvalování žádostí o změnu přezdívky, čtení audit logu,
                moderační smazání účtu (s povinným důvodem).
              </td>
            </tr>
            <tr>
              <td><strong>PJ</strong></td>
              <td>Game master ve svém světě</td>
              <td>
                Globálně se chová jako Hráč. Plné pravomoci uvnitř svých světů
                (správa členů, content, mapy, kampaně).
              </td>
            </tr>
            <tr>
              <td><strong>Hráč</strong></td>
              <td>Standardní uživatel</td>
              <td>
                Vlastní profil, vlastní postava, účast v adresáři, brzy chat /
                diskuze / pošta.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Správce článků / galerie / diskuzí</strong>
              </td>
              <td>Moderátor konkrétního typu obsahu</td>
              <td>
                Schvalování pending obsahu daného typu. Role je v enumu už dnes,
                reálná funkčnost přijde s fází 3.2–3.4.
              </td>
            </tr>
            <tr>
              <td>
                <em>Korektor / Čtenář / Žadatel / Ikarus</em>
              </td>
              <td>—</td>
              <td>
                V přípravě. Tyto role jsou v systému, ale jejich přesné chování
                bude definováno v pozdějších krocích.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Hierarchie a omezení adminů</h2>
      <p>
        Hlavní pravidla, která BE vynucuje při admin akcích:
      </p>
      <ul>
        <li>
          Admin <strong>nemůže měnit role / banovat / mazat jiného Admina</strong>{' '}
          ani Superadmina. To smí jen Superadmin.
        </li>
        <li>
          Admin <strong>nemůže povyšovat jiné na Admin</strong>, dokud nemá flag{' '}
          <code>canManageAdmins</code> (uděluje Superadmin).
        </li>
        <li>
          Nikdo nemůže banovat nebo smazat sám sebe.
        </li>
        <li>
          Granular permissions (<code>canManageAdmins</code>, ...) nastavuje
          výhradně Superadmin.
        </li>
        <li>
          Každá admin akce se zapisuje do <strong>Audit logu</strong> (přístupný
          v <code>/ikaros/uzivatele?tab=audit</code>).
        </li>
      </ul>

      <h2>Co kdo smí udělat s kým</h2>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Akce →<br />Aktér ↓</th>
              <th>Hráč</th>
              <th>PJ</th>
              <th>Admin</th>
              <th>Superadmin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Hráč</strong></td>
              <td>✕</td>
              <td>✕</td>
              <td>✕</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Admin</strong> (bez flagu)</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>✕</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Admin</strong> (s <code>canManageAdmins</code>)</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Superadmin</strong></td>
              <td>Vše</td>
              <td>Vše</td>
              <td>Vše + granular flagy</td>
              <td>✕ (sám sebe ne)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Světové role</h2>
      <p>
        Každý uživatel může být v každém světě v jiné roli. Světovou roli ti
        přidělí PJ daného světa.
      </p>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Co může</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>PJ</strong></td>
              <td>
                Vlastník světa. Plná správa: členové, role, obsah, mapy,
                kampaně, kalendář, nastavení.
              </td>
            </tr>
            <tr>
              <td><strong>Pomocný PJ</strong></td>
              <td>
                Zastupuje PJ. Pokud PJ smaže účet a Pomocný PJ existuje,
                <strong> automaticky se povýší</strong> na PJ.
              </td>
            </tr>
            <tr>
              <td><strong>Korektor</strong></td>
              <td>
                Read + gramatická korektura obsahu světa. Detail v rámci fáze 5+.
              </td>
            </tr>
            <tr>
              <td><strong>Hráč</strong></td>
              <td>
                Účastní se chatu, postav, deníků, eventů. Edituje svou postavu.
              </td>
            </tr>
            <tr>
              <td><strong>Čeká na schválení</strong></td>
              <td>
                Zažádal o vstup do uzavřeného světa. PJ ho potvrdí nebo zamítne
                v tabu Zpracovat (Fáze 2.4).
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={s.callout}>
        <strong>Tip:</strong> Pokud chceš svůj svět dlouhodobě, založ si v něm{' '}
        <strong>Pomocného PJ</strong>. Když budeš muset účet smazat, svět
        nezůstane bez vlastníka.
      </div>
    </>
  );
}
