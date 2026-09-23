import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MessageSquare,
  Sparkles,
  Tag,
  Layers,
  FileText,
  Settings as SettingsIcon,
  Shield,
  History,
  Store,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead } from '../lib/dataClient';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, signInAdmin, logoutAdmin, isLoading: isAuthLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@aurafitness.com.br');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const res = await signInAdmin(adminEmail, adminPass);
      if (!res.success) {
        setAuthError(res.error || 'Credenciais administrativas inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err) {
      setAuthError('Erro de conexão ao autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const notifications = getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Produtos', path: '/admin/produtos', icon: Package },
    { name: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag },
    { name: 'Clientes', path: '/admin/clientes', icon: Users },
    { name: 'Avaliações', path: '/admin/avaliacoes', icon: MessageSquare },
    { name: 'Promoções', path: '/admin/promocoes', icon: Sparkles },
    { name: 'Conjuntos (Looks)', path: '/admin/conjuntos', icon: Layers },
    { name: 'Cupons', path: '/admin/cupons', icon: Tag },
    { name: 'Blog', path: '/admin/blog', icon: FileText },
    { name: 'Configurações', path: '/admin/configuracoes', icon: SettingsIcon },
    { name: 'Usuários', path: '/admin/usuarios', icon: Shield },
    { name: 'Logs & Estoque', path: '/admin/logs', icon: History },
  ];

  // Lock screen if not authenticated as Admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#142318] text-white flex items-center justify-center p-4">
        <div className="bg-[#1c3022] border border-[#2d4d38] p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif font-bold text-2xl text-white">Acesso Restrito ao Admin</h2>
            <p className="text-xs text-white/70">
              Digite a senha de administrador para acessar a gestão da loja.
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-left text-xs">
            {authError && (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 p-3 rounded-xl">
                {authError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-white/90 mb-1">E-mail Administrativo</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-[#142318] border border-[#2d4d38] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/90 mb-1">Senha de Acesso</label>
              <input
                type="password"
                required
                placeholder="Senha de acesso..."
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full bg-[#142318] border border-[#2d4d38] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Autenticando...' : 'Autenticar e Entrar'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-white/60 hover:text-white underline font-medium block mx-auto"
          >
            Voltar para a Loja Virtual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border transition-all duration-300 flex flex-col justify-between ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-20 border-b border-border flex items-center justify-between px-4">
            <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
                A
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-base tracking-widest text-foreground">
                    AURA <span className="text-primary font-light">FITNESS</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-primary font-bold">
                    Painel Administrativo
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block text-muted-foreground hover:text-foreground p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-foreground/80 hover:bg-muted hover:text-primary'
                  }`}
                  title={item.name}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
                  {isSidebarOpen && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Quick Switch */}
        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => {
              logoutAdmin();
              navigate('/');
            }}
            className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold text-xs py-2.5 px-3 rounded-xl border border-destructive/20 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Sair do Painel Admin</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header Bar */}
        <header className="h-20 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-foreground p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-serif font-bold text-lg text-foreground hidden sm:block">
              Gestão Aura Fitness
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-foreground hover:bg-muted rounded-full transition-colors"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 text-foreground hover:bg-muted rounded-full transition-colors relative"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 z-50">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="font-serif font-bold text-xs text-foreground">Notificações</span>
                    <span className="text-[10px] text-muted-foreground">{unreadCount} não lidas</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <span className="text-xs text-muted-foreground block text-center py-4">Nenhuma notificação.</span>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.read ? 'bg-background border-border text-muted-foreground' : 'bg-primary/5 border-primary/30 font-semibold text-foreground'
                          }`}
                        >
                          <h5 className="text-xs font-bold text-foreground">{n.title}</h5>
                          <p className="text-[11px] text-muted-foreground">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                A
              </div>
              <span className="text-xs font-semibold text-foreground hidden sm:block">Admin Geral</span>
            </div>
          </div>
        </header>

        {/* Dashboard Viewport */}
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
