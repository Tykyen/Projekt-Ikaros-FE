import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnonChatGate } from './AnonChatGate';

const startSession = vi.fn().mockResolvedValue(undefined);
vi.mock('../api/useAnonSession', () => ({
  useAnonSession: () => ({ startSession, isPending: false, isError: false }),
}));

describe('AnonChatGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('po captcha → tlačítko enabled, klik volá startSession s tokenem', () => {
    // setup.ts mockuje Turnstile tak, že hned emituje 'test-captcha-token'
    // přes onSuccess → captchaToken se nastaví → tlačítko se odemkne.
    render(<AnonChatGate />);
    const btn = screen.getByRole('button', { name: /vstoupit jako host/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(startSession).toHaveBeenCalledWith('test-captcha-token');
  });
});
