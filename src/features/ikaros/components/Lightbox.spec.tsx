import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Lightbox } from './Lightbox';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';

const categories: GalleryCategory[] = [
  { key: 'fanart', label: 'Fanart', color: '#f06292', order: 0 },
];

function makeImage(id: string): IkarosGalleryItem {
  return {
    id,
    title: `Obrázek ${id}`,
    imageUrl: `https://res.cloudinary.com/demo/image/upload/v1/${id}.jpg`,
    publicId: id,
    width: 800,
    height: 600,
    category: 'fanart',
    authorId: 'u1',
    authorName: 'Autor',
    status: 'Published',
    ratings: [],
    averageRating: 0,
    createdAtUtc: '2026-05-10T00:00:00Z',
    updatedAtUtc: '2026-05-10T00:00:00Z',
  };
}

const images = [makeImage('a'), makeImage('b'), makeImage('c')];

let qc: QueryClient;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
}

describe('Lightbox', () => {
  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it('zobrazí aktuální obrázek', () => {
    render(
      <Lightbox
        images={images}
        index={0}
        categories={categories}
        onClose={vi.fn()}
        onIndexChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Obrázek a')).toBeTruthy();
  });

  it('Escape volá onClose', () => {
    const onClose = vi.fn();
    render(
      <Lightbox
        images={images}
        index={0}
        categories={categories}
        onClose={onClose}
        onIndexChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ArrowRight přejde na další (wrap-around z konce)', () => {
    const onIndexChange = vi.fn();
    render(
      <Lightbox
        images={images}
        index={2}
        categories={categories}
        onClose={vi.fn()}
        onIndexChange={onIndexChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('ArrowLeft přejde na předchozí (wrap-around z 0)', () => {
    const onIndexChange = vi.fn();
    render(
      <Lightbox
        images={images}
        index={0}
        categories={categories}
        onClose={vi.fn()}
        onIndexChange={onIndexChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it('klik na overlay zavře', () => {
    const onClose = vi.fn();
    render(
      <Lightbox
        images={images}
        index={0}
        categories={categories}
        onClose={onClose}
        onIndexChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });
});
