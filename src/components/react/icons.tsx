// Small line icons for the Products menu. They inherit the text color.
import type { ReactNode } from 'react';

const paths: Record<string, ReactNode> = {
  parcel: <><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  pallet: <><path d="M6 4h12v10H6zM12 4v10M6 9h12" /><path d="M3 17h18M5 17v3M12 17v3M19 17v3" /></>,
  motion: <><path d="M9 6h9v8H9z" /><path d="M2 8h4M2 12h4" /><path d="M3 18h18" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>,
  mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M10 8h4v4h-4zM11 18.5h2" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 11 5-3v8l-5-3" /></>,
  verify: <><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" /><path d="m9 13 2 2 4-4" /></>,
  returns: <><path d="M4 9h11a5 5 0 0 1 0 10H9" /><path d="M8 5 4 9l4 4" /></>,
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg className="v-arrow" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}
