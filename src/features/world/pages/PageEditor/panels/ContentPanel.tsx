import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useUploadImage } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { StyleRail } from '../components/StyleRail';
import { useWikilinkExtension } from '../hooks/useWikilinkExtension';
import { useBrokenLinkDecoration } from '../hooks/useBrokenLinkDecoration';
import { slugify } from '../lib/slugify';
import s from './ContentPanel.module.css';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

const MAX_CONTENT = 100_000;

/**
 * 7.2a + 7.2g + 8.2 — Rich-text obsah stránky. Split layout:
 *  • vlevo `RichTextEditor` (image upload, table, wikilink `[[`)
 *  • vpravo `StyleRail` — permanentní toolbar (B/I/U/S/sup/sub/seznamy/
 *    odkaz/barva/blok). Editor instanci dostane přes `onEditorReady`.
 *
 * Bubble menu zůstává — doplňuje rail rychlým formátem v selekci.
 */
export function ContentPanel({ content, onChange }: Props) {
  const { worldId, worldSlug } = useWorldContext();
  const uploadImage = useUploadImage();
  const { data: directory = [] } = usePagesDirectory(worldId);
  const wikilinkExt = useWikilinkExtension(directory);
  // 7.2m — propadlé odkazy v editoru červeně (parita s read mode).
  const brokenLinkExt = useBrokenLinkDecoration(directory, worldSlug);
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <CollapsiblePanel
      title="Textový obsah"
      icon={<Pencil size={18} aria-hidden />}
      defaultOpen
    >
      <div className={s.split}>
        <div className={s.editorCol}>
          <div className={s.editorWrap}>
            <RichTextEditor
              value={content}
              onChange={onChange}
              maxLength={MAX_CONTENT}
              enableTable
              additionalExtensions={[wikilinkExt, brokenLinkExt]}
              onImageUpload={async (file) =>
                (await uploadImage.mutateAsync(file)).url
              }
              onEditorReady={setEditor}
              linkDirectory={directory}
              linkMakeSlug={slugify}
              placeholder="Začni psát obsah stránky… (B/I/H2/H3/seznamy/citace/tabulky, [[ wikilink)"
              className={s.editor}
            />
          </div>
          <p className={s.tip}>
            💡 Napiš <code>[[</code> a vybírej z dropdownu stránek světa.
          </p>
        </div>

        <StyleRail editor={editor} directory={directory} makeSlug={slugify} />
      </div>
    </CollapsiblePanel>
  );
}
