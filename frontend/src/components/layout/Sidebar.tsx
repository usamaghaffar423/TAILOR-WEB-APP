import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

const RETAIL_NAV_ITEMS: NavItem[] = [
  {
    to: '/retail',
    end: true,
    label: 'Retail Dashboard',
    icon: (
      <>
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path d="M9 13a3 3 0 006 0" />
      </>
    ),
  },
  {
    to: '/retail/products',
    label: 'Products',
    icon: (
      <>
        <path d="M20 7H4a1 1 0 00-1 1v3a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" />
        <path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6" />
      </>
    ),
  },
  {
    to: '/retail/inventory',
    label: 'Inventory',
    icon: (
      <>
        <path d="M21 8L12 3 3 8v8l9 5 9-5V8z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    ),
  },
  { to: '/retail/pos', label: 'New Sale (POS)', icon: <path d="M6 3h12l1 5H5l1-5zM5 8h14l-1.5 11.5A2 2 0 0115.5 21h-7a2 2 0 01-2-1.5L5 8z" /> },
  {
    to: '/retail/sales',
    label: 'Sales History',
    icon: (
      <>
        <path d="M9 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V9.5" />
        <path d="M9 3h9v6M12 12l6-6" />
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

  const location = useLocation();
  const onRetailRoute = location.pathname.startsWith('/retail');
  const [retailOpen, setRetailOpen] = useState(onRetailRoute);

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

          <button
            type="button"
            className={`nav-item${onRetailRoute ? ' active' : ''}`}
            onClick={() => setRetailOpen((v) => !v)}
            aria-expanded={retailOpen}
            style={{ justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l1.5-5h15L21 9" />
                <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path d="M9 13a3 3 0 006 0" />
              </svg>
              Shop
            </span>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 14, height: 14, flexShrink: 0, transition: 'transform .15s', transform: retailOpen ? 'rotate(90deg)' : 'none' }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          {retailOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {RETAIL_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  style={{ paddingLeft: 40, fontSize: 12.5 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    {item.icon}
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
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
