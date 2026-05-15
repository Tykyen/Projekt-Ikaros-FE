import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoTOC } from './AutoTOC';
import { extractHeadings } from '../lib/articles';

describe('extractHeadings', () => {
  it('prázdný HTML → []', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('HTML bez nadpisů → []', () => {
    expect(extractHeadings('<p>Jen text</p>')).toEqual([]);
  });

  it('extrahuje H2 + H3 se správným level', () => {
    const html = '<h2>První</h2><p>x</p><h3>Pod</h3><h2>Druhý</h2>';
    const result = extractHeadings(html);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'heading-0', text: 'První', level: 2 });
    expect(result[1]).toEqual({ id: 'heading-1', text: 'Pod', level: 3 });
    expect(result[2]).toEqual({ id: 'heading-2', text: 'Druhý', level: 2 });
  });

  it('ignoruje H1/H4 (jen H2 a H3)', () => {
    const html = '<h1>Velký</h1><h2>OK</h2><h4>Malý</h4>';
    const result = extractHeadings(html);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('OK');
  });
});

describe('AutoTOC', () => {
  it('< 2 nadpisy → nic se nevykreslí', () => {
    const { container } = render(<AutoTOC html="<h2>Jediný</h2>" />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('>= 2 nadpisy → vykreslí seznam', () => {
    render(<AutoTOC html="<h2>První</h2><h2>Druhý</h2><h3>Třetí</h3>" />);
    expect(screen.getAllByText('První').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Druhý').length).toBeGreaterThan(0);
  });

  it('TOC link má href na anchor', () => {
    render(<AutoTOC html="<h2>Alfa</h2><h2>Beta</h2>" />);
    const links = screen.getAllByText('Alfa');
    const anchor = links.find((el) => el.tagName === 'A') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('#heading-0');
  });

  it('klik na link volá scrollIntoView', () => {
    const html = '<h2>Alfa</h2><h2>Beta</h2>';
    // injectneme target do DOM
    const target = document.createElement('div');
    target.id = 'heading-0';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(<AutoTOC html={html} />);
    const links = screen.getAllByText('Alfa');
    const anchor = links.find((el) => el.tagName === 'A') as HTMLAnchorElement;
    anchor.click();
    expect(target.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(target);
  });
});
