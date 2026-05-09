import { atom } from 'jotai';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const socketStatusAtom = atom<SocketStatus>('disconnected');
