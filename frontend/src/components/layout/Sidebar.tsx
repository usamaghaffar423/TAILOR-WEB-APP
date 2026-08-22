import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useAuthedImage } from '@/lib/useAuthedImage';

interface NavItem {
  to: string;
  end?: boolean;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    icon: (
      <>
        <rect x={3} y={3} width={7} height={9} rx={1.5} />
        <rect x={14} y={3} width={7} height={5} rx={1.5} />
        <rect x={14} y={12} width={7} height={9} rx={1.5} />
        <rect x={3} y={16} width={7} height={5} rx={1.5} />
      </>
    ),
  },
  { to: '/orders/new', label: 'New Order', icon: <path d="M12 5v14M5 12h14" /> },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <>
        <path d="M9 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V9.5" />
        <path d="M9 3h9v6M12 12l6-6" />
      </>
    ),
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: (
      <>
        <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
        <path d="M14 3v5h5" />
      </>
    ),
  },
  {
    to: '/karigars',
    label: 'Karigars',
    icon: (
      <>
        <circle cx={12} cy={8} r={3.2} />
        <path d="M5 20c0-3.6 3-6.2 7-6.2s7 2.6 7 6.2" />
      </>
    ),
  },
  { to: '/payments', label: 'Payments', icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /> },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <>
        <circle cx={12} cy={12} r={3} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onOverlayClick: () => void;
}

export function Sidebar({ open, onOverlayClick }: SidebarProps) {
  const shop = useAuthStore((s) => s.shop);
  const logoUrl = useAuthedImage(shop?.logo_path);
  const shopName = shop?.name || 'Top Man Tailor';
  const mark = shopName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            {logoUrl ? <img src={logoUrl} alt="Shop logo" /> : <span>{mark}</span>}
          </div>
          <div>
            <div className="brand-name">{shopName.toUpperCase()}</div>
            <div className="brand-sub">Tailor &amp; Co.</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <b>Order Studio</b>
          <br />
          Top Man Tailor
        </div>
      </aside>
      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={onOverlayClick} />
    </>
  );
}
