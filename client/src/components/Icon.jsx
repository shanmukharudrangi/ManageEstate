export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const sharedProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth
  };

  switch (name) {
    case 'manage-estate-logo':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M3 21h18" />
          <path {...sharedProps} d="M5 21V7l7-4 7 4v14" />
          <path {...sharedProps} d="M9 21v-6h6v6" />
          <path {...sharedProps} d="M12 3v4" />
          <circle fill="currentColor" stroke="none" cx="9" cy="11" r="1" />
          <circle fill="currentColor" stroke="none" cx="15" cy="11" r="1" />
        </svg>
      );
    case 'brand':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M4 20V8l8-4 8 4v12" />
          <path {...sharedProps} d="M9 20v-5h6v5" />
          <path {...sharedProps} d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <circle {...sharedProps} cx="12" cy="12" r="4" />
          <path {...sharedProps} d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z" />
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <path {...sharedProps} d="M10 17l5-5-5-5" />
          <path {...sharedProps} d="M15 12H3" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <rect {...sharedProps} x="3" y="5" width="18" height="16" rx="3" />
          <path {...sharedProps} d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5Z" />
          <path {...sharedProps} d="M4 8h13" />
          <circle {...sharedProps} cx="16.5" cy="13" r="1" />
        </svg>
      );
    case 'trend':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M4 18 10 12l4 4 6-8" />
          <path {...sharedProps} d="M18 8h2v2" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M7 17 3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z" />
          <path {...sharedProps} d="M8 9h8M8 13h5" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
        </svg>
      );
    case 'team':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <circle {...sharedProps} cx="9" cy="8" r="3" />
          <path {...sharedProps} d="M4 19a5 5 0 0 1 10 0" />
          <circle {...sharedProps} cx="17" cy="9" r="2.5" />
          <path {...sharedProps} d="M15 19a4 4 0 0 1 5 0" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="m14 7 3-3 3 3-3 3" />
          <path {...sharedProps} d="M4 20l7-7" />
          <path {...sharedProps} d="M11 13 6 8l2-2 5 5" />
          <path {...sharedProps} d="m15 9 4 4" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M13 2 5 14h6l-1 8 8-12h-6z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M12 3 5 6v6c0 5 3.5 7.8 7 9 3.5-1.2 7-4 7-9V6Z" />
          <path {...sharedProps} d="m9.5 12 1.8 1.8 3.2-3.6" />
        </svg>
      );
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'save':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M5 4h11l3 3v13H5Z" />
          <path {...sharedProps} d="M8 4v5h8V4M9 20v-6h6v6" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="m5 13 4 4L19 7" />
        </svg>
      );
    case 'alert':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M12 9v4" />
          <path {...sharedProps} d="M12 17h.01" />
          <path {...sharedProps} d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M5 12h14" />
          <path {...sharedProps} d="m13 6 6 6-6 6" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M19 12H5" />
          <path {...sharedProps} d="m11 18-6-6 6-6" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <circle {...sharedProps} cx="12" cy="12" r="9" />
          <path {...sharedProps} d="M12 7v5l3 2" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'store':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M3 9l1-5h16l1 5" />
          <path {...sharedProps} d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2" />
          <path {...sharedProps} d="M5 11v9h14v-9" />
          <path {...sharedProps} d="M9 21v-6h6v6" />
        </svg>
      );
    case 'shopping-bag':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path {...sharedProps} d="M3 6h18" />
          <path {...sharedProps} d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'image':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <rect {...sharedProps} x="3" y="3" width="18" height="18" rx="3" />
          <circle {...sharedProps} cx="8.5" cy="8.5" r="1.5" />
          <path {...sharedProps} d="m21 15-5-5L5 21" />
        </svg>
      );
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M12 2H7a2 2 0 0 0-2 2v5l9 9a2 2 0 0 0 2.83 0l4.17-4.17a2 2 0 0 0 0-2.83Z" />
          <circle fill="currentColor" stroke="none" cx="7.5" cy="7.5" r="1.5" />
        </svg>
      );
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path {...sharedProps} d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M9 6h11M9 12h11M9 18h11" />
          <circle fill="currentColor" stroke="none" cx="4" cy="6" r="1.5" />
          <circle fill="currentColor" stroke="none" cx="4" cy="12" r="1.5" />
          <circle fill="currentColor" stroke="none" cx="4" cy="18" r="1.5" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <path {...sharedProps} d="M3 3v18h18" />
          <path {...sharedProps} d="M7 16l4-6 4 3 4-7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
          <circle {...sharedProps} cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
