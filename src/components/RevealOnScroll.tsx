"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
};

export default function RevealOnScroll({
  children,
  className = "",
  rootMargin = "0px",
  threshold = 0.15,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div
      ref={ref}
      className={`${className} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } transition-all duration-700 ease-out will-change-transform`}
    >
      {children}
    </div>
  );
}
