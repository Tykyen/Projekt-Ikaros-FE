# Plán 3.3x — TipTap Image extension pro `<RichTextEditor>`

**Spec:** [spec-3.3.md](spec-3.3.md) §10 · **Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)

Vkládání obrázků do sdíleného `<RichTextEditor>`. Prospěje **článkům** (autor vloží obrázek do textu) a **novinkám**. Galerie RTE nepoužívá (popis = plain textarea) — spec §10 zmínka „galerijní editor" je nepřesná.

## Problém k vyřešení
`POST /upload/image` je Admin/Superadmin-only. Autor článku je hráč → potřebuje upload endpoint bez admin gate.

## Kroky

### BE
1. `upload.service.ts` — `uploadContentImage(file)` → `uploadImageToFolder(file, 'content')`.
2. `upload.controller.ts` — `POST /upload/content-image`, `JwtAuthGuard`, **bez** admin gate, `image/*` max 10 MB. Vrací `{ url, publicId, width, height }`.
3. Test — `upload.service.spec.ts` + controller (role gating: hráč smí).

### FE
4. `extensions.ts` — `getExtensions` přijme `opts.enableImage`; když true přidá `Image.configure({ inline: false, allowBase64: false })`.
5. `RichTextEditor.tsx` — prop `enableImage?: boolean`; předá do `getExtensions`; když true zobrazí toolbar nad editorem.
6. Nový `RTEToolbar.tsx` — tlačítko „Vložit obrázek": file picker → upload → `editor.chain().focus().setImage({ src }).run()`. Loading stav, validace velikosti.
7. `useUploadContentImage.ts` — mutace `POST /upload/content-image`.
8. CSS — `img` v `RichTextEditor.module.css` (responsivní `max-width:100%`, radius).
9. Napojení — `ArticleEditorPage` předá `enableImage` do `<RichTextEditor>`.
10. Testy — extensions s/bez image, RTEToolbar smoke.

## Mimo rozsah
Drag&drop a paste obrázku → budoucí vylepšení (dluh). 3.3x dělá jen explicitní tlačítko.
