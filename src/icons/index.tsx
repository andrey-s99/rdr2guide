import type { ComponentChildren, FunctionComponent } from 'preact';

/**
 * Original line icons in an "engraving" style (SPEC 10.4):
 * viewBox 0 0 24 24, stroke currentColor, stroke-width 1.5, no fill.
 */

export interface IconProps {
  /** Pixel size (width = height). Default 24. */
  size?: number;
  class?: string;
  /** Accessible label; without it the icon is decorative (aria-hidden). */
  title?: string;
  strokeWidth?: number;
}

export interface StarIconProps extends IconProps {
  /** Filled star (selected goal). */
  filled?: boolean;
}

export type ChevronDirection = 'right' | 'down' | 'left' | 'up';

export interface ChevronIconProps extends IconProps {
  direction?: ChevronDirection;
}

interface SvgProps extends IconProps {
  children: ComponentChildren;
  fill?: string;
  transform?: string;
}

function Svg({
  size = 24,
  class: cls,
  title,
  strokeWidth = 1.5,
  children,
  fill,
  transform,
}: SvgProps) {
  return (
    <svg
      class={cls ? `icon ${cls}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ?? 'none'}
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {transform ? <g transform={transform}>{children}</g> : children}
    </svg>
  );
}

export const HatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 14.5c2 2.2 5.6 3.5 10 3.5s8-1.3 10-3.5" />
    <path d="M6.6 15.6 7.6 8.6c.3-1.8 1.9-2.8 3.4-2.1l1 .5 1-.5c1.5-.7 3.1.3 3.4 2.1l1 7" />
    <path d="M7.1 12.6c3.2.9 6.6.9 9.8 0" />
  </Svg>
);

export const CoatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3 4.6 5 3 20h4.4l.6-8.5" />
    <path d="M15 3l4.4 2L21 20h-4.4l-.6-8.5" />
    <path d="M8 11v10h8V11" />
    <path d="M9 3l3 6.5L15 3" />
    <path d="M12 9.5V21" />
    <circle cx="13.3" cy="13" r=".4" />
    <circle cx="13.3" cy="16.5" r=".4" />
  </Svg>
);

export const VestIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 3 6 4.5c.6 2.4.4 4.4-1 6.5V20h6.3l.7-1.5.7 1.5H19v-9c-1.4-2.1-1.6-4.1-1-6.5L15.5 3" />
    <path d="M8.5 3c.3 4 1.6 7 3.5 9 1.9-2 3.2-5 3.5-9" />
    <path d="M12 12v6.5" />
    <path d="M7.5 15h2.5M14 15h2.5" />
  </Svg>
);

export const GlovesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 21v-4.2l-3-4a1.5 1.5 0 0 1 2.3-2L9 12.5V5.3a1.4 1.4 0 0 1 2.8 0V10.5" />
    <path d="M11.8 10.5V4a1.4 1.4 0 0 1 2.8 0v6.5" />
    <path d="M14.6 10.5V5.2a1.4 1.4 0 0 1 2.8 0V14c0 3-1 4.8-1.4 7" />
    <path d="M8 18h8.5" />
  </Svg>
);

export const BootsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h6.3l-.6 9.2 5.6 2.4c1.7.7 3.2 1.8 3.2 3.6V20H5.4L6 13z" />
    <path d="M5.4 20v1h3.2v-1" />
    <path d="M7 6h6.1" />
    <path d="M9 9.5c1 .5 2 .5 3 0" />
  </Svg>
);

export const ChapsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3h14l-1 18h-4.2L12 9.5 10.2 21H6z" />
    <path d="M5.2 6h13.6" />
    <path d="M6.6 10 4.8 10.6M6.8 13.5 5 14.1M7 17l-1.8.6" />
    <path d="M17.4 10l1.8.6M17.2 13.5l1.8.6M17 17l1.8.6" />
  </Svg>
);

export const FeatherIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20 17.5 6.5" />
    <path d="M20.5 3.5c-5.5.2-10.6 3.4-12 8.7L8 16h3.8c5.3-1.4 8.5-6.5 8.7-12.5z" />
    <path d="M10.4 13.6H14M12.8 11.2h3.4M15.2 8.8h2.6" />
  </Svg>
);

export const SaddleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5c3.2 0 4.4 2.3 9 2.3s5.8-2.3 9-2.3l-1 4c-.8 2.3-3.8 3.5-8 3.5s-7.2-1.2-8-3.5z" />
    <path d="M17 11.5V8a1.5 1.5 0 0 1 3 0" />
    <path d="M10.5 18v2.5h3V18" />
    <path d="M6 14.2c3.6 1.5 8.4 1.5 12 0" />
  </Svg>
);

export const SatchelIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8 8.5 3h7L19 8" />
    <rect x="3" y="8" width="18" height="12" rx="1.5" />
    <path d="M3 10.5c3.5 3.2 14.5 3.2 18 0" />
    <rect x="10.8" y="12.6" width="2.4" height="3.2" rx=".4" />
  </Svg>
);

export const CampIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 20h20" />
    <path d="M4 20 12 5l8 15" />
    <path d="M12 5 10.8 3M12 5l1.2-2" />
    <path d="M12 20v-6.5L9 20M12 13.5l3 6.5" />
  </Svg>
);

export const TrinketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 3c0 4.5 2 8 5.5 9 3.5-1 5.5-4.5 5.5-9" />
    <circle cx="12" cy="16" r="4" />
    <path d="M12 13.5 14 16l-2 2.5-2-2.5z" />
  </Svg>
);

export const TalismanIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 4c4.5 4 12.5 4 17 0" />
    <path d="M12 7.2c-2 0-3.2 2-3.2 5 0 4 1.8 6.8 3.2 8.8 1.4-2 3.2-4.8 3.2-8.8 0-3-1.2-5-3.2-5z" />
    <circle cx="7" cy="6.6" r=".9" />
    <circle cx="17" cy="6.6" r=".9" />
    <path d="M12 11v4" />
  </Svg>
);

export const PawIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.8 17.2c0-2.7 2-4.9 4.2-4.9s4.2 2.2 4.2 4.9c0 1.6-1 2.6-2.5 2.6-.9 0-1.1-.5-1.7-.5s-.8.5-1.7.5c-1.5 0-2.5-1-2.5-2.6z" />
    <ellipse cx="5.6" cy="11.2" rx="1.6" ry="2" />
    <ellipse cx="9.4" cy="7.2" rx="1.6" ry="2.1" />
    <ellipse cx="14.6" cy="7.2" rx="1.6" ry="2.1" />
    <ellipse cx="18.4" cy="11.2" rx="1.6" ry="2" />
  </Svg>
);

export const BirdIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 16.5c2.5.3 4.2-.6 5.3-2.7 1.6-3.2 3.7-5.6 7.2-5.6 1.4 0 2.4.8 2.9 1.9L21.5 11l-3.1 1c-.1 4.3-3.1 7-7.8 7H6" />
    <path d="M9 15.6c2.3.1 4.3-1 5.4-3" />
    <path d="M11 19v2.2M14 18.6v2.6" />
    <circle cx="16" cy="10" r=".4" />
  </Svg>
);

export const LegendaryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 9.8c0-2.4 1.8-3.8 4-3.8s4 1.4 4 3.8c0 1.7-.6 2.9-1.5 3.6V16h-5v-2.6C8.6 12.7 8 11.5 8 9.8z" />
    <path d="M8.4 7.8C5.6 7.8 3.2 6.2 2.8 2.8c1.4 2 3.4 2.6 5.8 2.6" />
    <path d="M15.6 7.8c2.8 0 5.2-1.6 5.6-5-1.4 2-3.4 2.6-5.8 2.6" />
    <circle cx="10.4" cy="10" r=".8" />
    <circle cx="13.6" cy="10" r=".8" />
    <path d="M12 11.8v1" />
    <path d="M10.3 16v2.4M12 16v3M13.7 16v2.4" />
  </Svg>
);

export const StarIcon = ({ filled, ...p }: StarIconProps) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
  </Svg>
);

/** Pen-stroke tick. */
export const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M4.2 12.8c1.4.6 2.8 2 4.2 4.6C11 11.6 14.8 7.2 20 4.6" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5.5 5.5" />
  </Svg>
);

/** A spur rowel. */
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="12" cy="12" r="6" />
    <path d="M18 12h3M16.2 16.2l2.2 2.2M12 18v3M7.8 16.2l-2.2 2.2M6 12H3M7.8 7.8 5.6 5.6M12 6V3M16.2 7.8l2.2-2.2" />
  </Svg>
);

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5.5" />
    <path d="M11 5.5 4.5 12l6.5 6.5" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const WarningIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 21.5 20h-19z" />
    <path d="M12 10v4.5" />
    <path d="M12 17.3v.01" />
  </Svg>
);

export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9.5" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </Svg>
);

export const MapPinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
);

/** Hunting ledger (summary tab; not in SPEC 10.4 list, extra). */
export const LedgerIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3.5h12.5A1.5 1.5 0 0 1 19 5v15H6.5A1.5 1.5 0 0 1 5 18.5z" />
    <path d="M5 18.5A1.5 1.5 0 0 1 6.5 17H19" />
    <path d="M8.5 7.5h7M8.5 10.5h7M8.5 13.5h4" />
  </Svg>
);

const CHEVRON_ROTATION: Record<ChevronDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export const ChevronIcon = ({ direction = 'right', ...p }: ChevronIconProps) => (
  <Svg {...p} transform={`rotate(${CHEVRON_ROTATION[direction]} 12 12)`}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const icons = {
  hat: HatIcon,
  coat: CoatIcon,
  vest: VestIcon,
  gloves: GlovesIcon,
  boots: BootsIcon,
  chaps: ChapsIcon,
  feather: FeatherIcon,
  saddle: SaddleIcon,
  satchel: SatchelIcon,
  camp: CampIcon,
  trinket: TrinketIcon,
  talisman: TalismanIcon,
  paw: PawIcon,
  bird: BirdIcon,
  legendary: LegendaryIcon,
  star: StarIcon,
  check: CheckIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  back: BackIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  warning: WarningIcon,
  external: ExternalIcon,
  lock: LockIcon,
  'map-pin': MapPinIcon,
  chevron: ChevronIcon,
  close: CloseIcon,
  ledger: LedgerIcon,
} satisfies Record<string, FunctionComponent<IconProps>>;

export type IconName = keyof typeof icons;

export function isIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(icons, name);
}

export interface NamedIconProps extends IconProps {
  /** Icon name, e.g. `category.icon` from data/categories.json. */
  name: string;
}

/** Renders an icon by name; unknown names render nothing. */
export function Icon({ name, ...rest }: NamedIconProps) {
  if (!isIconName(name)) return null;
  const Cmp: FunctionComponent<IconProps> = icons[name];
  return <Cmp {...rest} />;
}
