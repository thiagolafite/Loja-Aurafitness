import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function useCrmPwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningStandalone());
  const [isIos, setIsIos] = useState<boolean>(() => isIosDevice());
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isRunningStandalone());
    setIsIos(isIosDevice());

    // Registra o Service Worker dedicado do CRM para habilitar a instalação nativa no Android/Chrome
    if ('serviceWorker' in navigator) {
      const scope = window.location.hostname.toLowerCase().startsWith('crm.') ? '/' : '/crm';
      navigator.serviceWorker
        .register('/crm-sw.js', { scope })
        .catch((err) => console.warn('CRM SW registration warning:', err));
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    // No iOS Safari ou navegadores sem beforeinstallprompt nativo, abre o passo a passo visual
    setShowIosGuide(true);
  };

  return {
    canInstallNative: Boolean(deferredPrompt),
    isInstalled,
    isIos,
    justInstalled,
    showIosGuide,
    setShowIosGuide,
    triggerInstall,
  };
}

export const CrmInstallBanner: React.FC<{ variant?: 'dark' | 'card' }> = ({
  variant = 'card',
}) => {
  const {
    canInstallNative,
    isInstalled,
    isIos,
    justInstalled,
    showIosGuide,
    setShowIosGuide,
    triggerInstall,
  } = useCrmPwaInstall();

  const [dismissed, setDismissed] = useState(false);

  if (justInstalled) {
    return (
      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Aura CRM instalado no seu celular! Agora você pode abrir direto da tela inicial.</span>
      </div>
    );
  }

  if (isInstalled || dismissed) return null;

  const wrapperClass =
    variant === 'dark'
      ? 'p-4 rounded-2xl bg-[#142318] border border-amber-400/40 text-white shadow-lg space-y-3'
      : 'p-4 rounded-2xl bg-gradient-to-r from-[#142318] to-[#1c3022] border border-amber-400/30 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3';

  return (
    <>
      <div className={wrapperClass}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              Instalar Aura CRM no Celular
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase">
                App
              </span>
            </h4>
            <p className="text-[11px] text-white/75">
              {canInstallNative
                ? 'Adicione o CRM à tela inicial para abrir em tela cheia como aplicativo.'
                : isIos
                  ? 'Adicione o Aura CRM na tela inicial do seu iPhone/iPad em 2 toques.'
                  : 'Instale como aplicativo no seu celular ou computador para acesso rápido.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={triggerInstall}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{canInstallNative ? 'Instalar Aplicativo' : 'Como Instalar'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal com instruções passo-a-passo para iPhone (Safari) ou navegadores sem prompt automático */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  Instalar Aura CRM como App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              <div className="space-y-3 text-foreground">
                <p className="text-muted-foreground">
                  No iPhone / iPad (Safari), siga estes 2 passos rápidos:
                </p>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                  <Share className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>1.</strong> Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                  <PlusSquare className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>2.</strong> Role para baixo e toque em{' '}
                    <strong>"Adicionar à Tela de Início"</strong>, depois em <strong>Adicionar</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-foreground">
                <p className="text-muted-foreground">
                  Para instalar no Android (Chrome) ou Desktop:
                </p>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  Toque no menu <strong>⋮</strong> (três pontinhos) no canto superior direito do navegador e selecione{' '}
                  <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
