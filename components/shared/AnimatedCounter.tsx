'use client';

import React, { useEffect, useState } from 'react';

export function AnimatedCounter({
  to,
  duration = 1400,
  format = (n: number) => n.toLocaleString('fr-FR'),
  motion = 'subtle',
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  motion?: 'subtle' | 'lively' | 'off' | string;
}) {
  const [n, setN] = useState(motion === 'off' ? to : 0);

  useEffect(() => {
    if (motion === 'off') {
      setN(to);
      return;
    }
    const start = performance.now();
    const dur = motion === 'lively' ? duration * 1.2 : duration;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, motion]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{format(n)}</span>;
}
