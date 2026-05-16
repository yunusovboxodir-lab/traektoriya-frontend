/**
 * src/components/ui/ — базовая UI-библиотека Traektoriya.
 *
 * Импортировать через барель: `import { Button, Card, PageHeader } from '@/components/ui';`
 *
 * Каждый компонент:
 *  - построен на токенах из src/styles/tokens.css (Tailwind theme.extend)
 *  - не содержит хардкод-цветов / шрифтов / отступов
 *  - имеет ARIA + клавиатурную навигацию (где применимо)
 *  - использует Lucide иконки, никаких эмодзи в системном UI
 *
 * Спецификация: _docs/codex/02_components.md
 * Правила для AI: _docs/codex/14_ai_assistant_rules.md
 */

// --- AI-UX (Phase 0-3) ---
export { AIBadge } from './AIBadge';
export type { AIBadgeVariant, AIBadgeSize } from './AIBadge';
export { ConfidenceIndicator } from './ConfidenceIndicator';
export type { ConfidenceLevel } from './ConfidenceIndicator';
export { AIFeedbackBar } from './AIFeedbackBar';
export type { FeedbackType } from './AIFeedbackBar';

// --- Базовая библиотека (Phase 1-A) ---
export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardDescription,
} from './Card';
export type { CardDensity } from './Card';

export { Badge } from './Badge';
export type { BadgeVariant, BadgeSize, Role } from './Badge';

export { EmptyState } from './EmptyState';

export { PageHeader } from './PageHeader';

export {
  Skeleton,
  SkeletonLine,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
} from './Skeleton';

export { Input } from './Input';
export type { InputSize } from './Input';

export { Label } from './Label';

export { FormField } from './FormField';

// --- Radix-based (Phase 1-B) ---
export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
  ModalClose,
} from './Modal';
export type { ModalMaxWidth } from './Modal';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from './DropdownMenu';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';

export { ToastContainer, toast } from './Toast';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table';
