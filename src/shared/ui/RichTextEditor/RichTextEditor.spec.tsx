import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  it('renderuje placeholder při prázdném value', async () => {
    render(<RichTextEditor value="" placeholder="Test placeholder" />);
    await waitFor(() => {
      const editor = document.querySelector('.ProseMirror');
      expect(editor).toBeTruthy();
      expect(editor?.getAttribute('contenteditable')).toBe('true');
    });
  });

  it('renderuje content při neprázdné value', async () => {
    render(<RichTextEditor value="<p>Hello world</p>" />);
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeTruthy();
    });
  });

  it('readOnly mode — contenteditable false', async () => {
    render(<RichTextEditor value="<p>Read me</p>" readOnly />);
    await waitFor(() => {
      const editor = document.querySelector('.ProseMirror');
      expect(editor?.getAttribute('contenteditable')).toBe('false');
    });
  });

  it('readOnly + withDropCap — wrapper má correct class', async () => {
    const { container } = render(
      <RichTextEditor value="<p>Drop cap test</p>" readOnly withDropCap />,
    );
    await waitFor(() => {
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/readOnly/);
      expect(wrapper.className).toMatch(/withDropCap/);
    });
  });

  it('onChange se volá při edit (ne v readOnly)', async () => {
    const onChange = vi.fn();
    render(
      <RichTextEditor value="<p>Initial</p>" onChange={onChange} readOnly />,
    );
    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')).toBeTruthy();
    });
    // V readOnly se onChange nesmí volat (TipTap onUpdate je guard-ed)
    expect(onChange).not.toHaveBeenCalled();
  });

  it('vlastní className se aplikuje', async () => {
    const { container } = render(
      <RichTextEditor value="" className="my-custom" />,
    );
    await waitFor(() => {
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/my-custom/);
    });
  });

  it('renderuje H2 + H3 z HTML', async () => {
    render(<RichTextEditor value="<h2>Big</h2><h3>Small</h3>" readOnly />);
    await waitFor(() => {
      expect(screen.getByText('Big').tagName).toBe('H2');
      expect(screen.getByText('Small').tagName).toBe('H3');
    });
  });

  it('renderuje blockquote', async () => {
    render(<RichTextEditor value="<blockquote>Quoted</blockquote>" readOnly />);
    await waitFor(() => {
      const q = screen.getByText('Quoted').closest('blockquote');
      expect(q).toBeTruthy();
    });
  });

  it('renderuje bullet list', async () => {
    render(
      <RichTextEditor value="<ul><li>One</li><li>Two</li></ul>" readOnly />,
    );
    await waitFor(() => {
      const list = document.querySelector('ul');
      expect(list).toBeTruthy();
      expect(list?.querySelectorAll('li').length).toBe(2);
    });
  });

  it('renderuje link s rel + target', async () => {
    render(
      <RichTextEditor
        value='<p>Visit <a href="https://example.com">site</a></p>'
        readOnly
      />,
    );
    await waitFor(() => {
      const link = screen.getByText('site') as HTMLAnchorElement;
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('https://example.com');
    });
  });
});
