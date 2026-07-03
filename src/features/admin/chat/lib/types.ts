/** 20.5 — konverzace admin chatu (podmnožina BE `ChatChannel`). */
export interface AdminChatChannel {
  id: string;
  name: string;
  /** `staff-main` / `staff-vedeni` = seed (nelze smazat); `staff-custom` = vlastní. */
  type: string;
  accessMode: 'all' | 'roles' | 'members';
  allowedMemberIds: string[];
  lastMessagePreview?: string;
  lastMessageAt?: string;
  order: number;
}

/** Seed konverzace jsou zamčené (nelze smazat, členství = všichni admini). */
export function isSeedChannel(ch: AdminChatChannel): boolean {
  return ch.type === 'staff-main' || ch.type === 'staff-vedeni';
}

/** 20.5 — úkol v panelu „Úkoly týmu" (zrcadlí BE `AdminTask`). */
export interface AdminTask {
  id: string;
  ownerId: string;
  ownerName: string;
  text: string;
  done: boolean;
  order: number;
  createdBy: string;
  createdAt: string;
}

/** 20.5 — sdílený PDF dokument admin chatu (zrcadlí BE `PlatformDocument`). */
export interface PlatformDocument {
  id: string;
  filename: string;
  /** Cloudinary raw URL — přímé čtení (iframe) i stažení. */
  url: string;
  publicId: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}
