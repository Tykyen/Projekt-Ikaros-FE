import { describe, it, expect } from 'vitest';
import {
  articleJsonLd,
  galleryJsonLd,
  worldJsonLd,
  breadcrumbJsonLd,
  siteJsonLd,
  firstImageSrc,
  absoluteUrl,
  serializeJsonLd,
} from './jsonLd';
import type { IkarosArticle, IkarosGalleryItem, World } from '@/shared/types';

const ORIGIN = 'https://www.projekt-ikaros.com';

const article: IkarosArticle = {
  id: 'a1',
  title: 'Příběh světa',
  content: '<p>Dlouhý text</p><img src="/uploads/x.jpg" alt="">',
  category: 'lore',
  authorId: 'u1',
  authorName: 'Tyky',
  status: 'Published',
  ratings: [],
  averageRating: 0,
  createdAtUtc: '2026-01-01T00:00:00Z',
  updatedAtUtc: '2026-02-01T00:00:00Z',
  publishedAtUtc: '2026-01-15T00:00:00Z',
};

const gallery: IkarosGalleryItem = {
  id: 'g1',
  title: 'Krajina',
  description: 'Malba hor',
  imageUrl: 'https://cdn.example/abc.jpg',
  publicId: 'abc',
  width: 1200,
  height: 800,
  category: 'art',
  authorId: 'u1',
  authorName: 'Tyky',
  status: 'Published',
  ratings: [],
  averageRating: 0,
  createdAtUtc: '2026-01-01T00:00:00Z',
  updatedAtUtc: '2026-02-01T00:00:00Z',
  publishedAtUtc: '2026-01-15T00:00:00Z',
};

const world: World = {
  id: 'w1',
  name: 'Aetheria',
  slug: 'aetheria',
  description: 'Svět létajících ostrovů',
  imageUrl: '/uploads/hero.png',
  ownerId: 'u1',
  isActive: true,
  accessMode: 'public',
  playerCount: 3,
  system: 'drd',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  owner: { id: 'u1', username: 'Tyky' },
} as World;

describe('absoluteUrl', () => {
  it('relativní → origin + path', () => {
    expect(absoluteUrl(ORIGIN, '/svet/x')).toBe(`${ORIGIN}/svet/x`);
    expect(absoluteUrl(ORIGIN, 'svet/x')).toBe(`${ORIGIN}/svet/x`);
  });
  it('absolutní URL nechá být', () => {
    expect(absoluteUrl(ORIGIN, 'https://cdn/x.jpg')).toBe('https://cdn/x.jpg');
  });
});

describe('firstImageSrc', () => {
  it('vytáhne 1. img a absolutizuje', () => {
    expect(firstImageSrc('<img src="/a.jpg"><img src="/b.jpg">', ORIGIN)).toBe(
      `${ORIGIN}/a.jpg`,
    );
  });
  it('bez obrázku → undefined', () => {
    expect(firstImageSrc('<p>text</p>', ORIGIN)).toBeUndefined();
    expect(firstImageSrc('', ORIGIN)).toBeUndefined();
  });
});

describe('articleJsonLd', () => {
  it('Article s autorem, daty a obrázkem z contentu', () => {
    const n = articleJsonLd(article, ORIGIN);
    expect(n['@type']).toBe('Article');
    expect(n.headline).toBe('Příběh světa');
    expect(n.image).toEqual([`${ORIGIN}/uploads/x.jpg`]);
    expect(n.datePublished).toBe('2026-01-15T00:00:00Z');
    expect(n.dateModified).toBe('2026-02-01T00:00:00Z');
    expect((n.author as Record<string, string>).name).toBe('Tyky');
    expect(n.mainEntityOfPage).toBe(`${ORIGIN}/ikaros/clanky/a1`);
  });

  it('bez obrázku v contentu → brand logo fallback', () => {
    const n = articleJsonLd({ ...article, content: '<p>jen text</p>' }, ORIGIN);
    expect(n.image).toEqual([`${ORIGIN}/icons/icon-512.png`]);
  });

  it('smazaný autor → „Smazaný účet" (parita s rendererem D-040)', () => {
    const n = articleJsonLd({ ...article, authorIsDeleted: true }, ORIGIN);
    expect((n.author as Record<string, string>).name).toBe('Smazaný účet');
  });

  it('chybějící publishedAt → fallback createdAt', () => {
    const n = articleJsonLd({ ...article, publishedAtUtc: undefined }, ORIGIN);
    expect(n.datePublished).toBe('2026-01-01T00:00:00Z');
  });
});

describe('galleryJsonLd', () => {
  it('ImageObject s rozměry a contentUrl', () => {
    const n = galleryJsonLd(gallery, ORIGIN);
    expect(n['@type']).toBe('ImageObject');
    expect(n.contentUrl).toBe('https://cdn.example/abc.jpg');
    expect(n.width).toBe(1200);
    expect(n.height).toBe(800);
  });
  it('bez popisu → klíč description vynechán', () => {
    const n = galleryJsonLd({ ...gallery, description: undefined }, ORIGIN);
    expect('description' in n).toBe(false);
  });
});

describe('worldJsonLd', () => {
  it('CreativeWork s creatorem, obrázkem a URL', () => {
    const n = worldJsonLd(world, ORIGIN);
    expect(n['@type']).toBe('CreativeWork');
    expect(n.url).toBe(`${ORIGIN}/svet/aetheria`);
    expect(n.image).toBe(`${ORIGIN}/uploads/hero.png`);
    expect((n.creator as Record<string, string>).name).toBe('Tyky');
  });
  it('bez owner/genre/image → volitelné klíče vynechány', () => {
    const n = worldJsonLd(
      { ...world, owner: undefined, genre: undefined, imageUrl: undefined } as World,
      ORIGIN,
    );
    expect('creator' in n).toBe(false);
    expect('genre' in n).toBe(false);
    expect('image' in n).toBe(false);
  });
});

describe('breadcrumbJsonLd', () => {
  it('ListItem s pozicemi; poslední bez item', () => {
    const n = breadcrumbJsonLd(
      [
        { label: 'Domů', href: '/' },
        { label: 'Články', href: '/ikaros/clanky' },
        { label: 'Příběh' },
      ],
      ORIGIN,
    );
    const items = n.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[0].item).toBe(`${ORIGIN}/`);
    expect(items[2].position).toBe(3);
    expect('item' in items[2]).toBe(false);
  });
});

describe('siteJsonLd', () => {
  it('WebSite + Organization', () => {
    const [site, org] = siteJsonLd(ORIGIN);
    expect(site['@type']).toBe('WebSite');
    expect(org['@type']).toBe('Organization');
    expect(org.logo).toBe(`${ORIGIN}/icons/icon-512.png`);
  });
});

describe('serializeJsonLd', () => {
  it('escapuje < proti </script> breakoutu', () => {
    const out = serializeJsonLd({ name: 'zlý </script><script>alert(1)' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c');
  });
});
