import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageAttachments } from './MessageAttachments';
import type { ChatAttachment } from '../lib/types';

const img = (id: string): ChatAttachment => ({
  url: `https://res.cloudinary.com/c/image/upload/global-chat/hospoda/${id}.png`,
  publicId: `global-chat/hospoda/${id}`,
  type: 'image',
  mimeType: 'image/png',
  filename: `${id}.png`,
  size: 1000,
});

const doc: ChatAttachment = {
  url: 'https://res.cloudinary.com/c/raw/upload/global-chat/hospoda/d.pdf',
  publicId: 'global-chat/hospoda/d',
  type: 'document',
  mimeType: 'application/pdf',
  filename: 'navod.pdf',
  size: 2048,
};

describe('MessageAttachments', () => {
  it('vykreslí mřížku obrázků', () => {
    render(<MessageAttachments attachments={[img('a'), img('b')]} />);
    expect(screen.getByAltText('a.png')).toBeInTheDocument();
    expect(screen.getByAltText('b.png')).toBeInTheDocument();
  });

  it('klik na obrázek otevře lightbox', () => {
    render(<MessageAttachments attachments={[img('a')]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Zobrazit obrázek a.png'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dokument vykreslí jako chip s názvem, velikostí a odkazem', () => {
    render(<MessageAttachments attachments={[doc]} />);
    expect(screen.getByText('navod.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 kB')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', doc.url);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
