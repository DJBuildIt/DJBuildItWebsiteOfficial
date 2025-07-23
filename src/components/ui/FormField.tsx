import { cva, type VariantProps } from 'class-variance-authority';

import { COLORS, ANIMATIONS } from '@/lib/design-system';

export const formElementVariants = cva(
  `w-full border rounded-md px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 ${ANIMATIONS.transition.all}`,
  {
    variants: {
      intent: {
        default: `${COLORS.glass.base} border-white/20 focus:ring-purple-400/50`,
        error: `${COLORS.glass.base} border-red-400/50 focus:ring-red-400/50`,
      },
    },
    defaultVariants: {
      intent: 'default',
    },
  }
);

