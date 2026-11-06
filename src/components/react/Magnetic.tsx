// A link that leans a few pixels toward the pointer. Stays still on touch
// screens and for visitors who prefer reduced motion.
import { m, useMotionValue, useSpring } from 'framer-motion';
import type { AnchorHTMLAttributes, PointerEvent, ReactNode } from 'react';

const STRENGTH = 0.28; // how far it follows the pointer: 0 is still, 1 is glued
const SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode };

export default function Magnetic({ children, ...link }: Props) {
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const follow = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - box.left - box.width / 2) * STRENGTH);
    y.set((e.clientY - box.top - box.height / 2) * STRENGTH);
  };
  const release = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.a {...(link as object)} style={{ x, y }} onPointerMove={follow} onPointerLeave={release}>
      {children}
    </m.a>
  );
}
