import { Inbox } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="size-6" />
        </span>
        <p className="text-[15px] font-semibold text-slate-900">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{message}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
