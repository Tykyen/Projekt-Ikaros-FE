import { describe, it, expect } from 'vitest';
import { cloudinaryThumb } from './cloudinary';

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
  it('zachová celý obraz v režimu fit', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';
    expect(cloudinaryThumb(url, 400, undefined, 'fit')).toContain('c_fit');
  });
  it('vrátí URL beze změny pokud není Cloudinary', () => {
    expect(cloudinaryThumb('https://example.com/a.jpg', 400)).toBe(
      'https://example.com/a.jpg',
    );
  });
});
