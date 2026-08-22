import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { useAuthStore } from '@/store/auth';

interface TopbarProps {
  onHamburgerClick: () => void;
}

export function Topbar({ onHamburgerClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const admin = useAuthStore((s) => s.admin);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const initials = (admin?.email || 'TM').slice(0, 2).toUpperCase();

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/orders?q=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <div className="topbar">
      <button className="hamburger" aria-label="Toggle menu" onClick={onHamburgerClick}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div className="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={11} cy={11} r={7} />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search orders, customers, karigars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>
      <div className="theme-toggle">
        <button className={theme === 'dark' ? 'active' : ''} aria-label="Dark mode" onClick={() => setTheme('dark')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
          </svg>
        </button>
        <button className={theme === 'light' ? 'active' : ''} aria-label="Light mode" onClick={() => setTheme('light')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={4} />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </button>
      </div>
      <div className="bell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        <span className="dot" />
      </div>
      <div className="avatar">{initials}</div>
    </div>
  );
}
