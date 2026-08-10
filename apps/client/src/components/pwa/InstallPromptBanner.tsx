import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.info('User installed DrinkHub Kenya PWA');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md">
      <div className="glass-panel p-4 flex items-center justify-between border border-brand-500/50 shadow-2xl bg-dark-900/95 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-extrabold text-lg shadow-md">
            🍸
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install DrinkHub App</h4>
            <p className="text-[11px] text-slate-400">Add to home screen for faster ordering</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleInstallClick} className="px-3 py-1.5 text-xs">
            <Download className="mr-1 h-3.5 w-3.5" /> Install
          </Button>
          <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
