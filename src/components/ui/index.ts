// Transitional barrel — bude smazán v commit 5.
// Generické UI primitivy z @/shared/ui, profile-specific z @/features/profile/components.
export {
  Button,
  Input,
  Card,
  Modal,
  Badge,
  Spinner,
  IkarosCard,
  UserAvatar,
  GlobalErrorBoundary,
} from '@/shared/ui';

export { AvatarUploader } from '@/features/profile/components/AvatarUploader';
export { ChatColorPicker } from '@/features/profile/components/ChatColorPicker';
export { EditCard } from '@/features/profile/components/EditCard';
