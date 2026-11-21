import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

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

function detectPlatform() {
  if (typeof window === 'undefined') {
    return { isIos: false, isAndroid: false, isInAppBrowser: false, isIosNonSafari: false };
  }
  const ua = window.navigator.userAgent || '';
  const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line\/|MicroMessenger/i.test(ua);
  const isIosNonSafari = isIos && (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) || isInAppBrowser);
  return { isIos, isAndroid, isInAppBrowser, isIosNonSafari };
}

export function useCrmPwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningStandalone());
  const [platform, setPlatform] = useState(() => detectPlatform());
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isRunningStandalone());
    setPlatform(detectPlatform());

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

    // No iOS ou quando o navegador não dispara beforeinstallprompt, abre o guia visual
    setShowGuide(true);
  };

  return {
    canInstallNative: Boolean(deferredPrompt),
    isInstalled,
    isIos: platform.isIos,
    isAndroid: platform.isAndroid,
    isInAppBrowser: platform.isInAppBrowser,
    isIosNonSafari: platform.isIosNonSafari,
    justInstalled,
    showIosGuide: showGuide,
    setShowIosGuide: setShowGuide,
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
    isAndroid,
    isInAppBrowser,
    isIosNonSafari,
    justInstalled,
    showIosGuide,
    setShowIosGuide,
    triggerInstall,
  } = useCrmPwaInstall();

  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

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
            <h4 className="font-serif font-bold text-sm text-white flex flex-wrap items-center gap-2">
              Instalar Aura CRM no Celular
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase">
                {isIos ? 'iOS / iPhone' : isAndroid ? 'Android' : 'App'}
              </span>
            </h4>
            <p className="text-[11px] text-white/75">
              {canInstallNative
                ? 'Toque no botão ao lado para instalar o Aura CRM na tela inicial do seu celular.'
                : isIosNonSafari
                  ? 'Para instalar no iPhone, abra este link no Safari e adicione à Tela de Início.'
                  : isIos
                    ? 'Adicione o Aura CRM à Tela de Início do iPhone em 2 toques (Compartilhar → Adicionar à Tela de Início).'
                    : isInAppBrowser
                      ? 'Abra este link no Chrome/Safari para instalar o aplicativo no seu celular.'
                      : 'Instale como aplicativo no Android, iPhone ou computador para abrir direto sem navegador.'}
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
            <span>{canInstallNative ? 'Instalar Aplicativo' : isIos ? 'Instalar no iPhone' : 'Instalar App'}</span>
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

      {/* Modal com instruções passo-a-passo para iPhone/iPad (Safari) e Android */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  {isIos ? 'Instalar Aura CRM no iPhone / iPad' : 'Instalar Aura CRM como App'}
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
                {isIosNonSafari && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      Você abriu fora do Safari (ex.: WhatsApp, Instagram ou Chrome).
                    </p>
                    <p>
                      No iPhone, a Apple só libera a instalação de aplicativos pelo navegador{' '}
                      <strong>Safari</strong>. Copie o link abaixo e cole no Safari:
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Link Copiado! Cole no Safari' : 'Copiar Link do CRM'}</span>
                    </button>
                  </div>
                )}

                <p className="text-muted-foreground">
                  No <strong>Safari</strong>, siga estes 2 passos rápidos:
                </p>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                  <Share className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>1.</strong> Toque no botão <strong>Compartilhar</strong> (quadrado com seta pra cima) na barra do Safari.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                  <PlusSquare className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>2.</strong> Role para baixo e toque em{' '}
                    <strong>"Adicionar à Tela de Início"</strong>, depois confirme em{' '}
                    <strong>Adicionar</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-foreground">
                {isInAppBrowser && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-2">
                    <p className="font-bold">Você abriu dentro de outro app (ex.: WhatsApp/Instagram).</p>
                    <p>Toque nos 3 pontinhos e escolha <strong>"Abrir no navegador (Chrome)"</strong>, ou copie o link:</p>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Link Copiado!' : 'Copiar Link do CRM'}</span>
                    </button>
                  </div>
                )}
                <p className="text-muted-foreground">
                  No <strong>Android (Chrome / Edge / Samsung)</strong> ou computador:
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
