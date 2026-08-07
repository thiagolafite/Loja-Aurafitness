import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Instagram, Youtube, Menu, X, ShieldAlert, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SearchModal } from './SearchModal';
import { AdminLoginModal } from '../admin/AdminLoginModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { totalItemCount, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin, logoutAdmin } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'CATEGORIAS', path: '/catalogo' },
    { name: 'LANÇAMENTOS', path: '/catalogo?ordenar=novidades' },
    { name: 'PROMOÇÃO', path: '/catalogo?promocao=true' },
    { name: 'MAIS VENDIDOS', path: '/catalogo?ordenar=mais_vendidos' },
    { name: 'NOVA COLEÇÃO', path: '/catalogo?categoria=CONJUNTOS' },
    { name: 'BLOG', path: '/blog' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 shadow-lg select-none">
        {/* Very Top Bar */}
        <div className="bg-[#1f3d19] text-[#d6e2cf] text-[11px] text-center py-1 px-4 font-medium tracking-wide border-b border-[#284e20]">
          <span>Frete Grátis para compras acima de R$299 🌿</span>
        </div>

        {/* Main Header Bar */}
        <div className="bg-[#284e20] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1 text-[#e1e9dc] hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo Aura Fitness - Right Aligned Stacked with Sirenik font */}
          <Link to="/" className="flex flex-col items-end justify-center leading-none group py-0.5 select-none text-right">
            <span className="font-sirenik text-3xl font-normal tracking-[0.06em] text-[#e8eee3] group-hover:text-amber-200 transition-colors">
              Aura
            </span>
            <span className="font-sans text-[11px] font-semibold tracking-[0.12em] text-amber-200/90 group-hover:text-white uppercase -mt-0.5">
              Fitness
            </span>
          </Link>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons */}
            <div className="hidden sm:flex items-center gap-2 text-[#d2dfcb]">
              <a
                href="https://www.instagram.com/adoro.aura/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="Youtube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <span className="text-[#3e6834] mx-1">|</span>
            </div>

            {/* Pill Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Pesquisar..."
                onClick={() => setIsSearchOpen(true)}
                readOnly
                className="bg-[#213f1a] border border-[#37612d] text-white placeholder-[#9cb893] pl-8 pr-4 py-1 text-xs rounded-full h-8 w-48 focus:outline-none cursor-pointer hover:bg-[#25471d] transition-colors"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9cb893]" />
            </div>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden text-[#d2dfcb] hover:text-white p-1"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-[#d2dfcb] hover:text-white p-1.5 rounded-full transition-colors"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Customer User Account */}
            {user ? (
              <div className="relative group">
                <Link
                  to="/minha-conta"
                  className="flex items-center gap-1.5 text-[#d2dfcb] hover:text-white py-1 px-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Minha Conta"
                >
                  <User className="w-4 h-4 text-amber-200" />
                  <span className="hidden md:inline text-xs font-medium">
                    Olá, {user.name.split(' ')[0]}
                  </span>
                </Link>

                {/* Customer Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#1f3d19] border border-[#345c2a] rounded-xl shadow-xl py-2 hidden group-hover:block z-50 text-xs text-white">
                  <Link
                    to="/minha-conta"
                    className="block px-4 py-2 hover:bg-[#2e5725] transition-colors"
                  >
                    👤 Minha Conta
                  </Link>
                  <Link
                    to="/meus-pedidos"
                    className="block px-4 py-2 hover:bg-[#2e5725] transition-colors"
                  >
                    🛍️ Meus Pedidos
                  </Link>
                  <Link
                    to="/favoritos"
                    className="block px-4 py-2 hover:bg-[#2e5725] transition-colors"
                  >
                    ❤️ Meus Favoritos
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-amber-950/60 text-amber-300 font-bold transition-colors border-t border-[#345c2a]"
                    >
                      🛡️ Painel de Administração
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-950/60 text-rose-300 transition-colors border-t border-[#345c2a] mt-1"
                  >
                    🚪 Sair da Conta
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-[#d2dfcb] hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-semibold border border-white/10 transition-all"
                title="Entrar ou Cadastrar"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar / Cadastrar</span>
              </Link>
            )}

            {/* Shopping Bag Icon */}
            <button
              onClick={openCart}
              className="text-[#d2dfcb] hover:text-white p-1.5 rounded-full transition-colors relative"
              title="Sacola de Compras"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 text-slate-950 text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Admin Badge (Visible ONLY when authenticated as Admin) */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Link
                  to="/admin"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-sm"
                  title="Acessar Painel Admin"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Painel Admin</span>
                </Link>
                <button
                  onClick={logoutAdmin}
                  className="p-1.5 text-rose-300 hover:text-rose-100 transition-colors"
                  title="Sair do Modo Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Row (Lower Header Bar) */}
        <nav className="bg-[#38672b] text-white hidden lg:flex items-center justify-center gap-8 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-t border-[#447a36]">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="hover:text-amber-200 transition-colors py-0.5 relative hover:after:w-full after:w-0 after:h-0.5 after:bg-amber-200 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#1f3d19] text-white border-t border-[#2d5624] px-6 py-4 space-y-3"
            >
              <div className="flex flex-col gap-2 font-semibold text-xs uppercase tracking-wider">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-amber-200 py-2 border-b border-[#2b5223]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
      />
    </>
  );
};
