import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

/**
 * 17.8 / D-17.8-A11Y-BACKLOG — primitiv uvězňující fokus musí mít test (bez něj
 * je regrese neviditelná). Kryje kontrakt: fokus dovnitř (form field > první
 * focusable > kontejner), Tab/Shift+Tab cyklus, návrat fokusu, Escape jako no-op.
 */

function makeContainer(html: string): HTMLElement {
  const el = document.createElement('div');
  el.tabIndex = -1; // fallback focus target dle kontraktu hooku
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

function tab(shiftKey = false): KeyboardEvent {
  const e = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    cancelable: true,
    bubbles: true,
  });
  document.dispatchEvent(e);
  return e;
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('active=false → fokus se nikam nepřesune', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const container = makeContainer('<button id="a">A</button>');
    renderHook(() =>
      useFocusTrap({ active: false, containerRef: { current: container } }),
    );

    expect(document.activeElement).toBe(outside);
  });

  it('active → fokus na první focusable prvek', () => {
    const container = makeContainer(
      '<button id="a">A</button><button id="b">B</button>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );

    expect(document.activeElement).toBe(container.querySelector('#a'));
  });

  it('active → form field má přednost před dřívějším tlačítkem', () => {
    const container = makeContainer(
      '<button id="a">A</button><input id="field" />',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );

    expect(document.activeElement).toBe(container.querySelector('#field'));
  });

  it('active bez focusable prvku → fokus na kontejner (tabIndex=-1 fallback)', () => {
    const container = makeContainer('<span>jen text</span>');
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );

    expect(document.activeElement).toBe(container);
  });

  it('Tab na posledním prvku → cyklí na první (preventDefault)', () => {
    const container = makeContainer(
      '<button id="a">A</button><button id="b">B</button><button id="c">C</button>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const last = container.querySelector<HTMLElement>('#c')!;
    const first = container.querySelector<HTMLElement>('#a')!;
    last.focus();

    const e = tab();

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab na prvním prvku → cyklí na poslední (preventDefault)', () => {
    const container = makeContainer(
      '<button id="a">A</button><button id="b">B</button><button id="c">C</button>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const first = container.querySelector<HTMLElement>('#a')!;
    const last = container.querySelector<HTMLElement>('#c')!;
    first.focus();

    const e = tab(true);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('Tab uprostřed → hook nezasahuje (native chování)', () => {
    const container = makeContainer(
      '<button id="a">A</button><button id="b">B</button><button id="c">C</button>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const mid = container.querySelector<HTMLElement>('#b')!;
    mid.focus();

    const e = tab();

    expect(e.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(mid);
  });

  it('prázdný kontejner → Tab je preventDefault (nekam uniknout)', () => {
    const container = makeContainer('<span>jen text</span>');
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );

    const e = tab();

    expect(e.defaultPrevented).toBe(true);
  });

  it('Escape ZÁMĚRNĚ neřeší → no-op, fokus zůstává', () => {
    const container = makeContainer('<button id="a">A</button>');
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const first = container.querySelector<HTMLElement>('#a')!;

    const e = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
      bubbles: true,
    });
    document.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it('deaktivace (active true→false) → vrátí fokus na původní prvek', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const container = makeContainer('<button id="a">A</button>');
    const { rerender } = renderHook(
      ({ active }) =>
        useFocusTrap({ active, containerRef: { current: container } }),
      { initialProps: { active: true } },
    );
    // fokus se přesunul dovnitř
    expect(document.activeElement).toBe(container.querySelector('#a'));

    rerender({ active: false });

    expect(document.activeElement).toBe(outside);
  });

  it('unmount → vrátí fokus na původní prvek', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const container = makeContainer('<button id="a">A</button>');
    const { unmount } = renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    expect(document.activeElement).toBe(container.querySelector('#a'));

    unmount();

    expect(document.activeElement).toBe(outside);
  });

  it('původní prvek zmizel z DOM → návrat fokusu se přeskočí (bez chyby)', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const container = makeContainer('<button id="a">A</button>');
    const { unmount } = renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const inner = container.querySelector<HTMLElement>('#a')!;
    expect(document.activeElement).toBe(inner);

    outside.remove(); // původní prvek pryč

    expect(() => unmount()).not.toThrow();
    // fokus zůstal uvnitř (návrat se korektně přeskočil)
    expect(document.activeElement).not.toBe(outside);
  });

  it('contenteditable (rich-text editor) je součástí trap cyklu', () => {
    const container = makeContainer(
      '<button id="a">A</button><div id="ed" contenteditable="true">text</div>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    const first = container.querySelector<HTMLElement>('#a')!;
    const editor = container.querySelector<HTMLElement>('#ed')!;
    // editor je poslední focusable → Tab z něj cyklí zpět na první
    editor.focus();

    const e = tab();

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('contenteditable="false" (read-only editor) je z trap cyklu vyřazený', () => {
    const container = makeContainer(
      '<div id="ro" contenteditable="false">read only</div><button id="a">A</button>',
    );
    renderHook(() =>
      useFocusTrap({ active: true, containerRef: { current: container } }),
    );
    // read-only editor se přeskočí → initial focus jde na tlačítko
    expect(document.activeElement).toBe(container.querySelector('#a'));
  });
});
