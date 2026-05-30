import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapToolDock } from './MapToolDock';

beforeEach(() => localStorage.clear());

describe('MapToolDock', () => {
  it('rozbalený zobrazí obsah sekcí', () => {
    render(
      <MapToolDock title="🎨 Efekty" storageKey="test">
        <div>sekce-efekty</div>
        <div>sekce-zoom</div>
      </MapToolDock>,
    );
    expect(screen.getByText('sekce-efekty')).toBeInTheDocument();
    expect(screen.getByText('sekce-zoom')).toBeInTheDocument();
  });

  it('klik na hlavičku sbalí obsah (zůstane jen úchyt)', () => {
    render(
      <MapToolDock title="🎨 Efekty" storageKey="test">
        <div>sekce-efekty</div>
      </MapToolDock>,
    );
    fireEvent.click(screen.getByTitle('Sbalit nástroje'));
    expect(screen.queryByText('sekce-efekty')).not.toBeInTheDocument();
    expect(screen.getByTitle('Rozbalit nástroje')).toBeInTheDocument();
  });

  it('sbalený stav persistuje v localStorage', () => {
    const { unmount } = render(
      <MapToolDock title="🎨 Efekty" storageKey="test">
        <div>obsah</div>
      </MapToolDock>,
    );
    fireEvent.click(screen.getByTitle('Sbalit nástroje'));
    unmount();
    render(
      <MapToolDock title="🎨 Efekty" storageKey="test">
        <div>obsah</div>
      </MapToolDock>,
    );
    // Po remountu zůstává sbalený (čte z LS)
    expect(screen.queryByText('obsah')).not.toBeInTheDocument();
  });
});
