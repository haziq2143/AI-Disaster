'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'scale'
  threshold = 0.02,
  rootMargin = '0px 0px -15px 0px'
}) {
  const [revealed, setRevealed] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const dirClass = direction === 'left' ? 'reveal-left'
    : direction === 'right' ? 'reveal-right'
    : direction === 'down' ? 'reveal-down'
    : direction === 'scale' ? 'reveal-scale'
    : 'reveal-up';

  return (
    <div
      ref={elementRef}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${dirClass} ${revealed ? 'revealed' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
