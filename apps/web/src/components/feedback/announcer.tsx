'use client';

import { createContext, use, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

type Politeness = 'polite' | 'assertive';

type Announce = (message: string, politeness?: Politeness) => void;

const AnnounceContext = createContext<Announce | null>(null);

/** Renders the polite and the assertive live region and gives `useAnnounce()` to its children. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLSpanElement>(null);
  const assertiveRef = useRef<HTMLSpanElement>(null);
  const frames = useRef<Partial<Record<Politeness, number>>>({});

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    const region = (politeness === 'polite' ? politeRef : assertiveRef).current;
    if (!region) return;
    const pending = frames.current[politeness];
    if (pending !== undefined) cancelAnimationFrame(pending);
    // Screen readers read a live region when its text changes. The text is cleared first and set
    // on the next frame, so the same message is read again. The DOM is written directly: React
    // could join both updates into one render.
    region.textContent = '';
    frames.current[politeness] = requestAnimationFrame(() => {
      region.textContent = message;
    });
  }, []);

  useEffect(() => {
    const pendingFrames = frames.current;
    return () => Object.values(pendingFrames).forEach((frame) => cancelAnimationFrame(frame));
  }, []);

  return (
    <AnnounceContext value={announce}>
      {children}
      {/*
        The explicit aria-live keeps the regions readable while a dialog is open: Radix hides the
        rest of the page with aria-hidden, except elements that have aria-live.
      */}
      <VisuallyHidden ref={politeRef} role="status" aria-live="polite" aria-atomic="true" />
      <VisuallyHidden ref={assertiveRef} role="alert" aria-live="assertive" aria-atomic="true" />
    </AnnounceContext>
  );
}

/** Returns `announce(message, politeness)`, which reads a message to screen reader users. */
export function useAnnounce(): Announce {
  const announce = use(AnnounceContext);
  if (!announce) throw new Error('useAnnounce needs an AnnouncerProvider above it.');
  return announce;
}
