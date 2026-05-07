# Routing

## Route strom

### Veřejné — `AuthLayout`

| Cesta | Komponenta |
|-------|------------|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |

### Chráněné — `IkarosLayout` (loader: `authLoader`)

| Cesta | Komponenta |
|-------|------------|
| `/` | `DashboardPage` |
| `/chat` | `ChatPage` (Hospoda) |
| `/ikaros/vesmiry` | `WorldsPage` |
| `/ikaros/vytvorit-svet` | `CreateWorldPage` |
| `/ikaros/profil` | `ProfilePage` |
| `/ikaros/uzivatele` | `UsersPage` |
| `/ikaros/uzivatel/:id` | `UserProfilePage` |
| `/ikaros/clanky` | `ArticlesPage` |
| `/ikaros/galerie` | `GalleryPage` |
| `/ikaros/diskuze` | `DiscussionsPage` |
| `/ikaros/posta` | `MailPage` |
| `/ikaros/napoveda` | `HelpPage` |
| `/admin` | `PlatformAdminPage` + `RoleGuard [Superadmin, Admin]` |
| `/admin/dungeon-builder` | `DungeonBuilderPage` + `RoleGuard [Superadmin, Admin, PJ]` |

### Chráněné — `WorldLayout` (loader: `authLoader`)

| Cesta | Komponenta |
|-------|------------|
| `/svet/:worldId` | `WorldDashboardPage` |
| `/svet/:worldId/chat` | `WorldChatPage` |
| `/svet/:worldId/stranky` | `PagesListPage` |
| `/svet/:worldId/nova-stranka` | `PageEditorPage` |
| `/svet/:worldId/edit/:slug` | `PageEditorPage` |
| `/svet/:worldId/postavy` | `CharactersPage` |
| `/svet/:worldId/moje-postava` | `MyCharacterPage` |
| `/svet/:worldId/mapa` | `MapPage` |
| `/svet/:worldId/takticka-mapa` | `TacticalMapPage` |
| `/svet/:worldId/kalendar` | `CalendarPage` |
| `/svet/:worldId/timeline` | `TimelinePage` |
| `/svet/:worldId/pocasi` | `WeatherPage` |
| `/svet/:worldId/sprava-udalosti` | `EventsPage` |
| `/svet/:worldId/pavucina` | `CampaignPage` |
| `/svet/:worldId/scenare` | `StorylinesPage` |
| `/svet/:worldId/obchod` | `ShopPage` |
| `/svet/:worldId/zvuky` | `SoundsPage` |
| `/svet/:worldId/prevodnik-men` | `CurrencyPage` |
| `/svet/:worldId/nastaveni` | `WorldSettingsPage` |
| `/svet/:worldId/skupiny` | `GroupsPage` |
| `/svet/:worldId/pravidla` | `RulesPage` |
| `/svet/:worldId/admin/stranky` | `PagesAdminPage` + `RoleGuard [Superadmin, Admin, PJ]` |
| `/svet/:worldId/admin/adresar-postav` | `NPCDirectoryPage` + `RoleGuard [Superadmin, Admin, PJ]` |
| `/svet/:worldId/:slug` | `PageViewerPage` *(catch-all — musí být poslední)* |

### Chybové

| Cesta | Komponenta |
|-------|------------|
| `*` | `NotFoundPage` (404) |
| `errorElement` na layoutech | `ErrorPage` (router errors) |

## Guards

**`authLoader`** — čte `ikaros.jwt` z localStorage. Jotai `atomWithStorage` ukládá JSON-encoded hodnoty, proto je třeba `JSON.parse()`. Redirect na `/login` při chybějícím nebo null tokenu.

**`RoleGuard`** — `roles: UserRole[]`. Porovnává `user.role` z `currentUserAtom`. Zobrazí `ForbiddenPage` pokud role není v seznamu. BE vždy provádí vlastní validaci — RoleGuard je pouze UX ochrana.
