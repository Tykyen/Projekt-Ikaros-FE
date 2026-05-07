import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoginModal } from './LoginModal';
import { loginModalOpenAtom } from '../../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
});

function ModalOpener() {
  const setOpen = useSetAtom(loginModalOpenAtom);
  useEffect(() => {
    setOpen(true);
  }, [setOpen]);
  return <LoginModal />;
}

const meta: Meta<typeof LoginModal> = {
  title: 'Auth/LoginModal',
  component: LoginModal,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof LoginModal>;

/**
 * Modal v idle stavu — pole prázdná, žádná chyba.
 * Pro vizuální kontrolu se přepíná v Storybook globalTypes (theme).
 */
export const Open: Story = {
  render: () => <ModalOpener />,
};
