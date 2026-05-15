import { BubbleMenu as TipTapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  Link2,
} from 'lucide-react';
import s from './BubbleMenu.module.css';

interface Props {
  editor: Editor;
}

/**
 * 3.2b — bubble menu nad textovou selekcí. 7 tlačítek (B, I, H2, H3, „",
 * •, link). Žádný top toolbar — Medium-like clean writing experience.
 */
export function RTEBubbleMenu({ editor }: Props) {
  return (
    <TipTapBubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      className={s.menu}
    >
      <Button
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={<Bold size={14} />}
        title="Tučně (⌘B)"
      />
      <Button
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={<Italic size={14} />}
        title="Kurzíva (⌘I)"
      />
      <Button
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={<Heading2 size={14} />}
        title="Nadpis 2"
      />
      <Button
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={<Heading3 size={14} />}
        title="Nadpis 3"
      />
      <Button
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={<Quote size={14} />}
        title="Citát"
      />
      <Button
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={<List size={14} />}
        title="Odrážky"
      />
      <Button
        active={editor.isActive('link')}
        onClick={() => promptLink(editor)}
        icon={<Link2 size={14} />}
        title="Odkaz (⌘K)"
      />
    </TipTapBubbleMenu>
  );
}

function promptLink(editor: Editor): void {
  const prev = (editor.getAttributes('link').href as string | undefined) ?? '';
  const url = window.prompt('URL odkazu:', prev);
  if (url === null) return; // cancel
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run();
}

interface ButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

function Button({ active, onClick, icon, title }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? s.btnActive : s.btn}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
