import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: IconProps) => base(p, <path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" />);
export const IconPause = (p: IconProps) => base(p, <><rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" /></>);
export const IconPlus = (p: IconProps) => base(p, <path d="M12 5v14M5 12h14" />);
export const IconSearch = (p: IconProps) => base(p, <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>);
export const IconCheck = (p: IconProps) => base(p, <path d="M4.5 12.5l5 5 10-11" />);
export const IconX = (p: IconProps) => base(p, <path d="M6 6l12 12M18 6L6 18" />);
export const IconStar = (p: IconProps) => base(p, <path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" />);
export const IconHeart = (p: IconProps) => base(p, <path d="M12 20s-7.5-4.6-9.3-9.3C1.5 7.5 3.6 4.5 6.8 4.5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.2C19.5 15.4 12 20 12 20z" />);
export const IconLock = (p: IconProps) => base(p, <><rect x="5.5" y="11" width="13" height="9" rx="2" /><path d="M8.5 11V7.8a3.5 3.5 0 017 0V11" /></>);
export const IconUnlock = (p: IconProps) => base(p, <><rect x="5.5" y="11" width="13" height="9" rx="2" /><path d="M8.5 11V7.8a3.5 3.5 0 016.9-.8" /></>);
export const IconTrash = (p: IconProps) => base(p, <><path d="M4.5 6.5h15M9.5 6V4.5h5V6" /><path d="M6.5 6.5l1 13h9l1-13" /><path d="M10 10.5v5.5M14 10.5v5.5" /></>);
export const IconPencil = (p: IconProps) => base(p, <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5 4 20z" />);
export const IconGrip = (p: IconProps) => base(p, <><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" /></>);
export const IconChevronDown = (p: IconProps) => base(p, <path d="M6 9l6 6 6-6" />);
export const IconChevronRight = (p: IconProps) => base(p, <path d="M9 6l6 6-6 6" />);
export const IconChevronLeft = (p: IconProps) => base(p, <path d="M15 6l-6 6 6 6" />);
export const IconUpload = (p: IconProps) => base(p, <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3.5h16V16" /></>);
export const IconDownload = (p: IconProps) => base(p, <><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 17v3h16v-3" /></>);
export const IconFilm = (p: IconProps) => base(p, <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4" /></>);
export const IconMusic = (p: IconProps) => base(p, <><path d="M9 18V6l10-2v11.5" /><circle cx="6.8" cy="18" r="2.3" /><circle cx="16.8" cy="15.5" r="2.3" /></>);
export const IconSliders = (p: IconProps) => base(p, <><path d="M5 7h14M5 12h14M5 17h14" /><circle cx="9" cy="7" r="1.9" fill="var(--surface, #fff)" /><circle cx="15" cy="12" r="1.9" fill="var(--surface, #fff)" /><circle cx="8" cy="17" r="1.9" fill="var(--surface, #fff)" /></>);
export const IconType = (p: IconProps) => base(p, <path d="M5 7V5h14v2M12 5v14M9.5 19h5" />);
export const IconUndo = (p: IconProps) => base(p, <><path d="M8 5L4 9l4 4" /><path d="M4 9h10a6 6 0 016 6v0a6 6 0 01-6 6h-3" /></>);
export const IconRedo = (p: IconProps) => base(p, <><path d="M16 5l4 4-4 4" /><path d="M20 9H10a6 6 0 00-6 6v0a6 6 0 006 6h3" /></>);
export const IconShare = (p: IconProps) => base(p, <><circle cx="6" cy="12" r="2.5" /><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="M8.3 10.8l7-4M8.3 13.2l7 4" /></>);
export const IconScissors = (p: IconProps) => base(p, <><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="6.5" cy="17.5" r="2.5" /><path d="M8.6 8.3L20 19M8.6 15.7L20 5" /></>);
export const IconNote = (p: IconProps) => base(p, <><path d="M4.5 5.5h15v10.5h-8L7 20v-4H4.5z" /></>);
export const IconClock = (p: IconProps) => base(p, <><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3.2 2" /></>);
export const IconCalendar = (p: IconProps) => base(p, <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M4 10.5h16M8.5 3.8V7M15.5 3.8V7" /></>);
export const IconMaximize = (p: IconProps) => base(p, <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />);
export const IconInfo = (p: IconProps) => base(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.6v.4" /></>);
export const IconWarning = (p: IconProps) => base(p, <><path d="M12 4l9 15.5H3z" /><path d="M12 10v4M12 16.6v.4" /></>);
export const IconFolder = (p: IconProps) => base(p, <path d="M3.5 6.5A1.5 1.5 0 015 5h5l2 2.5h7.5A1.5 1.5 0 0121 9v8.5a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5z" />);
export const IconCloud = (p: IconProps) => base(p, <path d="M7 18.5a4.5 4.5 0 01-.6-9A5.5 5.5 0 0117 8a4.2 4.2 0 011 8.3z" />);
export const IconEye = (p: IconProps) => base(p, <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>);
export const IconHelp = (p: IconProps) => base(p, <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.3a2.6 2.6 0 015.1.6c0 1.7-2.4 2.1-2.4 3.6M12 16.5v.4" /></>);
export const IconRefresh = (p: IconProps) => base(p, <><path d="M20 12a8 8 0 10-2.5 5.8" /><path d="M20 17.5V13h-4.5" /></>);
export const IconSettings = (p: IconProps) => base(p, <><circle cx="12" cy="12" r="3" /><path d="M12 2.8l1.2 2.6 2.8-.7 1.3 2.3 2.6 1.2-.7 2.8 1.6 2.4-1.6 2.4.7 2.8-2.6 1.2-1.3 2.3-2.8-.7L12 21.2l-1.2-2.4-2.8.7-1.3-2.3-2.6-1.2.7-2.8L3.2 12l1.6-2.4-.7-2.8 2.6-1.2 1.3-2.3 2.8.7z" /></>);
export const IconShield = (p: IconProps) => base(p, <path d="M12 3l7.5 2.8v5.4c0 4.6-3 8.1-7.5 9.8-4.5-1.7-7.5-5.2-7.5-9.8V5.8z" />);
export const IconFlag = (p: IconProps) => base(p, <path d="M6 21V4.5m0 0h11l-2.5 3.5L17 11.5H6" />);
