import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * The frame every page renders inside.
 *
 * Owns only layout state (which nav item is active, whether the mobile drawer
 * is open). Pages stay unaware of the chrome around them.
 */
export function AppShell({ user, nav, current, onNavigate, title, unread, onLogout, children }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        nav={nav}
        current={current}
        onNavigate={(key) => {
          onNavigate(key);
          setDrawer(false);
        }}
        user={user}
        open={drawer}
        onClose={() => setDrawer(false)}
        onLogout={onLogout}
      />

      <div className="lg:pl-[264px]">
        <Topbar title={title} user={user} unread={unread} onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
