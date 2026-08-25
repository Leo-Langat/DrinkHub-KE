import React from 'react';
import { Timer } from 'lucide-react';

export interface SessionTimeoutBannerProps {
  /** Whether the banner is visible */
  show: boolean;
  /** Formatted countdown string, e.g. "01:45" */
  countdownFormatted: string;
  /** Role label for the banner, e.g. "Platform Admin", "Manager", "Waiter" */
  roleName?: string;
  /** Callback triggered when user clicks "Stay Logged In" */
  onStayLoggedIn: () => void;
  /** Callback triggered when user clicks "Logout Now" */
  onLogoutNow: () => void;
}

export const SessionTimeoutBanner: React.FC<SessionTimeoutBannerProps> = ({
  show,
  countdownFormatted,
  roleName = 'Session',
  onStayLoggedIn,
  onLogoutNow,
}) => {
  if (!show) return null;

  return (
    <aside
      aria-label="Session Inactivity Warning"
      role="alert"
      className="fixed top-0 left-0 right-0 z-[99999] px-4 py-2.5 sm:px-6 sm:py-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white text-xs sm:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-4"
      style={{
        background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B45309 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Timer className="h-4 w-4 text-amber-200" />
        </div>
        <div className="leading-snug truncate">
          <span className="font-bold">{roleName} Inactivity Alert:</span>{' '}
          <span>Session will expire in </span>
          <span className="font-black text-amber-300 bg-black/30 px-2 py-0.5 rounded-md font-mono tracking-wider text-sm inline-block">
            {countdownFormatted}
          </span>
          <span className="hidden sm:inline"> (20-min idle limit)</span>.
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <button
          type="button"
          onClick={onStayLoggedIn}
          className="rounded-lg bg-white text-red-900 px-3.5 py-1.5 text-xs font-extrabold shadow-sm hover:bg-amber-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>✔</span> Stay Logged In
        </button>
        <button
          type="button"
          onClick={onLogoutNow}
          className="rounded-lg bg-black/25 text-white border border-white/30 px-3 py-1.5 text-xs font-bold hover:bg-black/40 active:scale-95 transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
