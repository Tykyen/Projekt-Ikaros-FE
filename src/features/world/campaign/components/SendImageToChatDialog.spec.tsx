import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SendImageToChatDialog } from './SendImageToChatDialog';

const { sendMutate } = vi.hoisted(() => ({ sendMutate: vi.fn() }));

vi.mock('@/features/world/chat/api/useWorldChat', () => ({
  useChatGroups: () => ({
    data: [
      {
        group: { id: 'g1', name: 'Obecné' },
        channels: [{ id: 'c1', name: 'Hlavní' }],
      },
    ],
  }),
  useSendMessage: () => ({ mutate: sendMutate, isPending: false }),
  useScheduleMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('SendImageToChatDialog', () => {
  it('odešle obrázek jako přílohu do zvoleného kanálu', () => {
    sendMutate.mockClear();
    render(
      <SendImageToChatDialog
        worldId="w"
        imageUrl="https://cdn/x/mapa.png"
        onClose={() => {}}
      />,
    );

    // Před výběrem kanálu je odeslání zakázané.
    const sendBtn = screen.getByRole('button', { name: 'Poslat' });
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'c1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Poslat' }));

    expect(sendMutate).toHaveBeenCalledTimes(1);
    const payload = sendMutate.mock.calls[0][0];
    expect(payload.attachments[0]).toMatchObject({
      url: 'https://cdn/x/mapa.png',
      type: 'image',
      mimeType: 'image/png',
    });
  });

  it('imageUrl null → modal zavřený (nic se nevykreslí)', () => {
    render(
      <SendImageToChatDialog worldId="w" imageUrl={null} onClose={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: 'Poslat' })).toBeNull();
  });
});
