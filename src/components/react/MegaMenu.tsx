// The Products panel. It stays in the page while closed (hidden and inert), so
// search engines can follow its links and opening it never loads anything.
import { m, type Variants } from 'framer-motion';
import { navbar } from '../../data/site';
import { newTab } from '../../lib/links';
import { ArrowIcon, NavIcon } from './icons';

const EASE = [0.22, 1, 0.36, 1] as const; // same curve as --ease-hero
const STAGGER = 0.08; // seconds between each row

const panel: Variants = {
  closed: { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } },
  open: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const row: Variants = {
  closed: { opacity: 0, y: 10, transition: { duration: 0.15 } },
  open: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.04 + i * STAGGER } }),
};

interface Props { id: string; open: boolean; onNavigate: () => void }

export default function MegaMenu({ id, open, onNavigate }: Props) {
  const state = open ? 'open' : 'closed';
  return (
    <div id={id} className="mega-anchor" data-open={open} inert={!open}>
      <m.div className="mega" variants={panel} initial="closed" animate={state}>
        {navbar.products.groups.map((group) => (
          <div key={group.name} className="mega-group">
            <m.a variants={row} custom={0} href={group.href} {...newTab(group.href)} className="mega-head" onClick={onNavigate}>
              <span>
                <span className="mega-name">{group.name}</span>
                <span className="mega-tagline">{group.tagline}</span>
              </span>
              <ArrowIcon />
            </m.a>
            <ul>
              {group.items.map((item, i) => (
                <m.li key={item.href} variants={row} custom={i + 1}>
                  <a href={item.href} {...newTab(item.href)} className="mega-item" onClick={onNavigate}>
                    <span className="mega-icon"><NavIcon name={item.icon} /></span>
                    <span>
                      <span className="mega-label">{item.label}</span>
                      <span className="mega-desc">{item.desc}</span>
                    </span>
                  </a>
                </m.li>
              ))}
            </ul>
          </div>
        ))}
      </m.div>
    </div>
  );
}
