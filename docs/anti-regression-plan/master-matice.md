# Master matice — všech 266 nálezů × stupeň pojistky (G)

> Generováno: `node scripts/anti-regression-scan.mjs --emit-matrix`. NEUPRAVOVAT ručně.
> G0 žádná · G1 papírová · G2 živá statická · G3 živý cílený test · G4 ozubená.

| ID | Audit | Sev | Stav | Třída | G | LIVE | Pojistka | Pozn. |
|---|---|---|---|---|---|---|---|---|
| N-3 | bug | ? | fixed | config | G3 | ✅ | be:src/modules/users/services/account-cleanup.cron.spec.ts |  |
| N-12 | bug | 🟡 | fixed | data | G3 | ✅ | be:src/modules/ikaros-discussions/ikaros-discussions.service.spec.ts |  |
| N-33 | bug | 🟡 | fixed | realtime | G2 | ✅ | class:audit:routes |  |
| N-18 | bug | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts |  |
| N-14 | bug | 🟡 | fixed | role | G3 | ✅ | be:src/modules/ikaros-articles/ikaros-articles.service.spec.ts |  |
| N-2 | bug | 🟡 | accepted | config | G2 | ✅ | class:audit:routes | ACCEPTED: hardcoded barvy — velký samostatný design dluh; bezpečná část (bílá/černá) dotažena, zbytek mimo rozsah anti-regression auditu. |
| N-40 | bug | 🟡 | bydesign | other | G2 | ✅ | class:audit:routes |  |
| N-39 | bug | 🔴 | bydesign | ui | G2 | ✅ | class:audit:routes |  |
| N-23 | bug | 🟡 | fixed | ui | G3 | ✅ | fe:src/features/world/shop/components/MyPurchasesPanel.spec.tsx |  |
| N-34 | bug | 🟡 | fixed | realtime | G3 | ✅ | be:src/modules/ikaros-messages/ikaros-messages.service.spec.ts |  |
| N-11 | bug | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/users/dto/update-user.dto.spec.ts |  |
| N-27 | bug | 🟡 | fixed | realtime | G2 | ✅ | class:audit:routes |  |
| N-17 | bug | 🟡 | bydesign | authz | G2 | ✅ | class:audit:routes |  |
| N-8 | bug | 🟠 | bydesign | authz | G3 | ✅ | be:src/gateways/app.gateway.spec.ts |  |
| N-10 | bug | 🟡 | bydesign | authz | G2 | ✅ | class:audit:routes |  |
| N-1 | bug | ? | fixed | other | G2 | ✅ | class:audit:routes |  |
| N-4 | bug | 🟠 | fixed | realtime | G3 | ✅ | be:src/modules/friendships/friendships.gateway.spec.ts |  |
| N-5 | bug | 🟠 | fixed | realtime | G3 | ✅ | be:src/modules/presence/presence.gateway.spec.ts |  |
| N-7 | bug | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts |  |
| N-9 | bug | 🟠 | fixed | authz | G3 | ✅ | be:src/modules/chat/chat.gateway.spec.ts |  |
| N-13 | bug | 🟡 | fixed | data | G2 | ✅ | class:audit:routes |  |
| N-15 | bug | 🔴 | fixed | realtime | G2 | ✅ | class:audit:routes |  |
| N-16 | bug | 🔴 | fixed | ui | G2 | ✅ | class:audit:routes |  |
| N-19 | bug | 🔴 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| N-20 | bug | 🔴 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| N-21 | bug | 🟡 | fixed | contract | G2 | ✅ | class:audit:routes |  |
| N-22 | bug | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/campaign/campaign.service.spec.ts |  |
| N-24 | bug | 🟡 | fixed | data | G2 | ✅ | class:audit:routes |  |
| N-25 | bug | 🔴 | fixed | data | G2 | ✅ | class:audit:routes |  |
| N-26 | bug | 🔴 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| N-28 | bug | 🟡 | fixed | realtime | G2 | ✅ | class:audit:routes |  |
| N-29 | bug | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/maps/operations/operations-authorizer.service.spec.ts |  |
| N-30 | bug | 🔴 | fixed | authz | G3 | ✅ | fe:src/features/chat/api/useGlobalChat.spec.tsx |  |
| N-31 | bug | 🔴 | fixed | realtime | G2 | ✅ | class:audit:routes |  |
| N-32 | bug | 🟡 | fixed | ui | G2 | ✅ | class:audit:routes |  |
| N-35 | bug | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/search/search.controller.spec.ts |  |
| N-36 | bug | 🔴 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| N-37 | bug | 🟡 | fixed | authz | G3 | ✅ | be:src/modules/pages/pages.service.spec.ts |  |
| N-38 | bug | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useUpdatePage.spec.tsx |  |
| N-41 | bug | 🟡 | fixed | validace | G2 | ✅ | class:audit:routes |  |
| N-6 | bug | 🟠 | fixed | contract | G2 | ✅ | class:audit:routes |  |
| C-55 | cache | 🟠 | bydesign | cache | G0 | — | — |  |
| C-09 | cache | 🔴 | fixed | cache | G3 | ✅ | fe:src/features/world/api/useGameEvents.spec.tsx |  |
| C-15 | cache | 🔴 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useCreatePage.spec.tsx |  |
| C-20 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useCharacterMutations.spec.tsx |  |
| C-02 | cache | 🟠 | fixed | realtime | G3 | ✅ | fe:src/features/world/api/useWorldJoin.spec.tsx |  |
| C-05 | cache | 🟠 | accepted | realtime | G0 | — | — | ACCEPTED (jiný typ pojistky): WS reconnect handler v ChatRoom komponentě — kryto component/e2e, unit test křehký |
| C-06 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/chat/api/useChannelMutations.spec.tsx |  |
| C-07 | cache | 🟠 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): WS reconnect refetch v useUnreadSync — reconnect callback, kryto e2e |
| C-25 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/tactical-map/components/MapEmptyState.spec.tsx |  |
| C-46 | cache | 🟠 | accepted | realtime | G0 | — | — | ACCEPTED (jiný typ pojistky): WS reconnect (bell feed) v komponentě — component-level |
| C-56 | cache | 🟡 | bydesign | realtime | G0 | — | — |  |
| C-22 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useCharacterMutations.spec.tsx |  |
| C-11 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/api/useCalendarConfigs.spec.tsx |  |
| C-29 | cache | 🟠 | fixed | authz | G3 | ✅ | fe:src/features/auth/api/useAuth.spec.tsx |  |
| C-12 | cache | 🟠 | fixed | authz | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-54 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-08 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useMail.spec.tsx |  |
| C-42 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useArticles.spec.tsx |  |
| C-23 | cache | 🟡 | bydesign | cache | G0 | — | — |  |
| C-01 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/api/useWorldJoin.spec.tsx |  |
| C-03 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/api/useUpdateMember.spec.tsx |  |
| C-16 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useDeletePage.spec.tsx |  |
| C-17 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useDeletePage.spec.tsx |  |
| C-18 | cache | 🟡 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): read-side factory key (usePage) — žádná mutace k otestování |
| C-19 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/usePage.spec.tsx |  |
| C-21 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/pages/api/useCharacterAccounts.spec.tsx |  |
| C-10 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/api/useGameEvents.spec.tsx |  |
| C-24 | cache | 🟠 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): inline optimistic v 1500-řádkové TacticalMapView — neizolovatelné, klíč pokryt jinde |
| C-26 | cache | 🟡 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): inline scéna mutace v MapPjPanel — klíč activeScenes pokryt C-25 |
| C-28 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/themes/useThemeSync.spec.tsx |  |
| C-30 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/auth/api/useEmailChangeConfirm.spec.tsx |  |
| C-37 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useBulkArticleActions.spec.tsx |  |
| C-38 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useArticles.spec.tsx |  |
| C-39 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useArticles.spec.tsx |  |
| C-40 | cache | 🟠 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): render-time derivace z query (AkcePage) — žádná cache mutace |
| C-41 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/ikaros/api/useDiscussions.spec.tsx |  |
| C-13 | cache | 🟠 | fixed | realtime | G3 | ✅ | fe:src/features/friendships/hooks/useFriendshipsSocket.spec.tsx |  |
| C-14 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-45 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-51 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-52 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/admin/users/api/useAdminUsers.spec.tsx |  |
| C-33 | cache | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/bestiar/hooks/useBestieMutations.spec.tsx |  |
| C-58 | cache | 🟡 | fixed | cache | G3 | ✅ | fe:src/features/world/chat/api/usePinnedChannels.spec.tsx |  |
| C-04 | cache | 🟠 | fixed | realtime | G3 | ✅ | be:src/modules/world-news/world-news.service.spec.ts |  |
| C-31 | cache | 🟡 | accepted | realtime | G0 | — | — | ACCEPTED (jiný typ pojistky): WS identita push — kryto WS gateway/e2e |
| C-34 | cache | 🟠 | fixed | realtime | G3 | ✅ | be:src/modules/bestiae/bestiae.service.spec.ts |  |
| C-47 | cache | 🟠 | fixed | realtime | G3 | ✅ | be:src/modules/ikaros-events/ikaros-events.service.spec.ts |  |
| C-27 | cache | 🟠 | accepted | cache | G0 | — | — | ACCEPTED (jiný typ pojistky): jotai hydration most — ⚖️ by-design, žádná invalidace |
| C-32 | cache | 🟡 | bydesign | cache | G0 | — | — |  |
| C-35 | cache | 🟡 | bydesign | cache | G0 | — | — |  |
| C-53 | cache | 🟡 | bydesign | cache | G0 | — | — |  |
| C-57 | cache | 🟡 | bydesign | cache | G0 | — | — |  |
| CD-01 | cascade-delete | 🔴 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| CD-05 | cascade-delete | 🟠 | bydesign | data | G0 | — | — |  |
| CD-06 | cascade-delete | 🟡 | bydesign | data | G0 | — | — |  |
| CD-07 | cascade-delete | 🟡 | bydesign | nav | G0 | — | — |  |
| CD-09 | cascade-delete | 🟠 | fixed | data | G3 | ✅ | be:src/modules/characters/characters.service.spec.ts |  |
| CD-02 | cascade-delete | 🔴 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| CD-03 | cascade-delete | 🔴 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| CD-04 | cascade-delete | 🔴 | fixed | data | G3 | ✅ | be:src/modules/maps/maps.service.spec.ts |  |
| CD-08 | cascade-delete | 🟡 | fixed | data | G3 | ✅ | be:src/modules/users/users.service.spec.ts |  |
| DI-02 | db-integrity | ? | bydesign | validace | G0 | — | — |  |
| DI-01 | db-integrity | 🟡 | accepted | config | G0 | — | — | ACCEPTED: custom_emotes ObjectId FK — konvenční odchylka; oprava rizikovější než problém (registr). |
| DI-03 | db-integrity | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/world-currencies/world-currencies.service.spec.ts |  |
| DI-04 | db-integrity | 🟠 | fixed | data | G3 | ✅ | be:src/modules/pages/pages.service.spec.ts |  |
| DI-05 | db-integrity | 🟡 | fixed | cache | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts |  |
| EC-01 | error-contract | 🟠 | fixed | contract | G3 | ✅ | be:test/error-contract.e2e-spec.ts |  |
| EC-12 | error-contract | 🟡 | fixed | contract | G3 | ✅ | fe:src/shared/api/__tests__/parseApiError.fuzz.spec.ts |  |
| EC-10 | error-contract | 🟠 | fixed | contract | G2 | ✅ | class:audit:errors |  |
| EC-11 | error-contract | 🟡 | fixed | contract | G3 | ✅ | be:test/error-contract.e2e-spec.ts |  |
| EC-02 | error-contract | 🟠 | fixed | contract | G3 | ✅ | be:test/error-contract.e2e-spec.ts |  |
| EC-03 | error-contract | 🟡 | fixed | contract | G3 | ✅ | be:src/modules/character-subdocs/character-subdocs.service.spec.ts |  |
| EC-04 | error-contract | 🟡 | fixed | contract | G2 | ✅ | class:audit:errors |  |
| EC-06 | error-contract | 🟠 | fixed | contract | G2 | ✅ | class:audit:errors |  |
| EC-09 | error-contract | 🟡 | fixed | contract | G2 | ✅ | class:audit:errors |  |
| EC-08 | error-contract | 🟡 | fixed | contract | G2 | ✅ | class:audit:errors |  |
| EC-05 | error-contract | 🟡 | fixed | contract | G3 | ✅ | be:test/error-contract.e2e-spec.ts |  |
| EC-07 | error-contract | 🟡 | fixed | contract | G3 | ✅ | be:test/error-contract.e2e-spec.ts |  |
| F-01 | form-schema | 🔴 | fixed | validace | G3 | ✅ | fe:src/features/auth/api/useResetPassword.spec.tsx |  |
| F-28 | form-schema | 🔴 | fixed | validace | G3 | ✅ | be:src/modules/users/dto/update-user.dto.spec.ts |  |
| F-02 | form-schema | 🔴 | fixed | data | G3 | ✅ | be:src/modules/timeline/timeline.service.spec.ts | OPRAVENO v timeline.service.ts (NE game-events): sanitizeRichText při create(163)+update(205)+read-time(93). AR-12 byl můj omyl (hledal špatný modul). |
| F-03 | form-schema | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/auth/auth.service.spec.ts |  |
| F-27 | form-schema | 🔴 | fixed | validace | G3 | ✅ | fe:src/features/admin/users/api/useRequestUsernameChange.spec.tsx |  |
| F-12 | form-schema | 🟡 | accepted | validace | G0 | — | — | ACCEPTED: YouTube URL BC-risk — přísnější BE regex by odmítl existující validní odkazy; vědomě ponecháno. |
| F-15 | form-schema | 🟡 | accepted | validace | G0 | — | — | ACCEPTED: isCollapsed legacy default latentní (low), bez aktivního dopadu. |
| F-26 | form-schema | ? | bydesign | cache | G0 | — | — |  |
| F-25 | form-schema | ? | fixed | config | G0 | — | — | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-07 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/worlds/dto/update-world.dto.spec.ts |  |
| F-11 | form-schema | 🟡 | accepted | validace | G0 | — | — | ACCEPTED (jiný typ pojistky): DB default (schema @Prop default:true), ne DTO validační pravidlo — netestovatelné na DTO úrovni |
| F-23 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/users/dto/update-user.dto.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-04 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/world-currencies/dto/update-world-currencies.dto.spec.ts |  |
| F-05 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/worlds/dto/update-world.dto.spec.ts |  |
| F-06 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/worlds/dto/create-world.dto.spec.ts |  |
| F-08 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/game-events/dto/create-game-event.dto.spec.ts | AR-13 opraveno: @IsOptional odebrán, @ValidateIf řídí; null odmítnut. Regresní test create-game-event.dto.spec AR-13. |
| F-09 | form-schema | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/bestiae/dto/create-bestie.dto.spec.ts |  |
| F-10 | form-schema | 🟡 | fixed | data | G3 | ✅ | be:src/modules/ikaros-news/ikaros-news.service.spec.ts |  |
| F-13 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/game-events/dto/create-game-event.dto.spec.ts |  |
| F-14 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/pages/dto/create-page.dto.spec.ts |  |
| F-16 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/characters/dto/create-character.dto.spec.ts |  |
| F-17 | form-schema | 🟡 | fixed | cache | G0 | — | — | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-18 | form-schema | 🟡 | accepted | cache | G0 | — | — | ACCEPTED: by-design — Mongoose strict drop legacy polí, žádný runtime dopad. |
| F-19 | form-schema | 🟡 | fixed | data | G3 | ✅ | be:src/modules/chat/dto/create-scheduled-message.dto.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-20 | form-schema | 🟡 | fixed | data | G3 | ✅ | be:src/modules/bestiae/dto/create-bestie.dto.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-21 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/maps/dto/create-map.dto.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-22 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/maps/dto/operations/hex-coord.dto.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| F-24 | form-schema | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/users/dto/update-user.dto.spec.ts |  |
| LH-02 | log-hygiene | 🟠 | fixed | log | G2 | ✅ | class:audit:logs |  |
| LH-05 | log-hygiene | 🟠 | fixed | log | G2 | ✅ | class:audit:logs |  |
| LH-01 | log-hygiene | 🟡 | fixed | log | G3 | ✅ | be:src/common/logging/log-hygiene.spec.ts |  |
| LH-12 | log-hygiene | 🟡 | fixed | log | G2 | ✅ | class:audit:logs |  |
| LH-08 | log-hygiene | 🟡 | bydesign | log | G2 | ✅ | class:audit:logs |  |
| LH-09 | log-hygiene | ? | bydesign | log | G2 | ✅ | class:audit:logs |  |
| LH-03 | log-hygiene | 🟡 | fixed | log | G3 | ✅ | be:src/common/logging/log-hygiene.spec.ts |  |
| LH-04 | log-hygiene | 🟡 | fixed | log | G3 | ✅ | be:src/common/logging/log-hygiene.spec.ts |  |
| LH-06 | log-hygiene | 🟡 | fixed | log | G2 | ✅ | class:audit:logs |  |
| LH-07 | log-hygiene | ? | fixed | log | G2 | ✅ | class:audit:logs |  |
| LH-10 | log-hygiene | ? | bydesign | log | G2 | ✅ | class:audit:logs |  |
| LH-11 | log-hygiene | ? | bydesign | log | G2 | ✅ | class:audit:logs |  |
| NAV-01 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-02 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-03 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-04 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-05 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-06 | nav | 🔴 | fixed | authz | G2 | ✅ | class:audit:nav |  |
| NAV-07 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-08 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| NAV-09 | nav | 🟠 | fixed | nav | G2 | ✅ | class:audit:nav |  |
| PC-01 | prod-config | 🔴 | fixed | authz | G2 | ✅ | class:audit:config |  |
| PC-24 | prod-config | 🟠 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-13 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-02 | prod-config | 🔴 | fixed | data | G2 | ✅ | class:audit:config |  |
| PC-21 | prod-config | 🟠 | accepted | config | G2 | ✅ | class:audit:config | ACCEPTED: OPS task — nahrát embedding modely, ať nezávisí na starém webu; není kódová změna, na provozovateli. |
| PC-14 | prod-config | 🟡 | bydesign | authz | G2 | ✅ | class:audit:config |  |
| PC-17 | prod-config | 🟡 | bydesign | config | G2 | ✅ | class:audit:config |  |
| PC-19 | prod-config | 🟡 | bydesign | authz | G2 | ✅ | class:audit:config |  |
| PC-11 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-12 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-15 | prod-config | 🟠 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-16 | prod-config | 🟠 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-18 | prod-config | 🟠 | fixed | config | G3 | ✅ | fe:src/features/auth/api/useAuth.spec.tsx |  |
| PC-22 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-23 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-07 | prod-config | 🟡 | fixed | validace | G2 | ✅ | class:audit:config |  |
| PC-03 | prod-config | 🟠 | fixed | config | G3 | ✅ | be:src/common/config/env.validation.spec.ts |  |
| PC-04 | prod-config | 🟠 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-08 | prod-config | 🟡 | fixed | log | G2 | ✅ | class:audit:config |  |
| PC-09 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-10 | prod-config | 🟠 | fixed | contract | G2 | ✅ | class:audit:config |  |
| PC-05 | prod-config | 🟠 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-06 | prod-config | 🟡 | fixed | config | G2 | ✅ | class:audit:config |  |
| PC-20 | prod-config | 🟡 | bydesign | config | G2 | ✅ | class:audit:config |  |
| RC-E1 | race-condition | 🔴 | fixed | money | G3 | ✅ | be:test/race/economy.race.e2e-spec.ts |  |
| RC-E2 | race-condition | 🔴 | fixed | money | G3 | ✅ | be:test/race/economy.race.e2e-spec.ts |  |
| RC-E3 | race-condition | 🟠 | fixed | money | G3 | ✅ | be:src/modules/character-subdocs/character-accounts.service.spec.ts |  |
| RC-E4 | race-condition | 🟠 | fixed | money | G3 | ✅ | be:src/modules/campaign/campaign-purchase.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-E5 | race-condition | 🔴 | fixed | money | G3 | ✅ | be:src/modules/campaign/campaign-purchase.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-E6 | race-condition | 🟠 | bydesign | money | G0 | — | — |  |
| RC-P1 | race-condition | 🟠 | fixed | data | G3 | ✅ | be:test/race/pages.race.e2e-spec.ts |  |
| RC-P2 | race-condition | 🟠 | fixed | data | G3 | ✅ | be:test/race/pages.race.e2e-spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-P3 | race-condition | 🟡 | bydesign | data | G3 | ✅ | be:test/race/pages.race.e2e-spec.ts |  |
| RC-P4 | race-condition | 🟡 | fixed | data | G3 | ✅ | be:test/race/pages.race.e2e-spec.ts |  |
| RC-R1 | race-condition | 🟠 | bydesign | role | G3 | ✅ | be:test/race/roles.race.e2e-spec.ts |  |
| RC-R2 | race-condition | 🟡 | fixed | cache | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts |  |
| RC-R3 | race-condition | 🟠 | fixed | authz | G3 | ✅ | be:test/race/roles.race.e2e-spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-D3 | race-condition | 🟠 | fixed | data | G3 | ✅ | be:test/race/db-lifecycle.race.e2e-spec.ts |  |
| RC-R4 | race-condition | ? | bydesign | authz | G3 | ✅ | be:test/race/roles.race.e2e-spec.ts |  |
| RC-R5 | race-condition | ? | bydesign | authz | G0 | — | — |  |
| RC-D1 | race-condition | 🟠 | fixed | data | G3 | ✅ | be:src/modules/character-subdocs/character-subdocs.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-D2 | race-condition | 🟠 | fixed | data | G3 | ✅ | be:src/modules/characters/characters.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| RC-D4 | race-condition | 🟡 | bydesign | data | G3 | ✅ | be:test/race/deletion.race.e2e-spec.ts |  |
| RC-D6 | race-condition | 🟡 | fixed | data | G3 | ✅ | be:test/race/maps.race.e2e-spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| R-01 | role | 🟡 | fixed | role | G2 | ✅ | class:audit:routes |  |
| R-19 | role | 🟡 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| R-07 | role | 🔴 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| R-08 | role | 🔴 | fixed | authz | G3 | ✅ | be:src/common/guards/jwt-auth.guard.spec.ts |  |
| R-11 | role | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/maps/maps.service.spec.ts |  |
| R-09 | role | 🟡 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| R-10 | role | 🟡 | fixed | role | G2 | ✅ | class:audit:routes |  |
| R-04 | role | 🔴 | fixed | authz | G3 | ✅ | be:src/gateways/app.gateway.spec.ts |  |
| R-03 | role | 🔴 | fixed | role | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts |  |
| R-02 | role | 🟡 | fixed | role | G3 | ✅ | be:src/modules/characters/characters.service.spec.ts |  |
| R-06 | role | 🟡 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| R-05 | role | 🟡 | fixed | role | G3 | ✅ | be:src/modules/admin/admin.service.spec.ts |  |
| R-20 | role | 🟡 | fixed | role | G2 | ✅ | class:audit:routes |  |
| R-12 | role | 🟡 | fixed | authz | G3 | ✅ | be:src/modules/dungeon-maps/dungeon-maps.service.spec.ts |  |
| R-13 | role | 🟡 | fixed | authz | G2 | ✅ | class:audit:routes |  |
| R-14 | role | 🟡 | bydesign | authz | G2 | ✅ | class:audit:routes |  |
| R-15 | role | 🟡 | fixed | role | G3 | ✅ | be:src/modules/campaign/scenario-templates.controller.spec.ts |  |
| R-16 | role | 🟡 | fixed | ui | G2 | ✅ | class:audit:routes |  |
| R-17 | role | 🟡 | fixed | ui | G2 | ✅ | class:audit:routes |  |
| R-18 | role | 🟡 | fixed | ui | G2 | ✅ | class:audit:routes |  |
| SS-01 | seed-scenario | 🟡 | fixed | data | G3 | ✅ | be:test/seed-scenario.e2e-spec.ts |  |
| S-01 | state-consist | 🟡 | accepted | realtime | G0 | — | — | ACCEPTED (jiný typ pojistky): removal — smazány redundantní BE emity, žádné nové testovatelné chování |
| S-02 | state-consist | 🟡 | fixed | realtime | G3 | ✅ | fe:src/features/world/tactical-map/hooks/__tests__/useMapSocket.test.tsx |  |
| S-06 | state-consist | 🟠 | fixed | cache | G3 | ✅ | fe:src/features/world/hooks/useWorldSocket.spec.tsx |  |
| S-03 | state-consist | 🟠 | fixed | realtime | G3 | ✅ | fe:src/features/world/pages/api/useAccountTransferNotifications.spec.tsx |  |
| S-04 | state-consist | 🟡 | fixed | realtime | G3 | ✅ | fe:src/features/ikaros/api/useIkarosEvents.spec.tsx |  |
| S-05 | state-consist | 🟡 | fixed | realtime | G3 | ✅ | fe:src/features/friendships/hooks/useFriendshipsSocket.spec.tsx |  |
| UM-01 | upload-media | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-03 | upload-media | 🟠 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-04 | upload-media | 🟠 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-05 | upload-media | 🟠 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-06 | upload-media | 🟠 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-07 | upload-media | 🟠 | fixed | validace | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-08 | upload-media | 🟠 | fixed | authz | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-09 | upload-media | 🟠 | fixed | media | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts |  |
| UM-10 | upload-media | 🟠 | accepted | authz | G0 | — | — | ACCEPTED (jiný typ pojistky): @Throttle decorator guard na /upload — ověřeno staticky, ne falešný unit test |
| UM-02 | upload-media | 🟠 | bydesign | media | G0 | — | — |  |
| UM-11 | upload-media | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/emotes/emotes.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| UM-12 | upload-media | 🟡 | accepted | contract | G0 | — | — | ACCEPTED: fragmentace limitů — drift vyvrácen, limity konzistentní. |
| UM-13 | upload-media | 🟡 | accepted | contract | G0 | — | — | ACCEPTED: dva useUploadImage (shared vs legacy) — vyvráceno, oba legitimní. |
| UM-14 | upload-media | 🟡 | fixed | validace | G3 | ✅ | be:src/modules/upload/upload.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| UM-15 | upload-media | 🟡 | fixed | data | G3 | ✅ | be:src/modules/worlds/worlds.service.spec.ts | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| UM-16 | upload-media | 🟡 | bydesign | media | G0 | — | — |  |
| W-4 | ws | 🟡 | fixed | contract | G2 | ✅ | class:audit:ws |  |
| W-5 | ws | 🟡 | fixed | realtime | G2 | ✅ | class:audit:ws |  |
| W-7 | ws | 🔴 | fixed | realtime | G3 | ✅ | fe:src/features/chat/api/useSocket.spec.ts |  |
| W-10 | ws | 🔴 | fixed | authz | G3 | ✅ | be:src/modules/global-chat/global-chat.gateway.spec.ts |  |
| W-3 | ws | 🟠 | fixed | authz | G3 | ✅ | be:src/modules/chat/chat.gateway.spec.ts |  |
| W-9 | ws | 🟠 | fixed | realtime | G3 | ✅ | fe:src/app/layout/WorldLayout/WorldLayout.spec.tsx |  |
| W-1 | ws | 🟡 | fixed | realtime | G3 | ✅ | be:src/modules/friendships/friendships.gateway.spec.ts |  |
| W-11 | ws | 🟡 | fixed | realtime | G3 | ✅ | be:src/modules/presence/presence.gateway.spec.ts |  |
| W-8 | ws | 🟡 | fixed | config | G2 | ✅ | class:audit:ws |  |
| W-2 | ws | ? | fixed | contract | G2 | ✅ | class:audit:ws | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
| W-6 | ws | ? | fixed | contract | G2 | ✅ | class:audit:ws | Opraveno 2026-06-15 (dluhová vlna) + regresní test / ověřeno. |
