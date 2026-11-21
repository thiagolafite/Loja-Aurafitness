import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Store,
  ShieldCheck,
  Smartphone,
  LayoutDashboard,
  Download,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getStandaloneCrmSession,
  loginStandaloneCrm,
  logoutStandaloneCrm,
} from '../services/crmService';
import { CrmUser } from '../types';
import { CrmWorkspace } from '../pages/CrmWorkspace';
import { CrmInstallBanner, useCrmPwaInstall } from '../components/CrmInstallPrompt';

export const CrmStandaloneLayout: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, user: storeUser } = useAuth();

  const [crmUser, setCrmUser] = useState<CrmUser | null>(() => getStandaloneCrmSession());
  const [email, setEmail] = useState('admin@aurafitness.com.br');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isInstalled, canInstallNative, triggerInstall } = useCrmPwaInstall();

  // Garante manifesto e título do App CRM mesmo quando acessado via navegação interna
  useEffect(() => {
    document.title = 'Aura CRM 360°';
    let manifestEl = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestEl) {
      manifestEl = document.createElement('link');
      manifestEl.rel = 'manifest';
      document.head.appendChild(manifestEl);
    }
    manifestEl.href = '/crm-manifest.json';
  }, []);

  // Se já estiver logado como Admin da loja ou na sessão standalone do CRM, libera o acesso direto
  const isAuthenticated = Boolean(crmUser) || isAdmin;
  const activeRole: CrmUser['role'] = crmUser?.role || 'admin';
  const activeName = crmUser?.name || storeUser?.name || 'Admin Aura CRM';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = loginStandaloneCrm(email, password);
    if (res.success && res.user) {
      setCrmUser(res.user);
    } else {
      setError(res.error || 'Falha na autenticação do CRM.');
    }
  };

  const handleQuickLogin = (presetEmail: string, presetPass: string) => {
    const res = loginStandaloneCrm(presetEmail, presetPass);
    if (res.success && res.user) {
      setCrmUser(res.user);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#142318] text-white flex flex-col items-center justify-center p-4 gap-4">
        <div className="bg-[#1c3022] border border-[#2d4d38] p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center font-serif font-bold text-2xl">
              A
            </div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
              Portal Externo & Mobile Ready
            </span>
            <h1 className="font-serif font-bold text-2xl text-white">Aura Fitness CRM 360°</h1>
            <p className="text-xs text-white/70">
              Acesse a central de clientes, aniversariantes, carrinhos abandonados e automações sem precisar entrar pela loja.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-white/90 mb-1">E-mail da Equipe CRM</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#142318] border border-[#2d4d38] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/90 mb-1">Senha de Acesso</label>
              <input
                type="password"
                required
                placeholder="AuraAdmin2026! ou crm2026"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#142318] border border-[#2d4d38] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg transition-colors"
            >
              Entrar no Portal CRM
            </button>

            <div className="pt-3 border-t border-[#2d4d38] space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aurafitness.com.br', 'AuraAdmin2026!')}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 font-semibold text-xs border border-amber-400/30 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Entrar como Admin CRM (1-Clique)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('vendas@aurafitness.com.br', 'vendas2026')}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-[11px] border border-white/10 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entrar como Consultora de Vendas (1-Clique)</span>
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-md w-full">
          <CrmInstallBanner variant="dark" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Standalone Top Header */}
      <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white font-serif font-bold text-lg flex items-center justify-center shadow-sm">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base tracking-wider text-foreground">
                AURA <span className="text-primary">CRM</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase">
                Portal Externo
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Sincronizado em tempo real com pedidos, cadastros e carrinhos da loja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isInstalled && (
            <button
              type="button"
              onClick={triggerInstall}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Instalar Aura CRM no celular ou computador"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{canInstallNative ? 'Instalar App' : 'App Celular'}</span>
            </button>
          )}

          <Link
            to="/admin/crm"
            className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold hidden md:flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            <span>Painel Admin</span>
          </Link>

          <Link
            to="/"
            className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold hidden sm:flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-primary" />
            <span>Ver Loja</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted text-foreground transition-colors"
            title="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border text-xs">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-bold">{activeName}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
              {activeRole}
            </span>
          </div>

          <button
            onClick={() => {
              logoutStandaloneCrm();
              setCrmUser(null);
              if (isAdmin) navigate('/admin');
            }}
            className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            title="Sair do CRM"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Standalone CRM Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <CrmInstallBanner variant="card" />
        <CrmWorkspace isStandalone={true} currentUserRole={activeRole} />
      </main>
    </div>
  );
};
