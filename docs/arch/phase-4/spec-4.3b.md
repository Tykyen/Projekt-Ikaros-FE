# Spec 4.3b — Zprávy: Přílohy

Rozšíření globálního chatu (Hospoda + Rozcestí) o **přílohy** — obrázky a
dokumenty. Navazuje na 4.3a (reply + reakce). Video je mimo scope.

## Kontext (co už existuje)

- BE má `ChatAttachment` interface
  (`chat/interfaces/chat-attachment.interface.ts`): `url, publicId, type,
  mimeType, filename, size`.
- BE `ChatMessage` **už má** `attachments?: ChatAttachment[]`.
  `GlobalChatService.sendMessage`/`sendWhisper`/`saveSystemMessage` ho ukládají
  natvrdo jako `[]` — chybí cesta, která ho naplní.
- FE typ `ChatMessage` (`chat/lib/types.ts`) **`attachments` nemá** → type
  drift, sjednotit (skill `type-sync`).
- `UploadService` umí Cloudinary upload: `uploadFile()` validuje MIME (image /
  video / document), nahraje do `chat/<worldId>/<channelId>`, vrací
  `ChatAttachment`. Endpoint `POST /upload` ho používá, ale řeší **světový**
  chat (`chatService.findChannelForUpload`, `worldId!` non-null) — pro globální
  místnosti (`worldId: null`) nepoužitelný.
- Galerie (3.3) má vzor image uploadu: `cloudinaryThumb()` transformace URL,
  `Lightbox` komponenta (`features/ikaros/components/Lightbox`).

## Rozhodnutí (odsouhlaseno v brainstormingu)

- **Typy:** obrázky (JPG, PNG, GIF, WebP, SVG) + dokumenty (PDF, TXT, MD, DOC,
  DOCX). **Video ne.**
- **Počet na zprávu:** max **10 obrázků** a max **4 dokumenty** (limit zvlášť
  podle typu; zpráva smí mít obojí).
- **Max velikost:** 10 MB / soubor.
- **Whisper:** přílohy fungují i u šeptaných zpráv (konzistence s 4.3a).
- **Upload-on-send:** soubory se nahrávají až při odeslání zprávy, ne při
  výběru → žádné osiřelé soubory z nepoužitého výběru.

## §1 — Upload příloh

### BE

- Nový endpoint `POST /global-chat/upload?room=` (multipart, `file`), za
  `JwtAuthGuard`, `MulterExceptionFilter`, `FileInterceptor` limit 10 MB.
  - `parseRoom` validuje `room`; vrátí `ChatAttachment`.
  - Volá novou metodu `UploadService.uploadGlobalChatFile(file, room)` —
    Cloudinary folder `global-chat/<room>`, MIME whitelist **bez videa**
    (image + document), jinak `UnsupportedMediaTypeException`.
- Endpoint nahrává **jeden** soubor za request; FE volá per-soubor (viz FE).

### Validace přílohy na BE při odeslání zprávy

⚠️ Klient posílá v DTO celý objekt `ChatAttachment`. BE **nesmí věřit**
libovolné `url` (riziko XSS přes odkaz na dokument, embed cizího obrázku).
`GlobalChatService` proto každou přílohu ověří:

- `url` musí být na Cloudinary doméně daného účtu
  (`https://res.cloudinary.com/<cloud_name>/`),
- `publicId` musí začínat `global-chat/`,
- `type` ∈ `{image, document}`, `size` ≤ 10 MB,
- počet: ≤ 10 image **a** ≤ 4 document.

Nevyhovující příloha → `BadRequestException` (na rozdíl od reply, kde je tichý
fallback — tady jde o vstup, ne o expiraci cíle).

## §2 — Zpráva s přílohou

### BE

- `CreateGlobalMessageDto`:
  - `content` → `@IsOptional`, zrušit `@MinLength(1)`, ponechat
    `@MaxLength(4000)`. Prázdný text je legitimní, má-li zpráva přílohu.
  - nové `attachments?: ChatAttachmentDto[]` —
    `@IsOptional @IsArray @ValidateNested({ each: true }) @Type(...)`.
    `ChatAttachmentDto` zrcadlí `ChatAttachment` s validátory polí.
- `GlobalChatService.sendMessage` / `sendWhisper`:
  - guard: `!content?.trim() && attachments prázdné` → `BadRequestException`
    (`GLOBAL_CHAT_EMPTY_MESSAGE`).
  - validace příloh dle §1, uložení do `message.attachments`.
- Whisper — WS `ikaros:whisper` payload + `attachments?: ChatAttachment[]`;
  `sendWhisper` signatura + parametr, stejná validace.
- `saveSystemMessage` beze změny (systémová zpráva přílohy nemá).

### FE

- Typ `ChatMessage` + `attachments?: ChatAttachment[]`; nový exportovaný typ
  `ChatAttachment` (zrcadlí BE).
- `SendMessagePayload` + `attachments?`. `sendWhisper` payload taktéž.
- Nový hook `useUploadAttachment(room)` — `useMutation`, multipart
  `POST /global-chat/upload?room=`, vrací `ChatAttachment`.

## §3 — ChatInput: výběr a náhled příloh

- Tlačítko **Přidat přílohu** (ikona `Paperclip`) vedle pole — otevře skrytý
  `<input type="file" multiple accept="image/*,.pdf,.txt,.md,.doc,.docx">`.
- Vybrané soubory drží `ChatInput` jako `File[]` ve stavu (zatím nenahrané).
- **Náhledová lišta** nad polem (i zároveň s reply lištou 4.3a):
  - obrázek → malý thumbnail z `URL.createObjectURL`,
  - dokument → chip s ikonou typu + název souboru,
  - každá položka má „×" pro odebrání.
- Klientská validace při výběru (toast u chyby, soubor se nepřidá):
  - velikost > 10 MB,
  - MIME mimo whitelist,
  - překročení limitu 10 obrázků / 4 dokumentů.
- **Odeslání:** klik na Odeslat → tlačítko do stavu „nahrávám" (spinner,
  disabled) → `useUploadAttachment` nahraje soubory (paralelně) → výsledné
  `ChatAttachment[]` se předají do `onSendPublic`/`onSendWhisper` spolu s
  textem → po úspěchu se vyčistí text, reply i přílohy. Selže-li upload →
  toast, přílohy zůstanou, lze odeslat znovu.
- Zpráva smí být **jen příloha** (prázdný text). Odeslat je aktivní, pokud je
  neprázdný text **nebo** je vybraná aspoň jedna příloha.
- `revokeObjectURL` při odebrání položky a při odmountování (úklid paměti).

## §4 — MessageItem: zobrazení příloh

- Přílohy se renderují **pod obsahem**, nad řádkem reakcí (4.3a).
- **Obrázky** — mřížka thumbnailů (`cloudinaryThumb`, `c_fill`):
  - 1 obrázek = větší náhled; 2+ = mřížka (2 sloupce mobil, až 3 desktop).
  - klik → `Lightbox` (galerie všech obrázků zprávy, krok/listování).
- **Dokumenty** — chip pod obrázky: ikona dle typu (`FileText` ap.), název
  souboru (ellipsis), velikost (`formatBytes`). Klik → otevře `url` v nové
  záložce (`target="_blank" rel="noopener"`).
- Smazaná zpráva: přílohy se nevykreslují (řádek „Zpráva byla smazána" beze
  změny). Systémová zpráva: bez příloh.
- `Lightbox` z `features/ikaros` — pokud cross-feature import vadí, přesunout
  do `shared/ui` (zvážit v impl. plánu; jinak založit `dluh`).

## §5 — Úklid Cloudinary (řeší dluh nalezený při analýze)

Bez tohoto by každá příloha osiřela na Cloudinary (chat má TTL 1 h).

- **Prune job** (`clean-messages.job.ts`): `pruneChannel` dnes maže zprávy z DB
  bez úklidu Cloudinary. Upravit tak, aby se před smazáním posbíraly
  `attachments` mazaných zpráv a předaly do `UploadService` (Cloudinary
  `destroy` per asset, best-effort, jen log při chybě).
- **Admin smazání** (`deleteMessage`): event `chat.global.message.deleted`
  rozšířit o `attachments` mazané zprávy; `deleteMessage` navíc nuluje
  `attachments`.
- **`UploadService`**: stávající `@OnEvent('chat.message.deleted')` reaguje na
  jiný název, než global-chat emituje. Přidat handler pro
  `chat.global.message.deleted` (případně sjednotit), který smaže Cloudinary
  assety z payloadu.

## Whisper (§3 brainstormingu)

Přílohy fungují u whisperů. Upload je vždy REST (`POST /global-chat/upload`);
výsledné `ChatAttachment[]` se u whisperu předají ve WS `ikaros:whisper`
payloadu. `visibleTo` omezuje viditelnost zprávy i jejích příloh.

## Mimo scope

- Video a audio přílohy.
- Drag & drop a vložení ze schránky (Ctrl+V) — možné rozšíření později.
- Progress bar per soubor (jen souhrnný stav „nahrávám").
- Náhled obsahu dokumentu (PDF viewer) — dokument se jen stáhne/otevře.
- Galerie / perzistentní úložiště — přílohy sdílí TTL 1 h se zprávou.

## Responsive

- ChatInput náhledová lišta: vodorovný scroll na mobilu, „×" dosažitelné palcem.
- Obrázková mřížka v MessageItem: 2 sloupce ≤ 768px, až 3 na desktopu.
- Tlačítko přílohy: dotyková plocha ≥ 40 px.
- `Lightbox` je už responzivní (3.3).
- Po implementaci ověřit skillem `mobil-desktop`.

## Design

Vizuál navazuje na stávající chat komponenty (`MessageItem`, `ChatInput`,
reaction chips 4.3a) a galerii (`Lightbox`, `cloudinaryThumb`) — žádný nový
designový jazyk, jen konzistentní rozšíření. Není-li to dostatečné, lze před
impl. plánem spustit `frontend-design` audit.

## Testy

- BE: `uploadGlobalChatFile` odmítne video / nadlimitní soubor; `sendMessage`
  s validní Cloudinary přílohou projde, s cizí `url` / přespočetnou přílohou
  → `BadRequestException`; zpráva jen s přílohou (prázdný `content`) projde;
  whisper s přílohou respektuje `visibleTo`; prune job a `deleteMessage`
  spustí Cloudinary cleanup.
- FE: typy sjednoceny; `ChatInput` výběr / validace / odebrání / náhled /
  upload-on-send; `MessageItem` obrázková mřížka + dokument chip; smazaná
  zpráva bez příloh; `useUploadAttachment`.

## Stav

- [x] Schváleno (2026-05-17)
- [x] Implementováno (2026-05-17). BE testy 81/81 (global-chat + upload),
  FE testy 678/678, typecheck + build + lint:colors čisté.
- Odchylka od §4: galerijní `Lightbox` je pevně svázaný s galerií (rating,
  kategorie, `IkarosGalleryItem`) — nešel sdílet. Místo přesunu vznikl nový
  generický `ImageLightbox` v `shared/ui` (klávesy, swipe, counter).
  `cloudinaryThumb` přesunut do `shared/lib/cloudinary.ts`.
- Theme-independent tokeny lightboxu (`--lightbox-*`) přidány do
  `themes/_shared/tokens.css` (vzor jako `--tombstone-band`).
