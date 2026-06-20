Stručně, jasně, přímo; bez vaty. Gramatiku obětuj brevitě, ne srozumitelnosti. Česky (i dokumentace).
Nesrovnalost/problém v kódu hned prokomunikuj (co · dopad · návrh), neopravuj tiše, čekej na souhlas. Vlastní nápady (lepší/jinak/rozšíření) nejdřív do diskuze, neimplementuj bez souhlasu.
UI musí fungovat na mobilu i desktopu: po grafické úpravě → `mobil-desktop`; před spec plánem grafiky → `frontend-design`.
Před implementací komponenty/featury → `spec-driven-development`.
Změna funkčnosti (route · stub→funkční · chování · role/oprávnění · BE schopnost · dluh) → `funkce` (kódem ověřená inventura `docs/funkce/`, zdroj pravdy) + `napoveda` (hráčský výtah `/ikaros/napoveda`); měň oba.
Neřešený dluh/riziko/nesrovnalost → `dluh`.
**ZÁKLADNÍ PRAVIDLO (deník práce + brzda proti cyklení):** `chybovy-denik` (`docs/chybovy-denik/`) nahazuj POVINNĚ při: **(a) chybě** — vlastní chyba · oprava nezabrala · cyklíš → zapiš `CH-xxx` (co nefungovalo + poučení + příznak cyklení); **(b) netriviálním řešení / přepracování** — vyřešený větší problém · změna přístupu · zásadní oprava, co zabrala → zapiš `✅ ŘEŠENÍ` (co zabralo · proč správně · jak ověřeno · zhodnocení dobře/špatně). Drobné jednořádkové fixy NEzapisuj. Před opakováním pokusu projdi index `README.md`; tutéž chybu 2× = STOP → jiný přístup nebo dotaz. Cíl: vždy vědět, co už jsem zkusil/udělal a jak to dopadlo.
