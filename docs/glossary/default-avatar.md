---
name: default-avatar
aliases: [defaultní avatar, fallback avatar]
category: ui
related: []
status: draft
---

# Default avatar

**TL;DR:** Jeden ze tří fallback avatarů (muž / žena / bytost), který se použije, když uživatel nenahraje vlastní.

## Detail

Uživatel si v profilu vybere jeden ze tří defaultních setů — slouží jako vizuální identita, dokud nenahraje vlastní avatar přes AvatarUploader.

Defaultní avatar má svůj soubor v assetech a renderuje se přes [UserAvatar](../../src/shared/ui/UserAvatar/UserAvatar.tsx).

## Kde se objevuje

- v kódu (FE):
  - [src/shared/ui/UserAvatar/UserAvatar.tsx](../../src/shared/ui/UserAvatar/UserAvatar.tsx)
  - [src/features/profile/components/AvatarUploader/AvatarUploader.tsx](../../src/features/profile/components/AvatarUploader/AvatarUploader.tsx)
- v dokumentaci:
  - HelpPage AccountSection
- v UI:
  - Profil → Avatar (výběr default setu / upload vlastního)

## Nepleť s

- **vlastní avatar** — nahraný obrázek; default je fallback.
