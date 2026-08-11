import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Banner "Instalar app" que aparece cuando el browser dispara
 * el evento beforeinstallprompt (Chrome/Edge en Android y desktop).
 * En iOS/Safari muestra instrucciones manuales ya que no hay API nativa.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // No mostrar si ya esta instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // No mostrar si el usuario ya cerro el banner en esta sesion
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detectar iOS (Safari no tiene beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari) setShowIos(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIos(false);
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIos) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-rose-100 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(244,63,94,0.35)]">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-stone-800 text-sm leading-tight">
            Instalar Mi Dulce Tentación
          </p>
          {showIos ? (
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
              Tocá <strong>Compartir</strong> → <strong>Agregar a inicio</strong> para instalar la app.
            </p>
          ) : (
            <p className="text-[11px] text-stone-500 mt-0.5">
              Acceso directo desde tu pantalla de inicio.
            </p>
          )}
          {!showIos && (
            <button
              onClick={handleInstall}
              className="mt-2 text-[11px] font-bold text-rose-500 active:text-rose-700"
            >
              Instalar ahora
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-stone-400 active:text-stone-600 shrink-0 -mt-0.5"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
