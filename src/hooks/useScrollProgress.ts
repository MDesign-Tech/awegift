import { useState, useEffect, useRef, RefObject } from 'react';

export function useScrollProgress(containerRef: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight;
        const winHeight = window.innerHeight;

        // Progress from 0 (top of page) to 1 (bottom of page)
        const scrollProgress = Math.min(1, Math.max(0, scrollTop / (docHeight - winHeight)));

        setProgress(scrollProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return progress;
}
