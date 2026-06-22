import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShowcaseSection } from '../ShowcaseSection';
import { SHOWCASE_SLIDES } from '../showcaseSlides';

// Spec 15.7 — rotující showcase banner. matchMedia v jsdom chybí → komponenta
// přes `?.` spadne na reduced=false (autorotace povolená, ale 5s interval se
// v testech nečeká). Ovládání (tečky/šipky) testujeme přímo.

describe('ShowcaseSection (15.7)', () => {
  it('vyrenderuje všechny slidy (captiony v DOM, i neaktivní)', () => {
    render(<ShowcaseSection />);
    for (const slide of SHOWCASE_SLIDES) {
      expect(screen.getByText(slide.caption)).toBeInTheDocument();
    }
  });

  it('má šipky a tečku pro každý slide', () => {
    render(<ShowcaseSection />);
    expect(screen.getByLabelText('Předchozí ukázka')).toBeInTheDocument();
    expect(screen.getByLabelText('Další ukázka')).toBeInTheDocument();
    SHOWCASE_SLIDES.forEach((slide, i) => {
      expect(
        screen.getByLabelText(`Ukázka ${i + 1}: ${slide.caption}`),
      ).toBeInTheDocument();
    });
  });

  it('první slide je aktivní (aria-current), druhý ne', () => {
    render(<ShowcaseSection />);
    expect(
      screen.getByLabelText(`Ukázka 1: ${SHOWCASE_SLIDES[0].caption}`),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByLabelText(`Ukázka 2: ${SHOWCASE_SLIDES[1].caption}`),
    ).toHaveAttribute('aria-current', 'false');
  });

  it('klik na tečku přepne aktivní slide', () => {
    render(<ShowcaseSection />);
    const third = screen.getByLabelText(`Ukázka 3: ${SHOWCASE_SLIDES[2].caption}`);
    fireEvent.click(third);
    expect(third).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByLabelText(`Ukázka 1: ${SHOWCASE_SLIDES[0].caption}`),
    ).toHaveAttribute('aria-current', 'false');
  });

  it('šipka „Další" posune na druhý slide, „Předchozí" z prvního na poslední (wrap)', () => {
    render(<ShowcaseSection />);
    fireEvent.click(screen.getByLabelText('Další ukázka'));
    expect(
      screen.getByLabelText(`Ukázka 2: ${SHOWCASE_SLIDES[1].caption}`),
    ).toHaveAttribute('aria-current', 'true');

    fireEvent.click(screen.getByLabelText('Předchozí ukázka'));
    expect(
      screen.getByLabelText(`Ukázka 1: ${SHOWCASE_SLIDES[0].caption}`),
    ).toHaveAttribute('aria-current', 'true');

    const last = SHOWCASE_SLIDES.length;
    fireEvent.click(screen.getByLabelText('Předchozí ukázka'));
    expect(
      screen.getByLabelText(
        `Ukázka ${last}: ${SHOWCASE_SLIDES[last - 1].caption}`,
      ),
    ).toHaveAttribute('aria-current', 'true');
  });
});
