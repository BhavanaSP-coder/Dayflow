import { LogOut, Settings, X } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { cx } from "../lib/status";

const ROLE_TONE = {
  admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
  hr: "bg-brand-50 text-brand-700 ring-brand-600/20",
  employee: "bg-slate-100 text-slate-600 ring-slate-300",
};

export function Sidebar({ nav, current, onNavigate, user, open, onClose, onLogout }) {
  return (
    <>
      <div
        onClick={onClose}
        className={cx(
          "fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-hairline bg-surface",
          "transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <span className="text-[15px] font-extrabold text-white">D</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">Dayflow</p>
            <p className="truncate text-[11px] text-slate-400">Every workday, perfectly aligned.</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>

        <nav className="scrollbar-slim flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</p>
          {nav.map(({ key, label, icon: Icon, badge }) => {
            const active = current === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600" />}
                <Icon className={cx("size-[18px] transition-colors", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} />
                {label}
                {badge ? (
                  <span className="ml-auto grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-hairline p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">{user.name}</p>
              <Badge tone={ROLE_TONE[user.role]} className="mt-0.5">{user.role.toUpperCase()}</Badge>
            </div>
            <Settings className="size-4 shrink-0 text-slate-400" />
          </div>
          <button
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-[18px] text-slate-400" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
