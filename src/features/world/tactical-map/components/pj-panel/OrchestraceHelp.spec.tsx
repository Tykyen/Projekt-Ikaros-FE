import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrchestraceHelp } from './OrchestraceHelp';

describe('OrchestraceHelp', () => {
  it('vždy ukáže slovníček i rychlý start', () => {
    render(<OrchestraceHelp canManageScenes />);
    expect(screen.getByText('Slovníček')).toBeInTheDocument();
    expect(screen.getByText(/Rychlý start/i)).toBeInTheDocument();
    expect(screen.getByText('Aktivní set')).toBeInTheDocument();
  });

  it('plný PJ (canManageScenes) → bez poznámky „jen plný PJ"', () => {
    render(<OrchestraceHelp canManageScenes />);
    expect(screen.queryByText(/jen plný PJ/i)).not.toBeInTheDocument();
  });

  it('Pomocný PJ (canManageScenes=false) → u tvorby scén poznámka „jen plný PJ"', () => {
    render(<OrchestraceHelp canManageScenes={false} />);
    // Text je rozesetý ve více blocích (StepList + CalloutBox) → matcher přes elementy.
    expect(screen.getAllByText(/jen plný PJ/i).length).toBeGreaterThan(0);
  });
});
