import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterModal } from './RegisterModal';
import { registerModalOpenAtom } from '../../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
});

function ModalOpener() {
  const setOpen = useSetAtom(registerModalOpenAtom);
  useEffect(() => {
    setOpen(true);
  }, [setOpen]);
  return <RegisterModal />;
}

const meta: Meta<typeof RegisterModal> = {
  title: 'Auth/RegisterModal',
  component: RegisterModal,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div
            style={{
              minHeight: '100vh',
              background: 'var(--bg-primary)',
              padding: '2rem',
            }}
          >
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RegisterModal>;

/**
 * Modal v idle stavu — pole prázdná, žádná chyba.
 * Theme se přepíná přes Storybook globalTypes.
 */
export const Open: Story = {
  render: () => <ModalOpener />,
};
