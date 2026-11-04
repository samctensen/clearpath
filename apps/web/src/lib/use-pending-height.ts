"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/** Reserve the settled layout while its content is replaced with a loading state.
 * This prevents the browser clamping scrollY to a temporarily shorter document.
 * Release the reservation when results arrive; genuinely shorter results can then
 * use their natural height without restoring an outdated scroll position.
 */
export function usePendingHeight<T extends HTMLElement>(pending: boolean) {
  const ref = useRef<T>(null);
  const [settledHeight, setSettledHeight] = useState<number>();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || pending) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      setSettledHeight(current => current === height ? current : height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pending]);

  return {
    ref,
    style: pending && settledHeight !== undefined
      ? { height: settledHeight, overflow: "hidden" } satisfies CSSProperties
      : undefined,
  };
}
