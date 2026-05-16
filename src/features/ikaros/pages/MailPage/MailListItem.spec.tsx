import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MailListItem } from './MailListItem';
import type { IkarosMessage } from '@/shared/types';

const msg: IkarosMessage = {
  id: 'm1',
  senderId: 's1',
  senderName: 'Alice',
  recipientId: 'r1',
  recipientName: 'Bob',
  subject: 'Pozvánka na sezení',
  body: 'text',
  sentAtUtc: '2026-05-15T10:00:00Z',
  isRead: false,
  deletedBySender: false,
  deletedByRecipient: false,
  conversationId: 'm1',
  createdAt: '',
  updatedAt: '',
};

describe('MailListItem', () => {
  it('v Doručených zobrazí jméno odesílatele', () => {
    render(
      <ul>
        <MailListItem
          message={msg}
          folder="dorucene"
          selected={false}
          onClick={() => {}}
        />
      </ul>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Pozvánka na sezení')).toBeInTheDocument();
  });

  it('v Odeslaných zobrazí jméno příjemce', () => {
    render(
      <ul>
        <MailListItem
          message={msg}
          folder="odeslane"
          selected={false}
          onClick={() => {}}
        />
      </ul>,
    );
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('nepřečtená zpráva v Doručených má indikátor', () => {
    render(
      <ul>
        <MailListItem
          message={msg}
          folder="dorucene"
          selected={false}
          onClick={() => {}}
        />
      </ul>,
    );
    expect(screen.getByLabelText('Nepřečteno')).toBeInTheDocument();
  });

  it('přečtená zpráva nemá indikátor', () => {
    render(
      <ul>
        <MailListItem
          message={{ ...msg, isRead: true }}
          folder="dorucene"
          selected={false}
          onClick={() => {}}
        />
      </ul>,
    );
    expect(screen.queryByLabelText('Nepřečteno')).not.toBeInTheDocument();
  });
});
