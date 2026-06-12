import { describe, it, expect } from 'vitest';
import { rankPageSuggestions, MAX_SUGGESTIONS } from '../rankSuggestions';

const item = (title: string, slug: string) => ({ title, slug });

describe('rankPageSuggestions', () => {
  it('prázdný dotaz → původní pořadí, ořez na max', () => {
    const items = Array.from({ length: 40 }, (_, i) => item(`S${i}`, `s${i}`));
    const out = rankPageSuggestions(items, '');
    expect(out).toHaveLength(MAX_SUGGESTIONS);
    expect(out[0]!.slug).toBe('s0');
  });

  it('řadí podle relevance: přesná shoda → začátek názvu → začátek slova → uprostřed', () => {
    const items = [
      item('Britské státní organizace', 'britske-statni-organizace'), // slovo začíná
      item('Reorganizace', 'reorganizace'), // jen uprostřed
      item('Organizace', 'organizace'), // přesná
      item('Organizace odboje', 'organizace-odboje'), // začátek názvu
    ];
    const out = rankPageSuggestions(items, 'organizace').map((x) => x.title);
    expect(out).toEqual([
      'Organizace',
      'Organizace odboje',
      'Britské státní organizace',
      'Reorganizace',
    ]);
  });

  it('akcent-insensitivní (dotaz bez diakritiky najde název s diakritikou)', () => {
    const items = [item('Magické organizace', 'magicke-organizace')];
    expect(rankPageSuggestions(items, 'magicke')).toHaveLength(1);
  });

  it('shoda jen na slugu (ne v názvu) projde s nejnižší prioritou', () => {
    const items = [
      item('Tajný spolek', 'magicke-organizace'),
      item('Magické organizace', 'magicke-organizace-2'),
    ];
    const out = rankPageSuggestions(items, 'magicke').map((x) => x.title);
    expect(out[0]).toBe('Magické organizace'); // shoda v názvu před shodou v slugu
    expect(out).toContain('Tajný spolek');
  });

  it('bez shody → vyřazeno', () => {
    const items = [item('Aralion', 'aralion'), item('Brennor', 'brennor')];
    expect(rankPageSuggestions(items, 'organizace')).toEqual([]);
  });

  it('respektuje vlastní max', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      item(`Organizace ${i}`, `org-${i}`),
    );
    expect(rankPageSuggestions(items, 'organizace', 3)).toHaveLength(3);
  });
});
