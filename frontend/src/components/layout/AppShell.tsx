import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onOverlayClick={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar onHamburgerClick={() => setSidebarOpen((v) => !v)} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
