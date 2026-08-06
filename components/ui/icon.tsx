import type { ReactNode, SVGProps } from "react";

/**
 * Curated outline icons derived from Lucide's open-source icon language.
 * All product icons use one 24px grid, round caps/joins and a consistent 1.8 stroke.
 * Brand marks are intentionally excluded and handled by PaymentBrand.
 */
export type IconName =
  | "activity"
  | "alert-triangle"
  | "arrow-right"
  | "badge-dollar"
  | "ban"
  | "boxes"
  | "building"
  | "chart"
  | "check-circle"
  | "chevron-right"
  | "circle-dollar"
  | "circle-help"
  | "download"
  | "file-check"
  | "file-up"
  | "filter"
  | "folder-kanban"
  | "grid"
  | "home"
  | "landmark"
  | "lightbulb"
  | "link"
  | "lock"
  | "log-out"
  | "moon"
  | "package-check"
  | "plus"
  | "receipt"
  | "refresh-cw"
  | "rotate-ccw"
  | "save"
  | "scale"
  | "search"
  | "shield-check"
  | "shopping-cart"
  | "smartphone"
  | "sparkles"
  | "sun"
  | "trending-down"
  | "trending-up"
  | "upload"
  | "user"
  | "users"
  | "wallet"
  | "workflow"
  | "x";

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  "alert-triangle": <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  "badge-dollar": <><path d="M12 3 9.8 5.2 6.7 4.8l-.5 3.1L3.5 9.5 5 12l-1.5 2.5 2.7 1.6.5 3.1 3.1-.4L12 21l2.2-2.2 3.1.4.5-3.1 2.7-1.6L19 12l1.5-2.5-2.7-1.6-.5-3.1-3.1.4Z" /><path d="M14.5 9.2c-.5-.5-1.2-.7-2-.7-1.1 0-2 .6-2 1.5s.8 1.3 2 1.5 2 .6 2 1.5-.9 1.5-2 1.5c-.8 0-1.6-.3-2.2-.9" /><path d="M12.5 7.5v9" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  boxes: <><path d="m12 2 4.5 2.6v5.2L12 12.4 7.5 9.8V4.6Z" /><path d="m3 11 4.5 2.6v5.2L3 21.4l-4.5-2.6v-5.2Z" transform="translate(4.5 -1.4)" /><path d="m16.5 11 4.5 2.6v5.2l-4.5 2.6-4.5-2.6v-5.2Z" /></>,
  building: <><path d="M3 21h18" /><path d="M6 21V7l6-4 6 4v14" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M9 14h.01" /><path d="M15 14h.01" /><path d="M10 21v-3h4v3" /></>,
  chart: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /></>,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" /></>,
  "chevron-right": <><path d="m9 18 6-6-6-6" /></>,
  "circle-dollar": <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.6-.6-1.5-1-2.5-1-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.4-2.8-1.1" /><path d="M12.5 5.5v13" /></>,
  "circle-help": <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-1 .8-1.9 1.2-1.9 2.7" /><path d="M12 17h.01" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  "file-check": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></>,
  "file-up": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" /></>,
  filter: <><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></>,
  "folder-kanban": <><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M8 13v4" /><path d="M12 13v2" /><path d="M16 13v5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-7h6v7" /></>,
  landmark: <><path d="m3 9 9-6 9 6" /><path d="M5 10h14" /><path d="M6 10v8" /><path d="M10 10v8" /><path d="M14 10v8" /><path d="M18 10v8" /><path d="M3 21h18" /></>,
  lightbulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.6 15.2 14 16 14 18h-4c0-2-.6-2.8-1.5-3.5Z" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
  "log-out": <><path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" /><path d="m14 8 4 4-4 4" /><path d="M18 12H9" /></>,
  moon: <><path d="M20.7 15.5A8.5 8.5 0 0 1 8.5 3.3 9 9 0 1 0 20.7 15.5Z" /></>,
  "package-check": <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3" /><path d="M12 12v9" /><path d="m8.5 15.5 1.8 1.8 4-4" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  receipt: <><path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2Z" /><path d="M9 9h6" /><path d="M9 13h6" /></>,
  "refresh-cw": <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 8A7 7 0 0 1 18 6l2 2" /><path d="M17.9 16A7 7 0 0 1 6 18l-2-2" /></>,
  "rotate-ccw": <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  save: <><path d="M5 3h12l2 2v16H5Z" /><path d="M8 3v6h8V3" /><path d="M8 21v-7h8v7" /></>,
  scale: <><path d="M12 3v18" /><path d="M5 7h14" /><path d="m5 7-3 6h6Z" /><path d="m19 7-3 6h6Z" /><path d="M8 21h8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  "shield-check": <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  "shopping-cart": <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H7" /></>,
  smartphone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 5h4" /><path d="M11 18h2" /></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" /><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" /><path d="m5 14 .6 1.8 1.9.7-1.9.6L5 19l-.6-1.9-1.9-.6 1.9-.7Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></>,
  "trending-down": <><path d="m3 7 6 6 4-4 8 8" /><path d="M21 10v7h-7" /></>,
  "trending-up": <><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  upload: <><path d="M12 21V9" /><path d="m7 14 5-5 5 5" /><path d="M5 3h14" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><path d="M16 21a6 6 0 0 0-12 0" /><circle cx="10" cy="8" r="4" /><path d="M18 11a4 4 0 0 1 4 4v6" /><path d="M17 4a4 4 0 0 1 0 8" /></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" /><path d="M16 12h4" /><circle cx="16" cy="12" r=".5" /></>,
  workflow: <><rect x="3" y="3" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><path d="M6 8v4h12v4" /><path d="M6 12v4" /></>,
  x: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
};

export type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  label?: string;
};

export function Icon({ name, size = 20, label, className = "", ...props }: IconProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`app-icon ${className}`.trim()}
      fill="none"
      height={size}
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
