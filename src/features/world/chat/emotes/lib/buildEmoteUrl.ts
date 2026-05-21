import { cloudinaryThumb } from '@/shared/lib/cloudinary';

/**
 * Krok 6.4 — staví URL emote obrázku v Cloudinary s transformací do 128×128.
 *
 * `imageUrl` z BE je plná Cloudinary URL. `cloudinaryThumb` vloží
 * transformace; pokud URL není Cloudinary (legacy / mocked), vrátí ji
 * beze změny.
 */
export function buildEmoteUrl(imageUrl: string): string {
  return cloudinaryThumb(imageUrl, 128, 128, 'fit');
}
