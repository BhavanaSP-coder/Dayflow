import { Bell, Menu, Search } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";

export function Topbar({ title, user, unread = 0, onMenu }) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h1>

        {/* Search — hidden on small screens where the icon button is enough */}
        <div className="ml-auto hidden md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search people, leave, payslips…"
              className="h-9 w-72 rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>

        <button
          className="relative ml-auto rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:ml-0"
          aria-label={`Notifications, ${unread} unread`}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        <div className="h-6 w-px bg-hairline" />
        <Avatar name={user.name} size="sm" />
      </div>
    </header>
  );
}
