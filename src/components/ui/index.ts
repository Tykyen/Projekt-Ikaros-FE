// Transitional barrel — re-exports generic UI primitives from @/shared/ui
// + feature-specific UI (které se v commit 3 přesunou do features/profile/).
// Po dokončení 1.6a refactoru tento barrel zmizí; importy půjdou
// přímo z '@/shared/ui' nebo '@/features/profile'.
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

export { AvatarUploader } from './AvatarUploader';
export { ChatColorPicker } from './ChatColorPicker';
export { EditCard } from './EditCard';
