import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge knows only Tailwind's own scales: without these groups it keeps both classes of
// `duration-fast duration-base` or `z-sticky z-toast`. The values are the tokens of globals.css.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      duration: [{ duration: ['fast', 'base'] }],
      z: [{ z: ['sticky', 'overlay', 'dropdown', 'toast'] }],
    },
  },
});

/** Joins class names; a later Tailwind class wins over an earlier one of the same group. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
