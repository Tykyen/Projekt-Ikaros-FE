import { describe, it, expect } from 'vitest';
import {
  cloudinaryThumb,
  aspectRatio,
  categoryByKey,
  filterImages,
  statusLabel,
} from './gallery';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';

const categories: GalleryCategory[] = [
  { key: 'fanart', label: 'Fanart', color: '#f06292', order: 0 },
  { key: 'ostatni', label: 'Ostatní', color: '#8b98a5', order: 4 },
];

function makeImage(o: Partial<IkarosGalleryItem> = {}): IkarosGalleryItem {
  return {
    id: 'g1',
    title: 'Obrázek',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/gallery/a.jpg',
    publicId: 'gallery/a',
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
    ...o,
  };
}

describe('cloudinaryThumb', () => {
  it('vloží transformace za /upload/', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';
    expect(cloudinaryThumb(url, 400)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_400,c_fill,q_auto,f_auto/v1/a.jpg',
    );
  });
  it('přidá height když zadaná', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';
    expect(cloudinaryThumb(url, 400, 300)).toContain('w_400,h_300,c_fill');
  });
  it('vrátí URL beze změny pokud není Cloudinary', () => {
    expect(cloudinaryThumb('https://example.com/a.jpg', 400)).toBe(
      'https://example.com/a.jpg',
    );
  });
});

describe('aspectRatio', () => {
  it('počítá poměr z rozměrů', () => {
    expect(aspectRatio({ width: 800, height: 400 })).toBe(2);
  });
  it('fallback 1:1 u nulových rozměrů', () => {
    expect(aspectRatio({ width: 0, height: 0 })).toBe(1);
  });
});

describe('categoryByKey', () => {
  it('najde kategorii', () => {
    expect(categoryByKey(categories, 'fanart').label).toBe('Fanart');
  });
  it('fallback na ostatni', () => {
    expect(categoryByKey(categories, 'neznama').key).toBe('ostatni');
  });
});

describe('statusLabel', () => {
  it('mapuje statusy', () => {
    expect(statusLabel('Pending')).toBe('Čeká na schválení');
    expect(statusLabel('Published')).toBe('Publikováno');
  });
});

describe('filterImages', () => {
  const images = [
    makeImage({ id: 'a', title: 'Drak', category: 'fanart', averageRating: 5, ratings: [{ userId: 'x', stars: 5 }] }),
    makeImage({ id: 'b', title: 'Mapa', category: 'ostatni', averageRating: 2 }),
    makeImage({ id: 'c', title: 'Koncept', status: 'Draft' }),
  ];

  it('vrací jen Published', () => {
    const r = filterImages(images, '', new Set(), 'new');
    expect(r.every((i) => i.status === 'Published')).toBe(true);
    expect(r).toHaveLength(2);
  });

  it('filtruje podle hledání', () => {
    const r = filterImages(images, 'drak', new Set(), 'new');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('a');
  });

  it('filtruje podle kategorie', () => {
    const r = filterImages(images, '', new Set(['ostatni']), 'new');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('b');
  });

  it('řadí podle hodnocení (top)', () => {
    const r = filterImages(images, '', new Set(), 'top');
    expect(r[0].id).toBe('a');
  });
});
